import React, { useState, useEffect, useRef } from 'react';
import { TerrainId, TerrainConfig } from '../types';
import { TERRAINS } from '../data/maps';
import {
  calculateTiles,
  downloadTiles,
  getCacheStats,
  clearOfflineTiles,
  isOfflineSimulated,
  setOfflineSimulation,
  TileCoordinate,
  DownloadProgress,
  CachedStats,
} from '../services/offlineMapStorage';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Trash2,
  X,
  Play,
  Pause,
  RefreshCw,
  Layers,
  MapPin,
  WifiOff,
  Wifi,
  Radio,
  FileCheck,
  ShieldCheck,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface OfflineMapDownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTerrainId: TerrainId;
  gunPos?: { x: number; z: number };
  targetPos?: { x: number; z: number };
  lang: 'en' | 'ar';
}

export const OfflineMapDownloaderModal: React.FC<OfflineMapDownloaderModalProps> = ({
  isOpen,
  onClose,
  activeTerrainId,
  gunPos,
  targetPos,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'storage'>('presets');
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainId>(activeTerrainId);
  const [selectedLayers, setSelectedLayers] = useState<('topo' | 'sat' | 'drawn')[]>(['topo', 'sat']);
  const [minZoom, setMinZoom] = useState<number>(0);
  const [maxZoom, setMaxZoom] = useState<number>(5);
  const [useSectorOnly, setUseSectorOnly] = useState<boolean>(false);
  const [sectorRadiusKm, setSectorRadiusKm] = useState<number>(3);

  // Cache stats
  const [stats, setStats] = useState<CachedStats | null>(null);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(isOfflineSimulated());
  const [isClearing, setIsClearing] = useState(false);

  // Active download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
      setSelectedTerrain(activeTerrainId);
    }
  }, [isOpen, activeTerrainId]);

  const loadStats = async () => {
    try {
      const data = await getCacheStats();
      setStats(data);
    } catch (e) {
      console.warn('Failed to get cache stats', e);
    }
  };

  const currentTerrainConfig = TERRAINS[selectedTerrain];

  // Calculate sector bounds around gun and target
  const getSectorBounds = () => {
    if (!gunPos && !targetPos) return undefined;
    const pts = [gunPos, targetPos].filter(Boolean) as { x: number; z: number }[];
    const minX = Math.min(...pts.map((p) => p.x));
    const maxX = Math.max(...pts.map((p) => p.x));
    const minZ = Math.min(...pts.map((p) => p.z));
    const maxZ = Math.max(...pts.map((p) => p.z));
    const pad = sectorRadiusKm * 1000;
    return {
      minX: Math.max(0, minX - pad),
      maxX: maxX + pad,
      minZ: Math.max(0, minZ - pad),
      maxZ: maxZ + pad,
    };
  };

  // Preview tiles for current custom selection
  const previewTiles: TileCoordinate[] = calculateTiles({
    terrainId: selectedTerrain,
    layers: selectedLayers,
    minZoom,
    maxZoom,
    bounds: useSectorOnly ? getSectorBounds() : undefined,
  });

  const estimatedSizeMb = ((previewTiles.length * 16) / 1024).toFixed(1);

  const startDownload = async (tilesToFetch: TileCoordinate[]) => {
    if (tilesToFetch.length === 0) return;

    abortControllerRef.current = new AbortController();
    setIsDownloading(true);
    setProgress({
      total: tilesToFetch.length,
      completed: 0,
      failed: 0,
      bytesDownloaded: 0,
      speedBps: 0,
      estimatedSecondsRemaining: 0,
      isPaused: false,
      isFinished: false,
      statusText: isAr ? 'جاري بدء التحميل...' : 'Initializing offline download...',
    });

    try {
      await downloadTiles(
        tilesToFetch,
        (p) => setProgress(p),
        abortControllerRef.current.signal,
        5 // 5 parallel connections
      );
    } catch (err: any) {
      console.error('Download cancelled or failed', err);
    } finally {
      setIsDownloading(false);
      await loadStats();
    }
  };

  const cancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsDownloading(false);
  };

  const handleClearCache = async (terrainId?: TerrainId) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من مسح الخرائط المحملة؟' : 'Clear cached offline map tiles?')) return;
    setIsClearing(true);
    try {
      await clearOfflineTiles(terrainId);
      await loadStats();
    } finally {
      setIsClearing(false);
    }
  };

  const toggleOfflineSimulation = () => {
    const next = !isSimulatedOffline;
    setIsSimulatedOffline(next);
    setOfflineSimulation(next);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-wide">
                  {isAr ? 'محمّل الخرائط التكتيكية أوفلاين' : 'Offline Tactical Map Downloader'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-700 text-sky-300">
                  PWA / Storage
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'احفظ الخرائط والشبكات محلياً للعمل بدون إنترنت أثناء المعارك'
                  : 'Cache terrain tiles & grid data locally for zero-latency offline combat operations'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/60 border-b border-slate-800/80 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? 'حزم جاهزة سريعة' : 'Tactical Presets'}</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{isAr ? 'قطاع وتكبير مخصص' : 'Custom Sector & Zoom'}</span>
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'storage'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>{isAr ? 'إدارة السعة والاختبار' : 'Cache & Storage'}</span>
            {stats && stats.totalTiles > 0 && (
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-sky-300 font-mono">
                {stats.totalTiles}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Active Download Progress Dashboard */}
          {isDownloading && progress && (
            <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-sky-300 font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {progress.statusText}
                </span>
                <span className="text-slate-300">
                  {Math.round((progress.completed / Math.max(1, progress.total)) * 100)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, Math.round((progress.completed / Math.max(1, progress.total)) * 100))}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>
                  {isAr ? 'السرعة:' : 'Speed:'} {(progress.speedBps / 1024).toFixed(1)} KB/s
                </span>
                <span>
                  {isAr ? 'المتبقي التقريبي:' : 'ETA:'} {progress.estimatedSecondsRemaining}s
                </span>
                <button
                  onClick={cancelDownload}
                  className="px-2.5 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white font-bold text-[10px] transition"
                >
                  {isAr ? 'إلغاء التحميل' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'اختر حزمة تكتيكية محددة مسبقاً لتحميلها بنقرة واحدة وتثبيتها في ذاكرة المتصفح:'
                  : 'Select an optimized tactical package to pre-cache map tiles into device storage:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Preset 1: Arland Complete */}
                <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-sky-500/60 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-400 font-mono">ARLAND</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        ~12 MB · Z0-6
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-1">
                      {isAr ? 'حزمة جزيرة أرلان كاملة' : 'Arland Complete Theater'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isAr
                        ? 'كافة الطبقات (طوبوغرافية وقمر صناعي) حتى أقصى دقة تكبير'
                        : 'Complete Topo + Sat imagery up to tactical max resolution for small-unit ops.'}
                    </p>
                  </div>
                  <button
                    disabled={isDownloading}
                    onClick={() => {
                      const tiles = calculateTiles({
                        terrainId: 'arland',
                        layers: ['topo', 'sat'],
                        minZoom: 0,
                        maxZoom: 6,
                      });
                      startDownload(tiles);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold font-mono flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تحميل أرلان (~350 بلاطة)' : 'Download Arland (~350 tiles)'}</span>
                  </button>
                </div>

                {/* Preset 2: Everon Tactical Recon */}
                <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-sky-500/60 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 font-mono">EVERON</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        ~24 MB · Z0-5
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-1">
                      {isAr ? 'إيفرون: الاستطلاع التكتيكي' : 'Everon Tactical Recon'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isAr
                        ? 'كامل جزيرة إيفرون (12.8 كم) تشمل الطرق والمدن الرئيسية'
                        : 'Full 12.8 km island coverage with roads, towns, and contours down to 500m precision.'}
                    </p>
                  </div>
                  <button
                    disabled={isDownloading}
                    onClick={() => {
                      const tiles = calculateTiles({
                        terrainId: 'everon',
                        layers: ['topo', 'sat'],
                        minZoom: 0,
                        maxZoom: 5,
                      });
                      startDownload(tiles);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold font-mono flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تحميل إيفرون (~700 بلاطة)' : 'Download Everon (~700 tiles)'}</span>
                  </button>
                </div>

                {/* Preset 3: Active Combat Sector (Around Gun & Target) */}
                <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:border-amber-500/70 transition-all flex flex-col justify-between space-y-3 sm:col-span-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400 font-mono">MISSION SECTOR</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200">
                          Ultra-Fast · ~4 MB
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white mt-1">
                        {isAr
                          ? 'قطاع المهمة الحالية (حول المدفع والهدف بدقة كاملة Z0-7)'
                          : 'Active Fire Mission Sector (High-Res Z0-7 around Gun & Target)'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {isAr
                          ? 'يقوم بتحميل أعلى دقة تضاريس فقط لمحيط 4 كم حول موقع المدفع والهدف الحاليين.'
                          : 'Downloads maximum-resolution contour tiles (Z0-7) strictly covering your active battery and target area.'}
                      </p>
                    </div>
                    <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                  </div>
                  <button
                    disabled={isDownloading}
                    onClick={() => {
                      const bounds = getSectorBounds();
                      const tiles = calculateTiles({
                        terrainId: activeTerrainId,
                        layers: ['topo', 'sat'],
                        minZoom: 0,
                        maxZoom: 7,
                        bounds,
                      });
                      startDownload(tiles);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 text-xs font-bold font-mono flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {isAr
                        ? `تحميل قطاع المهمة النشطة (${previewTiles.length} بلاطة تقريباً)`
                        : `Download Active Mission Sector (~${calculateTiles({ terrainId: activeTerrainId, layers: ['topo'], minZoom: 0, maxZoom: 6, bounds: getSectorBounds() }).length} tiles)`}
                    </span>
                  </button>
                </div>

                {/* Preset 4: Kolguyev Soviet Stronghold */}
                <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-sky-500/60 transition-all flex flex-col justify-between space-y-3 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-400 font-mono">KOLGUYEV</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          ~22 MB · Z0-5
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white mt-1">
                        {isAr ? 'كولغويف: الجبهة الشرقية' : 'Kolguyev Soviet Bastion'}
                      </h3>
                    </div>
                    <button
                      disabled={isDownloading}
                      onClick={() => {
                        const tiles = calculateTiles({
                          terrainId: 'kolguyev',
                          layers: ['topo', 'sat'],
                          minZoom: 0,
                          maxZoom: 5,
                        });
                        startDownload(tiles);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold font-mono flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تحميل كولغويف' : 'Download Kolguyev'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM SECTOR */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              {/* Terrain Select */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {isAr ? 'اختر الخريطة / التضاريس:' : 'Select Terrain:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['everon', 'arland', 'kolguyev'] as TerrainId[]).map((tid) => (
                    <button
                      key={tid}
                      onClick={() => setSelectedTerrain(tid)}
                      className={`p-2 rounded-lg border text-xs font-bold font-mono uppercase transition ${
                        selectedTerrain === tid
                          ? 'bg-sky-500 text-slate-950 border-sky-400'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {TERRAINS[tid].name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layer checkboxes */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {isAr ? 'الطبقات المراد تخزينها:' : 'Map Layers to Cache:'}
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'topo', label: isAr ? 'طوبوغرافية (Topo)' : 'Topographic' },
                    { id: 'sat', label: isAr ? 'قمر صناعي (Sat)' : 'Satellite' },
                    { id: 'drawn', label: isAr ? 'مرسومة (Drawn)' : 'Tactical Drawn' },
                  ].map((layer) => {
                    const isChecked = selectedLayers.includes(layer.id as any);
                    return (
                      <button
                        key={layer.id}
                        onClick={() => {
                          if (isChecked && selectedLayers.length > 1) {
                            setSelectedLayers(selectedLayers.filter((l) => l !== layer.id));
                          } else if (!isChecked) {
                            setSelectedLayers([...selectedLayers, layer.id as any]);
                          }
                        }}
                        className={`p-2 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition ${
                          isChecked
                            ? 'bg-slate-800 text-sky-400 border-sky-500/50'
                            : 'bg-slate-950/50 text-slate-500 border-slate-800'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{layer.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zoom Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1 font-mono">
                    {isAr ? 'أدنى تكبير (Min Zoom):' : 'Min Zoom:'} <span className="text-white">{minZoom}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={maxZoom}
                    value={minZoom}
                    onChange={(e) => setMinZoom(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1 font-mono">
                    {isAr ? 'أقصى تكبير (Max Zoom):' : 'Max Zoom:'} <span className="text-white">{maxZoom}</span>
                  </label>
                  <input
                    type="range"
                    min={minZoom}
                    max={currentTerrainConfig.maxNativeZoom}
                    value={maxZoom}
                    onChange={(e) => setMaxZoom(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>
              </div>

              {/* Sector restriction toggle */}
              <div
                onClick={() => setUseSectorOnly(!useSectorOnly)}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 flex items-center justify-between cursor-pointer hover:border-slate-700 transition"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {isAr ? 'حصر التحميل بقطاع المهمة الحالية فقط' : 'Restrict to Active Combat Sector'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isAr
                      ? 'يوفر البيانات والوقت بتحميل البلاطات المحيطة بمواقع المدفع والهدف'
                      : 'Saves storage by only caching tiles around current Gun and Target positions'}
                  </div>
                </div>
                <div
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                    useSectorOnly ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                  dir="ltr"
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                </div>
              </div>

              {/* Summary & Start Button */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-mono">
                    {isAr ? 'إجمالي البلاطات المتوقعة:' : 'Calculated Tile Count:'}{' '}
                    <span className="font-bold text-white text-sm">{previewTiles.length}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {isAr ? 'الحجم التقديري:' : 'Est. Download Size:'}{' '}
                    <span className="text-emerald-400 font-bold">~{estimatedSizeMb} MB</span>
                  </div>
                </div>
                <button
                  disabled={isDownloading || previewTiles.length === 0}
                  onClick={() => startDownload(previewTiles)}
                  className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-lg transition"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'بدء التحميل المخصص' : 'Start Download'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CACHE & STORAGE */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              {/* Storage Overview */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase font-mono">
                    {isAr ? 'إحصائيات التخزين المحلي' : 'Local Cache Storage'}
                  </span>
                  <button
                    onClick={loadStats}
                    className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isAr ? 'تحديث' : 'Refresh'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-lg font-bold text-white">{stats?.totalTiles ?? 0}</div>
                    <div className="text-[10px] text-slate-400">{isAr ? 'بلاطة محفوظة' : 'Cached Tiles'}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-lg font-bold text-sky-400">
                      {stats ? (stats.estimatedBytes / (1024 * 1024)).toFixed(1) : 0} MB
                    </div>
                    <div className="text-[10px] text-slate-400">{isAr ? 'المساحة المستخدمة' : 'Used Space'}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-lg font-bold text-emerald-400">
                      {stats && stats.quotaBytes ? `${(stats.quotaBytes / (1024 * 1024 * 1024)).toFixed(0)} GB` : '∞'}
                    </div>
                    <div className="text-[10px] text-slate-400">{isAr ? 'السعة الكلية' : 'Device Quota'}</div>
                  </div>
                </div>

                {/* Per terrain breakdown */}
                {stats && stats.totalTiles > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Everon:</span>
                      <span className="text-white">{stats.byTerrain.everon} tiles</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Arland:</span>
                      <span className="text-white">{stats.byTerrain.arland} tiles</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Kolguyev:</span>
                      <span className="text-white">{stats.byTerrain.kolguyev} tiles</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Simulated Offline Mode Tester */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSimulatedOffline ? (
                      <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
                    ) : (
                      <Wifi className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {isAr ? 'اختبار وضع عدم الاتصال (Offline Simulation)' : 'Simulate Offline Mode (Field Test)'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {isAr
                          ? 'يحظر اتصالات الشبكة لاختبار تحميل الخرائط المحفوظة دون إطفاء الواي فاي'
                          : 'Forces app to use only cached tiles to verify field readiness without disabling device Wi-Fi'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleOfflineSimulation}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                      isSimulatedOffline
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isSimulatedOffline ? (isAr ? 'الوضع مفعل' : 'OFFLINE ACTIVE') : (isAr ? 'تشغيل' : 'TEST')}
                  </button>
                </div>
              </div>

              {/* Clear Cache Controls */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  disabled={isClearing || (stats?.totalTiles ?? 0) === 0}
                  onClick={() => handleClearCache()}
                  className="py-2 px-3 rounded-lg border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 disabled:opacity-40 text-red-300 text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>{isAr ? 'مسح كافة الخرائط المخزنة' : 'Clear All Cached Maps'}</span>
                </button>

                <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>ServiceWorker + IDB Safe</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Arma Reforger Tactical Cache v2.20</span>
          <button onClick={onClose} className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200">
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
