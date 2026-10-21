import type { WeatherSettings, WindUnit } from '../types';

/**
 * Wind correction for a mortar shell (advisory estimate).
 * Wind direction = where the wind comes FROM (compass degrees), like a weather report.
 * Drift = wind component x time of flight x `k`. k < 1 because the shell only feels the wind
 * for part of its flight; 0.5 is a sensible starting point and can be tuned to match the game.
 */
export interface WindCorrection {
  windMs: number;
  crossMs: number; // + = wind pushes the shell to the RIGHT of the firing line
  headMs: number; // + = headwind (shortens range), - = tailwind (extends range)
  driftM: number; // + = shell lands right of target
  rangeShiftM: number; // + = shell lands long (tailwind), - = short (headwind)
  azimuthCorrMils: number; // add to azimuth: + = turn right
  azimuthCorrDeg: number;
  rangeCorrM: number; // add to the range you dial in (aim-point range)
  correctedAzimuthMils: number;
  correctedAzimuthDeg: number;
  correctedRangeM: number;
  active: boolean;
}

export function windToMs(speed: number, unit: WindUnit): number {
  switch (unit) {
    case 'km/h': return speed / 3.6;
    case 'knots': return speed * 0.514444;
    case 'mph': return speed * 0.44704;
    default: return speed;
  }
}

export function computeWindCorrection(opts: {
  weather: Pick<WeatherSettings, 'enabled' | 'windSpeed' | 'windUnit' | 'windDirectionDeg'>;
  azimuthDeg: number; // firing direction, clockwise from north
  azimuthMils: number;
  horizontalDistance: number;
  timeOfFlight: number | null;
  milsPerCircle: number;
  k?: number;
}): WindCorrection {
  const { weather, azimuthDeg, azimuthMils, horizontalDistance, timeOfFlight, milsPerCircle } = opts;
  const k = opts.k ?? 0.5;
  const windMs = windToMs(Math.max(0, weather.windSpeed), weather.windUnit);
  const tof = timeOfFlight ?? 0;
  const none: WindCorrection = {
    windMs, crossMs: 0, headMs: 0, driftM: 0, rangeShiftM: 0, azimuthCorrMils: 0, azimuthCorrDeg: 0, rangeCorrM: 0,
    correctedAzimuthMils: azimuthMils, correctedAzimuthDeg: azimuthDeg, correctedRangeM: horizontalDistance, active: false,
  };
  if (!weather.enabled || windMs <= 0 || tof <= 0 || horizontalDistance <= 0) return none;

  // Direction the wind blows TOWARD, relative to the firing line (0 = along the shot, 90 = to the right).
  const rel = ((((weather.windDirectionDeg + 180) - azimuthDeg) % 360) + 360) % 360;
  const relRad = (rel * Math.PI) / 180;
  const along = windMs * Math.cos(relRad); // + tailwind
  const crossMs = windMs * Math.sin(relRad); // + to the right
  const driftM = crossMs * tof * k;
  const rangeShiftM = along * tof * k;

  // Aim into the wind: shift the aim point the opposite way.
  const azimuthCorrDeg = -(Math.atan2(driftM, horizontalDistance) * 180) / Math.PI;
  const azimuthCorrMils = (azimuthCorrDeg / 360) * milsPerCircle;
  const rangeCorrM = -rangeShiftM;
  return {
    windMs, crossMs, headMs: -along, driftM, rangeShiftM, azimuthCorrMils, azimuthCorrDeg, rangeCorrM,
    correctedAzimuthMils: (((azimuthMils + azimuthCorrMils) % milsPerCircle) + milsPerCircle) % milsPerCircle,
    correctedAzimuthDeg: (((azimuthDeg + azimuthCorrDeg) % 360) + 360) % 360,
    correctedRangeM: Math.max(0, horizontalDistance + rangeCorrM),
    active: true,
  };
}
