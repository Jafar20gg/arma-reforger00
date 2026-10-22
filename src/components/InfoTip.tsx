import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';
import { HELP_TEXTS } from '../data/helpTexts';

interface InfoTipProps {
  id: string;
  isAr: boolean;
}

/** Small (i) button. Tap it to read a detailed explanation of the feature next to it. */
export const InfoTip: React.FC<InfoTipProps> = ({ id, isAr }) => {
  const [open, setOpen] = useState(false);
  const entry = HELP_TEXTS[id];
  if (!entry) return null;
  const txt = isAr ? entry.ar : entry.en;

  const toggle = (e: React.SyntheticEvent) => {
    e.preventDefault(); // never toggle a checkbox/label this button sits inside
    e.stopPropagation();
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={isAr ? 'شرح هذه الميزة' : 'Explain this feature'}
        className="inline-flex items-center justify-center align-middle mx-1.5 w-6 h-6 min-h-0 rounded-full text-sky-400 bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/25 active:bg-sky-500/30 shrink-0"
        style={{ minHeight: 0 }}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[2300] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
            onClick={toggle}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div
              className="w-full max-w-md bg-slate-900 border border-sky-500/40 rounded-2xl shadow-2xl p-4 space-y-3 text-slate-200 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-white text-base">
                  <Info className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>{txt.title}</span>
                </div>
                <button type="button" onClick={toggle} className="p-2 rounded-lg bg-slate-800 text-slate-300 shrink-0" aria-label="close">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line text-slate-300">{txt.body}</p>
              <button type="button" onClick={toggle} className="w-full py-2.5 rounded-lg bg-sky-600 text-white font-bold text-sm">
                {isAr ? 'فهمت' : 'Got it'}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
