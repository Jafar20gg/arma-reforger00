import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Download, Trash2, HardDrive, Square, WifiOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TERRAINS } from '../data/maps';
import type { MapLayerType, TerrainId } from '../types';
import {
  DownloadProgress,
  OFFLINE_CACHE,
  countStored,
  deleteStored,
  downloadTiles,
  formatBytes,
  layerTemplate,
  planDownload,
  requestPersistentStorage,
  storageEstimate,
  zoomChoices,
} from '../services/offlineTiles';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
}

const LAYER_NAME: Record<MapLayerType, { ar: string; en: string }> = {
  topo: { ar: 'طبوغرافية', en: 'Topographic' },
  sat: { ar: 'قمر صناعي', en: 'Satellite' },
  drawn: { ar: 'مرسومة', en: 'Drawn' },
};

const key = (t: string, l: string) => `${t}:${l}`;

/** Offline maps: download tiles for field use without a connection. */
export const OfflineMapsModal: React.FC<Props> = ({ isOpen, onClose, lang }) => {
  const isAr = lang === 'ar';
  const terrainIds = Object.keys(TERRAINS) as TerrainId[];
  const [depth, setDepth] = useState<Record<string, number>>({});
  const [stored, setStored] = useState<Record<string, number>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null);
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  const layersOf = (id: TerrainId): MapLayerType[] => (['topo', 'sat', 'drawn'] as MapLayerType[]).filter((l) => !!layerTemplate(TERRAINS[id], l));

  const defaultDepth = (id: TerrainId, l: MapLayerType) => {
    const c = zoomChoices(TERRAINS[id], l);
    return c.includes(5) ? 5 : c[c.length - 1];
  };
  const depthOf = (id: TerrainId, l: MapLayerType) => depth[key(id, l)] ?? defaultDepth(id, l);

  const refresh = useCallback(async () => {
    if (typeof caches === 'undefined') return;
    const next: Record<string, number> = {};
    for (const id of terrainIds) {
      for (const l of layersOf(id)) {
        next[key(id, l)] = await countStored(layerTemplate(TERRAINS[id], l)!);
      }
    }
    setStored(next);
    setUsage(await storageEstimate());
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      refresh();
    }
  }, [isOpen, refresh]);

  // leaving the screen during a download cancels it (what is stored stays)
  useEffect(() => () => ctrlRef.current?.abort(), []);

  if (!isOpen) return null;

  const supported = typeof caches !== 'undefined' && 'serviceWorker' in navigator;
  const conn = (navigator as any).connection as { saveData?: boolean; effectiveType?: string; type?: string } | undefined;
  const cellular = conn?.type === 'cellular' || conn?.saveData === true || conn?.effectiveType === '2g' || conn?.effectiveType === '3g';

  const start = async (id: TerrainId, l: MapLayerType) => {
    const terrain = TERRAINS[id];
    const template = layerTemplate(terrain, l)!;
    const plan = planDownload(terrain, l, depthOf(id, l));
    if (plan.estimatedBytes > 150 * 1024 * 1024) {
      const ok = window.confirm(
        isAr
          ? `الحجم التقديري ${formatBytes(plan.estimatedBytes)} (${plan.tileCount} بلاطة). تأكد إنك على واي فاي. تكمل؟`
          : `Estimated size ${formatBytes(plan.estimatedBytes)} (${plan.tileCount} tiles). Make sure you are on Wi-Fi. Continue?`,
      );
      if (!ok) return;
    }
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setBusyKey(key(id, l));
    setProgress({ done: 0, missing: 0, failed: 0, total: plan.tileCount });
    setMessage(null);
    await requestPersistentStorage();
    try {
      const final = await downloadTiles({
        template,
        minZoom: plan.minZoom,
        maxZoom: plan.maxZoom,
        signal: ctrl.signal,
        onProgress: setProgress,
      });
      if (ctrl.signal.aborted) {
        setMessage({ kind: 'warn', text: isAr ? 'أُوقف التنزيل. اللي نزل انحفظ، وتقدر تكمله بعدين.' : 'Download stopped. What was saved is kept; you can continue later.' });
      } else if (final.failed > 0) {
        setMessage({
          kind: 'warn',
          text: isAr
            ? `خلص مع ${final.failed} بلاطة فشلت (اتصال أو خادم). اضغط تنزيل مرة ثانية لإكمال الناقص.`
            : `Finished with ${final.failed} failed tiles (network or server). Press Download again to fill the gaps.`,
        });
      } else {
        setMessage({ kind: 'ok', text: isAr ? 'تم التنزيل. الخريطة تشتغل بدون إنترنت.' : 'Done. This map now works without internet.' });
      }
    } catch (e) {
      const full = (e as Error)?.name === 'QuotaExceededError';
      setMessage({
        kind: 'warn',
        text: full
          ? isAr
            ? 'مساحة التخزين ممتلئة. احذف خرائط أو قلل العمق (التكبير) وجرّب.'
            : 'Storage is full. Delete a map or pick a lower zoom depth and try again.'
          : isAr
            ? 'تعذّر التنزيل. تأكد من الاتصال وجرّب.'
            : 'Download failed. Check your connection and try again.',
      });
    } finally {
      ctrlRef.current = null;
      setBusyKey(null);
      setProgress(null);
      refresh();
    }
  };

  const remove = async (id: TerrainId, l: MapLayerType) => {
    const ok = window.confirm(isAr ? 'تحذف هالخريطة المنزّلة من الجهاز؟' : 'Delete this downloaded map from the device?');
    if (!ok) return;
    await deleteStored(layerTemplate(TERRAINS[id], l)!);
    refresh();
  };

  return (
    <div className="fixed inset-0 z-[1060] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl bg-slate-900 border border-slate-700 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-sky-300 font-mono uppercase tracking-wider">{isAr ? 'الخرائط بدون إنترنت' : 'Offline maps'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" aria-label="close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-3 sm:p-4 space-y-3 text-slate-200">
          {!supported && (
            <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs">
              {isAr ? 'المتصفح هذا ما يدعم التخزين بدون إنترنت. جرّب Chrome أو Safari حديث، وافتح الموقع عبر https.' : 'This browser does not support offline storage. Use a recent Chrome or Safari over https.'}
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">
            {isAr
              ? 'نزّل الخرائط مرة وحدة وأنت على واي فاي، وبعدها التطبيق يشتغل بالميدان بدون إنترنت. كل ما رفعت العمق (التكبير) زاد الحجم كثير. العمق 5 يكفي لرؤية الخريطة كاملة بتفاصيل جيدة.'
              : 'Download maps once on Wi-Fi, then the app works in the field with no internet. Every extra zoom depth multiplies the size. Depth 5 shows the whole map in good detail.'}
          </p>

          {cellular && (
            <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{isAr ? 'يبدو إنك على بيانات الجوال أو اتصال بطيء. يفضّل تنزّل من واي فاي.' : 'You seem to be on mobile data or a slow link. Prefer Wi-Fi for downloads.'}</span>
            </div>
          )}

          {usage && (
            <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  {isAr ? 'مساحة التخزين بالمتصفح' : 'Browser storage'}
                </span>
                <span className="font-mono" dir="ltr">
                  {formatBytes(usage.usage)} / {formatBytes(usage.quota)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: `${Math.min(100, (usage.usage / usage.quota) * 100)}%` }} />
              </div>
            </div>
          )}

          {message && (
            <div
              className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                message.kind === 'ok' ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200' : 'bg-amber-950/60 border-amber-500/50 text-amber-200'
              }`}
            >
              {message.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{message.text}</span>
            </div>
          )}

          {terrainIds.map((id) => {
            const terrain = TERRAINS[id];
            return (
              <div key={id} className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
                <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800 text-sm font-bold text-white">{terrain.name}</div>
                <div className="divide-y divide-slate-800/70">
                  {layersOf(id).map((l) => {
                    const k = key(id, l);
                    const choices = zoomChoices(terrain, l);
                    const d = depthOf(id, l);
                    const plan = planDownload(terrain, l, d);
                    const have = stored[k] ?? 0;
                    const running = busyKey === k;
                    const pct = running && progress ? Math.round(((progress.done + progress.missing + progress.failed) / progress.total) * 100) : Math.min(100, Math.round((have / plan.tileCount) * 100));
                    return (
                      <div key={k} className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-200">{isAr ? LAYER_NAME[l].ar : LAYER_NAME[l].en}</span>
                          <span className="text-[11px] font-mono text-slate-400" dir="ltr">
                            {have > 0 ? `${have} ${isAr ? 'بلاطة محفوظة' : 'tiles saved'}` : isAr ? 'غير منزّلة' : 'not downloaded'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5" dir="ltr">
                          <span className="text-[11px] text-slate-500 me-1">{isAr ? 'العمق' : 'Depth'}</span>
                          {choices.map((z) => (
                            <button
                              key={z}
                              disabled={!!busyKey}
                              onClick={() => setDepth((s) => ({ ...s, [k]: z }))}
                              className={`min-w-10 h-10 px-2 rounded-lg text-xs font-mono font-bold border ${
                                z === d ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                              } disabled:opacity-50`}
                            >
                              {z}
                            </button>
                          ))}
                        </div>

                        <div className="text-[11px] text-slate-400">
                          {isAr ? 'سيحمّل' : 'Will download'} <span className="font-mono text-slate-200">{plan.tileCount}</span> {isAr ? 'بلاطة، حجمها التقديري' : 'tiles, about'}{' '}
                          <span className="font-mono text-slate-200">{formatBytes(plan.estimatedBytes)}</span>{' '}
                          <span className="text-slate-500">({isAr ? 'تقدير' : 'estimate'})</span>
                        </div>

                        {(running || (have > 0 && pct < 100)) && (
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className={`h-full ${running ? 'bg-sky-500' : 'bg-slate-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        )}
                        {running && progress && (
                          <div className="text-[11px] font-mono text-sky-300" dir="ltr">
                            {progress.done + progress.missing + progress.failed} / {progress.total} ({pct}%)
                            {progress.failed > 0 && <span className="text-amber-400"> · {progress.failed} failed</span>}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {running ? (
                            <button
                              onClick={() => ctrlRef.current?.abort()}
                              className="flex-1 h-11 rounded-lg bg-rose-900/70 hover:bg-rose-800 text-rose-100 text-sm font-bold flex items-center justify-center gap-2"
                            >
                              <Square className="w-4 h-4" />
                              {isAr ? 'إيقاف' : 'Stop'}
                            </button>
                          ) : (
                            <button
                              disabled={!supported || !!busyKey}
                              onClick={() => start(id, l)}
                              className="flex-1 h-11 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              {have > 0 ? (isAr ? 'تنزيل / إكمال' : 'Download / resume') : isAr ? 'تنزيل' : 'Download'}
                            </button>
                          )}
                          {have > 0 && !running && (
                            <button
                              onClick={() => remove(id, l)}
                              className="h-11 w-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 flex items-center justify-center"
                              title={isAr ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-3 py-1.5 text-[10px] text-slate-500 border-t border-slate-800/70" dir="ltr">
                  {terrain.tileHost}
                </div>
              </div>
            );
          })}
          <div className="text-[10px] text-slate-600 text-center" dir="ltr">
            cache: {OFFLINE_CACHE}
          </div>
        </div>
      </div>
    </div>
  );
};
