import type { AiSettings } from '../types';
import type { DistanceBreakdown } from './distance';

/**
 * OPTIONAL second opinion from an AI model. The numbers shown by the app always come from exact maths;
 * the AI only re-computes them independently and flags disagreements or problems.
 * It runs only when the user turns it on and enters their own API key (kept in this browser only).
 */
export interface AdvisorResult {
  distance_m: number | null;
  azimuth_mils: number | null;
  notes: string[];
}

export interface AdvisorInput {
  weaponName: string;
  milsPerCircle: number;
  gun: { x: number; z: number; alt: number };
  target: { x: number; z: number; alt: number };
  math: DistanceBreakdown;
  ring: number;
  elevationMils: number | null;
  inRange: boolean;
  minRange: number;
  maxRange: number;
  lang: 'en' | 'ar';
}

const SYSTEM =
  'You verify the arithmetic of an Arma Reforger mortar fire-control calculator. Coordinates are game metres: x = East, z = North, alt = height. ' +
  'Compute independently: horizontal distance = sqrt(dx^2 + dz^2); azimuth = atan2(dx, dz) in degrees clockwise from north, converted to mils with the given mil circle. ' +
  'Then list at most 4 short practical notes (out of range, big height difference, near min/max range, suspicious input). ' +
  'Reply with ONLY a JSON object: {"distance_m": number, "azimuth_mils": number, "notes": string[]}.';

export function parseAdvisorJson(text: string): AdvisorResult | null {
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try {
    const j = JSON.parse(text.slice(a, b + 1));
    const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    return {
      distance_m: n(j.distance_m),
      azimuth_mils: n(j.azimuth_mils),
      notes: Array.isArray(j.notes) ? j.notes.filter((x: unknown) => typeof x === 'string').slice(0, 4) : [],
    };
  } catch {
    return null;
  }
}

function userPayload(input: AdvisorInput): string {
  return JSON.stringify({
    weapon: input.weaponName,
    mil_circle: input.milsPerCircle,
    gun: input.gun,
    target: input.target,
    ring: input.ring,
    ring_range_m: [input.minRange, input.maxRange],
    app_result: { in_range: input.inRange, elevation_mils: input.elevationMils },
  });
}

export async function askAdvisor(ai: AiSettings, input: AdvisorInput): Promise<AdvisorResult> {
  if (!ai.apiKey.trim()) throw new Error('NO_KEY');
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 60000);
  const system = SYSTEM + (input.lang === 'ar' ? ' Write the notes in Arabic.' : ' Write the notes in English.');
  try {
    let res: Response;
    if (ai.provider === 'anthropic') {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': ai.apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: ai.model || 'claude-sonnet-5-5',
          max_tokens: 700,
          system,
          messages: [{ role: 'user', content: userPayload(input) }],
        }),
      });
    } else {
      // Google sometimes answers 503 ("high demand") or 429 (too many requests). That is temporary and not the key's fault,
      // so retry once and then fall back to other models. 404 = this model name is not available for this key.
      const models = Array.from(new Set([ai.model || 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite']));
      const body = JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: userPayload(input) }] }],
        // Thinking tokens count toward the output limit, so keep it generous or the JSON gets cut off.
        generationConfig: { temperature: 0, maxOutputTokens: 4096, responseMimeType: 'application/json' },
      });
      const busy = (st: number) => st === 503 || st === 429 || st === 500 || st === 502 || st === 504;
      let last: Response | null = null;
      outer: for (const m of models) {
        for (let attempt = 0; attempt < 2; attempt++) {
          last = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`,
            { method: 'POST', signal: ctrl.signal, headers: { 'content-type': 'application/json', 'x-goog-api-key': ai.apiKey.trim() }, body }
          );
          if (last.ok || last.status === 401 || last.status === 403) break outer;
          if (busy(last.status) && attempt === 0) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          break; // 404 or still busy -> next model
        }
      }
      res = last as Response;
    }
    if (res.status === 401) throw new Error('BAD_KEY');
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (res.status === 400 && /API_KEY_INVALID|API key not valid/i.test(body)) throw new Error('BAD_KEY');
      let detail = '';
      try { detail = (JSON.parse(body)?.error?.message as string) || ''; } catch { detail = body.slice(0, 160); }
      throw new Error(`HTTP_${res.status}: ${detail}`.slice(0, 220));
    }
    const data = await res.json();
    const text =
      ai.provider === 'anthropic'
        ? (data.content || []).map((c: { text?: string }) => c.text || '').join('')
        : (data.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || '').join('');
    const parsed = parseAdvisorJson(text);
    if (!parsed) throw new Error('BAD_REPLY');
    return parsed;
  } finally {
    window.clearTimeout(timer);
  }
}
