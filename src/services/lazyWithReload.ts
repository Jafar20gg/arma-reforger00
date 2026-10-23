import { lazy, ComponentType } from 'react';

/**
 * After a new version is published, a phone can still hold the OLD page, which asks for screen files
 * (Settings, Help…) that no longer exist on the server: "Failed to fetch dynamically imported module".
 * This notices that case, drops the saved old page copy and reloads once, instead of showing an error.
 */
const FLAG = 'fcs_stale_reload_at';

export function isChunkError(e: unknown): boolean {
  const m = String((e as { message?: string })?.message ?? e ?? '');
  return /dynamically imported module|Importing a module script failed|Unable to preload CSS|error loading dynamically/i.test(m);
}

function canAutoReload(): boolean {
  try {
    const t = Number(sessionStorage.getItem(FLAG) || 0);
    return Date.now() - t > 30000; // at most one automatic reload per 30 s (no loops)
  } catch {
    return true;
  }
}

/** Delete the saved copy of the app page (not the user's data, not the downloaded maps), then reload. */
export async function recoverFromStaleBuild(): Promise<void> {
  try {
    sessionStorage.setItem(FLAG, String(Date.now()));
  } catch {
    /* ignore */
  }
  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.endsWith('-shell')).map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  location.reload();
}

export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (e) {
      if (isChunkError(e) && canAutoReload()) {
        await recoverFromStaleBuild();
        return new Promise<never>(() => {}); // the page is reloading
      }
      throw e;
    }
  });
}

/** Vite fires this when a file preload fails (same cause). */
export function installPreloadErrorHandler() {
  window.addEventListener('vite:preloadError', (ev) => {
    ev.preventDefault?.();
    if (canAutoReload()) void recoverFromStaleBuild();
  });
}
