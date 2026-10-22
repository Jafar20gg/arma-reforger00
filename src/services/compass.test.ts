// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import L from 'leaflet';
import { bearingDeg, cardinalName, pickCircleStep, circleRadii, circleWeight, pixelsPerMeter } from './compass';
import { createTerrainCRS } from './mapCoordinates';
import { TERRAINS } from '../data/maps';

describe('compass / bearings (0 = north, 90 = east)', () => {
  const o = { x: 1000, z: 1000 };
  it('computes true-north bearings from game axes', () => {
    expect(bearingDeg(o, { x: 1000, z: 2000 })).toBeCloseTo(0, 6);
    expect(bearingDeg(o, { x: 2000, z: 1000 })).toBeCloseTo(90, 6);
    expect(bearingDeg(o, { x: 1000, z: 0 })).toBeCloseTo(180, 6);
    expect(bearingDeg(o, { x: 0, z: 1000 })).toBeCloseTo(270, 6);
    expect(bearingDeg(o, { x: 2000, z: 2000 })).toBeCloseTo(45, 6);
  });
  it('names the 8 directions in both languages', () => {
    expect(cardinalName(0, 'en')).toBe('N');
    expect(cardinalName(44, 'en')).toBe('NE');
    expect(cardinalName(225, 'en')).toBe('SW');
    expect(cardinalName(359, 'en')).toBe('N');
    expect(cardinalName(90, 'ar')).toBe('شرق');
    expect(cardinalName(315, 'ar')).toBe('شمال غرب');
  });
  it('circle radii and weights', () => {
    expect(circleRadii(500, 2000)).toEqual([500, 1000, 1500, 2000]);
    expect(circleWeight(1000)).toBe('strong');
    expect(circleWeight(1500)).toBe('medium');
    expect(circleWeight(100)).toBe('light');
    expect(pickCircleStep(1, 250)).toBe(250);
  });
});

describe('map scale is true game meters on all three terrains', () => {
  (['everon', 'arland', 'kolguyev'] as const).forEach((id) => {
    it(`${id}: 1000 m east/north spans the same pixels at every zoom`, () => {
      const t = TERRAINS[id];
      const crs = createTerrainCRS(t);
      [0, 3, 6].forEach((z) => {
        const a = crs.latLngToPoint(L.latLng(500, 500), z);
        const east = crs.latLngToPoint(L.latLng(500, 1500), z);
        const north = crs.latLngToPoint(L.latLng(1500, 500), z);
        const expected = 1000 * pixelsPerMeter(t.tileSize, t.worldSize, z);
        expect(east.x - a.x).toBeCloseTo(expected, 5);
        expect(a.y - north.y).toBeCloseTo(expected, 5); // north is up (screen y decreases)
      });
    });
    it(`${id}: world corners map to the full tile square`, () => {
      const t = TERRAINS[id];
      const crs = createTerrainCRS(t);
      const sw = crs.latLngToPoint(L.latLng(0, 0), 0);
      const ne = crs.latLngToPoint(L.latLng(t.worldSize, t.worldSize), 0);
      expect(ne.x - sw.x).toBeCloseTo(t.tileSize, 5);
      expect(sw.y - ne.y).toBeCloseTo(t.tileSize, 5);
    });
  });
});
