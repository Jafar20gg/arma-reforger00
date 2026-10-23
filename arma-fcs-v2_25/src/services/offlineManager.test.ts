import { describe, it, expect } from 'vitest';
import { getJob, readOfflineMeta, startJob, stopJob } from './offlineManager';
import { OFFLINE_CACHE } from './offlineTiles';

function installFakes(fetchImpl: (u: string) => any) {
  const g = globalThis as any;
  const store = new Map<string, any>();
  const cache = {
    match: async (u: string) => store.get(u),
    put: async (u: string, r: any) => {
      store.set(u, r);
    },
    keys: async () => [...store.keys()].map((url) => ({ url })),
    delete: async (k: any) => store.delete(k.url),
  };
  g.caches = { open: async (name: string) => (name === OFFLINE_CACHE ? cache : cache) };
  g.fetch = async (u: string) => fetchImpl(u);
  return store;
}
const ok = () => ({ ok: true, status: 200, type: 'cors', clone() { return this; } });

describe('offline manager (background download)', () => {
  it('downloads the whole queue, reports done and remembers the finished depth', async () => {
    const store = installFakes(async () => ok());
    await startJob([{ terrainId: 'arland', layer: 'sat', maxZoom: 2 }]);
    const job = getJob();
    expect(job.running).toBe(false);
    expect(job.result?.code).toBe('done');
    expect(store.size).toBe(1 + 4 + 16);
    expect(job.doneTiles).toBe(21);
    expect(readOfflineMeta()['arland:sat'].maxZoom).toBe(2);
  });

  it('server errors end as "partial" and the reason is kept', async () => {
    installFakes(async () => ({ ok: false, status: 503, type: 'cors' }));
    // not stored locally before: use another depth so the previous run's tiles do not interfere
    await startJob([{ terrainId: 'everon', layer: 'sat', maxZoom: 1 }]);
    const r = getJob().result!;
    expect(r.code).toBe('partial');
    expect(r.failed).toBe(1 + 4);
    expect(r.firstError).toBe('HTTP 503');
  });

  it('stop ends the job as "stopped" and keeps what was stored', async () => {
    let n = 0;
    const store = installFakes(async () => {
      n++;
      if (n === 8) stopJob();
      return ok();
    });
    await startJob([{ terrainId: 'kolguyev', layer: 'sat', maxZoom: 4 }]);
    expect(getJob().result?.code).toBe('stopped');
    expect(store.size).toBeGreaterThan(0);
    expect(store.size).toBeLessThan(1 + 4 + 16 + 64 + 256);
  });
});
