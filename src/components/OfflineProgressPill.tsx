import React from 'react';
import { Download, Square } from 'lucide-react';
import { stopJob, useOfflineJob } from '../services/offlineManager';

/** Small bar shown while maps are downloading and the Offline maps screen is closed. */
export const OfflineProgressPill: React.FC<{ lang: 'en' | 'ar'; onOpen: () => void }> = ({ lang, onOpen }) => {
  const job = useOfflineJob();
  if (!job.running) return null;
  const pct = job.totalTiles > 0 ? Math.min(100, Math.round((job.doneTiles / job.totalTiles) * 100)) : 0;
  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-2 rounded-full bg-slate-900/95 border border-sky-500/60 shadow-xl pl-3 pr-1 py-1" dir="ltr">
      <button onClick={onOpen} className="flex items-center gap-2 text-xs font-mono text-sky-200 py-1">
        <Download className="w-3.5 h-3.5 animate-pulse" />
        <span>{lang === 'ar' ? `تنزيل الخرائط ${pct}%` : `Downloading maps ${pct}%`}</span>
      </button>
      <button onClick={stopJob} className="w-8 h-8 rounded-full bg-rose-900/70 hover:bg-rose-800 text-rose-100 flex items-center justify-center" aria-label="stop">
        <Square className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
