import React from 'react';

interface Props {
  minMils: number;
  maxMils: number;
  milsPerCircle: number;
  currentMils: number | null;
  lang: 'en' | 'ar';
}

const TICKS = [45, 50, 60, 70, 80];

/**
 * Elevation scale in DEGREES (separate from distance). Ticks at 45/50/60/70/80 and the weapon's real limits.
 * Degrees = mils x 360 / milsPerCircle, using the selected weapon's own circle (6400 US, 6000 RU).
 */
export const ElevationGauge: React.FC<Props> = ({ minMils, maxMils, milsPerCircle, currentMils, lang }) => {
  const toDeg = (m: number) => (m * 360) / milsPerCircle;
  const lo = toDeg(minMils);
  const hi = toDeg(maxMils);
  const pct = (d: number) => Math.min(100, Math.max(0, ((d - lo) / (hi - lo)) * 100));
  const cur = currentMils === null ? null : toDeg(currentMils);
  const isAr = lang === 'ar';
  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-lg px-3 pt-2 pb-5" dir="ltr">
      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1.5">
        <span>{isAr ? 'مقياس زاوية الارتفاع (درجات)' : 'Elevation scale (degrees)'}</span>
        <span className="text-sky-300 font-bold">
          {cur === null ? '--' : `${cur.toFixed(1)}° · ${currentMils} ${isAr ? 'مل' : 'mil'}`}
        </span>
      </div>
      <div className="relative h-2 rounded bg-slate-800">
        {TICKS.filter((t) => t > lo + 0.4 && t < hi - 0.4).map((t) => (
          <div key={t} className="absolute top-0 h-2 w-px bg-slate-500" style={{ left: `${pct(t)}%` }}>
            <span className="absolute top-3 -translate-x-1/2 text-[9px] text-slate-400 font-mono">{t}°</span>
          </div>
        ))}
        <span className="absolute top-3 left-0 -translate-x-1/4 text-[9px] text-amber-400 font-mono">{lo.toFixed(1)}°</span>
        <span className="absolute top-3 right-0 translate-x-1/4 text-[9px] text-amber-400 font-mono">{hi.toFixed(1)}°</span>
        {cur !== null && (
          <div className="absolute -top-1 h-4 w-1.5 rounded bg-sky-400 shadow" style={{ left: `calc(${pct(cur)}% - 3px)` }} />
        )}
      </div>
    </div>
  );
};
