import React, { useState } from 'react';
import { Crosshair, MoveHorizontal, MoveVertical } from 'lucide-react';

interface AdjustFireCardProps {
  lang: 'en' | 'ar';
  milsPerCircle: number;
  disabled?: boolean;
  onApply: (addDropM: number, deflectionMils: number) => void;
}

/**
 * Adjust-fire card: the observer calls a correction ("add 100, left 20") and the target
 * point moves by exactly that correction in the firing-line frame, so the solution updates instantly.
 */
export const AdjustFireCard: React.FC<AdjustFireCardProps> = ({ lang, milsPerCircle, disabled, onApply }) => {
  const isAr = lang === 'ar';
  const [rangeText, setRangeText] = useState('');
  const [deflText, setDeflText] = useState('');

  const applyCustom = () => {
    const r = parseFloat(rangeText) || 0;
    const d = parseFloat(deflText) || 0;
    if (r === 0 && d === 0) return;
    onApply(r, d);
    setRangeText('');
    setDeflText('');
  };

  const chip = (label: string, onClick: () => void, cls: string) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-lg border border-rose-700/50 bg-rose-950/15 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider inline-flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5" />
          {isAr ? 'تصحيح الرمي (بعد الرصد)' : 'Adjust Fire (observed)'}
        </span>
        <span className="text-[9px] font-mono text-slate-500">{isAr ? `${milsPerCircle} مل` : `${milsPerCircle} mil`}</span>
      </div>

      {/* Range correction: add (+, away from gun) / drop (-, toward gun), meters */}
      <div>
        <div className="text-[9px] font-mono text-slate-400 mb-1 inline-flex items-center gap-1">
          <MoveVertical className="w-3 h-3 text-rose-400" />
          {isAr ? 'المدى (متر) — زيادة + / نقصان −' : 'Range (m) — add + / drop −'}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {chip(isAr ? '−100' : '-100', () => onApply(-100, 0), 'bg-slate-900 border-slate-700 text-slate-300 hover:border-rose-600')}
          {chip('-50', () => onApply(-50, 0), 'bg-slate-900 border-slate-700 text-slate-300 hover:border-rose-600')}
          {chip('-25', () => onApply(-25, 0), 'bg-slate-900 border-slate-700 text-slate-300 hover:border-rose-600')}
          {chip('+25', () => onApply(25, 0), 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-600')}
          {chip('+50', () => onApply(50, 0), 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-600')}
          {chip('+100', () => onApply(100, 0), 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-600')}
        </div>
      </div>

      {/* Deflection correction in mils: + right / - left */}
      <div>
        <div className="text-[9px] font-mono text-slate-400 mb-1 inline-flex items-center gap-1">
          <MoveHorizontal className="w-3 h-3 text-rose-400" />
          {isAr ? 'الاتجاه (مل) — يمين + / يسار −' : 'Deflection (mils) — right + / left −'}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {chip(isAr ? '◀ 50' : '◀ 50', () => onApply(0, -50), 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-600')}
          {chip('◀ 10', () => onApply(0, -10), 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-600')}
          {chip('10 ▶', () => onApply(0, 10), 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-600')}
          {chip('50 ▶', () => onApply(0, 50), 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-600')}
        </div>
      </div>

      {/* Custom combined correction */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-rose-900/40">
        <input
          type="number"
          inputMode="numeric"
          placeholder={isAr ? 'مدى ±م' : 'range ±m'}
          value={rangeText}
          onChange={(e) => setRangeText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
          disabled={disabled}
          className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] font-mono text-slate-200 placeholder:text-slate-600"
        />
        <input
          type="number"
          inputMode="numeric"
          placeholder={isAr ? 'اتجاه ±مل' : 'defl ±mil'}
          value={deflText}
          onChange={(e) => setDeflText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
          disabled={disabled}
          className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] font-mono text-slate-200 placeholder:text-slate-600"
        />
        <button
          onClick={applyCustom}
          disabled={disabled || (!parseFloat(rangeText) && !parseFloat(deflText))}
          className="flex-1 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white text-[11px] font-mono font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAr ? 'طبّق التصحيح' : 'Apply'}
        </button>
      </div>
      <p className="text-[9px] text-slate-500 font-mono">
        {isAr
          ? 'مثال: الراصد ينادي «زد 100، يسار 20» ← تكتب 100 و −20 أو تضغط الأزرار، فيتحرك الهدف ويتحدّث الحل فوراً.'
          : 'Example: observer calls "add 100, left 20" → type 100 and -20 (or tap the chips); the target moves and the solution updates instantly.'}
      </p>
    </div>
  );
};
