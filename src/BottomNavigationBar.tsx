import React from 'react';
import { 
  Map as MapIcon, 
  Crosshair, 
  Download, 
  Smartphone, 
  Wind, 
  History,
  Settings,
  WifiOff
} from 'lucide-react';
import { BallisticSolution, WeaponConfig } from '../types';

interface BottomNavigationBarProps {
  activeTab: 'map' | 'calc';
  onChangeTab: (tab: 'map' | 'calc') => void;
  onOpenOfflineDownloader: () => void;
  onOpenAndroidHub: () => void;
  onOpenMissionLog?: () => void;
  onOpenSettings?: () => void;
  onToggleWeather?: () => void;
  isWeatherOpen?: boolean;
  cachedTilesCount?: number;
  solution?: BallisticSolution;
  selectedWeapon?: WeaponConfig;
  lang: 'en' | 'ar';
  isOnline: boolean;
}

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  activeTab,
  onChangeTab,
  onOpenOfflineDownloader,
  onOpenAndroidHub,
  onOpenMissionLog,
  onOpenSettings,
  onToggleWeather,
  isWeatherOpen,
  cachedTilesCount = 0,
  solution,
  selectedWeapon,
  lang,
  isOnline,
}) => {
  const isAr = lang === 'ar';
  const isSoviet = selectedWeapon?.milSystem === 'SOVIET';

  const azMil = solution
    ? isSoviet
      ? `${String(Math.floor(solution.azimuthMils / 100)).padStart(2, '0')}-${String(solution.azimuthMils % 100).padStart(2, '0')}`
      : `${solution.azimuthMils}`
    : null;

  const elMil = solution && solution.elevationMils !== null
    ? isSoviet
      ? `${String(Math.floor(solution.elevationMils / 100)).padStart(2, '0')}-${String(solution.elevationMils % 100).padStart(2, '0')}`
      : `${solution.elevationMils}`
    : null;

  return (
    <nav
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed bottom-0 left-0 right-0 z-[1000] lg:hidden bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl shadow-2xl safe-area-bottom select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1 max-w-lg mx-auto">
        {/* Tab 1: Tactical Map */}
        <button
          onClick={() => onChangeTab('map')}
          className={`flex flex-col items-center justify-center h-full relative transition-all duration-150 min-h-[44px] min-w-[44px] ${
            activeTab === 'map' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MapIcon className={`w-5 h-5 transition-transform ${activeTab === 'map' ? 'scale-110' : ''}`} />
            {activeTab === 'map' && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 truncate">
            {isAr ? 'الخريطة' : 'Map'}
          </span>
        </button>

        {/* Tab 2: Ballistic Calculator & Solution */}
        <button
          onClick={() => onChangeTab('calc')}
          className={`flex flex-col items-center justify-center h-full relative transition-all duration-150 min-h-[44px] min-w-[44px] ${
            activeTab === 'calc' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Crosshair className={`w-5 h-5 transition-transform ${activeTab === 'calc' ? 'scale-110' : ''}`} />
            {solution && solution.elevationDeg !== null && (
              <span className="absolute -top-1 -right-1.5 text-[8px] font-mono px-1 rounded-full bg-emerald-500 text-slate-950 font-black">
                {solution.elevationDeg.toFixed(0)}°
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 truncate">
            {isAr ? 'الحاسبة' : 'Calculator'}
          </span>
        </button>

        {/* Tab 3: Offline Maps Downloader (FEATURE PROMINENT IN THE BOTTOM BAR) */}
        <button
          onClick={onOpenOfflineDownloader}
          className="flex flex-col items-center justify-center h-full relative transition-all duration-150 text-slate-300 hover:text-sky-300 min-h-[44px] min-w-[44px] group"
        >
          <div className="w-10 h-10 -mt-2 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 shadow-lg shadow-sky-500/25 border border-sky-300/40 flex items-center justify-center text-slate-950 transition-transform active:scale-95 group-hover:scale-105">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            <span className="text-[9px] font-bold tracking-tight text-sky-400">
              {isAr ? 'تنزيل خرائط' : 'Download'}
            </span>
            {cachedTilesCount > 0 && (
              <span className="text-[8px] font-mono text-slate-400">
                ({cachedTilesCount > 999 ? `${(cachedTilesCount / 1000).toFixed(0)}k` : cachedTilesCount})
              </span>
            )}
          </div>
        </button>

        {/* Tab 4: Wind & Mission Tools */}
        <button
          onClick={onToggleWeather}
          className={`flex flex-col items-center justify-center h-full relative transition-all duration-150 min-h-[44px] min-w-[44px] ${
            isWeatherOpen ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wind className={`w-5 h-5 transition-transform ${isWeatherOpen ? 'scale-110 text-sky-400' : ''}`} />
          <span className="text-[10px] tracking-tight mt-1 truncate">
            {isAr ? 'الرياح' : 'Wind'}
          </span>
        </button>

        {/* Tab 5: App / APK & Install */}
        <button
          onClick={onOpenAndroidHub}
          className="flex flex-col items-center justify-center h-full relative transition-all duration-150 text-purple-300 hover:text-purple-200 min-h-[44px] min-w-[44px]"
        >
          <div className="relative">
            <Smartphone className="w-5 h-5" />
            {!isOnline && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-slate-900" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 truncate">
            {isAr ? 'التطبيق APK' : 'App (APK)'}
          </span>
        </button>
      </div>

      {/* Floating mini status bar on mobile displaying active solution while on map */}
      {activeTab === 'map' && solution && solution.elevationDeg !== null && (
        <div className="bg-slate-900/90 border-t border-slate-800/80 px-3 py-1 flex items-center justify-between text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-bold">AZ: {azMil ?? `${solution.azimuthDeg.toFixed(0)}°`}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">EL: {solution.elevationDeg.toFixed(1)}° {elMil ? `(${elMil})` : ''}</span>
          </div>
          <div className="text-amber-300 font-bold flex items-center gap-1">
            <span>{isAr ? `حلقة ${solution.charge}` : `Ring ${solution.charge}`}</span>
            {solution.timeOfFlight && (
              <span className="text-slate-500 font-normal">({solution.timeOfFlight.toFixed(0)}s)</span>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
