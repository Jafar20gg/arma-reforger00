import type { TerrainId } from '../types';

/**
 * Share-by-link: the whole mission (terrain, weapon, ammo, ring, gun & target) is packed into
 * the URL hash as URL-safe base64 JSON, so a squadmate opens the link and gets the same setup.
 * Nothing is sent anywhere — the data travels inside the link itself.
 */
export interface SharedMission {
  terrainId: TerrainId;
  weaponId: string;
  ammoId?: string;
  ring: number;
  gun: { x: number; z: number; alt: number };
  target: { x: number; z: number; alt: number };
}

const TERRAIN_IDS: TerrainId[] = ['everon', 'arland', 'kolguyev'];

const isFiniteNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function encodeMissionLink(m: SharedMission): string {
  const payload = {
    t: m.terrainId,
    w: m.weaponId,
    a: m.ammoId,
    r: m.ring,
    g: [m.gun.x, m.gun.z, m.gun.alt],
    h: [m.target.x, m.target.z, m.target.alt],
  };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `#m=${b64}`;
}

export function decodeMissionLink(hash: string): SharedMission | null {
  try {
    const match = /(?:^|#|&)m=([A-Za-z0-9\-_]+)/.exec(hash || '');
    if (!match) return null;
    const b64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))));
    const p = JSON.parse(json);
    if (!p || typeof p !== 'object') return null;
    if (!TERRAIN_IDS.includes(p.t)) return null;
    if (typeof p.w !== 'string' || !p.w) return null;
    if (!Array.isArray(p.g) || !Array.isArray(p.h)) return null;
    const [gx, gz, ga] = p.g;
    const [hx, hz, ha] = p.h;
    if (![gx, gz, ga, hx, hz, ha].every(isFiniteNum)) return null;
    return {
      terrainId: p.t as TerrainId,
      weaponId: p.w.slice(0, 80),
      ammoId: typeof p.a === 'string' ? p.a.slice(0, 80) : undefined,
      ring: isFiniteNum(p.r) ? Math.round(p.r) : -1,
      gun: { x: gx, z: gz, alt: ga },
      target: { x: hx, z: hz, alt: ha },
    };
  } catch {
    return null;
  }
}
