import React from 'react';
import { TerrainId, TerrainConfig, WeaponConfig, BallisticSolution, InterfaceVisibilitySettings } from '../types';
import { 
  Crosshair, 
  Map as MapIcon,
  Download,
  Smartphone,
  Github
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  terrains: Record<TerrainId, TerrainConfig>;
  activeTerrainId: TerrainId;
  onSelectTerrain: (id: TerrainId) => void;
  solution?: BallisticSolution;
  selectedWeapon?: WeaponConfig;
  lang: 'en' | 'ar';
  visibility?: InterfaceVisibilitySettings;
  onOpenOfflineDownloader?: () => void;
  onOpenGitHubModal?: () => void;
  cachedTilesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  terrains,
  activeTerrainId,
  onSelectTerrain,
  solution,
  selectedWeapon,
  lang,
  visibility,
  onOpenOfflineDownloader,
  onOpenGitHubModal,
  cachedTilesCount = 0,
}) => {
  const isSoviet = selectedWeapon?.milSystem === 'SOVIET';
  const menuPos = visibility?.menuButtonPosition || 'top-right';

  const azMilFormatted = solution 
    ? (isSoviet 
        ? `${String(Math.floor(solution.azimuthMils / 100)).padStart(2, '0')}-${String(solution.azimuthMils % 100).padStart(2, '0')}`
        : `${solution.azimuthMils}`)
    : '----';

  const elMilFormatted = solution && solution.elevationMils !== null
    ? (isSoviet
        ? `${String(Math.floor(solution.elevationMils / 100)).padStart(2, '0')}-${String(solution.elevationMils % 100).padStart(2, '0')}`
        : `${solution.elevationMils}`)
    : '----';

  return (
    <header
      className="h-14 bg-slate-950 border-b border-slate-800 px-2 sm:px-4 flex items-center justify-between z-10 shrink-0 gap-2"
      style={{
        // keep the top bar content clear of the floating ⋮ button
        paddingRight: menuPos === 'top-right' ? 56 : undefined,
        paddingLeft: menuPos === 'top-left' ? 56 : undefined,
      }}
    >
      {/* Brand & Title */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <Crosshair className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-xs sm:text-sm font-bold tracking-wider text-white font-mono uppercase whitespace-nowrap">
              Arma Reforger <span className="text-sky-400">FCS</span>
            </h1>
            <span className="text-[10px] bg-slate-800 text-sky-300 font-mono px-1.5 py-0.2 rounded border border-slate-700 hidden lg:inline-block">
              v1.2+
            </span>
          </div>
          <p className="text-[10px] text-slate-400 tracking-tight hidden xl:block">
            {lang === 'ar' 
              ? 'منظومة إدارة النيران وحسابات الهاون التكتيكية'
              : 'Fire Control System & Tactical Artillery Planner'}
          </p>
        </div>
      </div>

      {/* Top Status Bar (Elevation in Degrees, Azimuth, and Ring) - Desktop & Large Tablet */}
      {(!visibility || visibility.showLiveSolutionPill) && solution && (
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg shadow-inner shrink-0">
          <span className="text-sky-400 font-bold flex items-center gap-1">
            <span>AZ:</span>
            <span>{azMilFormatted}</span>
            <span className="text-slate-400 text-[10px] font-normal">({solution.azimuthDeg.toFixed(1)}°)</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span>EL:</span>
            <span>{solution.elevationDeg !== null ? `${solution.elevationDeg.toFixed(1)}°` : '---'}</span>
            {solution.elevationMils !== null && (
              <span className="text-slate-400 text-[10px] font-normal">({elMilFormatted} mil)</span>
            )}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-semibold">
            {lang === 'ar' ? `حلقة ${solution.charge}` : `Ring ${solution.charge}`}
          </span>
        </div>
      )}

      {/* Center/Right Actions: PWA Install, Offline Maps Downloader, Android/GitHub Hub, Terrain Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Offline Maps Downloader Button */}
        {onOpenOfflineDownloader && (
          <button
            onClick={onOpenOfflineDownloader}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-white border border-slate-700/80 transition shadow-sm whitespace-nowrap shrink-0"
            title={lang === 'ar' ? 'محمّل الخرائط أوفلاين' : 'Offline Tactical Map Downloader'}
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'خرائط أوفلاين' : 'Offline Maps'}</span>
            {cachedTilesCount > 0 && (
              <span className="text-[10px] px-1 rounded bg-sky-950 border border-sky-700 text-sky-300 font-mono">
                {cachedTilesCount}
              </span>
            )}
          </button>
        )}

        {/* Android & GitHub Automation Hub Button */}
        {onOpenGitHubModal && (
          <button
            onClick={onOpenGitHubModal}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 hover:text-white border border-purple-500/40 transition shadow-sm whitespace-nowrap shrink-0"
            title={lang === 'ar' ? 'بناء APK ومستودع GitHub' : 'Android APK & GitHub Hub'}
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">{lang === 'ar' ? 'أندرويد APK' : 'Android (APK)'}</span>
          </button>
        )}

        {/* PWA Install Button */}
        <PWAInstallButton lang={lang} />

        {/* Terrain Selector Tabs */}
        {(!visibility || visibility.showTerrainTabs) && (
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 shrink-0">
            {(Object.keys(terrains) as TerrainId[]).map((id) => {
              const terrain = terrains[id];
              const isActive = id === activeTerrainId;
              return (
                <button
                  key={id}
                  onClick={() => onSelectTerrain(id)}
                  className={`px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-xs font-mono font-bold rounded-md transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <MapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="uppercase">{terrain.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
