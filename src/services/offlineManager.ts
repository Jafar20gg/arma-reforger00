/**
 * Runs the offline-map download in the background of the whole app (not inside the screen), so closing the
 * "Offline maps" screen does not stop it. One queue at a time: terrain by terrain, satellite layer.
 */
import { useSyncExternalStore } from 'react';
import { TERRAINS } from '../data/maps';
import type { MapLayerType, TerrainId } from '../types';
import { DownloadProgress, downloadTiles, layerTemplate, planDownload, requestPersistentStorage } from './offlineTiles';

export interface JobItem {
  terrainId: TerrainId;
  layer: MapLayerType;
  maxZoom: number;
}

export type JobResultCode = 'done' | 'partial' | 'stopped' | 'quota' | 'error';

export interface JobResult {
  code: JobResultCode;
  failed: number;
  firstError?: string;
}

export interface JobState {
  running: boolean;
  items: JobItem[];
  index: number;
  currentTerrain: TerrainId | null;
  currentProgress: DownloadProgress | null;
  /** overall counters for the whole queue */
  doneTiles: number;
  totalTiles: number;
  result: JobResult | null;
  /** bumps whenever something finished, so screens can recount what is stored */
  tick: number;
}

const IDLE: JobState = { running: false, items: [], index: 0, currentTerrain: null, currentProgress: null, doneTiles: 0, totalTiles: 0, result: null, tick: 0 };

let state: JobState = IDLE;
let ctrl: AbortController | null = null;
let wakeLock: { release: () => Promise<void> } | null = null;
const listeners = new Set<() => void>();

function set(patch: Partial<JobState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getJob(): JobState {
  return state;
}

/* ---- remembers which depth finished for each terrain (so the screen can say "installed") ---- */
const META_KEY = 'fcs_offline_meta_v1';
export interface OfflineMeta {
  [terrainAndLayer: string]: { maxZoom: number; at: number; missing: number };
}
export function readOfflineMeta(): OfflineMeta {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || '{}') || {};
  } catch {
    return {};
  }
}
function writeOfflineMeta(id: TerrainId, layer: MapLayerType, maxZoom: number, missing: number) {
  try {
    const m = readOfflineMeta();
    m[`${id}:${layer}`] = { maxZoom, at: Date.now(), missing };
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}
export function clearOfflineMeta(id: TerrainId, layer: MapLayerType) {
  try {
    const m = readOfflineMeta();
    delete m[`${id}:${layer}`];
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

async function keepScreenOn() {
  try {
    const wl = (navigator as any).wakeLock;
    if (wl?.request) wakeLock = await wl.request('screen');
  } catch {
    wakeLock = null;
  }
}
function releaseScreen() {
  try {
    void wakeLock?.release();
  } catch {
    /* ignore */
  }
  wakeLock = null;
}
const onVisible = () => {
  if (typeof document !== 'undefined' && state.running && document.visibilityState === 'visible' && !wakeLock) void keepScreenOn();
};

export function stopJob() {
  ctrl?.abort();
}

export async function startJob(items: JobItem[]) {
  if (state.running || items.length === 0) return;
  const plans = items.map((it) => planDownload(TERRAINS[it.terrainId], it.layer, it.maxZoom));
  const totalTiles = plans.reduce((a, p) => a + p.tileCount, 0);
  ctrl = new AbortController();
  const signal = ctrl.signal;
  set({ running: true, items, index: 0, currentTerrain: null, currentProgress: null, doneTiles: 0, totalTiles, result: null });
  void requestPersistentStorage(); // do not wait for it: some browsers keep this pending
  void keepScreenOn();
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);

  let finished = 0;
  let failedTotal = 0;
  let firstError: string | undefined;
  let code: JobResultCode = 'done';
  try {
    for (let i = 0; i < items.length; i++) {
      if (signal.aborted) break;
      const it = items[i];
      const plan = plans[i];
      set({ index: i, currentTerrain: it.terrainId, currentProgress: { done: 0, missing: 0, failed: 0, total: plan.tileCount } });
      const final = await downloadTiles({
        template: layerTemplate(TERRAINS[it.terrainId], it.layer)!,
        minZoom: plan.minZoom,
        maxZoom: plan.maxZoom,
        signal,
        onProgress: (p) => set({ currentProgress: p, doneTiles: finished + p.done + p.missing + p.failed }),
      });
      finished += plan.tileCount;
      failedTotal += final.failed;
      firstError = firstError ?? final.firstError;
      if (!signal.aborted && final.failed === 0) writeOfflineMeta(it.terrainId, it.layer, plan.maxZoom, final.missing);
      set({ doneTiles: finished, tick: state.tick + 1 });
    }
    code = signal.aborted ? 'stopped' : failedTotal > 0 ? 'partial' : 'done';
  } catch (e) {
    code = (e as Error)?.name === 'QuotaExceededError' ? 'quota' : 'error';
  } finally {
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
    releaseScreen();
    ctrl = null;
    set({ running: false, currentTerrain: null, currentProgress: null, result: { code, failed: failedTotal, firstError }, tick: state.tick + 1 });
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useOfflineJob(): JobState {
  return useSyncExternalStore(subscribe, getJob, () => IDLE);
}
