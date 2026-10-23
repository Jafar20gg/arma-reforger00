import React, { useCallback, useEffect, useState } from 'react';
import { X, Download, Trash2, HardDrive, Square, WifiOff, CheckCircle2, AlertTriangle, Satellite } from 'lucide-react';
import { TERRAINS } from '../data/maps';
import type { MapLayerType, TerrainId } from '../types';
import { OFFLINE_CACHE, countStored, deleteStored, formatBytes, layerMaxNativeZoom, layerTemplate, planDownload, storageEstimate } from '../services/offlineTiles';
import { JobItem, clearOfflineMeta, readOfflineMeta, startJob, stopJob, useOfflineJob } from '../services/offlineManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
}

/** Only the satellite layer is offered for download (the one used in the field). */
const LAYER: MapLayerType = 'sat';
const DEPTHS = [3, 4, 5, 6, 7];
const RECOMMENDED = 5;

/** Offline maps: download the satellite map once, then use it with no internet. */
export const OfflineMapsModal: React.FC<Props> = ({ isOpen, onClose, lang }) => {
  const isAr = lang === 'ar';
  const job = useOfflineJob();
  const terrainIds = (Object.keys(TERRAINS) as TerrainId[]).filter((id) => !!layerTemplate(TERRAINS[id], LAYER));
  const [depth, setDepth] = useState(RECOMMENDED);
  const [stored, setStored] = useState<Record<string, number>>({});
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);

  const depthFor = (id: TerrainId) => Math.min(depth, layerMaxNativeZoom(TERRAINS[id], LAYER));
  const planFor = (id: TerrainId) => planDownload(TERRAINS[id], LAYER, depthFor(id));

  const refresh = useCallback(async () => {
    if (typeof caches === 'undefined') return;
    const next: Record<string, number> = {};
    for (const id of terrainIds) next[id] = await countStored(layerTemplate(TERRAINS[id], LAYER)!);
    setStored(next);
    setUsage(await storageEstimate());
  }, []);

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh, job.tick]);

  if (!isOpen) return null;

  const supported = typeof caches !== 'undefined';
  const conn = (navigator as any).connection as { saveData?: boolean; effectiveType?: string; type?: string } | undefined;
  const cellular = conn?.type === 'cellular' || conn?.saveData === true || conn?.effectiveType === '2g' || conn?.effectiveType === '3g';
  const meta = readOfflineMeta();

  const itemsFor = (ids: TerrainId[]): JobItem[] => ids.map((id) => ({ terrainId: id, layer: LAYER, maxZoom: depthFor(id) }));
  const totalPlan = terrainIds.reduce((a, id) => a + planFor(id).tileCount, 0);
  const totalBytes = terrainIds.reduce((a, id) => a + planFor(id).estimatedBytes, 0);

  const begin = (ids: TerrainId[]) => {
    const bytes = ids.reduce((a, id) => a + planFor(id).estimatedBytes, 0);
    if (bytes > 150 * 1024 * 1024) {
      const ok = window.confirm(
        isAr ? `الحجم التقديري ${formatBytes(bytes)}. تأكد إنك على واي فاي وإن الشحن كافي. تكمل؟` : `Estimated size ${formatBytes(bytes)}. Use Wi-Fi and keep the phone charged. Continue?`,
      );
      if (!ok) return;
    }
    void startJob(itemsFor(ids));
  };

  const remove = async (id: TerrainId) => {
    if (!window.confirm(isAr ? 'تحذف هالخريطة المنزّلة من الجهاز؟' : 'Delete this downloaded map from the device?')) return;
    await deleteStored(layerTemplate(TERRAINS[id], LAYER)!);
    clearOfflineMeta(id, LAYER);
    refresh();
  };

  const overallPct = job.totalTiles > 0 ? Math.min(100, Math.round((job.doneTiles / job.totalTiles) * 100)) : 0;
  const r = job.result;

  const resultBox = () => {
    if (!r || job.running) return null;
    const ok = r.code === 'done';
    const text =
      r.code === 'done'
        ? isAr
          ? 'تم التنزيل والتثبيت. الخريطة تشتغل الحين بدون إنترنت.'
          : 'Downloaded and installed. The map now works without internet.'
        : r.code === 'stopped'
          ? isAr
            ? 'أُوقف التنزيل. اللي نزل انحفظ، اضغط تنزيل لإكمال الناقص.'
            : 'Download stopped. What was saved is kept; press Download to continue.'
          : r.code === 'quota'
            ? isAr
              ? 'مساحة التخزين ممتلئة. قلل العمق أو احذف خريطة.'
              : 'Storage is full. Pick a lower depth or delete a map.'
            : isAr
              ? `ما اكتمل: فشلت ${r.failed} بلاطة${r.firstError ? ` (السبب: ${r.firstError})` : ''}. اضغط تنزيل لإكمال الناقص.`
              : `Not complete: ${r.failed} tiles failed${r.firstError ? ` (reason: ${r.firstError})` : ''}. Press Download to fill the gaps.`;
    return (
      <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${ok ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200' : 'bg-amber-950/60 border-amber-500/50 text-amber-200'}`}>
        {ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
        <span>{text}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[1060] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div dir={isAr ? 'rtl' : 'ltr'} className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl bg-slate-900 border border-slate-700 flex flex-col" onClick={(e) => e.stopPropagation()}>
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
              {isAr ? 'المتصفح هذا ما يدعم التخزين بدون إنترنت. افتح الموقع عبر https بمتصفح حديث.' : 'This browser does not support offline storage. Use a recent browser over https.'}
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed flex items-start gap-2">
            <Satellite className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
            <span>
              {isAr
                ? 'يتنزّل القمر الصناعي فقط. اضغط تنزيل مرة وحدة وأنت على واي فاي، وبعدها تتثبت الخريطة تلقائياً وتشتغل بدون إنترنت (اختر طبقة "قمر صناعي" في الخريطة). التنزيل يكمل بالخلفية حتى لو سكّرت هالنافذة، والشاشة تظل شغالة أثناءه.'
                : 'Only the satellite map is downloaded. Tap Download once on Wi-Fi; it installs automatically and then works with no internet (pick the "Satellite" layer on the map). It keeps going in the background if you close this window, and the screen stays on while it runs.'}
            </span>
          </p>

          {cellular && (
            <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{isAr ? 'يبدو إنك على بيانات الجوال أو اتصال بطيء. يفضّل واي فاي.' : 'You seem to be on mobile data or a slow link. Prefer Wi-Fi.'}</span>
            </div>
          )}

          {/* depth */}
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">{isAr ? 'العمق (دقة التفاصيل)' : 'Depth (detail level)'}</span>
              <span className="text-slate-500">{isAr ? 'الأعلى = تفاصيل أكثر وحجم أكبر بكثير' : 'higher = more detail, much bigger'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5" dir="ltr">
              {DEPTHS.map((z) => (
                <button
                  key={z}
                  disabled={job.running}
                  onClick={() => setDepth(z)}
                  className={`min-w-11 h-11 px-2 rounded-lg text-sm font-mono font-bold border disabled:opacity-50 ${
                    z === depth ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {z}
                  {z === RECOMMENDED && <span className="block text-[8px] leading-none font-sans -mt-0.5">{isAr ? 'موصى' : 'best'}</span>}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-slate-400">
              {isAr ? 'الكل:' : 'All maps:'} <span className="font-mono text-slate-200">{totalPlan}</span> {isAr ? 'بلاطة، حوالي' : 'tiles, about'}{' '}
              <span className="font-mono text-slate-200">{formatBytes(totalBytes)}</span> <span className="text-slate-500">({isAr ? 'تقدير' : 'estimate'})</span>
            </div>
          </div>

          {/* one button for everything */}
          {job.running ? (
            <div className="p-3 rounded-xl border border-sky-500/50 bg-sky-950/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-sky-300" dir="ltr">
                <span>
                  {job.currentTerrain ? TERRAINS[job.currentTerrain].name : '…'} ({job.index + 1}/{job.items.length})
                </span>
                <span>{overallPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-sky-500 transition-all" style={{ width: `${overallPct}%` }} />
              </div>
              {job.currentProgress && job.currentProgress.failed > 0 && (
                <div className="text-[11px] text-amber-300" dir="ltr">
                  {job.currentProgress.failed} failed{job.currentProgress.firstError ? ` · ${job.currentProgress.firstError}` : ''}
                </div>
              )}
              <button onClick={stopJob} className="w-full h-12 rounded-lg bg-rose-900/70 hover:bg-rose-800 text-rose-100 text-sm font-bold flex items-center justify-center gap-2">
                <Square className="w-4 h-4" />
                {isAr ? 'إيقاف' : 'Stop'}
              </button>
            </div>
          ) : (
            <button
              disabled={!supported}
              onClick={() => begin(terrainIds)}
              className="w-full h-14 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-base font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isAr ? 'تنزيل كل الخرائط (قمر صناعي)' : 'Download all maps (satellite)'}
            </button>
          )}

          {resultBox()}

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

          {/* per map */}
          {terrainIds.map((id) => {
            const have = stored[id] ?? 0;
            const plan = planFor(id);
            const m = meta[`${id}:${LAYER}`];
            const installed = !!m && m.maxZoom >= plan.maxZoom && have > 0;
            const pct = Math.min(100, Math.round((have / plan.tileCount) * 100));
            return (
              <div key={id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{TERRAINS[id].name}</span>
                  <span className={`text-[11px] font-bold ${installed ? 'text-emerald-400' : have > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                    {installed ? (isAr ? '✓ مثبّتة بدون إنترنت' : '✓ installed offline') : have > 0 ? (isAr ? `ناقصة ${pct}%` : `partial ${pct}%`) : isAr ? 'غير منزّلة' : 'not downloaded'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400" dir="ltr">
                  depth {plan.maxZoom} · {plan.tileCount} tiles · ~{formatBytes(plan.estimatedBytes)} {have > 0 && `· ${have} saved`}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!supported || job.running}
                    onClick={() => begin([id])}
                    className="flex-1 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {have > 0 ? (isAr ? 'تنزيل / إكمال' : 'Download / resume') : isAr ? 'تنزيل هذي الخريطة' : 'Download this map'}
                  </button>
                  {have > 0 && !job.running && (
                    <button onClick={() => remove(id)} className="h-11 w-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 flex items-center justify-center" title={isAr ? 'حذف' : 'Delete'}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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
