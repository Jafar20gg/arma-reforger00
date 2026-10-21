import { BallisticDataPoint, WeaponConfig, WeaponCharge, BallisticSolution, AmmoConfig } from '../types';

export interface InterpolatedBallistics {
  elevation: number;
  timeOfFlight: number;
  // Optional table columns are null when the source table does not provide them.
  // They are never filled with invented defaults.
  peakAlt: number | null;
  dElevPer100m: number | null;
  dHw: number | null; // Signed Delta H_w (-dElevPer100m for high-angle fire)
  angleImpact: number | null;
  dispersion: number | null;
  isExact: boolean;
  inputs?: {
    r1: number;
    r2: number;
    e1: number;
    e2: number;
    fraction: number;
  };
}

export interface CalculateSolutionOptions {
  weapon: WeaponConfig;
  gunPos: { x: number; z: number; alt: number };
  targetPos: { x: number; z: number; alt: number };
  preferredCharge?: number; // -1 for auto
  ammoId?: string;
  ammoType?: string;
  /** Personal calibration: stretches/shrinks table ranges (%) and shifts final elevation (mils). */
  tuning?: WeaponTuningInput;
}

/** Linear interpolation of an optional column: null if either end is missing. */
function lerpOpt(a: number | undefined, b: number | undefined, t: number): number | null {
  if (a === undefined || b === undefined || a === null || b === null) return null;
  return a + (b - a) * t;
}

/**
 * Strict linear interpolation across ballistic data points according to official in-game manual formulas:
 * Result = V1 + (V2 - V1) * ((R_target - R1) / (R2 - R1))
 *
 * Returns null when the target is outside the table's range. Optional columns missing from the
 * table (peak altitude, dElev, impact angle, dispersion) come back as null, never as made-up numbers.
 */
export function interpolateBallistics(
  table: BallisticDataPoint[],
  targetDistance: number
): InterpolatedBallistics | null {
  if (!table || table.length === 0) return null;

  const fromPoint = (p: BallisticDataPoint, r1: number, r2: number, e1: number, e2: number, fraction: number, isExact: boolean): InterpolatedBallistics => ({
    elevation: p.elevation,
    timeOfFlight: p.tof,
    peakAlt: p.peakAlt ?? null,
    dElevPer100m: p.dElevPer100m ?? null,
    dHw: p.dElevPer100m === undefined || p.dElevPer100m === null ? null : -Math.abs(p.dElevPer100m),
    angleImpact: p.angleImpact ?? null,
    dispersion: p.dispersion ?? null,
    inputs: { r1, r2, e1, e2, fraction },
    isExact,
  });

  // Check exact match (within 0.05m tolerance)
  const exact = table.find((p) => Math.abs(p.range - targetDistance) < 0.05);
  if (exact) {
    return fromPoint(exact, exact.range, exact.range, exact.elevation, exact.elevation, 0, true);
  }

  const minRange = table[0].range;
  const maxRange = table[table.length - 1].range;

  // Range boundary check: no extrapolation, no clamping
  if (targetDistance < minRange || targetDistance > maxRange) {
    return null;
  }

  // Find bounding segment
  for (let i = 0; i < table.length - 1; i++) {
    const p1 = table[i];
    const p2 = table[i + 1];

    if (targetDistance >= p1.range && targetDistance <= p2.range) {
      const rangeSpan = p2.range - p1.range;
      if (rangeSpan === 0) {
        return fromPoint(p1, p1.range, p2.range, p1.elevation, p2.elevation, 0, true);
      }

      const t = (targetDistance - p1.range) / rangeSpan;
      const dElevInterp = lerpOpt(p1.dElevPer100m, p2.dElevPer100m, t);

      return {
        elevation: p1.elevation + (p2.elevation - p1.elevation) * t,
        timeOfFlight: p1.tof + (p2.tof - p1.tof) * t,
        peakAlt: lerpOpt(p1.peakAlt, p2.peakAlt, t),
        dElevPer100m: dElevInterp,
        dHw: dElevInterp === null ? null : -Math.abs(dElevInterp),
        angleImpact: lerpOpt(p1.angleImpact, p2.angleImpact, t),
        dispersion: lerpOpt(p1.dispersion, p2.dispersion, t),
        inputs: {
          r1: p1.range,
          r2: p2.range,
          e1: p1.elevation,
          e2: p2.elevation,
          fraction: Math.round(t * 1000) / 1000,
        },
        isExact: false,
      };
    }
  }

  return null;
}

/**
 * Finds all charge rings whose range brackets cover the given target distance.
 */
export function findValidCharges(
  weaponOrCharges: WeaponConfig | WeaponCharge[],
  distanceMeters: number
): WeaponCharge[] {
  const charges = Array.isArray(weaponOrCharges) ? weaponOrCharges : weaponOrCharges.charges;
  return charges.filter(
    (c) => distanceMeters >= c.minRange && distanceMeters <= c.maxRange
  );
}

/**
 * Returns explicit tactical guidance if a target distance falls outside a selected charge bracket.
 * e.g., "Range requires Ring 2" or "Range requires Ring 3 or Ring 4"
 */
export function getRequiredChargeWarning(
  weaponOrCharges: WeaponConfig | WeaponCharge[],
  selectedChargeIdx: number,
  distanceMeters: number
): string | undefined {
  const charges = Array.isArray(weaponOrCharges) ? weaponOrCharges : weaponOrCharges.charges;
  const selectedCharge = charges.find((c) => c.charge === selectedChargeIdx);
  if (!selectedCharge) return 'Invalid charge selected';

  // If in range of current charge, no warning
  if (distanceMeters >= selectedCharge.minRange && distanceMeters <= selectedCharge.maxRange) {
    return undefined;
  }

  // Find charges that can hit this target
  const valid = findValidCharges(charges, distanceMeters);

  if (valid.length > 0) {
    const ringNames = valid.map((c) => `Ring ${c.charge}`).join(' or ');
    return `Range requires ${ringNames}`;
  }

  // Outside weapon global min or max
  const globalMin = Math.min(...charges.map((c) => c.minRange));
  const globalMax = Math.max(...charges.map((c) => c.maxRange));

  if (distanceMeters < globalMin) {
    return `Target distance (${Math.round(distanceMeters)}m) below minimum range (${globalMin}m)`;
  }
  return `Target distance (${Math.round(distanceMeters)}m) exceeds maximum range (${globalMax}m)`;
}

/**
 * Altitude correction (Delta H_w) calculation according to official manual formula:
 * Delta Alt = Target Alt - Mortar Alt
 * Final Elevation = Base Elevation + (Delta Alt / 100 * Delta H_w)
 * Where Delta H_w is negative for high-angle mortar fire (flatter tube to reach hilltop, steeper tube into valley).
 */
export function calculateAltitudeCorrection(deltaAltMeters: number, dElevPer100m: number): number {
  return - (deltaAltMeters / 100.0) * Math.abs(dElevPer100m);
}

/**
 * Computes high-precision firing solution for mortar systems with dynamic charge and ammo table selection
 */
export interface WeaponTuningInput {
  rangeScalePct: number;
  elevationOffsetMils: number;
  /** Lowest elevation (degrees) the user allows. 0/undefined = free (only the tube limit applies). */
  minElevationLockDeg?: number;
  /** Elevation (degrees) the table closes at on the max-range row. 0/undefined = standard data. */
  closingAngleDeg?: number;
}

/** Effective minimum elevation in mils: the tube limit, or the user's angle lock if it is higher. */
export function effectiveMinElevationMils(
  weapon: { minElevation: number; milsPerCircle: number },
  tuning?: WeaponTuningInput
): number {
  const toMils = (d: number) => Math.round((d * weapon.milsPerCircle) / 360);
  let min = weapon.minElevation;
  // A user-chosen closing angle below the tube limit frees the limit (full user control)
  if ((tuning?.closingAngleDeg ?? 0) > 0) min = Math.min(min, toMils(tuning!.closingAngleDeg as number));
  if ((tuning?.minElevationLockDeg ?? 0) > 0) min = Math.max(min, toMils(tuning!.minElevationLockDeg as number));
  return min;
}

/**
 * Applies the user's personal calibration to a set of charges:
 *  - range % stretches/shrinks every table range, min and max;
 *  - a closing angle re-maps the table's elevations so the max-range row sits at that angle
 *    (the min-range end is unchanged);
 *  - an angle lock cuts the table where the elevation reaches the lock, so the maximum range
 *    becomes the range reachable at that angle.
 */
export function applyTuningToCharges<T extends { minRange: number; maxRange: number; table: any[] }>(
  weapon: { minElevation: number; milsPerCircle: number },
  charges: T[],
  tuning?: WeaponTuningInput
): T[] {
  const k = 1 + (tuning?.rangeScalePct ?? 0) / 100;
  const closing = tuning?.closingAngleDeg ?? 0;
  const lock = tuning?.minElevationLockDeg ?? 0;
  if (k === 1 && !(closing > 0) && !(lock > 0)) return charges;
  const toMils = (d: number) => Math.round((d * weapon.milsPerCircle) / 360);
  return charges.map((c) => {
    let table: any[] = k === 1 ? c.table : c.table.map((p) => ({ ...p, range: p.range * k }));
    const minRange = Math.round(c.minRange * k);
    let maxRange = Math.round(c.maxRange * k);
    if (closing > 0 && table.length > 1) {
      const target = toMils(closing);
      const first = table[0].elevation;
      const last = table[table.length - 1].elevation;
      if (first !== last && last !== target) {
        table = table.map((p) => ({ ...p, elevation: Math.round(target + ((p.elevation - last) * (first - target)) / (first - last)) }));
      }
    }
    if (lock > 0) {
      const lockMils = toMils(lock);
      const keep = table.filter((p) => p.elevation >= lockMils);
      if (keep.length > 0 && keep.length < table.length) {
        const prev = keep[keep.length - 1];
        const next = table[keep.length];
        const f = (prev.elevation - lockMils) / (prev.elevation - next.elevation);
        const r = prev.range + f * (next.range - prev.range);
        keep.push({ ...prev, range: r, elevation: lockMils });
        table = keep;
        maxRange = Math.floor(r);
      }
    }
    return { ...c, minRange, maxRange, table };
  });
}

export function solveMortarFireMission({
  weapon,
  gunPos,
  targetPos,
  preferredCharge,
  ammoId,
  ammoType,
  tuning,
}: CalculateSolutionOptions): BallisticSolution {
  // Resolve active ammo from weapon.ammunition if configured
  let activeAmmo: AmmoConfig | undefined = undefined;
  if (weapon.ammunition && weapon.ammunition.length > 0) {
    const targetKey = (ammoId || ammoType)?.toLowerCase();
    if (targetKey) {
      activeAmmo = weapon.ammunition.find(
        (a) =>
          a.id.toLowerCase() === targetKey ||
          a.code.toLowerCase() === targetKey ||
          a.name.toLowerCase().includes(targetKey)
      );
    }
    if (!activeAmmo) {
      activeAmmo = weapon.ammunition[0];
    }
  }

  const baseCharges = activeAmmo ? activeAmmo.charges : weapon.charges;
  // Personal calibration: ranges in the tables are scaled, so every limit, warning and lookup stays consistent.
  const elevOffset = tuning?.elevationOffsetMils ?? 0;
  const lockMils = effectiveMinElevationMils(weapon, tuning);
  const activeCharges = applyTuningToCharges(weapon, baseCharges, tuning);

  // Euclidean planar distance (1 meter per coordinate unit)
  const dx = targetPos.x - gunPos.x;
  const dz = targetPos.z - gunPos.z;
  const deltaAlt = targetPos.alt - gunPos.alt;

  const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
  const slantDistance = Math.sqrt(horizontalDistance * horizontalDistance + deltaAlt * deltaAlt);

  // Azimuth calculation normalized in weapon's native mil system (6400 NATO or 6000 Soviet)
  // In Arma Reforger: Z is North (0° / 0 mils), X is East (90° / 1600 or 1500 mils)
  let angleRad = Math.atan2(dx, dz);
  if (angleRad < 0) {
    angleRad += 2 * Math.PI;
  }
  const azimuthDeg = (angleRad * 180) / Math.PI;
  const azimuthMils = (angleRad / (2 * Math.PI)) * weapon.milsPerCircle;

  // Weapons whose tables are known to be invalid must not produce a firing solution.
  if (weapon.firingTablesBlockedReason) {
    return {
      horizontalDistance: Math.round(horizontalDistance),
      slantDistance: Math.round(slantDistance),
      heightDifference: Math.round(deltaAlt),
      azimuthDeg: Math.round(azimuthDeg * 10) / 10,
      azimuthMils: Math.round(azimuthMils),
      charge: preferredCharge !== undefined && preferredCharge >= 0 ? preferredCharge : 0,
      recommendedCharge: 0,
      elevationMils: null,
      elevationDeg: null,
      timeOfFlight: null,
      peakAlt: null,
      dElevPer100m: null,
      angleImpact: null,
      inRange: false,
      warning: weapon.firingTablesBlockedReason,
      ammoType: activeAmmo ? `${activeAmmo.code} ${activeAmmo.name}` : weapon.caliber,
      ammoId: activeAmmo?.id,
      ammoWeightKg: activeAmmo?.weightKg,
      ammoCategory: activeAmmo?.category,
      tableVerificationStatus: 'UNVERIFIED',
    };
  }

  // Determine valid charge rings for this distance
  const validCharges = findValidCharges(activeCharges, horizontalDistance);

  // Automatic optimal charge selection
  let recommendedCharge = 0;
  if (validCharges.length > 0) {
    // If target is on the extreme upper edge (> 95% of lowest charge max) and next charge has good angle headroom, prefer next
    const lowest = validCharges[0];
    const second = validCharges.length > 1 ? validCharges[1] : null;

    if (
      second &&
      horizontalDistance > lowest.maxRange * 0.95 &&
      horizontalDistance >= second.minRange + 30
    ) {
      recommendedCharge = second.charge;
    } else {
      recommendedCharge = lowest.charge;
    }
  } else {
    // Outside all charges: choose closest boundary
    const globalMin = Math.min(...activeCharges.map((c) => c.minRange));
    if (horizontalDistance < globalMin) {
      recommendedCharge = activeCharges[0].charge;
    } else {
      recommendedCharge = activeCharges[activeCharges.length - 1].charge;
    }
  }

  // Active charge selection:
  // If preferredCharge is -1 (AUTO), use recommended charge.
  // If user specified a manual charge (0..4), use it.
  const isAuto = preferredCharge === undefined || preferredCharge < 0;
  const activeChargeIdx = isAuto ? recommendedCharge : preferredCharge;

  const selectedChargeObj = activeCharges.find((c) => c.charge === activeChargeIdx) || activeCharges[0];
  // A stale manual ring (e.g. saved before only Ring 4 existed) falls back to the real ring.
  const resolvedChargeIdx = selectedChargeObj.charge;
  const table = selectedChargeObj.table;
  const inRange = horizontalDistance >= selectedChargeObj.minRange && horizontalDistance <= selectedChargeObj.maxRange;

  // Check explicit bracket guidance / warnings
  let warning: string | undefined = getRequiredChargeWarning(activeCharges, resolvedChargeIdx, horizontalDistance);

  let elevationMils: number | null = null;
  let elevationDeg: number | null = null;
  let timeOfFlight: number | null = null;
  let peakAlt: number | null = null;
  let dElevPer100m: number | null = null;
  let angleImpact: number | null = null;

  // No clamping: a target outside the selected ring's bracket gets no firing solution at all.
  // (Previously the distance was clamped to the table edge and a number was still shown.)
  const interp = inRange ? interpolateBallistics(table, horizontalDistance) : null;

  if (inRange && !interp && !warning) {
    warning = `No ballistic table data for ${Math.round(horizontalDistance)}m on Ring ${resolvedChargeIdx} (table covers ${table[0]?.range ?? '?'}–${table[table.length - 1]?.range ?? '?'}m)`;
  }

  if (interp) {
    dElevPer100m = interp.dElevPer100m === null ? null : Math.round(interp.dElevPer100m * 10) / 10;
    peakAlt = interp.peakAlt === null ? null : Math.round(interp.peakAlt);
    angleImpact = interp.angleImpact === null ? null : Math.round(interp.angleImpact * 10) / 10;
    timeOfFlight = Math.round(interp.timeOfFlight * 10) / 10;

    // Official manual altitude correction: Final Elevation = Base Elevation + (Delta Alt / 100 * Delta H_w)
    // If the table has no dElev column, a non-zero height difference cannot be corrected: refuse instead of guessing.
    let correctedElev: number | null = interp.elevation;
    if (deltaAlt !== 0) {
      if (interp.dElevPer100m === null) {
        correctedElev = null;
        warning = warning ?? 'Altitude correction data (D ELEV) missing in table - cannot correct for height difference';
      } else {
        correctedElev = interp.elevation + calculateAltitudeCorrection(deltaAlt, interp.dElevPer100m);
      }
    }

    if (correctedElev !== null) correctedElev += elevOffset;

    if (correctedElev !== null) {
      // Physical tube limits: an unreachable elevation is not shown as a solution.
      if (correctedElev > weapon.maxElevation) {
        warning = warning ?? `Corrected elevation (${Math.round(correctedElev)} mils) exceeds maximum quadrant limit [${weapon.minElevation}–${weapon.maxElevation} mils]`;
      } else if (correctedElev < lockMils) {
        warning = warning ?? (lockMils > weapon.minElevation
          ? `Corrected elevation (${Math.round(correctedElev)} mils) is below your minimum angle (${lockMils} mils)`
          : `Corrected elevation (${Math.round(correctedElev)} mils) below minimum quadrant limit [${weapon.minElevation}–${weapon.maxElevation} mils]`);
      } else {
        elevationMils = Math.round(correctedElev);
        elevationDeg = Math.round(elevationMils * (360 / weapon.milsPerCircle) * 10) / 10;
      }
    }
  }

  return {
    horizontalDistance: Math.round(horizontalDistance),
    slantDistance: Math.round(slantDistance),
    heightDifference: Math.round(deltaAlt),
    azimuthDeg: Math.round(azimuthDeg * 10) / 10,
    azimuthMils: Math.round(azimuthMils),
    charge: resolvedChargeIdx,
    recommendedCharge,
    elevationMils,
    elevationDeg,
    timeOfFlight,
    peakAlt,
    dElevPer100m,
    angleImpact,
    inRange,
    warning,
    ammoType: activeAmmo ? `${activeAmmo.code} ${activeAmmo.name}` : weapon.caliber,
    ammoId: activeAmmo?.id,
    ammoWeightKg: activeAmmo?.weightKg,
    ammoCategory: activeAmmo?.category,
    tableVerificationStatus: activeAmmo && activeAmmo.isVerified === false ? 'UNVERIFIED' : undefined,
    tableNote: activeAmmo && activeAmmo.isVerified === false ? activeAmmo.verificationNote : undefined,
  };
}

/**
 * Direct calculation entry point supporting weapon, ammoType, chargeRing, targetRange, and optional deltaAlt
 */
export function calculateSolutionByAmmo(
  weapon: WeaponConfig,
  ammoType: string,
  chargeRing: number,
  targetRange: number,
  deltaAlt: number = 0
): BallisticSolution {
  return solveMortarFireMission({
    weapon,
    gunPos: { x: 0, z: 0, alt: 0 },
    targetPos: { x: 0, z: targetRange, alt: deltaAlt },
    preferredCharge: chargeRing,
    ammoId: ammoType,
    ammoType,
  });
}

/**
 * Inverts elevation lookup to find the theoretical distance for a dialed elevation
 */
export function lookupRangeFromElevation(
  table: BallisticDataPoint[],
  elevationMils: number
): { range: number; tof: number; isExact: boolean } | null {
  if (!table || table.length === 0) return null;

  const exact = table.find((p) => Math.abs(p.elevation - elevationMils) < 0.2);
  if (exact) {
    return { range: exact.range, tof: exact.tof, isExact: true };
  }

  const highestElev = table[0].elevation;
  const lowestElev = table[table.length - 1].elevation;

  if (elevationMils > highestElev || elevationMils < lowestElev) {
    return null;
  }

  for (let i = 0; i < table.length - 1; i++) {
    const p1 = table[i];
    const p2 = table[i + 1];

    if (elevationMils <= p1.elevation && elevationMils >= p2.elevation) {
      const span = p2.elevation - p1.elevation;
      const t = (elevationMils - p1.elevation) / span;
      return {
        range: Math.round((p1.range + t * (p2.range - p1.range)) * 10) / 10,
        tof: Math.round((p1.tof + t * (p2.tof - p1.tof)) * 10) / 10,
        isExact: false,
      };
    }
  }

  return null;
}
