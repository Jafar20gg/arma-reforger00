import React, { useState } from 'react';
import { X, Trash2, Play, Copy, Check, History, Crosshair, Target } from 'lucide-react';
import type { FireMissionRecord } from '../types';
import { formatGridCoord } from '../data/ballistics';

interface MissionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: FireMissionRecord[];
  onReengage: (mission: FireMissionRecord) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  lang: 'en' | 'ar';
  terrainName: (id: string) => string;
}

/** Mission log: every saved fire mission, with one-tap re-engage and callout copy. */
export const MissionLogModal: React.FC<MissionLogModalProps> = ({
  isOpen,
  onClose,
  missions,
  onReengage,
  onDelete,
  onClearAll,
  lang,
  terrainName,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  if (!isOpen) return null;
  const isAr = lang === 'ar';

  const copyCallout = (m: FireMissionRecord) => {
    if (m.callout) navigator.clipboard.writeText(m.callout);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId((c) => (c === m.id ? null : c)), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[1060] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-2xl shadow-2xl bg-slate-900 border border-slate-700 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-sky-300 font-mono uppercase tracking-wider">
              {isAr ? 'سجل مهام الرمي' : 'Fire Mission Log'}
            </h2>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
              {missions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {missions.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-900/60 rounded px-2 py-1 transition-all"
              >
                {isAr ? 'مسح الكل' : 'Clear all'}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {missions.length === 0 && (
            <div className="text-center text-slate-500 text-xs font-mono py-10">
              {isAr
                ? 'لا مهام محفوظة بعد. تُحفظ المهمة تلقائياً عند الضغط على «إطلاق!» أو يدوياً بزر «حفظ المهمة».'
                : 'No saved missions yet. A mission is saved automatically when you press FIRE, or manually via "Save mission".'}
            </div>
          )}
          {missions.map((m) => (
            <div key={m.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-[11px] font-mono text-slate-300 font-bold">
                  {m.weaponName}
                  <span className="text-slate-500"> · </span>
                  <span className="text-sky-300">{terrainName(m.terrainId)}</span>
                  <span className="text-slate-500"> · </span>
                  <span className="text-emerald-300">{isAr ? `حلقة ${m.ring}` : `Ring ${m.ring}`}</span>
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  {new Date(m.createdAt).toLocaleString(isAr ? 'ar' : 'en-GB', { hour12: false })}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 mt-1.5 text-[10px] font-mono">
                <span className="text-slate-400 inline-flex items-center gap-1">
                  <Crosshair className="w-3 h-3 text-sky-500" />
                  {formatGridCoord(m.gun.x, m.gun.z, 6)}
                </span>
                <span className="text-slate-400 inline-flex items-center gap-1">
                  <Target className="w-3 h-3 text-red-500" />
                  {formatGridCoord(m.target.x, m.target.z, 6)}
                </span>
                <span className="text-sky-300">AZ {m.azimuthMils} mil</span>
                <span className="text-emerald-300">
                  EL {m.elevationMils !== null ? `${m.elevationMils} mil` : '---'} · {m.rangeM}m{m.tofS ? ` · ${m.tofS}s` : ''}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-2">
                <button
                  onClick={() => onReengage(m)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-mono font-bold transition-all"
                >
                  <Play className="w-3 h-3" />
                  {isAr ? 'إعادة اشتباك' : 'Re-engage'}
                </button>
                <button
                  onClick={() => copyCallout(m)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    copiedId === m.id ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {copiedId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedId === m.id ? (isAr ? 'نُسخ' : 'Copied') : (isAr ? 'نسخ النداء' : 'Copy')}
                </button>
                <button
                  onClick={() => onDelete(m.id)}
                  className="ms-auto p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-all"
                  title={isAr ? 'حذف' : 'Delete'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
