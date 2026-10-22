import { describe, it, expect } from 'vitest';
import {
  AVG_TILE_BYTES,
  countTiles,
  downloadTiles,
  formatBytes,
  planDownload,
  templatePrefix,
  tileUrl,
  tileUrls,
  tilesAtZoom,
  zoomChoices,
} from './offlineTiles';
import { TERRAINS } from '../data/maps';

/** In-memory stand-in for the browser cache */
function fakeCache() {
  const store = new Map<string, any>();
  return {
    store,
    match: async (u: string) => store.get(u),
    put: async (u: string, r: any) => {
      store.set(u, r);
    },
  } as any;
}
const okRes = () => ({ ok: true, status: 200, type: 'cors', clone() { return this; } }) as any;
const T = 'https://host.test/tiles/everon/{z}/{x}/{y}.webp?v=1';

describe('offline maps: counting and planning', () => {
  it('level z has 4^z tiles; totals add up', () => {
    expect(tilesAtZoom(0)).toBe(1);
    expect(tilesAtZoom(5)).toBe(1024);
    expect(countTiles(0, 5)).toBe(1365);
    expect(countTiles(2, 4)).toBe(16 + 64 + 256);
  });

  it('plan never goes deeper than the layer really has', () => {
    const arland = TERRAINS.arland;
    const plan = planDownload(arland, 'sat', 7);
    expect(plan.maxZoom).toBe(arland.layerZoomLimits!.sat!.maxNativeZoom);
    expect(plan.estimatedBytes).toBe(plan.tileCount * AVG_TILE_BYTES);
  });

  it('zoom choices start at 2 and stop at the real limit (max 7)', () => {
    Object.values(TERRAINS).forEach((t) => {
      (Object.keys(t.layers) as Array<'topo' | 'sat' | 'drawn'>).forEach((l) => {
        const c = zoomChoices(t, l);
        expect(c.length).toBeGreaterThan(0);
        expect(c[0]).toBeGreaterThanOrEqual(2);
        expect(c[c.length - 1]).toBeLessThanOrEqual(7);
      });
    });
  });

  it('builds the exact URLs Leaflet requests, level by level', () => {
    expect(tileUrl(T, 3, 5, 2)).toBe('https://host.test/tiles/everon/3/5/2.webp?v=1');
    const all = [...tileUrls(T, 0, 2)];
    expect(all.length).toBe(21);
    expect(all[0]).toBe('https://host.test/tiles/everon/0/0/0.webp?v=1');
    expect(new Set(all).size).toBe(21);
    expect(templatePrefix(T)).toBe('https://host.test/tiles/everon/');
  });

  it('formats sizes', () => {
    expect(formatBytes(500)).toBe('1 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2.00 GB');
  });
});

describe('offline maps: download', () => {
  it('stores every tile, skips ones already stored, reports progress', async () => {
    const cache = fakeCache();
    cache.store.set(tileUrl(T, 0, 0, 0), okRes()); // already there
    let calls = 0;
    const seen: number[] = [];
    const p = await downloadTiles({
      template: T,
      minZoom: 0,
      maxZoom: 2,
      cache,
      fetchFn: (async () => {
        calls++;
        return okRes();
      }) as any,
      onProgress: (x) => seen.push(x.done),
    });
    expect(p.total).toBe(21);
    expect(p.done).toBe(21);
    expect(p.failed).toBe(0);
    expect(calls).toBe(20);
    expect(cache.store.size).toBe(21);
    expect(seen[seen.length - 1]).toBe(21);
  });

  it('404 is "missing", not a failure; other errors retry then count as failed', async () => {
    const cache = fakeCache();
    let hits = 0;
    const p = await downloadTiles({
      template: T,
      minZoom: 1,
      maxZoom: 1,
      cache,
      retries: 1,
      concurrency: 1,
      fetchFn: (async (u: string) => {
        if (u.includes('/1/0/0.')) return { ok: false, status: 404, type: 'cors' } as any;
        if (u.includes('/1/1/1.')) {
          hits++;
          return { ok: false, status: 500, type: 'cors' } as any;
        }
        return okRes();
      }) as any,
    });
    expect(p.missing).toBe(1);
    expect(p.failed).toBe(1);
    expect(p.done).toBe(2);
    expect(hits).toBe(2); // first try + 1 retry
  });

  it('opaque answers are never stored (they would blow the storage quota)', async () => {
    const cache = fakeCache();
    const p = await downloadTiles({
      template: T,
      minZoom: 0,
      maxZoom: 0,
      cache,
      retries: 0,
      fetchFn: (async () => ({ ok: false, status: 0, type: 'opaque' })) as any,
    });
    expect(cache.store.size).toBe(0);
    expect(p.failed).toBe(1);
  });

  it('cancel stops the download and keeps what was stored', async () => {
    const cache = fakeCache();
    const ctrl = new AbortController();
    let n = 0;
    const p = await downloadTiles({
      template: T,
      minZoom: 0,
      maxZoom: 4,
      cache,
      concurrency: 1,
      signal: ctrl.signal,
      fetchFn: (async () => {
        n++;
        if (n === 10) ctrl.abort();
        return okRes();
      }) as any,
    });
    expect(p.done).toBeLessThan(p.total);
    expect(cache.store.size).toBe(p.done);
  });

  it('a full storage stops everything with the quota error', async () => {
    const cache = fakeCache();
    cache.put = async () => {
      const e = new Error('full');
      e.name = 'QuotaExceededError';
      throw e;
    };
    let threw = false;
    try {
      await downloadTiles({ template: T, minZoom: 0, maxZoom: 1, cache, fetchFn: (async () => okRes()) as any });
    } catch (e) {
      threw = (e as Error).name === 'QuotaExceededError';
    }
    expect(threw).toBe(true);
  });
});
