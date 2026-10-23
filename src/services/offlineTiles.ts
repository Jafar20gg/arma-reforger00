/**
 * Offline maps: the user picks a terrain + layer + zoom depth and the app downloads those map
 * tiles into the browser's Cache Storage ("fcs-offline-tiles-v1"). The service worker then serves them
 * with no connection. This cache is never evicted by the viewing cache (LRU) in sw.js.
 *
 * Tiles come from whatever host the map is configured with (default enfumap.com, or your own
 * GitHub Pages host via VITE_TILE_HOST). The host must send CORS headers (GitHub Pages does).
 */
import type { TerrainConfig, MapLayerType } from '../types';

export const OFFLINE_CACHE = 'fcs-offline-tiles-v1';
/** Rough average size of one webp tile, used only for the size estimate shown to the user. */
export const AVG_TILE_BYTES = 28 * 1024;
const MAX_ZOOM_CHOICE = 7;

export interface OfflinePlan {
  terrainId: string;
  layer: MapLayerType;
  minZoom: number;
  maxZoom: number;
  tileCount: number;
  estimatedBytes: number;
}

/** Highest real tile level that exists for this layer (over-zoom levels have no files). */
export function layerMaxNativeZoom(terrain: TerrainConfig, layer: MapLayerType): number {
  return terrain.layerZoomLimits?.[layer]?.maxNativeZoom ?? terrain.maxNativeZoom;
}

export function layerTemplate(terrain: TerrainConfig, layer: MapLayerType): string | null {
  return (terrain.layers as Record<string, string | undefined>)[layer] ?? null;
}

/** Zoom depths the user can pick: from the map's minimum up to the real tile limit (capped at 7). */
export function zoomChoices(terrain: TerrainConfig, layer: MapLayerType): number[] {
  const max = Math.min(layerMaxNativeZoom(terrain, layer), MAX_ZOOM_CHOICE);
  const out: number[] = [];
  for (let z = Math.max(2, terrain.minZoom); z <= max; z++) out.push(z);
  return out;
}

/** The world is one square pyramid: level z has 2^z x 2^z tiles. */
export function tilesAtZoom(z: number): number {
  return Math.pow(4, z);
}

export function countTiles(minZoom: number, maxZoom: number): number {
  let n = 0;
  for (let z = minZoom; z <= maxZoom; z++) n += tilesAtZoom(z);
  return n;
}

export function planDownload(terrain: TerrainConfig, layer: MapLayerType, maxZoom: number): OfflinePlan {
  const minZoom = terrain.minZoom;
  const top = Math.min(maxZoom, layerMaxNativeZoom(terrain, layer));
  const tileCount = countTiles(minZoom, top);
  return { terrainId: terrain.id, layer, minZoom, maxZoom: top, tileCount, estimatedBytes: tileCount * AVG_TILE_BYTES };
}

export function tileUrl(template: string, z: number, x: number, y: number): string {
  return template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
}

/** Every tile URL of the plan, level by level (coarse levels first so the map is usable early). */
export function* tileUrls(template: string, minZoom: number, maxZoom: number): Generator<string> {
  for (let z = minZoom; z <= maxZoom; z++) {
    const n = Math.pow(2, z);
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) yield tileUrl(template, z, x, y);
  }
}

/** The part of a template before the first "{": identifies one terrain+layer inside the cache. */
export function templatePrefix(template: string): string {
  const i = template.indexOf('{');
  return i === -1 ? template : template.slice(0, i);
}

export function formatBytes(b: number): string {
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(b < 100 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export interface DownloadProgress {
  done: number; // tiles stored or already present
  missing: number; // tiles the server does not have (404/410): normal at the map edges
  failed: number; // network or server errors after retries
  total: number;
  /** first problem seen (for the user): 'HTTP 403', 'blocked (no CORS)', 'network' */
  firstError?: string;
}

export interface DownloadOptions {
  template: string;
  minZoom: number;
  maxZoom: number;
  signal?: AbortSignal;
  onProgress?: (p: DownloadProgress) => void;
  concurrency?: number;
  retries?: number;
  /** test hooks */
  fetchFn?: typeof fetch;
  cache?: Pick<Cache, 'match' | 'put'>;
}

/**
 * Downloads the tiles into the offline cache. Already stored tiles are skipped, so a cancelled or
 * interrupted download simply continues next time. Returns the final progress.
 */
export async function downloadTiles(opts: DownloadOptions): Promise<DownloadProgress> {
  const { template, minZoom, maxZoom, signal, onProgress } = opts;
  const concurrency = Math.max(1, opts.concurrency ?? 6);
  const retries = opts.retries ?? 2;
  const doFetch = opts.fetchFn ?? ((i: RequestInfo | URL, init?: RequestInit) => fetch(i, init));
  const cache = opts.cache ?? (await caches.open(OFFLINE_CACHE));

  const total = countTiles(minZoom, maxZoom);
  const p: DownloadProgress = { done: 0, missing: 0, failed: 0, total };
  const iter = tileUrls(template, minZoom, maxZoom);
  let lastReport = 0;
  const report = (force = false) => {
    const now = Date.now();
    if (!force && now - lastReport < 150) return;
    lastReport = now;
    onProgress?.({ ...p });
  };

  const one = async (url: string) => {
    if (await cache.match(url)) {
      p.done++;
      return;
    }
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (signal?.aborted) return;
      try {
        // cache:'reload' also tells our service worker to leave this request alone (no double storing, no slow trimming)
        const res = await doFetch(url, { mode: 'cors', credentials: 'omit', cache: 'reload', signal });
        if (res.status === 404 || res.status === 410) {
          p.missing++;
          return;
        }
        if (res.ok && res.type !== 'opaque') {
          await cache.put(url, res.clone());
          p.done++;
          return;
        }
        p.firstError = p.firstError ?? (res.type === 'opaque' ? 'blocked (no CORS)' : `HTTP ${res.status}`);
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
        if ((e as Error)?.name !== 'QuotaExceededError') p.firstError = p.firstError ?? 'network / CORS';
        const msg = (e as Error)?.name === 'QuotaExceededError' ? 'quota' : '';
        if (msg) {
          p.failed++;
          throw e; // storage is full: stop everything
        }
      }
      if (attempt < retries) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
    p.failed++;
  };

  const worker = async () => {
    for (;;) {
      if (signal?.aborted) return;
      const next = iter.next();
      if (next.done) return;
      await one(next.value);
      report();
    }
  };

  await Promise.all(Array.from({ length: concurrency }, worker));
  report(true);
  return p;
}

export interface LayerStatus {
  stored: number;
}

/** How many tiles of this terrain+layer are stored offline (counts cache entries by URL prefix). */
export async function countStored(template: string): Promise<number> {
  if (typeof caches === 'undefined') return 0;
  const prefix = templatePrefix(template);
  const cache = await caches.open(OFFLINE_CACHE);
  const keys = await cache.keys();
  let n = 0;
  for (const k of keys) if (k.url.startsWith(prefix)) n++;
  return n;
}

export async function deleteStored(template: string): Promise<number> {
  if (typeof caches === 'undefined') return 0;
  const prefix = templatePrefix(template);
  const cache = await caches.open(OFFLINE_CACHE);
  const keys = await cache.keys();
  let n = 0;
  for (const k of keys) {
    if (k.url.startsWith(prefix)) {
      await cache.delete(k);
      n++;
    }
  }
  return n;
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    const e = await navigator.storage?.estimate?.();
    if (!e || e.usage === undefined || e.quota === undefined) return null;
    return { usage: e.usage, quota: e.quota };
  } catch {
    return null;
  }
}

/** Ask the browser not to delete the downloaded maps when space is low. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

let offlineCachePromise: Promise<Cache> | null = null;

/**
 * Looks one tile up in the downloaded maps. Returns a blob: URL to put in the <img>, or null when the tile
 * is not stored (the caller then loads it from the network as usual). This is what makes downloaded maps
 * work inside the Android app without depending on the service worker.
 */
export async function lookupOfflineTile(url: string): Promise<string | null> {
  try {
    if (typeof caches === 'undefined') return null;
    offlineCachePromise = offlineCachePromise ?? caches.open(OFFLINE_CACHE);
    const cache = await offlineCachePromise;
    const hit = await cache.match(url);
    if (!hit) return null;
    return URL.createObjectURL(await hit.blob());
  } catch {
    return null;
  }
}
