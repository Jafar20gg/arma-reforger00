import React, { useEffect, useRef, useState } from 'react';
import { fetchServers, ServerRow } from '../services/serverList';

interface Props {
  lang: 'en' | 'ar';
  className?: string;
}

/** Always-visible mini list of the busiest Arma Reforger servers. Updates by itself every minute. Nothing to tap. */
export const ServerWidget: React.FC<Props> = ({ lang, className = '' }) => {
  const isAr = lang === 'ar';
  const [rows, setRows] = useState<ServerRow[]>([]);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    let ctrl: AbortController | null = null;
    const run = async () => {
      ctrl?.abort();
      ctrl = new AbortController();
      const c = ctrl;
      const timer = window.setTimeout(() => c.abort(), 20000);
      try {
        const data = await fetchServers('', c.signal, 12);
        if (!alive.current) return;
        setRows(data);
        setFailed(false);
      } catch (e) {
        if (alive.current && (e as Error).name !== 'AbortError') setFailed(true);
        else if (alive.current) setFailed(true);
      } finally {
        window.clearTimeout(timer);
        if (alive.current) setReady(true);
      }
    };
    run();
    const id = window.setInterval(run, 60000);
    return () => {
      alive.current = false;
      window.clearInterval(id);
      ctrl?.abort();
    };
  }, []);

  const total = rows.reduce((a, r) => a + r.players, 0);

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`w-60 max-w-[70vw] rounded-xl bg-slate-950/80 backdrop-blur border border-slate-700/80 shadow-lg text-slate-200 ${className}`}
    >
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2 text-[13px] font-bold">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${failed && rows.length === 0 ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
          {isAr ? 'سيرفرات Reforger' : 'Reforger servers'}
        </span>
        {rows.length > 0 && (
          <span className="text-sky-300 font-mono" dir="ltr">
            {total} {isAr ? 'لاعب' : 'players'}
          </span>
        )}
      </div>
      <div className="max-h-44 overflow-y-auto overscroll-contain">
        {!ready && <div className="px-3 py-3 text-[13px] text-slate-400">{isAr ? 'جاري التحميل…' : 'Loading…'}</div>}
        {ready && rows.length === 0 && (
          <div className="px-3 py-3 text-[13px] text-slate-400">
            {failed ? (isAr ? 'تعذّر جلب السيرفرات (سيعيد المحاولة تلقائياً)' : 'Could not load servers (retrying automatically)') : isAr ? 'لا توجد سيرفرات' : 'No servers'}
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
        <div className="px-3 py-1 text-[11px] text-amber-300 border-t border-slate-800">{isAr ? 'آخر تحديث فشل، يعيد المحاولة…' : 'Last update failed, retrying…'}</div>
      )}
    </div>
  );
};
