import { 
  AppCustomizationSettings, 
  InterfaceVisibilitySettings,
  MapOverlaySettings, 
  WeatherSettings, 
  CustomMapMarker, 
  CustomMortarConfig,
  AppExportData,
  WeaponTuning,
  WeaponTunings
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'arma_reforger_fcs_settings_v1',
  OVERLAYS: 'arma_reforger_fcs_overlays_v1',
  WEATHER: 'arma_reforger_fcs_weather_v1',
  MARKERS: 'arma_reforger_fcs_markers_v1',
  MORTARS: 'arma_reforger_fcs_mortars_v1',
  TUNING: 'arma_reforger_fcs_tuning_v1',
};

export const DEFAULT_VISIBILITY: InterfaceVisibilitySettings = {
  showHeader: false,
  showTerrainTabs: false,
  showMobileTabs: false,
  showLiveSolutionPill: false,
  showMapTypeSelector: false,
  showMarkerControls: false,
  showMapTools: false,
  showFcsButton: false,
  showSettingsButton: false,
  showZoomControls: false,
  showBottomCoordinatesHud: false,
  menuButtonPosition: 'top-right',
  menuButtonSize: 'md',
};

export const FULL_VISIBILITY: InterfaceVisibilitySettings = {
  showHeader: true,
  showTerrainTabs: true,
  showMobileTabs: true,
  showLiveSolutionPill: true,
  showMapTypeSelector: true,
  showMarkerControls: true,
  showMapTools: true,
  showFcsButton: true,
  showSettingsButton: true,
  showZoomControls: true,
  showBottomCoordinatesHud: true,
  menuButtonPosition: 'top-right',
  menuButtonSize: 'md',
};

export const DEFAULT_SETTINGS: AppCustomizationSettings = {
  theme: 'dark_tactical',
  layoutPreset: 'minimal_map',
  panelWidth: 420,
  panelPosition: 'right',
  panelOpacity: 95,
  textSize: 'md',
  iconSize: 'md',
  buttonSize: 'md',
  distanceUnit: 'meters',
  decimalPrecision: 1,
  elevationDisplayFormat: 'both',
  language: 'en',
  fcsPanelOpen: false, // Default is clean Map-Only view!
  weatherPanelOpen: false,
  rulerToolOpen: false,
  visibility: DEFAULT_VISIBILITY,
};

export const DEFAULT_OVERLAYS: MapOverlaySettings = {
  showGrid: true,
  show100mGrid: true,
  showCapitals: true,
  showTowns: true,
  showVillages: true,
  showHills: true,
  showLandmarks: true,
  showGunMarker: true,
  showTargetMarker: true,
  showTrajectoryLine: true,
  showRangeRings: true,
  showCustomMarkers: true,
  showCoordinatesHud: true,
  showDistanceCircles: true,
  showCompass: true,
  distanceCircleStep: 0,
  mapLabelLanguage: 'auto',
  labelSize: 'md',
  labelColor: '#38bdf8',
};

export const DEFAULT_WEATHER: WeatherSettings = {
  enabled: false,
  windSpeed: 5, // Supports flexible values (e.g. 5, 10, 15, 100) without artificial limit
  windUnit: 'm/s',
  windDirectionDeg: 0,
  dataSource: 'manual_observation',
  recordedAt: new Date().toISOString(),
  isAdvisoryOnly: true,
};

// Safe JSON parser helper
function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function safeSet<T>(key: string, value: T): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[FCS Storage] Failed writing key "${key}":`, err);
    return false;
  }
}


// ---------------------------------------------------------------------------
// Sanitizers: anything read from the browser (or imported from a file) is validated field by field,
// so edited / corrupted / old data can never crash the app. Bad fields fall back to the defaults.
// ---------------------------------------------------------------------------
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], d: T): T => (allowed.includes(v as T) ? (v as T) : d);
const num = (v: unknown, min: number, max: number, d: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d;
const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
const str = (v: unknown, d: string, max = 300): string => (typeof v === 'string' ? v.slice(0, max) : d);
const color = (v: unknown, d: string): string => (typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : d);
const SIZES = ['sm', 'md', 'lg'] as const;

export function sanitizeVisibility(raw: unknown): InterfaceVisibilitySettings {
  const r = isObj(raw) ? raw : {};
  const d = DEFAULT_VISIBILITY;
  const out = { ...d } as InterfaceVisibilitySettings;
  (Object.keys(d) as Array<keyof InterfaceVisibilitySettings>).forEach((k) => {
    if (typeof d[k] === 'boolean') (out as any)[k] = bool(r[k], d[k] as boolean);
  });
  out.menuButtonPosition = oneOf(r.menuButtonPosition, ['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const, d.menuButtonPosition);
  out.menuButtonSize = oneOf(r.menuButtonSize, SIZES, d.menuButtonSize);
  return out;
}

export function sanitizeSettings(raw: unknown, fallbackLang?: 'en' | 'ar'): AppCustomizationSettings {
  const r = isObj(raw) ? raw : {};
  const d = DEFAULT_SETTINGS;
  return {
    theme: oneOf(r.theme, ['dark_tactical', 'night_ops', 'forest_slate', 'desert_camo', 'high_contrast'] as const, d.theme),
    layoutPreset: oneOf(r.layoutPreset, ['minimal_map', 'compact', 'standard', 'info_rich', 'custom'] as const, d.layoutPreset),
    panelWidth: Math.round(num(r.panelWidth, 340, 560, d.panelWidth)),
    panelPosition: oneOf(r.panelPosition, ['right', 'left'] as const, d.panelPosition),
    panelOpacity: Math.round(num(r.panelOpacity, 60, 100, d.panelOpacity)),
    textSize: oneOf(r.textSize, SIZES, d.textSize),
    iconSize: oneOf(r.iconSize, SIZES, d.iconSize),
    buttonSize: oneOf(r.buttonSize, SIZES, d.buttonSize),
    distanceUnit: oneOf(r.distanceUnit, ['meters', 'kilometers'] as const, d.distanceUnit),
    decimalPrecision: Math.round(num(r.decimalPrecision, 0, 2, d.decimalPrecision)),
    elevationDisplayFormat: oneOf(r.elevationDisplayFormat, ['both', 'degrees_first', 'mils_first'] as const, d.elevationDisplayFormat),
    language: oneOf(r.language, ['en', 'ar'] as const, fallbackLang ?? d.language),
    fcsPanelOpen: bool(r.fcsPanelOpen, d.fcsPanelOpen),
    weatherPanelOpen: bool(r.weatherPanelOpen, d.weatherPanelOpen),
    rulerToolOpen: bool(r.rulerToolOpen, d.rulerToolOpen),
    visibility: sanitizeVisibility(r.visibility),
  };
}

export function sanitizeOverlays(raw: unknown): MapOverlaySettings {
  const r = isObj(raw) ? raw : {};
  const d = DEFAULT_OVERLAYS;
  const out = { ...d } as MapOverlaySettings;
  (Object.keys(d) as Array<keyof MapOverlaySettings>).forEach((k) => {
    if (typeof d[k] === 'boolean') (out as any)[k] = bool(r[k], d[k] as boolean);
  });
  out.labelSize = oneOf(r.labelSize, SIZES, d.labelSize);
  out.mapLabelLanguage = oneOf(r.mapLabelLanguage, ['auto', 'en', 'ar', 'both'] as const, 'auto');
  out.distanceCircleStep = [0, 100, 250, 500, 1000].includes(r.distanceCircleStep as number) ? (r.distanceCircleStep as number) : 0;
  out.labelColor = color(r.labelColor, d.labelColor);
  return out;
}

export function sanitizeWeather(raw: unknown): WeatherSettings {
  const r = isObj(raw) ? raw : {};
  const d = DEFAULT_WEATHER;
  return {
    enabled: bool(r.enabled, d.enabled),
    windSpeed: num(r.windSpeed, 0, 500, d.windSpeed),
    windUnit: oneOf(r.windUnit, ['m/s', 'km/h', 'knots', 'mph'] as const, d.windUnit),
    windDirectionDeg: ((num(r.windDirectionDeg, -3600, 3600, d.windDirectionDeg) % 360) + 360) % 360,
    dataSource: oneOf(r.dataSource, ['manual_observation', 'mission_briefing'] as const, d.dataSource),
    recordedAt: typeof r.recordedAt === 'string' ? r.recordedAt : d.recordedAt,
    isAdvisoryOnly: true,
  };
}

export function sanitizeMarkers(raw: unknown): CustomMapMarker[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomMapMarker[] = [];
  raw.forEach((m, i) => {
    if (!isObj(m) || typeof m.x !== 'number' || typeof m.z !== 'number' || !Number.isFinite(m.x) || !Number.isFinite(m.z)) return;
    out.push({
      id: str(m.id, `marker_${Date.now()}_${i}`, 80),
      name: str(m.name, 'Marker', 80),
      x: m.x,
      z: m.z,
      color: color(m.color, '#38bdf8'),
      category: oneOf(m.category, ['observation', 'enemy', 'friendly', 'objective', 'waypoint'] as const, 'waypoint'),
      notes: typeof m.notes === 'string' ? m.notes.slice(0, 500) : undefined,
      createdAt: typeof m.createdAt === 'number' ? m.createdAt : Date.now(),
    });
  });
  return out;
}

export function sanitizeMortars(raw: unknown): CustomMortarConfig[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomMortarConfig[] = [];
  raw.forEach((m, i) => {
    if (!isObj(m) || typeof m.name !== 'string' || !m.name.trim()) return;
    const mpc = m.milsPerCircle === 6000 ? 6000 : 6400;
    const min = Math.round(num(m.minElevation, 0, mpc / 4, mpc === 6000 ? 750 : 800));
    const max = Math.round(num(m.maxElevation, min + 1, mpc / 4, mpc === 6000 ? 1415 : 1515));
    out.push({
      ...(m as unknown as CustomMortarConfig),
      id: str(m.id, `mortar_${Date.now()}_${i}`, 80),
      name: str(m.name, 'Mortar', 80),
      shortName: str(m.shortName, str(m.name, 'Mortar', 20), 20),
      caliber: str(m.caliber, '', 40),
      milSystem: mpc === 6000 ? 'SOVIET' : 'NATO',
      milsPerCircle: mpc,
      minElevation: min,
      maxElevation: max,
      verificationStatus: str(m.verificationStatus, 'User defined'),
      sourceInfo: str(m.sourceInfo, ''),
      description: str(m.description, ''),
      isUserDefined: true,
    });
  });
  return out;
}

export const DEFAULT_TUNING: WeaponTuning = { rangeScalePct: 0, elevationOffsetMils: 0, minElevationLockDeg: 0 };

export function sanitizeTunings(raw: unknown): WeaponTunings {
  const out: WeaponTunings = {};
  if (!isObj(raw)) return out;
  Object.keys(raw).slice(0, 50).forEach((id) => {
    const v = raw[id];
    if (!isObj(v)) return;
    const t: WeaponTuning = {
      rangeScalePct: Math.round(num(v.rangeScalePct, -20, 20, 0) * 10) / 10,
      elevationOffsetMils: Math.round(num(v.elevationOffsetMils, -60, 60, 0)),
      minElevationLockDeg: v.minElevationLockDeg ? Math.round(num(v.minElevationLockDeg, 30, 80, 0) * 2) / 2 : 0,
    };
    if (t.rangeScalePct !== 0 || t.elevationOffsetMils !== 0 || t.minElevationLockDeg) out[str(id, id, 80)] = t;
  });
  return out;
}

function readJson(key: string): unknown {
  try {
    const storage = getStorage();
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch (err) {
    console.warn(`[FCS Storage] Failed reading key "${key}":`, err);
    return undefined;
  }
}

function detectLanguage(): 'en' | 'ar' {
  try {
    return typeof navigator !== 'undefined' && /^ar/i.test(navigator.language || '') ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

export const StorageService = {
  // Loaders
  loadSettings(): AppCustomizationSettings {
    const raw = readJson(STORAGE_KEYS.SETTINGS);
    // First visit: follow the browser language (Arabic browsers start in Arabic)
    return sanitizeSettings(raw, raw === undefined ? detectLanguage() : 'en');
  },

  loadOverlays(): MapOverlaySettings {
    return sanitizeOverlays(readJson(STORAGE_KEYS.OVERLAYS));
  },

  loadWeather(): WeatherSettings {
    return sanitizeWeather(readJson(STORAGE_KEYS.WEATHER));
  },

  loadMarkers(): CustomMapMarker[] {
    return sanitizeMarkers(readJson(STORAGE_KEYS.MARKERS));
  },

  loadCustomMortars(): CustomMortarConfig[] {
    return sanitizeMortars(readJson(STORAGE_KEYS.MORTARS));
  },

  loadTunings(): WeaponTunings {
    return sanitizeTunings(readJson(STORAGE_KEYS.TUNING));
  },

  // Savers
  saveSettings(settings: AppCustomizationSettings) {
    safeSet(STORAGE_KEYS.SETTINGS, settings);
  },

  saveOverlays(overlays: MapOverlaySettings) {
    safeSet(STORAGE_KEYS.OVERLAYS, overlays);
  },

  saveWeather(weather: WeatherSettings) {
    safeSet(STORAGE_KEYS.WEATHER, weather);
  },

  saveMarkers(markers: CustomMapMarker[]) {
    safeSet(STORAGE_KEYS.MARKERS, markers);
  },

  saveTunings(t: WeaponTunings) {
    safeSet(STORAGE_KEYS.TUNING, t);
  },

  saveCustomMortars(mortars: CustomMortarConfig[]) {
    safeSet(STORAGE_KEYS.MORTARS, mortars);
  },

  // Export to Portable JSON Backup
  exportBackupFile(
    settings: AppCustomizationSettings,
    overlaySettings: MapOverlaySettings,
    weatherSettings: WeatherSettings,
    customMarkers: CustomMapMarker[],
    customMortars: CustomMortarConfig[],
    weaponTunings: WeaponTunings = {}
  ) {
    const backup: AppExportData = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      app: 'Arma Reforger FCS',
      settings,
      overlaySettings,
      weatherSettings,
      customMarkers,
      customMortars,
      weaponTunings,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arma-reforger-fcs-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Validate and Import from JSON File
  validateAndParseImport(jsonString: string): AppExportData | null {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.app !== 'Arma Reforger FCS' && !parsed.schemaVersion) {
        // Tolerant check for legacy exports
        if (!parsed.settings && !parsed.customMarkers) return null;
      }
      return {
        schemaVersion: 1,
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        app: 'Arma Reforger FCS',
        settings: sanitizeSettings(parsed.settings),
        overlaySettings: sanitizeOverlays(parsed.overlaySettings),
        weatherSettings: sanitizeWeather(parsed.weatherSettings),
        customMarkers: sanitizeMarkers(parsed.customMarkers),
        customMortars: sanitizeMortars(parsed.customMortars),
        weaponTunings: sanitizeTunings(parsed.weaponTunings),
      };
    } catch {
      return null;
    }
  },

  // Granular Reset Operations
  resetAppearance(prev: AppCustomizationSettings): AppCustomizationSettings {
    const next: AppCustomizationSettings = {
      ...prev,
      theme: DEFAULT_SETTINGS.theme,
      layoutPreset: DEFAULT_SETTINGS.layoutPreset,
      panelWidth: DEFAULT_SETTINGS.panelWidth,
      panelPosition: DEFAULT_SETTINGS.panelPosition,
      panelOpacity: DEFAULT_SETTINGS.panelOpacity,
      textSize: DEFAULT_SETTINGS.textSize,
      iconSize: DEFAULT_SETTINGS.iconSize,
      buttonSize: DEFAULT_SETTINGS.buttonSize,
    };
    safeSet(STORAGE_KEYS.SETTINGS, next);
    return next;
  },

  resetVisibility(prev: AppCustomizationSettings): AppCustomizationSettings {
    const next: AppCustomizationSettings = {
      ...prev,
      visibility: { ...DEFAULT_VISIBILITY },
      fcsPanelOpen: false,
    };
    safeSet(STORAGE_KEYS.SETTINGS, next);
    return next;
  },

  setMapOnly(prev: AppCustomizationSettings): AppCustomizationSettings {
    const next: AppCustomizationSettings = {
      ...prev,
      layoutPreset: 'minimal_map',
      fcsPanelOpen: false,
      weatherPanelOpen: false,
      rulerToolOpen: false,
      visibility: {
        ...prev.visibility,
        showHeader: false,
        showTerrainTabs: false,
        showMobileTabs: false,
        showLiveSolutionPill: false,
        showMapTypeSelector: false,
        showMarkerControls: false,
        showMapTools: false,
        showFcsButton: false,
        showSettingsButton: false,
        showZoomControls: false,
        showBottomCoordinatesHud: false,
      },
    };
    safeSet(STORAGE_KEYS.SETTINGS, next);
    return next;
  },

  setShowAll(prev: AppCustomizationSettings): AppCustomizationSettings {
    const next: AppCustomizationSettings = {
      ...prev,
      layoutPreset: 'standard',
      fcsPanelOpen: true,
      visibility: {
        ...FULL_VISIBILITY,
        menuButtonPosition: prev.visibility.menuButtonPosition,
        menuButtonSize: prev.visibility.menuButtonSize,
      },
    };
    safeSet(STORAGE_KEYS.SETTINGS, next);
    return next;
  },

  resetMapDisplay(): MapOverlaySettings {
    safeSet(STORAGE_KEYS.OVERLAYS, DEFAULT_OVERLAYS);
    return { ...DEFAULT_OVERLAYS };
  },

  resetMortarDisplay(prev: AppCustomizationSettings): AppCustomizationSettings {
    const next: AppCustomizationSettings = {
      ...prev,
      decimalPrecision: DEFAULT_SETTINGS.decimalPrecision,
      elevationDisplayFormat: DEFAULT_SETTINGS.elevationDisplayFormat,
    };
    safeSet(STORAGE_KEYS.SETTINGS, next);
    return next;
  },

  resetLanguage(prev: AppCustomizationSettings): AppCustomizationSettings {
    const next: AppCustomizationSettings = {
      ...prev,
      language: DEFAULT_SETTINGS.language,
    };
    safeSet(STORAGE_KEYS.SETTINGS, next);
    return next;
  },

  resetAllSettings(): AppCustomizationSettings {
    safeSet(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    safeSet(STORAGE_KEYS.OVERLAYS, DEFAULT_OVERLAYS);
    safeSet(STORAGE_KEYS.WEATHER, DEFAULT_WEATHER);
    safeSet(STORAGE_KEYS.TUNING, {});
    return { ...DEFAULT_SETTINGS };
  },

  clearUserData(): { markers: CustomMapMarker[]; mortars: CustomMortarConfig[] } {
    safeSet(STORAGE_KEYS.MARKERS, []);
    safeSet(STORAGE_KEYS.MORTARS, []);
    return { markers: [], mortars: [] };
  },

  factoryReset() {
    try {
      const storage = getStorage();
      if (!storage) return;
      storage.removeItem(STORAGE_KEYS.SETTINGS);
      storage.removeItem(STORAGE_KEYS.OVERLAYS);
      storage.removeItem(STORAGE_KEYS.WEATHER);
      storage.removeItem(STORAGE_KEYS.MARKERS);
      storage.removeItem(STORAGE_KEYS.MORTARS);
      storage.removeItem(STORAGE_KEYS.TUNING);
    } catch (err) {
      console.warn('Factory reset localStorage error:', err);
    }
  },
};
