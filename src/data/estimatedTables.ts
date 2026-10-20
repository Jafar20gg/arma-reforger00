import type { BallisticDataPoint } from '../types';

/**
 * Physics-based ESTIMATED firing tables for high-angle mortar fire.
 *
 * Why this exists: the hand-typed tables that used to live in ballistics.ts were internally
 * inconsistent (e.g. the US M821 Ring 4 table ended at 750 mils, below the M252's own 800-mil
 * minimum, and Ring 0 started at 50 m although the confirmed in-game minimum is 71 m).
 *
 * Model (high-angle branch, small drag correction):
 *   range(theta) = rMax * sin(2*theta)^p        (theta = elevation angle, 45 deg = max range)
 *   => theta = 90deg - 0.5 * asin((range / rMax)^(1/p))
 * The ring's confirmed max range anchors theta = 45 deg, and (when given) its confirmed min range
 * anchors the weapon's maximum elevation, which fixes p. Everything else (time of flight, peak
 * altitude, D ELEV, impact angle) is derived from the same vacuum model. These are ESTIMATES, not
 * in-game readings, and are labelled that way in the UI.
 */

const DEG = Math.PI / 180;
const G = 9.81;

export interface RingModelInput {
  milsPerCircle: number;
  minElevMils: number;
  maxElevMils: number;
  rMax: number;
  /** Confirmed min range (m). When given, p is fitted so range(maxElevation) = rMin. */
  rMin?: number;
  /** Used only when rMin is not given. */
  p?: number;
  /** Mean dispersion (m) for the ring, when confirmed. */
  dispersion?: number;
}

export interface RingModelOutput {
  minRange: number;
  maxRange: number;
  p: number;
  table: BallisticDataPoint[];
}

export function buildEstimatedRing(inp: RingModelInput): RingModelOutput {
  const { milsPerCircle, minElevMils, maxElevMils, rMax } = inp;
  const thMaxDeg = (maxElevMils * 360) / milsPerCircle;
  const sAtMax = Math.sin(2 * thMaxDeg * DEG);

  let p = inp.p ?? 0.98;
  if (inp.rMin !== undefined) {
    p = Math.log(inp.rMin / rMax) / Math.log(sAtMax);
  }
  p = Math.min(1.1, Math.max(0.9, p));

  const rMinModel = rMax * Math.pow(sAtMax, p);
  const minRange = inp.rMin !== undefined ? inp.rMin : Math.ceil(rMinModel);

  const elevDeg = (r: number): number => {
    const s = Math.min(1, Math.pow(r / rMax, 1 / p));
    return 90 - (0.5 * Math.asin(s)) / DEG;
  };

  const step = 50; // one row every 50 m
  const ranges: number[] = [minRange];
  for (let r = (Math.floor(minRange / step) + 1) * step; r < rMax; r += step) ranges.push(r);
  ranges.push(rMax);

  const table: BallisticDataPoint[] = ranges.map((r) => {
    const thDeg = elevDeg(r);
    const th = thDeg * DEG;
    let elevation = Math.round((thDeg * milsPerCircle) / 360);
    elevation = Math.min(maxElevMils, Math.max(minElevMils, elevation));

    // Vacuum model with v^2 = rMax * g
    const tof = 2 * Math.sqrt(rMax / G) * Math.sin(th);
    const peakAlt = (rMax * Math.sin(th) * Math.sin(th)) / 2;

    // Elevation change (mils) for a target 100 m higher, exact vacuum solution (high-angle root).
    let dElev: number | undefined;
    const k = (r * r) / (2 * rMax);
    const disc = r * r - 4 * k * (k + 100);
    if (disc >= 0) {
      const u = (r + Math.sqrt(disc)) / (2 * k);
      const thHigh = Math.atan(u) / DEG;
      dElev = Math.max(0, ((thDeg - thHigh) * milsPerCircle) / 360);
    }

    const pt: BallisticDataPoint = {
      range: r,
      elevation,
      tof: Math.round(tof * 10) / 10,
      peakAlt: Math.round(peakAlt),
      angleImpact: Math.round(thDeg * 10) / 10,
    };
    if (dElev !== undefined) pt.dElevPer100m = Math.round(dElev * 10) / 10;
    if (inp.dispersion !== undefined) pt.dispersion = inp.dispersion;
    return pt;
  });

  return { minRange, maxRange: rMax, p, table };
}
