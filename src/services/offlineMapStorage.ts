import { TerrainConfig, TerrainId } from '../types';
import { TERRAINS } from '../data/maps';

export interface TileCoordinate {
  url: string;
  terrainId: TerrainId;
  layer: string;
  z: number;
  x: number;
  y: number;
}

export interface DownloadProgress {
  total: number;
  completed: number;
  failed: number;
  bytesDownloaded: number;
  speedBps: number;
  currentTileUrl?: string;
  estimatedSecondsRemaining: number;
  isPaused: boolean;
  isFinished: boolean;
  statusText: string;
}

export interface CachedStats {
  totalTiles: number;
  estimatedBytes: number;
  quotaBytes: number;
  byTerrain: Record<TerrainId, number>;
}

export const TILE_CACHE_NAME = 'fcs-v2.20-tiles';
const IDB_NAME = 'ArmaReforger_OfflineMapStore_v1';
const IDB_STORE = 'offline_tiles';

// Open or initialize IndexedDB for secondary resilient storage
function openTileDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: 'url' });
        store.createIndex('terrainId', 'terrainId', { unique: false });
        store.createIndex('z', 'z', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generates the full list of tile URLs for a terrain, layers, and zoom range.
 * If bounds is provided (in Arma meter coordinates), only tiles intersecting that sector are generated.
 */
export function calculateTiles(params: {
  terrainId: TerrainId;
  layers: ('topo' | 'sat' | 'drawn')[];
  minZoom: number;
  maxZoom: number;
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
}): TileCoordinate[] {
  const terrain = TERRAINS[params.terrainId];
  if (!terrain) return [];

  const results: TileCoordinate[] = [];
  const worldSize = terrain.worldSize;

  for (const layer of params.layers) {
    let urlTemplate = terrain.layers.topo;
    if (layer === 'sat') {
      if (!terrain.layers.sat) continue;
      urlTemplate = terrain.layers.sat;
    } else if (layer === 'drawn') {
      if (!terrain.layers.drawn) continue;
      urlTemplate = terrain.layers.drawn;
    }

    const limits = terrain.layerZoomLimits?.[layer] ?? {
      maxNativeZoom: terrain.maxNativeZoom,
      maxZoom: terrain.maxZoom,
    };

    const effectiveMinZoom = Math.max(terrain.minZoom, params.minZoom);
    const effectiveMaxZoom = Math.min(limits.maxNativeZoom, params.maxZoom);

    for (let z = effectiveMinZoom; z <= effectiveMaxZoom; z++) {
      const maxTileCoord = Math.pow(2, z) - 1;

      let minXIndex = 0;
      let maxXIndex = maxTileCoord;
      let minYIndex = 0;
      let maxYIndex = maxTileCoord;

      if (params.bounds) {
        // Coordinate conversion for Arma Reforger CRS:
        // x_pixel = (x / worldSize) * 2^z
        // tileX = floor(x_pixel)
        // y_pixel = ((worldSize - z) / worldSize) * 2^z
        // tileY = floor(y_pixel)
        minXIndex = Math.max(0, Math.floor((Math.max(0, params.bounds.minX) / worldSize) * Math.pow(2, z)));
        maxXIndex = Math.min(maxTileCoord, Math.floor((Math.min(worldSize, params.bounds.maxX) / worldSize) * Math.pow(2, z)));

        // Arma game Z is North (Y in 2D map). Top of map is worldSize, bottom is 0.
        // Leaflet Y tile 0 is top (North = worldSize), maxTile is bottom (South = 0)
        minYIndex = Math.max(0, Math.floor(((worldSize - Math.min(worldSize, params.bounds.maxZ)) / worldSize) * Math.pow(2, z)));
        maxYIndex = Math.min(maxTileCoord, Math.floor(((worldSize - Math.max(0, params.bounds.minZ)) / worldSize) * Math.pow(2, z)));
      }

      for (let x = minXIndex; x <= maxXIndex; x++) {
        for (let y = minYIndex; y <= maxYIndex; y++) {
          const url = urlTemplate
            .replace('{z}', String(z))
            .replace('{x}', String(x))
            .replace('{y}', String(y));

          results.push({
            url,
            terrainId: params.terrainId,
            layer,
            z,
            x,
            y,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Downloads a batch of tiles with controlled concurrency, storing in CacheStorage and IndexedDB.
 */
export async function downloadTiles(
  tiles: TileCoordinate[],
  onProgress: (progress: DownloadProgress) => void,
  signal?: AbortSignal,
  concurrency = 4
): Promise<{ completed: number; failed: number; bytes: number }> {
  let completed = 0;
  let failed = 0;
  let bytesDownloaded = 0;
  const startTime = Date.now();
  let lastProgressUpdate = 0;

  let cache: Cache | null = null;
  try {
    if (typeof caches !== 'undefined') {
      cache = await caches.open(TILE_CACHE_NAME);
    }
  } catch (err) {
    console.warn('[OfflineMapStorage] CacheStorage unavailable:', err);
  }

  let db: IDBDatabase | null = null;
  try {
    db = await openTileDB();
  } catch (err) {
    console.warn('[OfflineMapStorage] IndexedDB unavailable:', err);
  }

  const queue = [...tiles];
  const total = tiles.length;

  const updateProgress = (currentUrl?: string) => {
    const now = Date.now();
    if (now - lastProgressUpdate < 150 && completed + failed < total) return;
    lastProgressUpdate = now;

    const elapsedSeconds = Math.max(0.1, (now - startTime) / 1000);
    const speedBps = bytesDownloaded / elapsedSeconds;
    const remainingTiles = total - (completed + failed);
    const avgTileBytes = completed > 0 ? bytesDownloaded / completed : 15000;
    const estimatedSeconds = speedBps > 0 ? (remainingTiles * avgTileBytes) / speedBps : 0;

    onProgress({
      total,
      completed,
      failed,
      bytesDownloaded,
      speedBps,
      currentTileUrl: currentUrl,
      estimatedSecondsRemaining: Math.round(estimatedSeconds),
      isPaused: false,
      isFinished: completed + failed >= total,
      statusText: `${completed} / ${total} tiles cached (${(bytesDownloaded / (1024 * 1024)).toFixed(1)} MB)`,
    });
  };

  async function processTile(coord: TileCoordinate) {
    if (signal?.aborted) return;

    try {
      // 1. Check if already cached in CacheStorage
      if (cache) {
        const match = await cache.match(coord.url);
        if (match) {
          completed++;
          const blob = await match.blob();
          bytesDownloaded += blob.size;
          updateProgress(coord.url);
          return;
        }
      }

      // 2. Fetch tile with fallback
      const response = await fetch(coord.url, {
        signal,
        mode: 'cors',
        credentials: 'omit',
        cache: 'force-cache',
      });

      if (!response.ok && response.status !== 0) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      bytesDownloaded += blob.size;

      // 3. Store into CacheStorage
      if (cache) {
        const responseToCache = new Response(blob, {
          headers: {
            'Content-Type': blob.type || 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
        await cache.put(coord.url, responseToCache);
      }

      // 4. Store metadata / blob copy in IndexedDB
      if (db) {
        try {
          const tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).put({
            url: coord.url,
            terrainId: coord.terrainId,
            layer: coord.layer,
            z: coord.z,
            x: coord.x,
            y: coord.y,
            timestamp: Date.now(),
            size: blob.size,
          });
        } catch {
          // ignore idb transient errors
        }
      }

      completed++;
    } catch {
      failed++;
    } finally {
      updateProgress(coord.url);
    }
  }

  // Run workers with concurrency limit
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      if (signal?.aborted) break;
      const tile = queue.shift();
      if (tile) {
        await processTile(tile);
      }
    }
  });

  await Promise.all(workers);

  // Final progress update
  updateProgress();

  return { completed, failed, bytes: bytesDownloaded };
}

/**
 * Returns current cache statistics across CacheStorage and IndexedDB.
 */
export async function getCacheStats(): Promise<CachedStats> {
  let totalTiles = 0;
  let estimatedBytes = 0;
  let quotaBytes = 0;
  const byTerrain: Record<TerrainId, number> = {
    everon: 0,
    arland: 0,
    kolguyev: 0,
  };

  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      estimatedBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    } catch {}
  }

  try {
    if (typeof caches !== 'undefined') {
      const cache = await caches.open(TILE_CACHE_NAME);
      const keys = await cache.keys();
      totalTiles = keys.length;

      for (const req of keys) {
        const url = req.url;
        if (url.includes('everon')) byTerrain.everon++;
        else if (url.includes('arland')) byTerrain.arland++;
        else if (url.includes('kolguyev')) byTerrain.kolguyev++;
      }
    }
  } catch (err) {
    console.warn('[OfflineMapStorage] Failed to query cache keys:', err);
  }

  return {
    totalTiles,
    estimatedBytes,
    quotaBytes,
    byTerrain,
  };
}

/**
 * Clears cached map tiles from storage.
 */
export async function clearOfflineTiles(terrainId?: TerrainId): Promise<void> {
  try {
    if (typeof caches !== 'undefined') {
      const cache = await caches.open(TILE_CACHE_NAME);
      if (!terrainId) {
        await caches.delete(TILE_CACHE_NAME);
      } else {
        const keys = await cache.keys();
        for (const req of keys) {
          if (req.url.includes(terrainId)) {
            await cache.delete(req);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[OfflineMapStorage] Error clearing CacheStorage:', err);
  }

  try {
    const db = await openTileDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    if (!terrainId) {
      store.clear();
    } else {
      const index = store.index('terrainId');
      const req = index.openKeyCursor(IDBKeyRange.only(terrainId));
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
    }
  } catch (err) {
    console.warn('[OfflineMapStorage] Error clearing IndexedDB:', err);
  }
}

// Local simulation flag for testing offline experience without cutting internet connection
const OFFLINE_SIM_KEY = 'arma_reforger_offline_sim';

export function isOfflineSimulated(): boolean {
  try {
    return localStorage.getItem(OFFLINE_SIM_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setOfflineSimulation(enabled: boolean): void {
  try {
    localStorage.setItem(OFFLINE_SIM_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent('arma-offline-sim-changed', { detail: { enabled } }));
  } catch {}
}
