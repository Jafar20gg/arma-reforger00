import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Users, Search } from 'lucide-react';
import { fetchServers, getServerQuery, ServerRow } from '../services/serverList';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
}

/** Arma Reforger servers: names and how many players are inside. Refreshes by itself every minute. */
export const ServerListModal: React.FC<Props> = ({ isOpen, onClose, lang }) => {
  const isAr = lang === 'ar';
  const [rows, setRows] = useState<ServerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(() => getServerQuery());
  const [updated, setUpdated] = useState<Date | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  const load = useCallback(async (q: string) => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const timer = window.setTimeout(() => ctrl.abort(), 20000);
    setLoading(true);
    setError(null);
    try {
      const data = await fetchServers(q, ctrl.signal);
      setRows(data);
      setUpdated(new Date());
    } catch (e) {
      const m = (e as Error).message;
      if ((e as Error).name === 'AbortError') {
        if (ctrlRef.current === ctrl) setError(isAr ? 'انتهت مهلة الاتصال. تأكد من الإنترنت وجرّب مرة ثانية.' : 'Connection timed out. Check your internet and try again.');
      } else if (m === 'RATE_LIMIT') {
        setError(isAr ? 'الموقع يطلب الانتظار شوي (طلبات كثيرة). جرّب بعد دقيقة.' : 'The site asks you to wait (too many requests). Try again in a minute.');
      } else if (m === 'NETWORK') {
        setError(isAr ? 'ما قدر يوصل لـ BattleMetrics. إذا تستخدم Brave عطّل Shields لهالموقع، أو جرّب شبكة ثانية.' : 'Cannot reach BattleMetrics. On Brave turn Shields off for this site, or try another network.');
      } else if (m === 'NO_DATA') {
        setError(isAr ? 'ما رجعت أي سيرفرات. ممكن المصدر ما يدعم Reforger بهالطريقة.' : 'No servers were returned. The source may not support Reforger this way.');
      } else {
        setError((isAr ? 'تعذّر جلب القائمة: ' : 'Could not load the list: ') + m);
      }
    } finally {
      window.clearTimeout(timer);
      if (ctrlRef.current === ctrl) setLoading(false);
    }
  }, [isAr]);

  // load on open + search (debounced) + auto refresh every 60 s while open
  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => load(search), search ? 500 : 0);
    return () => window.clearTimeout(t);
  }, [isOpen, search, load]);
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setInterval(() => load(search), 60000);
    return () => {
      window.clearInterval(id);
      ctrlRef.current?.abort();
    };
  }, [isOpen, search, load]);

  if (!isOpen) return null;
  const total = rows.reduce((a, r) => a + r.players, 0);

  return (
    <div className="fixed inset-0 z-[2100] bg-slate-950/80 backdrop-blur-sm flex items-stretch sm:items-center justify-center p-0 sm:p-4">
      <div dir={isAr ? 'rtl' : 'ltr'} className="bg-slate-900 sm:border border-slate-700 sm:rounded-2xl shadow-2xl w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col text-slate-200">
        <div className="p-3 sm:p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <Users className="w-5 h-5 text-sky-400" />
            <span>{isAr ? 'سيرفرات Arma Reforger' : 'Arma Reforger Servers'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2.5 rounded-lg bg-slate-800 text-slate-300" aria-label="close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 border-b border-slate-800 shrink-0 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 start-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'ابحث باسم السيرفر…' : 'Search by server name…'}
              className="w-full ps-9 pe-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500"
            />
          </div>
          <div className="text-[13px] text-slate-400 flex items-center justify-between">
            <span>
              {rows.length} {isAr ? 'سيرفر' : 'servers'} · {total} {isAr ? 'لاعب' : 'players'}
            </span>
            {updated && <span>{isAr ? 'آخر تحديث' : 'Updated'} {updated.toLocaleTimeString()}</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2">
          {error && <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-200 text-sm">{error}</div>}
          {!error && !loading && rows.length === 0 && <div className="text-center text-slate-500 text-sm py-8">{isAr ? 'لا توجد نتائج' : 'No results'}</div>}
          {loading && rows.length === 0 && !error && <div className="text-center text-slate-400 text-sm py-8">{isAr ? 'جاري التحميل…' : 'Loading…'}</div>}
          {rows.map((r) => {
            const pct = r.maxPlayers > 0 ? Math.min(100, Math.round((r.players / r.maxPlayers) * 100)) : 0;
            return (
              <div key={r.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-sm font-bold text-white break-words" dir="auto">{r.name}</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full ${pct >= 90 ? 'bg-rose-500' : pct >= 50 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-sm font-mono font-bold text-sky-300 shrink-0" dir="ltr">
                    {r.players}/{r.maxPlayers || '?'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2.5 border-t border-slate-800 text-[12px] text-slate-500 text-center shrink-0">
          {isAr ? 'المصدر: BattleMetrics (موقع خارجي). التحديث التلقائي كل دقيقة.' : 'Source: BattleMetrics (third-party). Auto-refreshes every minute.'}
        </div>
      </div>
    </div>
  );
};
