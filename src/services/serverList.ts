/**
 * Arma Reforger server list from the official BattleMetrics public API
 * (https://www.battlemetrics.com/developers). Only the server name and player counts are read.
 * Everything is automatic: the widget asks again every minute (well under the API rate limit).
 * An API token is optional (higher limits); it stays in this browser only.
 */
export interface ServerRow {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
}

export type ServerErrorKind = 'network' | 'rate' | 'http' | 'empty';

export class ServerFetchError extends Error {
  kind: ServerErrorKind;
  status?: number;
  constructor(kind: ServerErrorKind, status?: number) {
    super(kind === 'http' ? `HTTP_${status}` : kind === 'rate' ? 'RATE_LIMIT' : kind === 'empty' ? 'NO_DATA' : 'NETWORK');
    this.kind = kind;
    this.status = status;
  }
}

/** BattleMetrics game id for Arma Reforger (same as game=reforger in the website URL). */
const GAME_ID = 'reforger';
export const DEFAULT_QUERY = 'ps5o';

const QUERY_KEY = 'fcs_server_query';
const TOKEN_KEY = 'fcs_bm_token';
const CACHE_KEY = 'fcs_server_cache_v1';

export function getServerQuery(): string {
  try {
    const v = localStorage.getItem(QUERY_KEY);
    return v === null ? DEFAULT_QUERY : v;
  } catch {
    return DEFAULT_QUERY;
  }
}

export function setServerQuery(q: string) {
  try {
    localStorage.setItem(QUERY_KEY, q);
  } catch {
    /* ignore */
  }
}

export function getBmToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setBmToken(t: string) {
  try {
    if (t.trim()) localStorage.setItem(TOKEN_KEY, t.trim());
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export interface ServerCache {
  at: number;
  query: string;
  rows: ServerRow[];
}

export function loadServerCache(query: string): ServerCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as ServerCache;
    if (!c || c.query !== query || !Array.isArray(c.rows) || typeof c.at !== 'number') return null;
    return c;
  } catch {
    return null;
  }
}

function saveServerCache(query: string, rows: ServerRow[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), query, rows } satisfies ServerCache));
  } catch {
    /* ignore */
  }
}

interface BmServer {
  id: string;
  attributes?: { name?: string; players?: number; maxPlayers?: number };
}

async function request(url: string, signal: AbortSignal | undefined, token: string): Promise<Response> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(url, { signal, headers });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    // a token makes the browser send a preflight request; if that is what failed, try once without it
    if (token) return await request(url, signal, '');
    throw new ServerFetchError('network');
  }
}

export async function fetchServers(search: string, signal?: AbortSignal, limit = 50): Promise<ServerRow[]> {
  const token = getBmToken();
  const build = (withFields: boolean) => {
    const q = new URLSearchParams();
    q.set('filter[game]', GAME_ID);
    q.set('filter[status]', 'online');
    q.set('sort', '-players');
    q.set('page[size]', String(limit));
    if (search.trim()) q.set('filter[search]', search.trim());
    if (withFields) q.set('fields[server]', 'name,players,maxPlayers,status');
    return `https://api.battlemetrics.com/servers?${q.toString()}`;
  };

  let res: Response;
  try {
    res = await request(build(true), signal, token);
    if (res.status === 400) res = await request(build(false), signal, token); // some field name not accepted: ask for everything
  } catch (e) {
    if (e instanceof ServerFetchError || (e as Error).name === 'AbortError') throw e;
    throw new ServerFetchError('network');
  }

  if (res.status === 429) throw new ServerFetchError('rate');
  if (!res.ok) throw new ServerFetchError('http', res.status);

  let json: { data?: BmServer[] };
  try {
    json = await res.json();
  } catch {
    throw new ServerFetchError('http', res.status);
  }
  const rows: ServerRow[] = (json.data || []).map((d) => ({
    id: String(d.id),
    name: String(d.attributes?.name ?? '—'),
    players: Number(d.attributes?.players ?? 0),
    maxPlayers: Number(d.attributes?.maxPlayers ?? 0),
  }));
  saveServerCache(search, rows);
  return rows;
}
