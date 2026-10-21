import { describe, it, expect } from 'vitest';
import {
  interpolateBallistics,
  calculateAltitudeCorrection,
  findValidCharges,
  getRequiredChargeWarning,
  solveMortarFireMission,
  calculateSolutionByAmmo,
} from './ballisticsCalculator';
import {
  M252_M821_HE_CHARGE_0,
  M252_M821_HE_CHARGE_1,
  M252_M821_HE_CHARGE_2,
  M252_M821_HE_CHARGE_3,
  M252_M821_HE_CHARGE_4,
  PODNOS_O832DU_HE_CHARGE_0,
  PODNOS_O832DU_HE_CHARGE_1,
  PODNOS_O832DU_HE_CHARGE_2,
  PODNOS_O832DU_HE_CHARGE_3,
  PODNOS_O832DU_HE_CHARGE_4,
  M252_AMMUNITION,
  PODNOS_AMMUNITION,
  WEAPONS,
  calculateFiringSolution,
} from '../data/ballistics';

describe('Mortar Ballistic Engine - Dynamic Charges & Brackets Validation', () => {
  const m252Weapon = WEAPONS.find((w) => w.id === 'm252_81mm')!;
  const podnosWeapon = WEAPONS.find((w) => w.id === '2b14_82mm')!;

  describe('1. Table brackets per charge ring', () => {
    const US_BRACKETS = [[495, 2900]]; // only Ring 4 exists

    it('US M252 M821 rings use the confirmed in-game ranges and stay inside the 800-1515 mil tube limits', () => {
      expect(m252Weapon.charges.length).toBe(1);
      expect(m252Weapon.charges[0].charge).toBe(4);
      US_BRACKETS.forEach(([min, max], i) => {
        const c = m252Weapon.charges[i];
        expect(c.minRange).toBe(min);
        expect(c.maxRange).toBe(max);
        expect(c.table[0].range).toBe(min);
        expect(c.table[c.table.length - 1].range).toBe(max);
        c.table.forEach((p) => {
          expect(p.elevation).toBeGreaterThanOrEqual(800);
          expect(p.elevation).toBeLessThanOrEqual(1515);
        });
        // Elevation falls as range grows (high-angle fire)
        for (let k = 1; k < c.table.length; k++) {
          expect(c.table[k].elevation).toBeLessThanOrEqual(c.table[k - 1].elevation);
        }
        // Max range sits at 45 deg = 800 mils; min range at the 1515 mil stop
        expect(c.table[c.table.length - 1].elevation).toBe(800);
        expect(c.table[0].elevation).toBe(1515);
      });
    });

    it('2B14 tables are built on the 6000-mil circle and stay inside 748-1415 mils; the max-range row closes at 45.0 deg', () => {
      expect(podnosWeapon.charges.length).toBe(1);
      expect(podnosWeapon.charges[0].charge).toBe(4);
      podnosWeapon.charges.forEach((c) => {
        expect(c.table.length).toBeGreaterThan(3);
        c.table.forEach((p) => {
          expect(p.elevation).toBeGreaterThanOrEqual(748);
          expect(p.elevation).toBeLessThanOrEqual(1415);
        });
        expect(c.table[c.table.length - 1].elevation).toBe(750); // 45 deg on a 6000 circle
      });
    });

    it('the same angle is used for the same range on both weapons (only the mil circle differs)', () => {
      const us = calculateSolutionByAmmo(m252Weapon, 'M821_HE', 4, 1000, 0);
      const ru = calculateSolutionByAmmo(podnosWeapon, 'O832DU_HE', 4, 1000, 0);
      expect(us.elevationDeg).not.toBeNull();
      expect(ru.elevationDeg).not.toBeNull();
      expect(Math.abs(us.elevationDeg! - ru.elevationDeg!)).toBeLessThan(0.3);
      expect(us.elevationMils).not.toBe(ru.elevationMils);
    });
  });

  describe('2. Dynamic Table Selection by Ring & Range Warnings', () => {
    it('correctly maps target distance to valid charge rings', () => {
      expect(findValidCharges(m252Weapon, 1500).map((c) => c.charge)).toEqual([4]);
      expect(findValidCharges(m252Weapon, 2500).map((c) => c.charge)).toEqual([4]);
      expect(findValidCharges(m252Weapon, 400)).toEqual([]); // below Ring 4 minimum (495 m)
    });

    it('generates explicit "Range requires Ring X" warning on manual ring mismatch', () => {
      expect(getRequiredChargeWarning(m252Weapon, 4, 1500)).toBeUndefined();
      expect(getRequiredChargeWarning(m252Weapon, 4, 300)).toBe('Target distance (300m) below minimum range (495m)');
      expect(getRequiredChargeWarning(m252Weapon, 4, 3000)).toBe('Target distance (3000m) exceeds maximum range (2900m)');
      expect(getRequiredChargeWarning(m252Weapon, 1, 1500)).toBe('Invalid charge selected'); // Ring 1 no longer exists
    });

    it('auto-selects a valid charge in AUTO mode (preferredCharge = -1)', () => {
      const sol = solveMortarFireMission({
        weapon: m252Weapon,
        gunPos: { x: 1000, z: 1000, alt: 0 },
        targetPos: { x: 1000, z: 2500, alt: 0 }, // 1500m
        preferredCharge: -1,
      });
      expect(sol.charge).toBe(4);
      expect(sol.inRange).toBe(true);
      expect(sol.elevationMils).not.toBeNull();
      expect(sol.warning).toBeUndefined();
    });
  });

  describe('3. Precise Altitude Correction (Delta Hw)', () => {
    const shot = (gunAlt: number, tgtAlt: number) =>
      solveMortarFireMission({
        weapon: m252Weapon,
        gunPos: { x: 0, z: 0, alt: gunAlt },
        targetPos: { x: 0, z: 1000, alt: tgtAlt },
        preferredCharge: 4,
      });

    it('a target 100 m higher needs LESS elevation than flat ground', () => {
      const flat = shot(0, 0);
      const hill = shot(0, 100);
      expect(hill.horizontalDistance).toBe(1000);
      expect(hill.heightDifference).toBe(100);
      expect(hill.inRange).toBe(true);
      expect(hill.elevationMils!).toBeLessThan(flat.elevationMils!);
    });

    it('a target 100 m lower needs MORE elevation than flat ground', () => {
      const flat = shot(0, 0);
      const valley = shot(100, 0);
      expect(valley.heightDifference).toBe(-100);
      expect(valley.elevationMils!).toBeGreaterThan(flat.elevationMils!);
    });

    it('hill and valley corrections are about the same size', () => {
      const flat = shot(0, 0).elevationMils!;
      const up = flat - shot(0, 100).elevationMils!;
      const down = shot(100, 0).elevationMils! - flat;
      expect(Math.abs(up - down)).toBeLessThanOrEqual(2);
    });
  });

  describe('4. Azimuth & Euclidean Planar Distance Accuracy', () => {
    it('calculates exact 3-4-5 triangle Euclidean distance (1 unit = 1 meter)', () => {
      const sol = solveMortarFireMission({
        weapon: m252Weapon,
        gunPos: { x: 1000, z: 1000, alt: 0 },
        targetPos: { x: 1300, z: 1400, alt: 0 }, // dx=300, dz=400 -> dist=500m
        preferredCharge: 1,
      });

      expect(sol.horizontalDistance).toBe(500);
      expect(sol.slantDistance).toBe(500);
    });

    it('normalizes NATO Azimuth to 6400 mils and Soviet Azimuth to 6000 mils', () => {
      // Due East: dx = 1000, dz = 0 -> angle = 90 deg
      // NATO 90 deg = 90 * 6400 / 360 = 1600 mils
      // Soviet 90 deg = 90 * 6000 / 360 = 1500 mils
      const solNato = solveMortarFireMission({
        weapon: m252Weapon,
        gunPos: { x: 0, z: 0, alt: 0 },
        targetPos: { x: 1000, z: 0, alt: 0 },
      });
      expect(solNato.azimuthDeg).toBe(90.0);
      expect(solNato.azimuthMils).toBe(1600);

      const solSoviet = solveMortarFireMission({
        weapon: podnosWeapon,
        gunPos: { x: 0, z: 0, alt: 0 },
        targetPos: { x: 1000, z: 0, alt: 0 },
      });
      expect(solSoviet.azimuthDeg).toBe(90.0);
      expect(solSoviet.azimuthMils).toBe(1500);

      // Due South: dx = 0, dz = -1000 -> angle = 180 deg
      // NATO 180 deg = 3200 mils, Soviet 180 deg = 3000 mils
      const solSouth = solveMortarFireMission({
        weapon: m252Weapon,
        gunPos: { x: 0, z: 0, alt: 0 },
        targetPos: { x: 0, z: -1000, alt: 0 },
      });
      expect(solSouth.azimuthDeg).toBe(180.0);
      expect(solSouth.azimuthMils).toBe(3200);
    });
  });

  describe('5. Intermediate Linear Interpolation & Boundary Guard', () => {
    it('interpolates halfway between two table rows', () => {
      const table = m252Weapon.charges[0].table;
      const a = table[3];
      const b = table[4];
      const mid = interpolateBallistics(table, (a.range + b.range) / 2)!;
      expect(mid).not.toBeNull();
      expect(mid.elevation).toBeCloseTo((a.elevation + b.elevation) / 2, 5);
      expect(mid.isExact).toBe(false);
      const exact = interpolateBallistics(table, a.range)!;
      expect(exact.elevation).toBe(a.elevation);
      expect(exact.isExact).toBe(true);
    });

    it('returns null and triggers explicit warning for out-of-bounds target ranges', () => {
      const charge4Table = m252Weapon.charges[0].table;

      // Below minRange (400m)
      expect(interpolateBallistics(charge4Table, 350)).toBeNull();

      // Above maxRange (2900m)
      expect(interpolateBallistics(charge4Table, 3050)).toBeNull();

      // Fire mission returns inRange: false and tactical warning
      const solUnder = solveMortarFireMission({
        weapon: m252Weapon,
        gunPos: { x: 0, z: 0, alt: 0 },
        targetPos: { x: 0, z: 30, alt: 0 }, // 30m is below global min (50m)
      });
      expect(solUnder.inRange).toBe(false);
      expect(solUnder.warning).toMatch(/below minimum range/i);

      const solOver = solveMortarFireMission({
        weapon: m252Weapon,
        gunPos: { x: 0, z: 0, alt: 0 },
        targetPos: { x: 0, z: 3500, alt: 0 }, // 3500m is above global max (2900m)
      });
      expect(solOver.inRange).toBe(false);
      expect(solOver.warning).toMatch(/exceeds maximum range/i);
    });
  });

  describe('6. Comprehensive Ammunition Registry & Multi-Ammo Calculation', () => {
    it('verifies US M252 has 4 distinct ammunition types with authentic in-game weights', () => {
      expect(m252Weapon.ammunition).toBeDefined();
      expect(m252Weapon.ammunition!.length).toBe(4);

      const [he, illum, smoke, training] = m252Weapon.ammunition!;

      // 1. M821 HE: 4.06 kg
      expect(he.id).toBe('M821_HE');
      expect(he.category).toBe('HE');
      expect(he.weightKg).toBe(4.06);

      // 2. M853A1 ILLUM: 4.00 kg
      expect(illum.id).toBe('M853A1_ILLUM');
      expect(illum.category).toBe('ILLUM');
      expect(illum.weightKg).toBe(4.0);

      // 3. M819 SMOKE: 4.85 kg
      expect(smoke.id).toBe('M819_SMOKE');
      expect(smoke.category).toBe('SMOKE');
      expect(smoke.weightKg).toBe(4.85);

      // 4. M879 TRAINING: 4.26 kg
      expect(training.id).toBe('M879_TRAINING');
      expect(training.category).toBe('TRAINING');
      expect(training.weightKg).toBe(4.26);
    });

    it('verifies Soviet 2B14 Podnos has 3 distinct ammunition types with authentic weights', () => {
      expect(podnosWeapon.ammunition).toBeDefined();
      expect(podnosWeapon.ammunition!.length).toBe(3);

      const [he, illum, smoke] = podnosWeapon.ammunition!;

      // 1. O832DU HE: 3.10 kg
      expect(he.id).toBe('O832DU_HE');
      expect(he.category).toBe('HE');
      expect(he.weightKg).toBe(3.1);

      // 2. S832S ILLUM: 3.51 kg
      expect(illum.id).toBe('S832S_ILLUM');
      expect(illum.category).toBe('ILLUM');
      expect(illum.weightKg).toBe(3.51);

      // 3. D832DU SMOKE: 3.48 kg
      expect(smoke.id).toBe('D832DU_SMOKE');
      expect(smoke.category).toBe('SMOKE');
      expect(smoke.weightKg).toBe(3.48);
    });

    it('dynamically recalculates ballistic solution when switching between ammunition types', () => {
      const solve = (ammoId: string) =>
        solveMortarFireMission({
          weapon: m252Weapon,
          gunPos: { x: 0, z: 0, alt: 0 },
          targetPos: { x: 0, z: 1000, alt: 0 },
          preferredCharge: 4,
          ammoId,
        });
      const solHE = solve('M821_HE');
      const solSmoke = solve('M819_SMOKE');
      expect(solHE.ammoWeightKg).toBe(4.06);
      expect(solSmoke.ammoWeightKg).toBe(4.85);
      expect(solHE.elevationMils).not.toBeNull();
      expect(solSmoke.elevationMils).not.toBeNull();
      expect(solSmoke.elevationMils).not.toBe(solHE.elevationMils);
    });

    it('verifies direct calculateSolutionByAmmo helper API', () => {
      const solution = calculateSolutionByAmmo(m252Weapon, 'M821_HE', 4, 1000, 0);
      expect(solution.elevationMils).not.toBeNull();
      expect(solution.charge).toBe(4);
      expect(solution.horizontalDistance).toBe(1000);
      expect(solution.inRange).toBe(true);
      const solutionHill = calculateSolutionByAmmo(m252Weapon, 'M821_HE', 4, 1000, 100);
      expect(solutionHill.elevationMils!).toBeLessThan(solution.elevationMils!);
    });

    it('marks every estimated table as UNVERIFIED and carries a note for the UI', () => {
      const us = calculateSolutionByAmmo(m252Weapon, 'M821_HE', 4, 1000, 0);
      const ru = calculateSolutionByAmmo(podnosWeapon, 'O832DU_HE', 4, 1000, 0);
      expect(us.tableVerificationStatus).toBe('UNVERIFIED');
      expect(ru.tableVerificationStatus).toBe('UNVERIFIED');
      expect(us.tableNote).toBeDefined();
      expect(ru.tableNote).toBeDefined();
    });
  });

  describe('6. Elevation Degree Conversion & Sight Limit Verification', () => {
    it('verifies American M252 NATO 6400 mil system and reference angle values', () => {
      expect(m252Weapon.milsPerCircle).toBe(6400);
      expect(m252Weapon.minElevation).toBe(800);
      expect(m252Weapon.maxElevation).toBe(1515);
      expect((800 * 360) / 6400).toBe(45.0);
      expect(Math.round(((1515 * 360) / 6400) * 10) / 10).toBe(85.2);

      const sol = solveMortarFireMission({
        weapon: m252Weapon,
        gunPos: { x: 0, z: 0, alt: 0 },
        targetPos: { x: 0, z: 1000, alt: 0 },
        preferredCharge: 4,
        ammoId: 'M821_HE',
      });
      expect(sol.elevationMils).not.toBeNull();
      expect(sol.elevationDeg).toBe(Math.round(((sol.elevationMils! * 360) / 6400) * 10) / 10);
    });

    it('verifies Soviet 2B14 Podnos Warsaw Pact 6000 mil system and reference angle values', () => {
      expect(podnosWeapon.milsPerCircle).toBe(6000);
      expect(podnosWeapon.minElevation).toBe(748);
      expect(podnosWeapon.maxElevation).toBe(1415);
      expect(Math.round(((748 * 360) / 6000) * 10) / 10).toBe(44.9);
      expect(Math.round(((1415 * 360) / 6000) * 10) / 10).toBe(84.9);

      const sol = solveMortarFireMission({
        weapon: podnosWeapon,
        gunPos: { x: 0, z: 0, alt: 0 },
        targetPos: { x: 0, z: 1000, alt: 0 },
        preferredCharge: 4,
        ammoId: 'O832DU_HE',
      });
      expect(sol.elevationMils).not.toBeNull();
      expect(sol.inRange).toBe(true);
      expect(sol.elevationMils!).toBeGreaterThanOrEqual(748);
      expect(sol.elevationMils!).toBeLessThanOrEqual(1415);
      expect(sol.elevationDeg).toBe(Math.round(((sol.elevationMils! * 360) / 6000) * 10) / 10);
      expect(sol.tableVerificationStatus).toBe('UNVERIFIED');
    });


    it('verifies independent configurations and complete specification metadata for M252 and 2B14', () => {
      // 1. American M252 Mortar
      expect(m252Weapon.shortName).toBe('M252');
      expect(m252Weapon.caliber).toBe('81 mm');
      expect(m252Weapon.angularSystemDescription).toBe('6400 mil per full circle');
      expect(m252Weapon.minElevation).toBe(800);
      expect(m252Weapon.minElevationDeg).toBe(45.0);
      expect(m252Weapon.maxElevation).toBe(1515);
      expect(m252Weapon.maxElevationDeg).toBe(85.2);
      expect(m252Weapon.verificationStatus).toBe('Requires verification against the existing game implementation');
      expect(m252Weapon.ammunition?.length).toBeGreaterThanOrEqual(4);

      // Formatted limits
      const m252MinLimitStr = `${m252Weapon.minElevation} mil ≈ ${m252Weapon.minElevationDeg?.toFixed(1)}°`;
      const m252MaxLimitStr = `${m252Weapon.maxElevation} mil ≈ ${m252Weapon.maxElevationDeg?.toFixed(1)}°`;
      expect(m252MinLimitStr).toBe('800 mil ≈ 45.0°');
      expect(m252MaxLimitStr).toBe('1515 mil ≈ 85.2°');

      // 2. Russian 2B14 Mortar
      expect(podnosWeapon.shortName).toBe('2B14');
      expect(podnosWeapon.caliber).toBe('82 mm');
      expect(podnosWeapon.angularSystemDescription).toBe('6000 mil per full circle');
      expect(podnosWeapon.minElevation).toBe(748);
      expect(podnosWeapon.minElevationDeg).toBe(44.9);
      expect(podnosWeapon.maxElevation).toBe(1415);
      expect(podnosWeapon.maxElevationDeg).toBe(84.9);
      expect(podnosWeapon.verificationStatus).toBe('Requires verification against the existing game implementation');
      expect(podnosWeapon.ammunition?.length).toBeGreaterThanOrEqual(3);

      // Formatted limits
      const podnosMinLimitStr = `${podnosWeapon.minElevation} mil ≈ ${podnosWeapon.minElevationDeg?.toFixed(1)}°`;
      const podnosMaxLimitStr = `${podnosWeapon.maxElevation} mil ≈ ${podnosWeapon.maxElevationDeg?.toFixed(1)}°`;
      expect(podnosMinLimitStr).toBe('748 mil ≈ 44.9°');
      expect(podnosMaxLimitStr).toBe('1415 mil ≈ 84.9°');

      // 3. Confirm systems are fully independent
      expect(m252Weapon.milsPerCircle).not.toBe(podnosWeapon.milsPerCircle);
      expect(m252Weapon.minElevation).not.toBe(podnosWeapon.minElevation);
      expect(m252Weapon.maxElevation).not.toBe(podnosWeapon.maxElevation);
      expect(m252Weapon.ammunition).not.toBe(podnosWeapon.ammunition);
    });
  });

  describe('7. No invented values, no clamping', () => {
    it('returns null for optional columns missing from the table instead of defaults', () => {
      const table = [
        { range: 100, elevation: 1400, tof: 20 },
        { range: 200, elevation: 1300, tof: 25 },
      ];
      const r = interpolateBallistics(table, 150)!;
      expect(r.elevation).toBeCloseTo(1350, 5);
      expect(r.dElevPer100m).toBeNull();
      expect(r.peakAlt).toBeNull();
      expect(r.angleImpact).toBeNull();
      expect(r.dispersion).toBeNull();
    });

    it('gives no elevation for a target outside the selected ring (no clamping to the table edge)', () => {
      const sol = solveMortarFireMission({
        weapon: m252Weapon,
        gunPos: { x: 0, z: 0, alt: 0 },
        targetPos: { x: 0, z: 3500, alt: 0 }, // beyond Ring 4 max (2900 m)
        preferredCharge: 4,
      });
      expect(sol.inRange).toBe(false);
      expect(sol.elevationMils).toBeNull();
      expect(sol.warning).toMatch(/maximum range/);
    });

    it('refuses a height-corrected solution when the table has no D ELEV column', () => {
      const bareWeapon = {
        ...m252Weapon,
        ammunition: undefined,
        charges: [
          { charge: 0, name: 'bare', minRange: 100, maxRange: 200, muzzleVelocity: 0, table: [
            { range: 100, elevation: 1400, tof: 20 },
            { range: 200, elevation: 1300, tof: 25 },
          ] },
        ],
      };
      const flat = solveMortarFireMission({ weapon: bareWeapon, gunPos: { x: 0, z: 0, alt: 0 }, targetPos: { x: 0, z: 150, alt: 0 }, preferredCharge: 0 });
      expect(flat.elevationMils).toBe(1350);
      const hill = solveMortarFireMission({ weapon: bareWeapon, gunPos: { x: 0, z: 0, alt: 0 }, targetPos: { x: 0, z: 150, alt: 50 }, preferredCharge: 0 });
      expect(hill.elevationMils).toBeNull();
      expect(hill.warning).toMatch(/D ELEV/);
    });

    it('rejects a corrected elevation beyond the tube limit instead of displaying it', () => {
      const sol = solveMortarFireMission({
        weapon: m252Weapon,
        gunPos: { x: 0, z: 0, alt: 0 },
        targetPos: { x: 0, z: 500, alt: -300 }, // deep valley pushes Ring 4 past the 1515 mil stop
        preferredCharge: 4,
      });
      expect(sol.elevationMils).toBeNull();
      expect(sol.warning).toMatch(/quadrant limit/i);
    });
  });

  describe('8. Distance and azimuth come from world coordinates', () => {
    it('does not depend on anything but the two positions', () => {
      const a = solveMortarFireMission({ weapon: m252Weapon, gunPos: { x: 4000, z: 5000, alt: 0 }, targetPos: { x: 4300, z: 5400, alt: 0 }, preferredCharge: 1 });
      expect(a.horizontalDistance).toBe(500);
      const b = solveMortarFireMission({ weapon: podnosWeapon, gunPos: { x: 4000, z: 5000, alt: 0 }, targetPos: { x: 4300, z: 5400, alt: 0 }, preferredCharge: 1 });
      expect(b.horizontalDistance).toBe(500);
      expect(a.azimuthDeg).toBe(b.azimuthDeg);
    });
  });
});


describe('personal weapon calibration', () => {
  const m252Weapon = WEAPONS.find((w) => w.id === 'm252_81mm')!;
  const g = { x: 0, z: 0, alt: 0 };
  const at = (d: number) => ({ x: 0, z: d, alt: 0 });
  it('zero tuning equals standard data', () => {
    const a = calculateFiringSolution(m252Weapon, g, at(1500), -1);
    const b = calculateFiringSolution(m252Weapon, g, at(1500), -1, undefined, { rangeScalePct: 0, elevationOffsetMils: 0 });
    expect(b.elevationMils).toBe(a.elevationMils);
  });
  it('+5% range makes 1575 m use the standard 1500 m elevation', () => {
    const std = calculateFiringSolution(m252Weapon, g, at(1500), -1);
    const tuned = calculateFiringSolution(m252Weapon, g, at(1575), -1, undefined, { rangeScalePct: 5, elevationOffsetMils: 0 });
    expect(tuned.elevationMils).toBe(std.elevationMils);
  });
  it('elevation offset shifts the result and limits scale with the range', () => {
    const std = calculateFiringSolution(m252Weapon, g, at(1500), -1);
    const off = calculateFiringSolution(m252Weapon, g, at(1500), -1, undefined, { rangeScalePct: 0, elevationOffsetMils: 10 });
    expect(off.elevationMils).toBe((std.elevationMils as number) + 10);
    const edge = calculateFiringSolution(m252Weapon, g, at(3000), -1, undefined, { rangeScalePct: 5, elevationOffsetMils: 0 });
    expect(edge.inRange).toBe(true); // 2900 m * 1.05 = 3045 m
  });
});

describe('tables close at the tube minimum and stay smooth near max range', () => {
  ['m252_81mm', '2b14_82mm'].forEach((id) => {
    it(`${id}: every ammo ends exactly at the minimum elevation with no big jumps`, () => {
      const w = WEAPONS.find((x) => x.id === id)!;
      w.ammunition!.forEach((a) => {
        const t = a.charges[0].table;
        expect(t[t.length - 1].elevation).toBe(w.minElevation); // US 800 (45.0 deg), RU 748 (44.9 deg)
        for (let i = 1; i < t.length; i++) {
          expect(t[i].elevation).toBeLessThanOrEqual(t[i - 1].elevation);
          expect(t[i - 1].elevation - t[i].elevation).toBeLessThanOrEqual(20);
        }
      });
    });
  });
});
