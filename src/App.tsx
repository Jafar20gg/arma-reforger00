import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { TERRAINS } from './data/maps';
import { WEAPONS, calculateFiringSolution } from './data/ballistics';
import { 
  TerrainId, 
  MapLayerType, 
  TileDiagnostics, 
  WeaponConfig,
  AppCustomizationSettings,
  MapOverlaySettings,
  WeatherSettings,
  CustomMapMarker,
  CustomMortarConfig,
  WeaponTuning,
  AiSettings,
  WeaponTunings,
  AppExportData,
  FireMissionRecord
} from './types';
import { applyTuningToCharges } from './services/ballisticsCalculator';
import { offsetTarget } from './services/distance';
import { encodeMissionLink, decodeMissionLink } from './services/missionLink';
import { buildFireMissionCallout } from './services/callout';
import { StorageService } from './services/storageService';
import { useStorageConsent, grantStorage, denyStorage } from './services/storageConsent';
import { flushWidgetLayout } from './services/widgetLayout';
import { Header } from './components/Header';
import { TacticalMap } from './components/TacticalMap';
import { FireControlPanel } from './components/FireControlPanel';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { HelpModal } from './components/HelpModal';
import { StorageConsentBanner } from './components/StorageConsentBanner';
import { SettingsModal } from './components/SettingsModal';
import { CustomMarkerModal } from './components/CustomMarkerModal';
import { WeatherWidget } from './components/WeatherWidget';
import { ThreeDotMenu } from './components/ThreeDotMenu';
import { MissionLogModal } from './components/MissionLogModal';
import { MortarInformationSystem } from './components/MortarInformationSystem';

export default function App() {
  // 1. Persistent Storage State (Browser LocalStorage)
  const [settings, setSettings] = useState<AppCustomizationSettings>(() => StorageService.loadSettings());
  const [overlays, setOverlays] = useState<MapOverlaySettings>(() => StorageService.loadOverlays());
  const [weather, setWeather] = useState<WeatherSettings>(() => StorageService.loadWeather());
  const [customMarkers, setCustomMarkers] = useState<CustomMapMarker[]>(() => StorageService.loadMarkers());
  const [customMortars, setCustomMortars] = useState<CustomMortarConfig[]>(() => StorageService.loadCustomMortars());
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => StorageService.loadAi());
  const handleUpdateAi = useCallback((patch: Partial<AiSettings>) => {
    setAiSettings((prev) => {
      const next = { ...prev, ...patch };
      StorageService.saveAi(next);
      return next;
    });
  }, []);
  const [tunings, setTunings] = useState<WeaponTunings>(() => StorageService.loadTunings());
  const [missions, setMissions] = useState<FireMissionRecord[]>(() => StorageService.loadMissions());
  const [isMissionLogOpen, setIsMissionLogOpen] = useState(false);

  // Permission to save data in this browser (nothing is written until the user allows it)
  const storageConsent = useStorageConsent();
  const handleSetStorage = useCallback(
    (allow: boolean) => {
      if (allow) {
        grantStorage();
        // store what is on screen right now
        StorageService.saveSettings(settings);
        StorageService.saveOverlays(overlays);
        StorageService.saveWeather(weather);
        StorageService.saveMarkers(customMarkers);
        StorageService.saveCustomMortars(customMortars);
        StorageService.saveTunings(tunings);
        StorageService.saveAi(aiSettings);
        StorageService.saveMissions(missions);
        flushWidgetLayout();
      } else {
        denyStorage();
      }
    },
    [settings, overlays, weather, customMarkers, customMortars, tunings, aiSettings, missions],
  );

  // 2. Modals & Menu State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThreeDotOpen, setIsThreeDotOpen] = useState(false);
  const [isMarkerModalOpen, setIsMarkerModalOpen] = useState(false);
  const [markerModalCoords, setMarkerModalCoords] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMortarInfoOpen, setIsMortarInfoOpen] = useState(false);
  const [fitMissionTrigger, setFitMissionTrigger] = useState<number>(0);
  const [isRulerActive, setIsRulerActive] = useState<boolean>(false);

  // 3. Operational Map & Weapon State
  const [activeTerrainId, setActiveTerrainId] = useState<TerrainId>('everon');
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('topo');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponConfig>(WEAPONS[0]);
  const [selectedAmmoId, setSelectedAmmoId] = useState<string>('M821_HE');
  const [selectedCharge, setSelectedCharge] = useState<number>(-1); // -1 = Auto optimal ring
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);
  const [terrainNotice, setTerrainNotice] = useState<string | null>(null);

  const currentTerrain = TERRAINS[activeTerrainId];

  // Gun and Target coordinates (meters in game world)
  const [gunPos, setGunPos] = useState<{ x: number; z: number; alt: number }>({
    x: currentTerrain.defaultWeapon[0],
    z: currentTerrain.defaultWeapon[1],
    alt: 65,
  });

  const [targetPos, setTargetPos] = useState<{ x: number; z: number; alt: number }>({
    x: currentTerrain.defaultTarget[0],
    z: currentTerrain.defaultTarget[1],
    alt: 72,
  });

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<TileDiagnostics>({
    terrainId: 'everon',
    urlTemplate: currentTerrain.layers.topo,
    currentZoom: 2,
    loadedCount: 0,
    failedCount: 0,
    lastError: null,
    isReachable: null,
    pingMs: null,
    httpStatus: null,
  });

  // Combine standard weapons with custom user-defined mortars
  const allWeapons: WeaponConfig[] = useMemo(() => {
    if (customMortars.length === 0) return WEAPONS;

    const convertedCustoms: WeaponConfig[] = customMortars.map((cm) => {
      // Find matching base charges from American or Soviet baseline
      const base = cm.milsPerCircle === 6000 ? WEAPONS[1] : WEAPONS[0];
      return {
        id: cm.id,
        name: cm.name,
        shortName: cm.shortName,
        faction: cm.milsPerCircle === 6000 ? 'Soviet Army' : 'US Army',
        caliber: cm.caliber,
        milSystem: cm.milSystem,
        milsPerCircle: cm.milsPerCircle,
        minElevation: cm.minElevation,
        maxElevation: cm.maxElevation,
        minElevationDeg: cm.minElevationDeg,
        maxElevationDeg: cm.maxElevationDeg,
        verificationStatus: cm.verificationStatus,
        sourceInfo: cm.sourceInfo,
        description: cm.description,
        charges: base.charges,
        ammunition: base.ammunition,
      };
    });

    return [...WEAPONS, ...convertedCustoms];
  }, [customMortars]);

  // Update Settings with auto-persistence
  const handleUpdateSettings = useCallback((partial: Partial<AppCustomizationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      StorageService.saveSettings(next);
      return next;
    });
  }, []);

  // Update Overlays with auto-persistence
  const handleUpdateOverlays = useCallback((partial: Partial<MapOverlaySettings>) => {
    setOverlays((prev) => {
      const next = { ...prev, ...partial };
      StorageService.saveOverlays(next);
      return next;
    });
  }, []);

  // Update Weather with auto-persistence
  const handleUpdateWeather = useCallback((partial: Partial<WeatherSettings>) => {
    setWeather((prev) => {
      const next = { ...prev, ...partial };
      StorageService.saveWeather(next);
      return next;
    });
  }, []);

  // Custom Markers operations
  const handleAddMarker = useCallback((marker: CustomMapMarker) => {
    setCustomMarkers((prev) => {
      const next = [...prev, marker];
      StorageService.saveMarkers(next);
      return next;
    });
  }, []);

  const handleDeleteMarker = useCallback((id: string) => {
    setCustomMarkers((prev) => {
      const next = prev.filter((m) => m.id !== id);
      StorageService.saveMarkers(next);
      return next;
    });
  }, []);

  // Custom Mortars operations
  const handleAddMortar = useCallback((mortar: CustomMortarConfig) => {
    setCustomMortars((prev) => {
      const next = [...prev, mortar];
      StorageService.saveCustomMortars(next);
      return next;
    });
  }, []);

  const handleDeleteMortar = useCallback((id: string) => {
    setCustomMortars((prev) => {
      const next = prev.filter((m) => m.id !== id);
      StorageService.saveCustomMortars(next);
      return next;
    });
  }, []);

  // Personal weapon calibration (null = back to standard game data)
  const handleUpdateTuning = useCallback((weaponId: string, tuning: WeaponTuning | null) => {
    setTunings((prev) => {
      const next = { ...prev };
      if (!tuning || (tuning.rangeScalePct === 0 && tuning.elevationOffsetMils === 0)) delete next[weaponId];
      else next[weaponId] = tuning;
      StorageService.saveTunings(next);
      return next;
    });
  }, []);

  // Import Backup operation
  const handleImportBackup = useCallback((backup: AppExportData) => {
    if (backup.settings) {
      setSettings(backup.settings);
      StorageService.saveSettings(backup.settings);
    }
    if (backup.overlaySettings) {
      setOverlays(backup.overlaySettings);
      StorageService.saveOverlays(backup.overlaySettings);
    }
    if (backup.weatherSettings) {
      setWeather(backup.weatherSettings);
      StorageService.saveWeather(backup.weatherSettings);
    }
    if (backup.customMarkers) {
      setCustomMarkers(backup.customMarkers);
      StorageService.saveMarkers(backup.customMarkers);
    }
    if (backup.weaponTunings) {
      setTunings(backup.weaponTunings);
      StorageService.saveTunings(backup.weaponTunings);
    }
    if (backup.customMortars) {
      setCustomMortars(backup.customMortars);
      StorageService.saveCustomMortars(backup.customMortars);
    }
    if (backup.missions) {
      setMissions(backup.missions);
      StorageService.saveMissions(backup.missions);
    }
  }, []);

  const saveMissions = useCallback((next: FireMissionRecord[]) => {
    setMissions(next);
    StorageService.saveMissions(next);
  }, []);

  // Granular Reset operations
  const handleResetSection = useCallback((section: 'appearance' | 'map' | 'mortar' | 'language' | 'all' | 'userData' | 'factory' | 'visibility') => {
    if (section === 'appearance') {
      setSettings((prev) => StorageService.resetAppearance(prev));
    } else if (section === 'map') {
      setOverlays(StorageService.resetMapDisplay());
    } else if (section === 'mortar') {
      setSettings((prev) => StorageService.resetMortarDisplay(prev));
    } else if (section === 'language') {
      setSettings((prev) => StorageService.resetLanguage(prev));
    } else if (section === 'all') {
      setSettings(StorageService.resetAllSettings());
      setOverlays(StorageService.resetMapDisplay());
      setWeather(StorageService.loadWeather());
      setTunings({});
    } else if (section === 'userData') {
      const { markers, mortars, missions: cleared } = StorageService.clearUserData();
      setCustomMarkers(markers);
      setCustomMortars(mortars);
      setMissions(cleared);
    } else if (section === 'visibility') {
      setSettings((prev) => StorageService.resetVisibility(prev));
    } else if (section === 'factory') {
      StorageService.factoryReset();
      setSettings(StorageService.loadSettings());
      setOverlays(StorageService.loadOverlays());
      setWeather(StorageService.loadWeather());
      setCustomMarkers([]);
      setCustomMortars([]);
      setMissions([]);
      setTunings({});
      setAiSettings(StorageService.loadAi());
    }
  }, []);

  const handleQuickMapOnly = useCallback(() => {
    setSettings((prev) => StorageService.setMapOnly(prev));
  }, []);

  const handleQuickShowAll = useCallback(() => {
    setSettings((prev) => StorageService.setShowAll(prev));
  }, []);

  const handleQuickRestoreDefault = useCallback(() => {
    setSettings((prev) => StorageService.resetVisibility(prev));
  }, []);

  const handleFitMission = useCallback(() => {
    setFitMissionTrigger((v) => v + 1);
  }, []);

  const toggleLang = useCallback(() => {
    handleUpdateSettings({ language: settings.language === 'en' ? 'ar' : 'en' });
  }, [settings.language, handleUpdateSettings]);

  // Switch weapon and reset charge to Auto and ammo to default
  const handleSelectWeapon = useCallback((weapon: WeaponConfig) => {
    setSelectedWeapon(weapon);
    setSelectedCharge(-1);
    if (weapon.ammunition && weapon.ammunition.length > 0) {
      setSelectedAmmoId(weapon.ammunition[0].id);
    }
  }, []);

  // Switch terrain
  const handleSelectTerrain = (id: TerrainId) => {
    setActiveTerrainId(id);
    const newTerrain = TERRAINS[id];
    
    const gunInside = gunPos.x >= 0 && gunPos.x <= newTerrain.worldSize && gunPos.z >= 0 && gunPos.z <= newTerrain.worldSize;
    const targetInside = targetPos.x >= 0 && targetPos.x <= newTerrain.worldSize && targetPos.z >= 0 && targetPos.z <= newTerrain.worldSize;

    if (!gunInside || !targetInside) {
      setGunPos({
        x: newTerrain.defaultWeapon[0],
        z: newTerrain.defaultWeapon[1],
        alt: 50,
      });
      setTargetPos({
        x: newTerrain.defaultTarget[0],
        z: newTerrain.defaultTarget[1],
        alt: 60,
      });
      setTerrainNotice('Markers repositioned within new terrain bounds');
      setTimeout(() => setTerrainNotice(null), 3500);
    }

    if (id === 'kolguyev' && activeLayer === 'drawn') {
      setActiveLayer('topo');
    }
  };

  const handleDiagnosticsUpdate = useCallback((partial: Partial<TileDiagnostics>) => {
    setDiagnostics((prev) => ({ ...prev, ...partial }));
  }, []);

  // Ballistic solution calculation
  const solution = useMemo(() => {
    return calculateFiringSolution(selectedWeapon, gunPos, targetPos, selectedCharge, selectedAmmoId, tunings[selectedWeapon.id]);
  }, [selectedWeapon, gunPos, targetPos, selectedCharge, selectedAmmoId, tunings]);

  const activeAmmo = selectedWeapon.ammunition?.find((a) => a.id === selectedAmmoId) || selectedWeapon.ammunition?.[0];
  const activeCharges = activeAmmo ? activeAmmo.charges : selectedWeapon.charges;
  const tunedCharges = applyTuningToCharges(selectedWeapon, activeCharges, tunings[selectedWeapon.id]);
  const currentChargeObj = tunedCharges.find((c) => c.charge === solution.charge) || tunedCharges[0];
  const chargeMinRange = currentChargeObj?.minRange || 0;
  const chargeMaxRange = currentChargeObj?.maxRange || 0;

  // --- Fire mission log ---
  const handleSaveMission = useCallback(() => {
    if (!solution.inRange) return;
    const ammo = selectedWeapon.ammunition?.find((a) => a.id === selectedAmmoId) || selectedWeapon.ammunition?.[0];
    const ammoLabel = ammo ? `${ammo.name} (${ammo.weightKg}kg)` : solution.ammoType;
    const rec: FireMissionRecord = {
      id: `mission_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      terrainId: activeTerrainId,
      weaponId: selectedWeapon.id,
      weaponName: selectedWeapon.name,
      ammoId: ammo?.id,
      ammoLabel,
      ring: solution.charge,
      gun: { ...gunPos },
      target: { ...targetPos },
      azimuthMils: solution.azimuthMils,
      elevationMils: solution.elevationMils,
      rangeM: solution.horizontalDistance,
      tofS: solution.timeOfFlight,
      callout: buildFireMissionCallout({
        terrainName: currentTerrain.name,
        weapon: selectedWeapon,
        ammoLabel,
        solution,
        gunPos,
        targetPos,
      }),
    };
    saveMissions([rec, ...missions].slice(0, 100));
  }, [solution, selectedWeapon, selectedAmmoId, activeTerrainId, gunPos, targetPos, missions, currentTerrain, saveMissions]);

  const handleDeleteMission = useCallback((id: string) => {
    saveMissions(missions.filter((m) => m.id !== id));
  }, [missions, saveMissions]);

  const handleClearMissions = useCallback(() => {
    saveMissions([]);
  }, [saveMissions]);

  // Re-engage: load a saved mission back into the map and calculator
  const handleReengageMission = useCallback((m: FireMissionRecord) => {
    setActiveTerrainId(m.terrainId);
    const weapon = allWeapons.find((w) => w.id === m.weaponId);
    if (weapon) setSelectedWeapon(weapon);
    if (m.ammoId) setSelectedAmmoId(m.ammoId);
    setSelectedCharge(m.ring);
    setGunPos({ ...m.gun });
    setTargetPos({ ...m.target });
    setIsMissionLogOpen(false);
    setFitMissionTrigger((v) => v + 1);
  }, [allWeapons]);

  // Adjust fire: observer correction in the firing-line frame moves the target, solution updates
  const handleAdjustTarget = useCallback((addDropM: number, deflectionMils: number) => {
    setTargetPos((prev) => {
      const moved = offsetTarget(gunPos, prev, addDropM, deflectionMils, selectedWeapon.milsPerCircle);
      const max = currentTerrain.worldSize;
      return {
        x: Math.min(max, Math.max(0, moved.x)),
        z: Math.min(max, Math.max(0, moved.z)),
        alt: prev.alt,
      };
    });
  }, [gunPos, selectedWeapon, currentTerrain]);

  // Share-by-link: copy a URL that restores terrain/weapon/gun/target for a squadmate
  const handleCopyMissionLink = useCallback(() => {
    const hash = encodeMissionLink({
      terrainId: activeTerrainId,
      weaponId: selectedWeapon.id,
      ammoId: selectedAmmoId,
      ring: selectedCharge,
      gun: gunPos,
      target: targetPos,
    });
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    navigator.clipboard.writeText(url);
    window.history.replaceState(null, '', hash);
  }, [activeTerrainId, selectedWeapon, selectedAmmoId, selectedCharge, gunPos, targetPos]);

  // Open-via-link: apply a shared mission from the URL hash once on startup
  useEffect(() => {
    const shared = decodeMissionLink(window.location.hash);
    if (!shared) return;
    setActiveTerrainId(shared.terrainId);
    const weapon = allWeapons.find((w) => w.id === shared.weaponId);
    if (weapon) setSelectedWeapon(weapon);
    if (shared.ammoId) setSelectedAmmoId(shared.ammoId);
    if (shared.ring >= 0) setSelectedCharge(shared.ring);
    setGunPos(shared.gun);
    setTargetPos(shared.target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = useCallback(() => {
    setReloadTrigger((v) => v + 1);
  }, []);

  const [mobileTab, setMobileTab] = useState<'map' | 'calc'>('map');

  // Trigger custom marker modal with given coords
  const handleOpenMarkerModal = useCallback((coords: { x: number; z: number }) => {
    setMarkerModalCoords(coords);
    setIsMarkerModalOpen(true);
  }, []);

  // Theme styling classes
  const themeClass = settings.theme === 'night_ops'
    ? 'theme-night-ops'
    : settings.theme === 'forest_slate'
    ? 'theme-forest'
    : settings.theme === 'desert_camo'
    ? 'theme-desert'
    : settings.theme === 'high_contrast'
    ? 'theme-high-contrast'
    : 'theme-dark-tactical';

  const isAr = settings.language === 'ar';

  // Keep <html> language/direction in sync (screen readers, fonts, text selection)
  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  }, [settings.language, isAr]);

  return (
    <div 
      className={`flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans ${themeClass}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Header (Controlled by settings.visibility.showHeader) */}
      {settings.visibility.showHeader && (
        <Header
          terrains={TERRAINS}
          activeTerrainId={activeTerrainId}
          onSelectTerrain={handleSelectTerrain}
          solution={solution}
          selectedWeapon={selectedWeapon}
          lang={settings.language}
          visibility={settings.visibility}
        />
      )}

      {/* Mobile Mode Switcher Bar (< lg, Controlled by settings.visibility.showMobileTabs) */}
      {settings.visibility.showMobileTabs && (
        <div className="lg:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-3 py-1.5 shrink-0 z-20">
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setMobileTab('map')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all ${
                mobileTab === 'map'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'الخارطة التكتيكية' : 'Tactical Map'}
            </button>
            <button
              onClick={() => setMobileTab('calc')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all ${
                mobileTab === 'calc'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'الحاسبة والحل' : 'Calculator & Sol'}
            </button>
          </div>

          {/* Quick Solution Pill for Mobile */}
          {settings.visibility.showLiveSolutionPill && (
            <div 
              onClick={() => setMobileTab('calc')}
              className="flex items-center gap-2 cursor-pointer font-mono text-[11px] bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 hover:border-sky-500"
            >
              <span className="text-sky-400 font-bold">AZ: {solution.azimuthMils}</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">
                EL: {solution.elevationDeg !== null ? `${solution.elevationDeg.toFixed(1)}°` : '---'}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">Ring {solution.charge}</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Accessible Three-Dot Settings & Visibility Menu Button */}
      <ThreeDotMenu
        isOpen={isThreeDotOpen}
        onToggle={() => setIsThreeDotOpen((v) => !v)}
        onClose={() => setIsThreeDotOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onQuickMapOnly={handleQuickMapOnly}
        onQuickShowAll={handleQuickShowAll}
        onQuickRestoreDefault={handleQuickRestoreDefault}
        onOpenFullSettings={() => setIsSettingsOpen(true)}
        onToggleFcs={() => handleUpdateSettings({ fcsPanelOpen: !settings.fcsPanelOpen })}
        isFcsOpen={settings.fcsPanelOpen}
        onToggleWeather={() => handleUpdateSettings({ weatherPanelOpen: !settings.weatherPanelOpen })}
        isWeatherOpen={settings.weatherPanelOpen}
        onToggleRuler={() => setIsRulerActive((v) => !v)}
        isRulerActive={isRulerActive}
        onFitMission={handleFitMission}
        onToggleLang={toggleLang}
        onOpenMortarInfo={() => setIsMortarInfoOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenMissionLog={() => setIsMissionLogOpen(true)}
        missionsCount={missions.length}
        failedTiles={diagnostics.failedCount}
        overlays={overlays}
        onUpdateOverlays={handleUpdateOverlays}
        storageAllowed={storageConsent === 'granted'}
        onSetStorage={handleSetStorage}
        lang={settings.language}
      />

      {storageConsent === null && (
        <StorageConsentBanner lang={settings.language} onAllow={() => handleSetStorage(true)} onDeny={() => handleSetStorage(false)} />
      )}

      {/* Main Workspace Layout (Map-Only Primary Interface with Collapsible Sidebar) */}
      <div className={`flex-1 flex min-h-0 overflow-hidden relative ${
        settings.panelPosition === 'left' ? 'flex-col lg:flex-row-reverse' : 'flex-col lg:flex-row'
      }`}>
        {/* Tactical Map (Primary view - expands to 100% when FCS is closed) */}
        <div className={`flex-1 h-full relative ${mobileTab === 'calc' ? 'hidden lg:block' : 'block'}`}>
          <TacticalMap
            terrain={currentTerrain}
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
            gunPos={gunPos}
            targetPos={targetPos}
            onGunChange={setGunPos}
            onTargetChange={setTargetPos}
            chargeMinRange={chargeMinRange}
            chargeMaxRange={chargeMaxRange}
            inRange={solution.inRange}
            onDiagnosticsUpdate={handleDiagnosticsUpdate}
            reloadTrigger={reloadTrigger}
            onRetry={handleRetry}
            terrainNotice={terrainNotice}
            overlays={overlays}
            settings={settings}
            customMarkers={customMarkers}
            onAddCustomMarker={handleAddMarker}
            onDeleteCustomMarker={handleDeleteMarker}
            onOpenMarkerModal={handleOpenMarkerModal}
            weather={weather}
            onToggleWeather={() => handleUpdateSettings({ weatherPanelOpen: !settings.weatherPanelOpen })}
            onHideCompass={() => handleUpdateOverlays({ showCompass: false })}
            milsPerCircle={selectedWeapon.milsPerCircle}
            lang={settings.language}
            fitMissionTrigger={fitMissionTrigger}
          />

          {/* Floating Weather & Wind HUD Overlay (When enabled) */}
          {settings.weatherPanelOpen && (
            <div className="absolute top-16 right-3 sm:right-4 z-[1001] animate-in fade-in slide-in-from-top-2 duration-150">
              <WeatherWidget
                weather={weather}
                onChange={handleUpdateWeather}
                onClose={() => handleUpdateSettings({ weatherPanelOpen: false })}
                lang={settings.language}
              />
            </div>
          )}
        </div>

        {/* Fire Control Calculator Sidebar (Collapsible & Resizable on Desktop) */}
        {settings.fcsPanelOpen && (
          <div 
            style={{ width: `${settings.panelWidth}px` }}
            className={`w-full h-full shrink-0 z-10 shadow-2xl transition-all duration-200 ${
              mobileTab === 'map' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <FireControlPanel
              terrain={currentTerrain}
              weapons={allWeapons}
              selectedWeapon={selectedWeapon}
              onSelectWeapon={handleSelectWeapon}
              selectedAmmoId={selectedAmmoId}
              onSelectAmmo={setSelectedAmmoId}
              tuning={tunings[selectedWeapon.id]}
              aiSettings={aiSettings}
              weather={weather}
              selectedCharge={selectedCharge}
              onSelectCharge={setSelectedCharge}
              gunPos={gunPos}
              targetPos={targetPos}
              onGunChange={setGunPos}
              onTargetChange={setTargetPos}
              solution={solution}
              lang={settings.language}
              onAdjustTarget={handleAdjustTarget}
              onSaveMission={handleSaveMission}
              onCopyMissionLink={handleCopyMissionLink}
            />
          </div>
        )}
      </div>

      {/* Fire Mission Log Modal */}
      <MissionLogModal
        isOpen={isMissionLogOpen}
        onClose={() => setIsMissionLogOpen(false)}
        missions={missions}
        onReengage={handleReengageMission}
        onDelete={handleDeleteMission}
        onClearAll={handleClearMissions}
        lang={settings.language}
        terrainName={(id) => TERRAINS[id as TerrainId]?.name ?? id}
      />

      {/* Comprehensive Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        overlays={overlays}
        onUpdateOverlays={handleUpdateOverlays}
        weather={weather}
        onUpdateWeather={handleUpdateWeather}
        customMarkers={customMarkers}
        onAddMarker={handleAddMarker}
        onDeleteMarker={handleDeleteMarker}
        customMortars={customMortars}
        tunableWeapons={allWeapons}
        aiSettings={aiSettings}
        onUpdateAi={handleUpdateAi}
        tunings={tunings}
        onUpdateTuning={handleUpdateTuning}
        onAddMortar={handleAddMortar}
        onDeleteMortar={handleDeleteMortar}
        onImportBackup={handleImportBackup}
        onResetSection={handleResetSection}
        onQuickMapOnly={handleQuickMapOnly}
        onQuickShowAll={handleQuickShowAll}
        onQuickRestoreDefault={handleQuickRestoreDefault}
        onOpenMortarInfo={() => setIsMortarInfoOpen(true)}
      />

      {/* Custom Tactical Marker Modal */}
      <CustomMarkerModal
        isOpen={isMarkerModalOpen}
        onClose={() => setIsMarkerModalOpen(false)}
        onSave={handleAddMarker}
        defaultCoords={markerModalCoords}
        lang={settings.language}
      />

      {/* Developer Diagnostics Modal */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        diagnostics={diagnostics}
        terrain={currentTerrain}
        activeLayer={activeLayer}
        onRetry={handleRetry}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Comprehensive Mortar Information System Modal (Overlay without losing map state) */}
      {isMortarInfoOpen && (
        <div 
          className="fixed inset-0 z-[1060] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setIsMortarInfoOpen(false)}
        >
          <div 
            className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <MortarInformationSystem
              currentWeapon={selectedWeapon}
              onSelectWeapon={handleSelectWeapon}
              availableWeapons={allWeapons}
              lang={settings.language}
              onClose={() => setIsMortarInfoOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
