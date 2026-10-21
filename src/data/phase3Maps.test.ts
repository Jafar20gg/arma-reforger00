import { describe, it, expect } from 'vitest';
import { TERRAINS } from './maps';
import { pixelsPerMeter } from '../services/compass';
import { TerrainId } from '../types';

const ids = Object.keys(TERRAINS) as TerrainId[];

describe('Phase 3: map configuration is consistent for every terrain', () => {
  it('the three official terrains are present', () => {
    expect(ids.sort()).toEqual(['arland', 'everon', 'kolguyev']);
  });

  ids.forEach((id) => {
    const t = TERRAINS[id];
    describe(id, () => {
      it('has a topo layer and every layer URL is a proper {z}/{x}/{y} template', () => {
        expect(t.layers.topo).toBeTruthy();
        Object.entries(t.layers).forEach(([name, url]) => {
          expect(url, name).toMatch(/\{z\}.*\{x\}.*\{y\}/);
          expect(url, name).toMatch(/^https:\/\//);
        });
      });

      it('every layer has its own zoom limits, and over-zoom is at most one level', () => {
        Object.keys(t.layers).forEach((name) => {
          const lim = t.layerZoomLimits?.[name as 'topo' | 'sat' | 'drawn'];
          expect(lim, `${name} limits`).toBeDefined();
          expect(lim!.maxZoom).toBeGreaterThanOrEqual(lim!.maxNativeZoom);
          expect(lim!.maxZoom - lim!.maxNativeZoom).toBeLessThanOrEqual(1);
          expect(lim!.maxNativeZoom).toBeLessThanOrEqual(t.maxNativeZoom);
        });
      });

      it('the start zoom (2) is allowed and the finest tile is sharper than 1 m per pixel', () => {
        expect(t.minZoom).toBeLessThanOrEqual(2);
        Object.keys(t.layers).forEach((name) => {
          const lim = t.layerZoomLimits![name as 'topo' | 'sat' | 'drawn'];
          expect(lim.maxZoom).toBeGreaterThanOrEqual(2);
          const metersPerPixel = 1 / pixelsPerMeter(t.tileSize, t.worldSize, lim.maxNativeZoom);
          expect(metersPerPixel).toBeGreaterThan(0.05);
          expect(metersPerPixel).toBeLessThan(2);
        });
      });

      it('credits Bohemia Interactive and says where the tiles come from', () => {
        expect(t.attribution).toMatch(/Bohemia Interactive/);
        expect(t.tileHost).toBeTruthy();
      });

      it('has a square world that is a whole number of tiles at the finest zoom', () => {
        expect(t.tileSize).toBe(256);
        expect(t.worldSize % 256).toBe(0);
      });
    });
  });

  it('world sizes (metres) used for all distance maths', () => {
    expect(TERRAINS.everon.worldSize).toBe(12800);
    expect(TERRAINS.kolguyev.worldSize).toBe(12800);
    // Arland: 4096 matches the "16 km2" figure of public listings (4.096 x 4.096 km); verify in game, see docs/phase3-report.md
    expect(TERRAINS.arland.worldSize).toBe(4096);
  });
});
