import { useSyncExternalStore } from 'react';

/**
 * Position + size of the floating widgets (compass, servers list).
 * Saved only in this browser (localStorage). x / y = null means "use the default corner".
 */
export interface WidgetLayout {
  x: number | null;
  y: number | null;
  scale: number;
}

export const MIN_SCALE = 0.6;
export const MAX_SCALE = 2.5;

const KEY = 'fcs_widget_layout_v1';
const DEFAULT_LAYOUT: WidgetLayout = { x: null, y: null, scale: 1 };

const clampScale = (n: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(n * 100) / 100));
const okNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

function load(): Record<string, WidgetLayout> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, WidgetLayout> = {};
    for (const id of Object.keys(parsed)) {
      const v = parsed[id];
      if (!v || typeof v !== 'object') continue;
      out[id] = {
        x: okNum(v.x) ? v.x : null,
        y: okNum(v.y) ? v.y : null,
        scale: okNum(v.scale) ? clampScale(v.scale) : 1,
      };
    }
    return out;
  } catch {
    return {};
  }
}

let state: Record<string, WidgetLayout> = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: the layout just won't be remembered */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function getWidgetLayout(id: string): WidgetLayout {
  return state[id] ?? DEFAULT_LAYOUT;
}

export function setWidgetLayout(id: string, patch: Partial<WidgetLayout>) {
  const cur = getWidgetLayout(id);
  const next: WidgetLayout = {
    x: patch.x !== undefined ? patch.x : cur.x,
    y: patch.y !== undefined ? patch.y : cur.y,
    scale: patch.scale !== undefined ? clampScale(patch.scale) : cur.scale,
  };
  state = { ...state, [id]: next };
  persist();
  emit();
}

/** Back to default corner and normal size. Pass an id for one widget, nothing for all of them. */
export function resetWidgetLayout(id?: string) {
  if (id) {
    const { [id]: _removed, ...rest } = state;
    state = rest;
  } else {
    state = {};
  }
  persist();
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useWidgetLayout(id: string): WidgetLayout {
  return useSyncExternalStore(
    subscribe,
    () => getWidgetLayout(id),
    () => DEFAULT_LAYOUT,
  );
}
