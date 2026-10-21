import { describe, it, expect } from 'vitest';
import { distanceBreakdown, measurePath } from './distance';

import { gameToLatLng, latLngToGame } from './mapCoordinates';
import { pixelsPerMeter } from './compass';
import { TERRAINS } from '../data/maps';
import { WEAPONS, calculateFiringSolution } from '../data/ballistics';
import { TerrainId } from '../types';

const ids = Object.keys(TERRAINS) as TerrainId[];
const m252 = WEAPONS.find((w) => w.id === 'm252_81mm')!;
const b2 = WEAPONS.find((w) => w.id === '2b14_82mm')!;

/**
 * Pixel position of a game point at a zoom level: this is the exact formula Leaflet applies for
 * L.CRS.Simple with Transformation(s, 0, -s, tileSize) (see createTerrainCRS), written out in numbers.
 */
function toPixel(t: { worldSize: number; tileSize: number }, x: number, z: number, zoom: number) {
  const s = t.tileSize / t.worldSize;
  const k = Math.pow(2, zoom);
  return { px: k * (s * x), py: k * (-s * z + t.tileSize) };
}

describe('Phase 2: distance in every direction, on every terrain', () => {
  const lengths = [50, 300, 1200, 2500]; // short, medium, long
  const dirs: Array<[string, number, number, number]> = [
    ['east', 1, 0, 90],
    ['west', -1, 0, 270],
    ['north', 0, 1, 0],
    ['south', 0, -1, 180],
    ['north-east', Math.SQRT1_2, Math.SQRT1_2, 45],
    ['south-west', -Math.SQRT1_2, -Math.SQRT1_2, 225],
  ];
  ids.forEach((id) => {
    const t = TERRAINS[id];
    const base = { x: t.worldSize / 2 - 700, z: t.worldSize / 2 - 700 }; // keeps every test point inside the map
    dirs.forEach(([name, ux, uz, az]) => {
      lengths.forEach((len) => {
        it(`${id}: ${len} m ${name}`, () => {
          const target = { x: base.x + ux * len, z: base.z + uz * len };
          const d = distanceBreakdown(base, target, 6400);
          expect(d.horizontal).toBeCloseTo(len, 6);
          expect(d.azimuthDeg).toBeCloseTo(az, 6);
        });
      });
    });
  });
});

describe('Phase 2: one source of truth (calculator, ruler and breakdown agree)', () => {
  const gun = { x: 4775.6, z: 7086.9, alt: 30 };
  const tgt = { x: 5760.5, z: 7061.8, alt: 50 };

  it('calculator horizontal distance equals distanceBreakdown', () => {
    const sol = calculateFiringSolution(m252, gun, tgt, 4);
    const d = distanceBreakdown(gun, tgt, m252.milsPerCircle);
    expect(sol.horizontalDistance).toBe(Math.round(d.horizontal));
    expect(sol.azimuthDeg).toBeCloseTo(Math.round(d.azimuthDeg * 10) / 10, 6);
  });

  it('azimuth in mils follows each weapon circle (6400 US, 6000 RU) for the same target', () => {
    const us = calculateFiringSolution(m252, gun, tgt, 4);
    const ru = calculateFiringSolution(b2, gun, tgt, 4);
    expect(us.azimuthDeg).toBe(ru.azimuthDeg);
    // mils come from the exact angle (not from the 0.1-degree rounded value shown next to it)
    expect(us.azimuthMils).toBe(Math.round(distanceBreakdown(gun, tgt, 6400).azimuthMils));
    expect(ru.azimuthMils).toBe(Math.round(distanceBreakdown(gun, tgt, 6000).azimuthMils));
  });

  it('ruler: two points = one straight line; many points = sum of segments', () => {
    const two = measurePath([{ x: 0, z: 0 }, { x: 300, z: 400 }], 6400)!;
    expect(two.total).toBe(500);
    expect(two.straight).toBe(500);
    const three = measurePath([{ x: 0, z: 0 }, { x: 300, z: 400 }, { x: 300, z: 1400 }], 6400)!;
    expect(three.total).toBe(1500);
    expect(three.straight).toBeCloseTo(Math.hypot(300, 1400), 9);
    expect(three.segments).toEqual([500, 1000]);
    expect(measurePath([{ x: 1, z: 1 }], 6400)).toBeNull();
  });

  it('ruler bearing uses the mil circle it is given (was fixed at 6400 before)', () => {
    const east = measurePath([{ x: 0, z: 0 }, { x: 100, z: 0 }], 6000)!;
    expect(east.azimuthMils).toBeCloseTo(1500, 6);
    const east64 = measurePath([{ x: 0, z: 0 }, { x: 100, z: 0 }], 6400)!;
    expect(east64.azimuthMils).toBeCloseTo(1600, 6);
  });
});

describe('Phase 2: distance does not depend on zoom, pan or screen size', () => {
  ids.forEach((id) => {
    const t = TERRAINS[id];
    it(`${id}: pixel distance / pixels-per-meter = true meters at zoom 0..8, anywhere on the map`, () => {
      const spots = [
        [100, 100],
        [t.worldSize / 2, t.worldSize / 2],
        [t.worldSize - 150, t.worldSize - 150],
        [200, t.worldSize - 300],
      ];
      for (let zoom = 0; zoom <= 8; zoom++) {
        const ppm = pixelsPerMeter(t.tileSize, t.worldSize, zoom);
        spots.forEach(([x, z]) => {
          [
            [900, 0],
            [0, 900],
            [600, 800],
          ].forEach(([dx, dz]) => {
            const a = toPixel(t, x, z, zoom);
            const b = toPixel(t, x + dx, z + dz, zoom);
            const meters = Math.hypot(b.px - a.px, b.py - a.py) / ppm;
            expect(meters).toBeCloseTo(Math.hypot(dx, dz), 6);
          });
        });
      }
    });

    it(`${id}: world corners fill exactly the tile square (north is up)`, () => {
      const sw = toPixel(t, 0, 0, 0);
      const ne = toPixel(t, t.worldSize, t.worldSize, 0);
      expect(sw.px).toBeCloseTo(0, 9);
      expect(sw.py).toBeCloseTo(t.tileSize, 9);
      expect(ne.px).toBeCloseTo(t.tileSize, 9);
      expect(ne.py).toBeCloseTo(0, 9);
    });
  });

  it('game <-> Leaflet lat/lng keeps x = East and z = North', () => {
    const ll = gameToLatLng(1234.5, 6789.25);
    expect(ll.lng).toBe(1234.5);
    expect(ll.lat).toBe(6789.25);
    const back = latLngToGame(ll);
    expect(back).toEqual({ x: 1234.5, z: 6789.25 });
  });
});

describe('Phase 2: default positions are inside each map', () => {
  ids.forEach((id) => {
    const t = TERRAINS[id];
    it(`${id}: default centre, gun and target are inside 0..${t.worldSize}`, () => {
      [t.defaultCenter, t.defaultWeapon, t.defaultTarget].forEach(([x, z]) => {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(t.worldSize);
        expect(z).toBeGreaterThanOrEqual(0);
        expect(z).toBeLessThanOrEqual(t.worldSize);
      });
    });
    it(`${id}: every named location is inside the map`, () => {
      (t.pois || []).forEach((p) => {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(t.worldSize);
        expect(p.z).toBeGreaterThanOrEqual(0);
        expect(p.z).toBeLessThanOrEqual(t.worldSize);
      });
    });
  });
});
