import React, { useState } from 'react';
import type { AiSettings, BallisticSolution } from '../types';
import { askAdvisor, AdvisorResult } from '../services/aiAdvisor';
import { distanceBreakdown } from '../services/distance';

interface Props {
  ai: AiSettings;
  weaponName: string;
  milsPerCircle: number;
  gunPos: { x: number; z: number; alt: number };
  targetPos: { x: number; z: number; alt: number };
  solution: BallisticSolution;
  minRange: number;
  maxRange: number;
  lang: 'en' | 'ar';
}

/** Second-opinion card. Shown only when the user chose the "AI check" method in Settings. */
export const AiCheckCard: React.FC<Props> = ({ ai, weaponName, milsPerCircle, gunPos, targetPos, solution, minRange, maxRange, lang }) => {
  const isAr = lang === 'ar';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdvisorResult | null>(null);
  if (ai.method !== 'ai') return null;

  const math = distanceBreakdown(gunPos, targetPos, milsPerCircle);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(
        await askAdvisor(ai, {
          weaponName, milsPerCircle, gun: gunPos, target: targetPos, math,
          ring: solution.charge, elevationMils: solution.elevationMils, inRange: solution.inRange, minRange, maxRange, lang,
        })
      );
    } catch (e) {
      const m = (e as Error).message;
      setResult(null);
      setError(
        m === 'NO_KEY' ? (isAr ? 'أدخل مفتاح API في الإعدادات أولاً.' : 'Enter your API key in Settings first.')
        : m === 'BAD_KEY' ? (isAr ? 'المفتاح غير صحيح أو غير مسموح.' : 'The API key was rejected.')
        : m === 'BAD_REPLY' ? (isAr ? 'رد الذكاء الاصطناعي غير مفهوم، جرّب مرة ثانية.' : 'The AI reply could not be read, try again.')
        : /^HTTP_(503|429|500|502|504)/.test(m) ? (isAr ? 'سيرفرات Google مشغولة حالياً (ضغط عالي). المشكلة ليست من مفتاحك ولا من البرنامج. انتظر دقيقة وجرّب مرة ثانية.' : 'Google’s servers are busy right now (high demand). This is not your key or the app. Wait a minute and try again.')
        : (isAr ? 'تعذّر الاتصال بالذكاء الاصطناعي: ' : 'Could not reach the AI: ') + m
      );
    } finally {
      setBusy(false);
    }
  };

  const dd = result?.distance_m == null ? null : Math.abs(result.distance_m - math.horizontal);
  const da = result?.azimuth_mils == null ? null : Math.abs(result.azimuth_mils - math.azimuthMils);
  const agrees = dd !== null && da !== null && dd <= 1 && da <= 2;

  return (
    <div className="rounded-lg border border-violet-500/40 bg-violet-950/20 p-3 space-y-2 text-[11px] font-mono">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-violet-300">{isAr ? 'تحقق بالذكاء الاصطناعي (رأي ثاني)' : 'AI check (second opinion)'}</span>
        <button type="button" onClick={run} disabled={busy} className="px-3 py-2 rounded bg-violet-600 text-white font-bold disabled:opacity-50">
          {busy ? (isAr ? 'جاري التحقق…' : 'Checking…') : isAr ? 'تحقق الآن' : 'Check now'}
        </button>
      </div>
      <div className="text-slate-400">
        {isAr ? 'الرياضيات' : 'Maths'}: {math.horizontal.toFixed(1)} {isAr ? 'م' : 'm'} · {math.azimuthMils.toFixed(0)} {isAr ? 'مل' : 'mil'}
      </div>
      {error && <div className="text-rose-300">{error}</div>}
      {result && (
        <div className="space-y-1">
          <div className={agrees ? 'text-emerald-300' : 'text-amber-300'}>
            {agrees
              ? isAr ? '✅ الذكاء الاصطناعي يطابق الرياضيات' : '✅ The AI matches the maths'
              : isAr ? `⚠ فرق: المسافة ${dd?.toFixed(1) ?? '؟'} م · الاتجاه ${da?.toFixed(1) ?? '؟'} مل. المعتمد هو حساب الرياضيات.` : `⚠ Difference: distance ${dd?.toFixed(1) ?? '?'} m · azimuth ${da?.toFixed(1) ?? '?'} mil. The maths result stays in use.`}
          </div>
          {result.notes.map((n, i) => (
            <div key={i} className="text-slate-300">• {n}</div>
          ))}
        </div>
      )}
    </div>
  );
};
