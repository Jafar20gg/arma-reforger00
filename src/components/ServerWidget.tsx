import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchServers, getServerQuery, loadServerCache, ServerFetchError, ServerRow, setServerQuery } from '../services/serverList';

interface Props {
  lang: 'en' | 'ar';
  className?: string;
}

const REFRESH_MS = 60000;

function errorText(e: unknown, isAr: boolean): string {
  const err = e as ServerFetchError;
  switch (err?.kind) {
    case 'network':
      return isAr
        ? 'ما قدر يوصل لـ BattleMetrics. إذا تستخدم Brave: اضغط أيقونة الأسد وعطّل Shields لهالموقع، أو جرّب شبكة ثانية.'
        : 'Cannot reach BattleMetrics. On Brave: click the lion icon and turn Shields off for this site, or try another network.';
    case 'rate':
      return isAr ? 'طلبات كثيرة (429) — يعيد المحاولة تلقائياً' : 'Too many requests (429) — retrying automatically';
    case 'http':
      return isAr ? `الموقع رد بخطأ (HTTP ${err.status})` : `The site answered with an error (HTTP ${err.status})`;
    default:
      return isAr ? 'تعذّر جلب السيرفرات' : 'Could not load servers';
  }
}

/** Mini list of Arma Reforger servers (name + players). Updates by itself every minute. */
export const ServerWidget: React.FC<Props> = ({ lang, className = '' }) => {
  const isAr = lang === 'ar';
  const [query, setQuery] = useState<string>(() => getServerQuery());
  const [rows, setRows] = useState<ServerRow[]>(() => loadServerCache(getServerQuery())?.rows ?? []);
  const [savedAt, setSavedAt] = useState<number | null>(() => loadServerCache(getServerQuery())?.at ?? null);
  const [error, setError] = useState<unknown>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  const ctrlRef = useRef<AbortController | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;
  const firstQuery = useRef(true);

  const run = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const timer = window.setTimeout(() => ctrl.abort(), 20000);
    setBusy(true);
    const q = queryRef.current;
    try {
      const data = await fetchServers(q, ctrl.signal, 20);
      if (!alive.current || ctrlRef.current !== ctrl) return;
      setRows(data);
      setSavedAt(Date.now());
      setError(null);
    } catch (e) {
      if (!alive.current || ctrlRef.current !== ctrl) return;
      setError((e as Error).name === 'AbortError' ? new ServerFetchError('network') : e);
    } finally {
      window.clearTimeout(timer);
      if (alive.current && ctrlRef.current === ctrl) {
        setBusy(false);
        setReady(true);
      }
    }
  }, []);

  // first load + automatic refresh (skipped while the tab is in the background)
  useEffect(() => {
    alive.current = true;
    run();
    const id = window.setInterval(() => {
      if (!document.hidden) run();
    }, REFRESH_MS);
    const onVisible = () => {
      if (!document.hidden) run();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive.current = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      ctrlRef.current?.abort();
    };
  }, [run]);

  // changing the filter: save it, show the saved list for that filter, and reload
  useEffect(() => {
    setServerQuery(query);
    if (firstQuery.current) {
      firstQuery.current = false; // the first load is already started above
      return;
    }
    const cached = loadServerCache(query);
    setRows(cached?.rows ?? []);
    setSavedAt(cached?.at ?? null);
    const t = window.setTimeout(run, 600);
    return () => window.clearTimeout(t);
  }, [query, run]);

  const total = rows.reduce((a, r) => a + r.players, 0);
  const failed = error !== null;
  const minsOld = savedAt ? Math.max(0, Math.round((Date.now() - savedAt) / 60000)) : null;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`w-64 max-w-[80vw] rounded-b-xl bg-slate-950/85 backdrop-blur border border-slate-700/80 shadow-lg text-slate-200 ${className}`}
    >
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2 text-[13px] font-bold">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${failed && rows.length === 0 ? 'bg-rose-500' : failed ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
          {isAr ? 'سيرفرات Reforger' : 'Reforger servers'}
        </span>
        <span className="flex items-center gap-2">
          {rows.length > 0 && (
            <span className="text-sky-300 font-mono" dir="ltr">
              {total} {isAr ? 'لاعب' : 'players'}
            </span>
          )}
          <button
            onClick={run}
            disabled={busy}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50"
            title={isAr ? 'تحديث الآن' : 'Refresh now'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          </button>
        </span>
      </div>

      <div className="px-3 py-1.5 border-b border-slate-800 flex items-center gap-2 text-[12px]">
        <span className="text-slate-400 shrink-0">{isAr ? 'فلتر:' : 'Filter:'}</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isAr ? 'اسم السيرفر (فاضي = الكل)' : 'server name (empty = all)'}
          className="flex-1 min-w-0 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-[12px]"
          dir="ltr"
        />
      </div>

      <div className="max-h-44 overflow-y-auto overscroll-contain">
        {!ready && rows.length === 0 && <div className="px-3 py-3 text-[13px] text-slate-400">{isAr ? 'جاري التحميل…' : 'Loading…'}</div>}
        {ready && rows.length === 0 && (
          <div className={`px-3 py-3 text-[13px] ${failed ? 'text-rose-300' : 'text-slate-400'}`}>
            {failed ? errorText(error, isAr) : isAr ? 'ما في سيرفرات بهالاسم الحين' : 'No online servers match this filter'}
          </div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="px-3 py-1.5 flex items-center justify-between gap-2 border-b border-slate-800/60 last:border-0 text-[13px]">
            <span className="truncate" dir="auto" title={r.name}>
              {r.name}
            </span>
            <span
              className={`font-mono font-bold shrink-0 ${r.maxPlayers > 0 && r.players / r.maxPlayers >= 0.9 ? 'text-rose-400' : r.players > 0 ? 'text-emerald-300' : 'text-slate-500'}`}
              dir="ltr"
            >
              {r.players}/{r.maxPlayers || '?'}
            </span>
          </div>
        ))}
      </div>

      {failed && rows.length > 0 && (
        <div className="px-3 py-1.5 text-[11px] text-amber-300 border-t border-slate-800">
          {errorText(error, isAr)}
          {minsOld !== null && <span className="text-slate-400"> · {isAr ? `آخر بيانات قبل ${minsOld} د` : `last data ${minsOld} min ago`}</span>}
        </div>
      )}
      <div className="px-3 py-1 text-[10px] text-slate-500 border-t border-slate-800/60">
        {isAr ? 'المصدر: BattleMetrics • يتحدث كل دقيقة تلقائياً' : 'Source: BattleMetrics • auto-updates every minute'}
      </div>
    </div>
  );
};
