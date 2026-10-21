import { describe, it, expect } from 'vitest';
import { 
  M252_PROFILE, 
  PODNOS_2B14_PROFILE, 
  MORTAR_SYSTEM_PROFILES, 
  ALL_RANGE_ENTRIES,
  filterRangeEntries 
} from './mortarReferenceData';

describe('Mortar Reference Information System', () => {
  describe('1. American M252 81mm Mortar Profile', () => {
    it('contains strict American designation, caliber, and 6400 NATO mil system', () => {
      expect(M252_PROFILE.designation).toBe('M252 81mm Mortar');
      expect(M252_PROFILE.caliber).toBe('81 mm');
      expect(M252_PROFILE.milsPerCircle).toBe(6400);
      expect(M252_PROFILE.faction).toBe('US Army');
    });

    it('records exact M252 elevation limits: 800 mil ≈ 45.0° and 1515 mil ≈ 85.2°', () => {
      expect(M252_PROFILE.minimumElevationMil).toBe(800);
      expect(M252_PROFILE.maximumElevationMil).toBe(1515);
      expect(M252_PROFILE.minimumElevationDeg).toBeCloseTo(45.0, 1);
      expect(M252_PROFILE.maximumElevationDeg).toBeCloseTo(85.2, 1);
      expect(M252_PROFILE.elevationDisplayMilDeg).toContain('800 mil ≈ 45.0°');
      expect(M252_PROFILE.elevationDisplayMilDeg).toContain('1515 mil ≈ 85.2°');
    });

    it('includes all 4 documented ammunition categories: M821, M819, M853A1, M879', () => {
      const ammoIds = M252_PROFILE.ammunition.map((a) => a.id);
      expect(ammoIds).toContain('M821_HE');
      expect(ammoIds).toContain('M819_SMOKE');
      expect(ammoIds).toContain('M853A1_ILLUM');
      expect(ammoIds).toContain('M879_PRACTICE');

      const ammoCats = M252_PROFILE.ammunition.map((a) => a.category);
      expect(ammoCats).toContain('HE');
      expect(ammoCats).toContain('SMOKE');
      expect(ammoCats).toContain('ILLUM');
      expect(ammoCats).toContain('PRACTICE');
    });

    it('verifies M821 HE charges 0 through 4 with confirmed vanilla ranges', () => {
      const m821 = M252_PROFILE.ammunition.find((a) => a.id === 'M821_HE');
      expect(m821).toBeDefined();
      expect(m821?.verificationStatus).toBe('VERIFIED');
      expect(m821?.entries.length).toBe(5);

      const c0 = m821?.entries.find((e) => e.chargeRing === 0);
      expect(c0?.minimumRangeMeters).toBe(50);
      expect(c0?.maximumRangeMeters).toBe(500);
      expect(c0?.verificationStatus).toBe('VERIFIED');

      const c4 = m821?.entries.find((e) => e.chargeRing === 4);
      expect(c4?.minimumRangeMeters).toBe(400);
      expect(c4?.maximumRangeMeters).toBe(2900);
      expect(c4?.verificationStatus).toBe('VERIFIED');
    });
  });

  describe('2. Russian 2B14 82mm Mortar Profile', () => {
    it('contains strict Russian designation, caliber, and 6000 Warsaw Pact mil system', () => {
      expect(PODNOS_2B14_PROFILE.designation).toBe('2B14 82mm Mortar');
      expect(PODNOS_2B14_PROFILE.caliber).toBe('82 mm');
      expect(PODNOS_2B14_PROFILE.milsPerCircle).toBe(6000);
      expect(PODNOS_2B14_PROFILE.faction).toBe('Soviet Army');
    });

    it('records exact 2B14 elevation limits: 748 mil ≈ 44.9° and 1415 mil ≈ 84.9°', () => {
      expect(PODNOS_2B14_PROFILE.minimumElevationMil).toBe(748);
      expect(PODNOS_2B14_PROFILE.maximumElevationMil).toBe(1415);
      expect(PODNOS_2B14_PROFILE.minimumElevationDeg).toBeCloseTo(44.9, 1);
      expect(PODNOS_2B14_PROFILE.maximumElevationDeg).toBeCloseTo(84.9, 1);
      expect(PODNOS_2B14_PROFILE.elevationDisplayMilDeg).toContain('748 mil ≈ 44.9°');
      expect(PODNOS_2B14_PROFILE.elevationDisplayMilDeg).toContain('1415 mil ≈ 84.9°');
    });

    it('preserves exact Russian ammunition designations: O-832DU, D-832DU, C-832S', () => {
      const designations = PODNOS_2B14_PROFILE.ammunition.map((a) => a.designation);
      expect(designations).toContain('O-832DU');
      expect(designations).toContain('D-832DU');
      expect(designations).toContain('C-832S');
    });

    it('verifies O-832DU charges 0 to 4 and records conflicting unverified observation', () => {
      const o832 = PODNOS_2B14_PROFILE.ammunition.find((a) => a.id === 'O832DU_HE');
      expect(o832).toBeDefined();

      const c0 = o832?.entries.find((e) => e.id === 'podnos_o832_c0');
      expect(c0?.minimumRangeMeters).toBe(80);
      expect(c0?.maximumRangeMeters).toBe(450);
      expect(c0?.verificationStatus).toBe('VERIFIED');

      const c4 = o832?.entries.find((e) => e.id === 'podnos_o832_c4');
      expect(c4?.minimumRangeMeters).toBe(400);
      expect(c4?.maximumRangeMeters).toBe(2300);
      expect(c4?.verificationStatus).toBe('VERIFIED');

      // Check conflicting observation is preserved and not silently discarded
      const conflict = o832?.entries.find((e) => e.isConflicting);
      expect(conflict).toBeDefined();
      expect(conflict?.verificationStatus).toBe('CONFLICTING');
      expect(conflict?.notesEn).toContain('1422 mils');
    });

    it('marks Russian incomplete ammunition as UNVERIFIED or MISSING without fabricating data', () => {
      const d832 = PODNOS_2B14_PROFILE.ammunition.find((a) => a.id === 'D832DU_SMOKE');
      expect(d832?.verificationStatus).toBe('UNVERIFIED');

      const c832 = PODNOS_2B14_PROFILE.ammunition.find((a) => a.id === 'C832S_ILLUM');
      expect(c832?.verificationStatus).toBe('MISSING');
      expect(c832?.entries[0].minimumRangeMeters).toBeNull();
      expect(c832?.entries[0].maximumRangeMeters).toBeNull();
    });
  });

  describe('3. Strict Separation of Systems', () => {
    it('keeps American and Russian configurations isolated in catalog', () => {
      const usProfile = MORTAR_SYSTEM_PROFILES['m252_81mm'];
      const ruProfile = MORTAR_SYSTEM_PROFILES['2b14_82mm'];

      expect(usProfile.milsPerCircle).toBe(6400);
      expect(ruProfile.milsPerCircle).toBe(6000);

      // American ammunition never appears in Russian profile
      const usAmmoIds = usProfile.ammunition.map((a) => a.designation);
      const ruAmmoIds = ruProfile.ammunition.map((a) => a.designation);

      expect(usAmmoIds).not.toContain('O-832DU');
      expect(ruAmmoIds).not.toContain('M821 HE');
    });
  });

  describe('4. Range Reference Table Filtering', () => {
    it('filters entries strictly by mortar system', () => {
      const usEntries = filterRangeEntries({ mortarId: 'm252_81mm' });
      expect(usEntries.every((e) => e.mortarId === 'm252_81mm')).toBe(true);
      expect(usEntries.length).toBeGreaterThan(0);

      const ruEntries = filterRangeEntries({ mortarId: '2b14_82mm' });
      expect(ruEntries.every((e) => e.mortarId === '2b14_82mm')).toBe(true);
      expect(ruEntries.length).toBeGreaterThan(0);
    });

    it('filters entries by ammunition category', () => {
      const heEntries = filterRangeEntries({ ammunitionCategory: 'HE' });
      expect(heEntries.every((e) => e.ammunitionCategory === 'HE')).toBe(true);

      const smokeEntries = filterRangeEntries({ ammunitionCategory: 'SMOKE' });
      expect(smokeEntries.every((e) => e.ammunitionCategory === 'SMOKE')).toBe(true);
    });

    it('filters entries by verification status', () => {
      const verified = filterRangeEntries({ verificationStatus: 'VERIFIED' });
      expect(verified.every((e) => e.verificationStatus === 'VERIFIED')).toBe(true);

      const conflicting = filterRangeEntries({ verificationStatus: 'CONFLICTING' });
      expect(conflicting.length).toBeGreaterThan(0);
      expect(conflicting.every((e) => e.verificationStatus === 'CONFLICTING')).toBe(true);

      const missing = filterRangeEntries({ verificationStatus: 'MISSING' });
      expect(missing.length).toBeGreaterThan(0);
      expect(missing.every((e) => e.verificationStatus === 'MISSING')).toBe(true);
    });
  });
});
