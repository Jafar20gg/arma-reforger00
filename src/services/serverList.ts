/**
 * Public Arma Reforger server list from BattleMetrics (third-party site that tracks game servers).
 * The game's own in-game list is private to Bohemia, so this is the closest public source.
 * Only the server name and player counts are used.
 */
export interface ServerRow {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
}

const GAME_IDS = ['reforger', 'arma-reforger'];

export async function fetchServers(search: string, signal?: AbortSignal, limit = 50): Promise<ServerRow[]> {
  let lastErr: Error = new Error('NO_DATA');
  for (const game of GAME_IDS) {
    const q = new URLSearchParams();
    q.set('filter[game]', game);
    q.set('filter[status]', 'online');
    q.set('sort', '-players');
    q.set('page[size]', String(limit));
    if (search.trim()) q.set('filter[search]', search.trim());
    q.set('fields[server]', 'name,players,maxPlayers,status');
    try {
      const res = await fetch(`https://api.battlemetrics.com/servers?${q.toString()}`, { signal, headers: { accept: 'application/json' } });
      if (res.status === 429) throw new Error('RATE_LIMIT');
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      const json = await res.json();
      const rows: ServerRow[] = (json.data || []).map((d: { id: string; attributes: { name?: string; players?: number; maxPlayers?: number } }) => ({
        id: String(d.id),
        name: String(d.attributes?.name ?? '—'),
        players: Number(d.attributes?.players ?? 0),
        maxPlayers: Number(d.attributes?.maxPlayers ?? 0),
      }));
      if (rows.length > 0 || search.trim()) return rows;
      lastErr = new Error('NO_DATA');
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      lastErr = e as Error;
    }
  }
  throw lastErr;
}
