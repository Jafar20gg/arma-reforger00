/*
 * FCS offline service worker.
 * - App shell (same-origin): cache-first, background refresh (stale-while-revalidate).
 * - Map tiles (enfumap.com + self): cache-first with an LRU cap so storage stays bounded.
 * - API calls (AI providers) are never cached.
 * Offline maps (cache 'fcs-offline-*') are filled by the app itself and are found by caches.match below.
 * Version bump -> old caches are deleted on activate (except the offline maps).
 */
const VERSION = 'fcs-v2.21';
// Maps the user downloaded on purpose (Offline maps screen). Never deleted by version changes or the LRU trim.
const OFFLINE_PREFIX = 'fcs-offline-';
const SHELL_CACHE = `${VERSION}-shell`;
const TILE_CACHE = `${VERSION}-tiles`;
const MAX_TILES = 2500; // ~roughly a few hundred MB worst case; LRU evicts oldest first

const NEVER_CACHE = /(api\.anthropic\.com|generativelanguage\.googleapis\.com)/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(['./', './index.html', './manifest.webmanifest']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION) && !k.startsWith(OFFLINE_PREFIX)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

async function trimTileCache() {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  if (keys.length <= MAX_TILES) return;
  const toDelete = keys.slice(0, keys.length - MAX_TILES);
  await Promise.all(toDelete.map((k) => cache.delete(k)));
}

function isTile(url) {
  return /\/tiles\//.test(url.pathname) || /\.(webp|png|jpg|jpeg)$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (NEVER_CACHE.test(url.host)) return;

  // Page navigations: network first, fall back to the cached shell when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  const tile = isTile(url);

  if (sameOrigin || tile) {
    event.respondWith(
      caches.match(req, { ignoreSearch: !tile }).then((hit) => {
        const fetched = fetch(req)
          .then((res) => {
            // Opaque (no-CORS) answers are not stored: browsers count each as ~7 MB of quota.
            if (res && res.status === 200 && res.type !== 'opaque') {
              const copy = res.clone();
              const cacheName = tile ? TILE_CACHE : SHELL_CACHE;
              caches.open(cacheName).then((c) => c.put(req, copy));
              if (tile) trimTileCache();
            }
            return res;
          })
          .catch(() => null);
        // Tiles: cache-first (fast + offline). App shell: stale-while-revalidate.
        return hit || fetched.then((res) => res || hit);
      })
    );
  }
});
