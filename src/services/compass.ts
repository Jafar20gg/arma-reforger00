/** Bearing/cardinal helpers. Game axes: x = East, z = North, so 0° = North and 90° = East. */
export const CARDINALS_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export const CARDINALS_AR = ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب'] as const;

/** True-north bearing in degrees [0,360) from `from` to `to` (game meters). */
export function bearingDeg(from: { x: number; z: number }, to: { x: number; z: number }): number {
  const a = (Math.atan2(to.x - from.x, to.z - from.z) * 180) / Math.PI;
  return (a + 360) % 360;
}

export function cardinalIndex(deg: number): number {
  return Math.round((((deg % 360) + 360) % 360) / 45) % 8;
}

export function cardinalName(deg: number, lang: 'en' | 'ar'): string {
  const i = cardinalIndex(deg);
  return lang === 'ar' ? CARDINALS_AR[i] : CARDINALS_EN[i];
}

/** Spacing (m) between distance circles: `preferred` if set (>0), else the smallest step that keeps circles >= 46 px apart. */
export function pickCircleStep(pixelsPerMeter: number, preferred = 0): number {
  if (preferred > 0) return preferred;
  return [100, 250, 500, 1000, 2000].find((s) => s * pixelsPerMeter >= 46) ?? 2000;
}

export type CircleWeight = 'light' | 'medium' | 'strong';
/** Light lines for near circles, clearer every 500 m, distinctive every 1000 m. */
export function circleWeight(radius: number): CircleWeight {
  if (radius % 1000 === 0) return 'strong';
  if (radius % 500 === 0) return 'medium';
  return 'light';
}

export function circleRadii(step: number, maxRadius: number, maxCount = 60): number[] {
  const out: number[] = [];
  for (let r = step; r <= maxRadius && out.length < maxCount; r += step) out.push(r);
  return out;
}

/** Screen pixels per game meter at a zoom level for a terrain (matches createTerrainCRS). */
export function pixelsPerMeter(tileSize: number, worldSize: number, zoom: number): number {
  return (tileSize * Math.pow(2, zoom)) / worldSize;
}
