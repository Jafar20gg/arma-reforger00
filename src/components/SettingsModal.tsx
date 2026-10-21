import React, { useState } from 'react';
import { 
  AppCustomizationSettings, 
  MapOverlaySettings, 
  WeatherSettings, 
  CustomMapMarker, 
  CustomMortarConfig, 
  WeaponConfig,
  WeaponTuning,
  WeaponTunings,
  AiSettings,
  AppTheme, 
  LayoutPreset,
  DistanceUnit,
  ElevationDisplayFormat,
  TextSize
} from '../types';
import { StorageService } from '../services/storageService';
import { TRANSLATIONS } from '../locales/translations';
import { 
  X, 
  Settings, 
  Sliders, 
  Map, 
  Type, 
  MapPin, 
  Crosshair, 
  Wind, 
  Ruler, 
  Languages, 
  Layout, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Calculator,
  ChevronLeft,
  ChevronRight,
  Trash2, 
  Plus, 
  Copy, 
  AlertTriangle,
  Info,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { InfoTip } from './InfoTip';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppCustomizationSettings;
  onUpdateSettings: (updated: Partial<AppCustomizationSettings>) => void;
  overlays: MapOverlaySettings;
  onUpdateOverlays: (updated: Partial<MapOverlaySettings>) => void;
  weather: WeatherSettings;
  onUpdateWeather: (updated: Partial<WeatherSettings>) => void;
  customMarkers: CustomMapMarker[];
  onAddMarker: (marker: CustomMapMarker) => void;
  onDeleteMarker: (id: string) => void;
  customMortars: CustomMortarConfig[];
  tunableWeapons: WeaponConfig[];
  aiSettings: AiSettings;
  onUpdateAi: (patch: Partial<AiSettings>) => void;
  tunings: WeaponTunings;
  onUpdateTuning: (weaponId: string, tuning: WeaponTuning | null) => void;
  onAddMortar: (mortar: CustomMortarConfig) => void;
  onDeleteMortar: (id: string) => void;
  onImportBackup: (importedData: any) => void;
  onResetSection: (section: 'appearance' | 'map' | 'mortar' | 'language' | 'all' | 'userData' | 'factory' | 'visibility') => void;
  onQuickMapOnly?: () => void;
  onQuickShowAll?: () => void;
  onQuickRestoreDefault?: () => void;
  onOpenMortarInfo?: () => void;
}

/** Touch-friendly number input with big -/+ buttons (works on phones). */
const Stepper: React.FC<{ label: string; value: number; step: number; min: number; max: number; onChange: (v: number) => void }> = ({ label, value, step, min, max, onChange }) => {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 10) / 10));
  return (
    <div className="flex items-center justify-between gap-2" dir="ltr">
      <span className="text-[13px] text-slate-400 min-w-[84px]" dir="auto">{label}</span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onChange(clamp(value - step))} className="stepper-btn w-10 h-10 rounded bg-slate-800 text-white text-lg font-bold">−</button>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(parseFloat(e.target.value) || 0))}
          className="w-20 h-10 text-center bg-slate-900 border border-slate-700 rounded text-slate-100"
        />
        <button type="button" onClick={() => onChange(clamp(value + step))} className="stepper-btn w-10 h-10 rounded bg-slate-800 text-white text-lg font-bold">+</button>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  overlays,
  onUpdateOverlays,
  weather,
  onUpdateWeather,
  customMarkers,
  onAddMarker,
  onDeleteMarker,
  customMortars,
  tunableWeapons,
  aiSettings,
  onUpdateAi,
  tunings,
  onUpdateTuning,
  onAddMortar,
  onDeleteMortar,
  onImportBackup,
  onResetSection,
  onQuickMapOnly,
  onQuickShowAll,
  onQuickRestoreDefault,
  onOpenMortarInfo,
}) => {
  const t = TRANSLATIONS[settings.language];
  const isAr = settings.language === 'ar';

  const [section, setSection] = useState<string | null>(null);
  const SECTION_GROUPS = [
    { id: 'interface', title: isAr ? 'الواجهة' : 'Interface', items: [
      { key: 'general', label: isAr ? 'عام' : 'General', Icon: Settings },
      { key: 'interfaceVisibility', label: isAr ? 'إظهار وإخفاء العناصر' : 'Show / Hide Elements', Icon: Eye },
      { key: 'interfaceLayout', label: isAr ? 'التخطيط والقوائم' : 'Layout & Menus', Icon: Layout },
      { key: 'language', label: isAr ? 'اللغة' : 'Language', Icon: Languages },
    ] },
    { id: 'map', title: isAr ? 'الخريطة' : 'Map', items: [
      { key: 'mapAppearance', label: isAr ? 'مظهر الخريطة' : 'Map Appearance', Icon: Map },
      { key: 'mapLabels', label: isAr ? 'نصوص الخريطة' : 'Map Labels', Icon: Type },
      { key: 'markers', label: isAr ? 'العلامات والمواقع' : 'Markers', Icon: MapPin },
    ] },
    { id: 'mortar', title: isAr ? 'الهاون والحساب' : 'Mortar & Calculation', items: [
      { key: 'mortars', label: isAr ? 'الهاونات' : 'Mortars', Icon: Crosshair },
      { key: 'calculator', label: isAr ? 'الحاسبة' : 'Calculator', Icon: Calculator },
      { key: 'measurementUnits', label: isAr ? 'وحدات القياس' : 'Units', Icon: Ruler },
      { key: 'weather', label: isAr ? 'الطقس والرياح' : 'Weather & Wind', Icon: Wind },
    ] },
    { id: 'data', title: isAr ? 'البيانات' : 'Data', items: [
      { key: 'storagePrivacy', label: isAr ? 'التخزين والخصوصية' : 'Storage & Privacy', Icon: Database },
      { key: 'importExport', label: isAr ? 'استيراد وتصدير' : 'Import & Export', Icon: Download },
      { key: 'resetRecovery', label: isAr ? 'إعادة الضبط' : 'Reset', Icon: RotateCcw },
    ] },
  ];
  const activeKey = section ?? 'general';

  // State for adding custom mortar record
  const [newMortarName, setNewMortarName] = useState('');
  const [newMortarCaliber, setNewMortarCaliber] = useState('81 mm');
  const [newMortarMils, setNewMortarMils] = useState<6400 | 6000>(6400);
  const [newMortarMinElev, setNewMortarMinElev] = useState(800);
  const [newMortarMaxElev, setNewMortarMaxElev] = useState(1515);

  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExport = () => {
    StorageService.exportBackupFile(
      settings,
      overlays,
      weather,
      customMarkers,
      customMortars,
      tunings
    );
    notify(t.storage.exportSuccess);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = StorageService.validateAndParseImport(content);
      if (parsed) {
        onImportBackup(parsed);
        notify(t.storage.importSuccess);
      } else {
        alert(t.storage.importError);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateMortar = () => {
    if (!newMortarName.trim()) return;
    const degPerMil = 360 / newMortarMils;
    const minDeg = Math.round(((newMortarMinElev * degPerMil) * 10)) / 10;
    const maxDeg = Math.round(((newMortarMaxElev * degPerMil) * 10)) / 10;

    const custom: CustomMortarConfig = {
      id: `custom_${Date.now()}`,
      name: newMortarName.trim(),
      shortName: newMortarName.trim().slice(0, 8),
      caliber: newMortarCaliber.trim(),
      milSystem: newMortarMils === 6000 ? 'SOVIET' : 'NATO',
      milsPerCircle: newMortarMils,
      minElevation: newMortarMinElev,
      maxElevation: newMortarMaxElev,
      minElevationDeg: minDeg,
      maxElevationDeg: maxDeg,
      verificationStatus: 'User-Defined Configuration Profile',
      sourceInfo: 'Manual user custom configuration entry',
      description: `Custom ${newMortarCaliber} mortar system profile with ${newMortarMils} mil circular division.`,
      isUserDefined: true,
    };

    onAddMortar(custom);
    setNewMortarName('');
    notify(isAr ? 'تمت إضافة سجل الهاون المخصص بنجاح' : 'Custom mortar profile added successfully');
  };

  const handlePresetSelect = (preset: LayoutPreset) => {
    let panelWidth = 420;
    let fcsPanelOpen = true;

    if (preset === 'minimal_map') {
      fcsPanelOpen = false;
      panelWidth = 360;
    } else if (preset === 'compact') {
      panelWidth = 360;
      fcsPanelOpen = true;
    } else if (preset === 'standard') {
      panelWidth = 420;
      fcsPanelOpen = true;
    } else if (preset === 'info_rich') {
      panelWidth = 500;
      fcsPanelOpen = true;
    }

    onUpdateSettings({
      layoutPreset: preset,
      panelWidth,
      fcsPanelOpen,
    });
    notify(isAr ? `تم تطبيق المظهر المسبق: ${preset}` : `Applied layout preset: ${preset}`);
  };

  // NOTE: must stay after every hook above (an early return before hooks crashes React when the modal opens)
  if (!isOpen) return null;

  return (
    <div className="settings-overlay fixed inset-0 z-[2100] bg-slate-950/80 backdrop-blur-sm flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="settings-modal bg-slate-900 sm:border border-slate-700/80 sm:rounded-2xl shadow-2xl flex flex-col w-full max-w-none sm:max-w-3xl h-full sm:h-auto sm:max-h-[92vh] overflow-hidden text-slate-200"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="settings-header p-3 sm:p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase font-mono tracking-wide">
                {t.settingsTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr ? 'تخصيص كامل للواجهة، طبقات الخريطة، مواصفات الهاون والبيانات' : 'Complete control over UI, map layers, mortar records & storage'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="settings-close p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Temporary Notification Banner */}
        {notification && (
          <div className="bg-emerald-950/90 border-b border-emerald-500 text-emerald-300 px-4 py-2 text-[13px] font-mono flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Section navigation + content */}
        <div className="flex flex-1 min-h-0">
          {/* Desktop sidebar */}
          <nav className="hidden sm:block w-56 shrink-0 overflow-y-auto border-e border-slate-800 bg-slate-950/60 p-2 space-y-4">
            {SECTION_GROUPS.map((g) => (
              <div key={g.id}>
                <div className="px-3 pb-1 text-[13px] font-bold uppercase tracking-wider text-slate-500">{g.title}</div>
                {g.items.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSection(key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-start transition-colors ${
                      activeKey === key ? 'bg-sky-500/15 text-sky-300 font-bold ring-1 ring-sky-500/40' : 'text-slate-300 hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="flex-1 min-w-0 flex flex-col">
            {/* Mobile: big section list (home) */}
            {section === null && (
              <div className="sm:hidden flex-1 overflow-y-auto overscroll-contain p-3 space-y-5">
                {SECTION_GROUPS.map((g) => (
                  <div key={g.id} className="space-y-2">
                    <div className="px-1 text-sm font-bold text-slate-400">{g.title}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {g.items.map(({ key, label, Icon }) => (
                        <button
                          key={key}
                          onClick={() => setSection(key)}
                          className="flex flex-col items-center justify-center gap-2 min-h-[88px] p-3 rounded-xl bg-slate-950/60 border border-slate-800 active:bg-slate-800 text-slate-200 text-sm font-bold text-center"
                        >
                          <Icon className="w-6 h-6 text-sky-400" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Section content */}
            <div className={`settings-body flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-4 text-sm ${section === null ? 'hidden sm:block' : 'block'}`}>
              {section !== null && (
                <button
                  onClick={() => setSection(null)}
                  className="sm:hidden flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800 text-slate-200 font-bold text-sm"
                >
                  {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  <span>{isAr ? 'كل الأقسام' : 'All sections'}</span>
                </button>
              )}

              <div className="flex items-center gap-1 text-slate-400 text-[13px]">
                <span>{isAr ? 'اضغط على علامة ⓘ لشرح أي ميزة' : 'Tap the ⓘ icon to learn what any feature does'}</span>
                <InfoTip id={`sec_${activeKey}`} isAr={isAr} />
              </div>

          {activeKey === 'general' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center justify-between font-bold text-white text-base">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-sky-400" />
                <span>{t.settingsCategories.general}</span>
              </div>
            </div>

            {(
              <div className="p-4 space-y-4 border-t border-slate-800/80">
                <div>
                  <label className="text-[13px] font-bold text-slate-400 block mb-1.5 uppercase">
                    {isAr ? 'أنماط التخطيط السريعة (Layout Presets)' : 'Layout Presets'}<InfoTip id="layoutPresets" isAr={isAr} />
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['minimal_map', 'compact', 'standard', 'info_rich'] as LayoutPreset[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePresetSelect(p)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          settings.layoutPreset === p
                            ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="capitalize block text-[13px]">{({ minimal_map: isAr ? 'خريطة فقط' : 'Minimal map', compact: isAr ? 'مضغوط' : 'Compact', standard: isAr ? 'قياسي' : 'Standard', info_rich: isAr ? 'غني بالمعلومات' : 'Info rich' } as Record<string, string>)[p] || p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-850">
                  <div>
                    <label className="text-[13px] font-bold text-slate-400 block mb-1 uppercase">
                      {isAr ? 'حجم الخط والنصوص' : 'UI Text Size'}<InfoTip id="textSize" isAr={isAr} />
                    </label>
                    <div className="flex gap-2">
                      {(['sm', 'md', 'lg'] as TextSize[]).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => onUpdateSettings({ textSize: sz })}
                          className={`flex-1 py-1.5 rounded border text-center uppercase font-bold text-[13px] ${
                            settings.textSize === sz
                              ? 'bg-sky-500 text-slate-950 border-sky-400'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 block mb-1 uppercase">
                      {isAr ? 'عرض لوحة التحكم (بالبكسل)' : 'Panel Width (px)'}<InfoTip id="panelWidth" isAr={isAr} />
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="340"
                        max="560"
                        step="10"
                        value={settings.panelWidth}
                        onChange={(e) => onUpdateSettings({ panelWidth: parseInt(e.target.value, 10) })}
                        className="flex-1 accent-sky-500 cursor-pointer"
                      />
                      <span className="w-12 text-center font-bold text-sky-400">{settings.panelWidth}px</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {activeKey === 'interfaceVisibility' && (
          <div className="border border-sky-500/40 rounded-xl overflow-hidden bg-slate-950/60 shadow-lg">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center justify-between font-bold text-white text-base">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span className="text-sky-300 font-bold">{t.settingsCategories.interfaceVisibility}</span>
              </div>
            </div>

            {(
              <div className="p-4 space-y-4 border-t border-slate-800/80">
                <p className="text-[13px] text-slate-400">
                  {t.visibility.description}
                </p>

                {/* Quick Presets */}
                <div>
                  <label className="text-[13px] font-bold text-slate-400 block mb-2 uppercase">
                    {t.visibility.quickActions}<InfoTip id="quickDisplay" isAr={isAr} />
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => {
                        if (onQuickMapOnly) {
                          onQuickMapOnly();
                        } else {
                          onUpdateSettings(StorageService.setMapOnly(settings));
                        }
                        notify(t.visibility.mapOnly);
                      }}
                      className="p-2.5 rounded-lg border border-sky-500/30 bg-sky-950/40 hover:bg-sky-900/50 text-left flex flex-col justify-between transition-all"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-sky-300 text-[13px] mb-1">
                        <EyeOff className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{t.visibility.mapOnly}</span>
                      </div>
                      <span className="text-xs text-slate-400">100% Full Map</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onQuickMapOnly) {
                          onQuickMapOnly();
                        } else {
                          onUpdateSettings(StorageService.setMapOnly(settings));
                        }
                        notify(t.visibility.hideAll);
                      }}
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-left flex flex-col justify-between transition-all"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[13px] mb-1">
                        <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t.visibility.hideAll}</span>
                      </div>
                      <span className="text-xs text-slate-400">Hide Optional Bars</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onQuickShowAll) {
                          onQuickShowAll();
                        } else {
                          onUpdateSettings(StorageService.setShowAll(settings));
                        }
                        notify(t.visibility.showAll);
                      }}
                      className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/50 text-left flex flex-col justify-between transition-all"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-[13px] mb-1">
                        <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{t.visibility.showAll}</span>
                      </div>
                      <span className="text-xs text-slate-400">All Elements & Panels</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onQuickRestoreDefault) {
                          onQuickRestoreDefault();
                        } else {
                          onUpdateSettings(StorageService.resetVisibility(settings));
                        }
                        notify(t.visibility.restoreDefaults);
                      }}
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-left flex flex-col justify-between transition-all"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-300 text-[13px] mb-1">
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t.visibility.restoreDefaults}</span>
                      </div>
                      <span className="text-xs text-slate-400">Map-Only Default</span>
                    </button>
                  </div>
                </div>

                {/* Individual Component Toggles */}
                <div className="border-t border-slate-800/80 pt-3">
                  <label className="text-[13px] font-bold text-slate-400 block mb-2 uppercase">
                    {t.visibility.componentsTitle}<InfoTip id="visComponents" isAr={isAr} />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'showHeader', label: t.visibility.showHeader },
                      { key: 'showTerrainTabs', label: t.visibility.showTerrainTabs },
                      { key: 'showMobileTabs', label: t.visibility.showMobileTabs },
                      { key: 'showLiveSolutionPill', label: t.visibility.showLiveSolutionPill },
                      { key: 'showMapTypeSelector', label: t.visibility.showMapTypeSelector },
                      { key: 'showMarkerControls', label: t.visibility.showMarkerControls },
                      { key: 'showMapTools', label: t.visibility.showMapTools },
                      { key: 'showFcsButton', label: t.visibility.showFcsButton },
                      { key: 'showSettingsButton', label: t.visibility.showSettingsButton },
                      { key: 'showZoomControls', label: t.visibility.showZoomControls },
                      { key: 'showBottomCoordinatesHud', label: t.visibility.showBottomCoordinatesHud },
                    ].map((item) => {
                      const isChecked = !!(settings.visibility as any)[item.key];
                      return (
                        <div
                          key={item.key}
                          onClick={() => {
                            onUpdateSettings({
                              visibility: {
                                ...settings.visibility,
                                [item.key]: !isChecked,
                              },
                            });
                          }}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-850 border border-slate-800 cursor-pointer transition-colors"
                        >
                          <span className="text-[13px] text-slate-300 select-none">
                            {item.label}
                          </span>
                          <div
                            className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${
                              isChecked ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'
                            }`}
                          >
                            <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Three-Dot Menu Button Position & Size Customization */}
                <div className="border-t border-slate-800/80 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[13px] font-bold text-slate-400 block mb-1.5 uppercase">
                        {t.visibility.menuPosition}<InfoTip id="menuPosition" isAr={isAr} />
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 text-[13px]">
                        {[
                          { id: 'top-right', label: isAr ? 'أعلى اليمين' : 'Top Right' },
                          { id: 'top-left', label: isAr ? 'أعلى اليسار' : 'Top Left' },
                          { id: 'bottom-right', label: isAr ? 'أسفل اليمين' : 'Bottom Right' },
                          { id: 'bottom-left', label: isAr ? 'أسفل اليسار' : 'Bottom Left' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              onUpdateSettings({
                                visibility: {
                                  ...settings.visibility,
                                  menuButtonPosition: p.id as any,
                                },
                              });
                            }}
                            className={`p-2 rounded border text-[13px] font-semibold ${
                              settings.visibility.menuButtonPosition === p.id
                                ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[13px] font-bold text-slate-400 block mb-1.5 uppercase">
                        {t.visibility.menuSize}<InfoTip id="menuSize" isAr={isAr} />
                      </label>
                      <div className="flex gap-2">
                        {[
                          { id: 'sm', label: isAr ? 'صغير' : 'Small' },
                          { id: 'md', label: isAr ? 'متوسط' : 'Medium' },
                          { id: 'lg', label: isAr ? 'كبير' : 'Large' },
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              onUpdateSettings({
                                visibility: {
                                  ...settings.visibility,
                                  menuButtonSize: s.id as any,
                                },
                              });
                            }}
                            className={`flex-1 py-2 rounded border text-[13px] font-semibold ${
                              settings.visibility.menuButtonSize === s.id
                                ? 'bg-sky-500 text-slate-950 font-bold border-sky-400'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {activeKey === 'interfaceLayout' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center justify-between font-bold text-white text-base">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-purple-400" />
                <span>{t.settingsCategories.interfaceLayout}</span>
              </div>
            </div>

            {(
              <div className="p-4 space-y-3 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[13px] font-bold text-slate-400 block mb-1 uppercase">
                      {isAr ? 'موقع لوحة الحاسبة (FCS)' : 'FCS Panel Docking'}<InfoTip id="fcsDock" isAr={isAr} />
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onUpdateSettings({ panelPosition: 'left' })}
                        className={`flex-1 py-1.5 rounded border text-[13px] font-bold ${
                          settings.panelPosition === 'left'
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {isAr ? 'اليسار' : 'Left'}
                      </button>
                      <button
                        onClick={() => onUpdateSettings({ panelPosition: 'right' })}
                        className={`flex-1 py-1.5 rounded border text-[13px] font-bold ${
                          settings.panelPosition === 'right'
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {isAr ? 'اليمين' : 'Right'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 block mb-1 uppercase">
                      {isAr ? 'شفافية اللوحات' : 'Panel Opacity'}<InfoTip id="panelOpacity" isAr={isAr} />
                    </label>
                    <div className="flex gap-2">
                      {[80, 90, 95, 100].map((op) => (
                        <button
                          key={op}
                          onClick={() => onUpdateSettings({ panelOpacity: op })}
                          className={`flex-1 py-1.5 rounded border text-[13px] font-bold ${
                            settings.panelOpacity === op
                              ? 'bg-purple-600 text-white border-purple-400'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {op}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {activeKey === 'language' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center justify-between font-bold text-white text-base">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-sky-400" />
                <span>{t.settingsCategories.language}</span>
                <span className="text-xs bg-slate-800 text-sky-300 px-1.5 py-0.2 rounded border border-slate-700">
                  {settings.language === 'ar' ? 'العربية' : 'English'}
                </span>
              </div>
            </div>

            {(
              <div className="p-4 space-y-3 border-t border-slate-800/80">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onUpdateSettings({ language: 'en' })}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      settings.language === 'en'
                        ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">English (US)</div>
                      <div className="text-xs opacity-75">Left-to-Right (LTR)</div>
                    </div>
                    {settings.language === 'en' && <Check className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => onUpdateSettings({ language: 'ar' })}
                    className={`p-3 rounded-xl border text-right flex items-center justify-between transition-all ${
                      settings.language === 'ar'
                        ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">العربية (Arabic)</div>
                      <div className="text-xs opacity-75">من اليمين لليسار (RTL)</div>
                    </div>
                    {settings.language === 'ar' && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

          {activeKey === 'mapAppearance' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center justify-between font-bold text-white text-base">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-emerald-400" />
                <span>{t.settingsCategories.mapAppearance}</span>
              </div>
            </div>

            {(
              <div className="p-4 space-y-4 border-t border-slate-800/80">
                <div>
                  <label className="text-[13px] font-bold text-slate-400 block mb-1.5 uppercase">
                    {isAr ? 'سمة الواجهة والمظهر (Theme)' : 'Color Theme'}<InfoTip id="theme" isAr={isAr} />
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'dark_tactical', label: isAr ? 'تكتيكي داكن' : 'Dark Tactical' },
                      { id: 'night_ops', label: isAr ? 'عمليات ليلية (OLED)' : 'Night Ops (OLED)' },
                      { id: 'forest_slate', label: isAr ? 'غابة' : 'Forest Woodland' },
                      { id: 'desert_camo', label: isAr ? 'صحراء' : 'Desert Camo' },
                      { id: 'high_contrast', label: isAr ? 'تباين عالٍ' : 'High Contrast' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        onClick={() => onUpdateSettings({ theme: th.id as AppTheme })}
                        className={`p-2 rounded border text-left text-[13px] transition-all ${
                          settings.theme === th.id
                            ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-850">
                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'عرض شبكة 1 كم الرئيسية' : '1 km Major Tactical Grid'}<InfoTip id="grid1km" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showGrid}
                      onChange={(e) => onUpdateOverlays({ showGrid: e.target.checked })}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'عرض شبكة 100 م الدقيقة' : '100m Minor Tactical Grid'}<InfoTip id="grid100m" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.show100mGrid}
                      onChange={(e) => onUpdateOverlays({ show100mGrid: e.target.checked })}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
          )}

          {activeKey === 'mapLabels' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center justify-between font-bold text-white text-base">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-sky-400" />
                <span>{t.settingsCategories.mapLabels}</span>
              </div>
            </div>

            {(
              <div className="p-4 space-y-3 border-t border-slate-800/80">
                <p className="text-[13px] text-slate-400 mb-2">
                  {isAr 
                    ? 'التحكم المستقل في إظهار أو إخفاء تسميات المواقع، المدن، القرى، والتلال دون التأثير على طبقات الخريطة الأساسية.'
                    : 'Independent visibility controls for geographic place names, towns, villages, and elevation landmarks.'}
                </p>

                <label className="flex items-center justify-between gap-3 p-2 rounded bg-slate-900 border border-slate-800">
                  <span>{isAr ? 'لغة أسماء الخريطة' : 'Map place-name language'}<InfoTip id="labelLang" isAr={isAr} /></span>
                  <select
                    value={overlays.mapLabelLanguage}
                    onChange={(e) => onUpdateOverlays({ mapLabelLanguage: e.target.value as MapOverlaySettings['mapLabelLanguage'] })}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[13px] text-slate-200"
                  >
                    <option value="auto">{isAr ? 'تلقائي (لغة الواجهة)' : 'Auto (UI language)'}</option>
                    <option value="en">English</option>
                    <option value="ar">{isAr ? 'عربي (بنطق إنجليزي)' : 'Arabic spelling'}</option>
                    <option value="both">{isAr ? 'الاثنين معاً' : 'Both'}</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'العواصم والمدن الكبرى' : 'Capitals'}<InfoTip id="capitals" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showCapitals}
                      onChange={(e) => onUpdateOverlays({ showCapitals: e.target.checked })}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'البلدات' : 'Towns'}<InfoTip id="towns" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showTowns}
                      onChange={(e) => onUpdateOverlays({ showTowns: e.target.checked })}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'القرى والمزارع' : 'Villages'}<InfoTip id="villages" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showVillages}
                      onChange={(e) => onUpdateOverlays({ showVillages: e.target.checked })}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'التلال والارتفاعات' : 'Hills / Elevations'}<InfoTip id="hills" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showHills}
                      onChange={(e) => onUpdateOverlays({ showHills: e.target.checked })}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'المعالم العسكرية والمنشآت' : 'Military Landmarks'}<InfoTip id="military" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showLandmarks}
                      onChange={(e) => onUpdateOverlays({ showLandmarks: e.target.checked })}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
          )}

          {activeKey === 'markers' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center justify-between font-bold text-white text-base">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>{t.settingsCategories.markers}</span>
                <span className="text-xs bg-rose-950 text-rose-300 px-1.5 py-0.2 rounded border border-rose-800">
                  {customMarkers.length} {isAr ? 'علامات' : 'Custom'}
                </span>
              </div>
            </div>

            {(
              <div className="p-4 space-y-4 border-t border-slate-800/80">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'مربض الهاون' : 'Gun Position'}<InfoTip id="gunPos" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showGunMarker}
                      onChange={(e) => onUpdateOverlays({ showGunMarker: e.target.checked })}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'موقع الهدف' : 'Target Marker'}<InfoTip id="targetMarker" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showTargetMarker}
                      onChange={(e) => onUpdateOverlays({ showTargetMarker: e.target.checked })}
                      className="w-4 h-4 accent-rose-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'خط المسار الباليستي' : 'Trajectory Line'}<InfoTip id="trajectory" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showTrajectoryLine}
                      onChange={(e) => onUpdateOverlays({ showTrajectoryLine: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'دوائر المدى (Rings)' : 'Range Rings'}<InfoTip id="rangeRings" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showRangeRings}
                      onChange={(e) => onUpdateOverlays({ showRangeRings: e.target.checked })}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'دوائر المسافة حول الهاون' : 'Distance circles around the gun'}<InfoTip id="distCircles" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showDistanceCircles}
                      onChange={(e) => onUpdateOverlays({ showDistanceCircles: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span>{isAr ? 'الفاصل بين الدوائر' : 'Circle spacing'}<InfoTip id="circleStep" isAr={isAr} /></span>
                    <select
                      value={overlays.distanceCircleStep}
                      onChange={(e) => onUpdateOverlays({ distanceCircleStep: Number(e.target.value) })}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[13px] text-slate-200"
                    >
                      <option value={0}>{isAr ? 'تلقائي' : 'Auto'}</option>
                      <option value={100}>100 {isAr ? 'م' : 'm'}</option>
                      <option value={250}>250 {isAr ? 'م' : 'm'}</option>
                      <option value={500}>500 {isAr ? 'م' : 'm'}</option>
                      <option value={1000}>1000 {isAr ? 'م' : 'm'}</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span>{isAr ? 'أقصى نصف قطر للدوائر' : 'Circles outer radius'}<InfoTip id="circleRadius" isAr={isAr} /></span>
                    <select
                      value={overlays.distanceCircleMax}
                      onChange={(e) => onUpdateOverlays({ distanceCircleMax: Number(e.target.value) })}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[13px] text-slate-200"
                    >
                      <option value={0}>{isAr ? 'تلقائي' : 'Auto'}</option>
                      {[1000, 2000, 3000, 4000, 6000].map((v) => (
                        <option key={v} value={v}>{v} {isAr ? 'م' : 'm'}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'كتابة المسافة على الدوائر' : 'Distance text on circles'}<InfoTip id="circleText" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showDistanceLabels}
                      onChange={(e) => onUpdateOverlays({ showDistanceLabels: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                    <span>{isAr ? 'البوصلة' : 'Compass'}<InfoTip id="compass" isAr={isAr} /></span>
                    <input
                      type="checkbox"
                      checked={overlays.showCompass}
                      onChange={(e) => onUpdateOverlays({ showCompass: e.target.checked })}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                  </label>
                </div>

                {/* Custom Markers Management */}
                <div className="pt-3 border-t border-slate-850">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-300">
                      {isAr ? 'سجل العلامات التكتيكية المخصصة' : 'Tactical Custom Markers Registry'}<InfoTip id="customMarkers" isAr={isAr} />
                    </span>
                    <span className="text-xs text-slate-500">
                      {customMarkers.length} {isAr ? 'علامة محفوظة' : 'saved in browser'}
                    </span>
                  </div>

                  {customMarkers.length === 0 ? (
                    <div className="p-3 rounded bg-slate-900/60 border border-slate-800 text-center text-slate-500 text-[13px]">
                      {isAr 
                        ? 'لا توجد علامات مخصصة حالياً. يمكنك استخدام زر "إضافة علامة" على الخارطة لإسقاط نقاط تكتيكية.'
                        : 'No custom tactical markers created yet. Use the Tactical Marker button on the map to place custom waypoints.'}
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {customMarkers.map((m) => (
                        <div
                          key={m.id}
                          className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[13px]"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: m.color }}
                            />
                            <span className="font-bold text-white">{m.name}</span>
                            <span className="text-xs text-slate-400 font-mono">
                              ({m.x.toFixed(0)}, {m.z.toFixed(0)})
                            </span>
                          </div>
                          <button
                            onClick={() => onDeleteMarker(m.id)}
                            className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/60 transition-colors"
                            title={t.deleteMarker}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          {activeKey === 'mortars' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center gap-2 font-bold text-white text-base">
              <Crosshair className="w-5 h-5 text-sky-400" />
              <span>{isAr ? 'الهاونات' : 'Mortars'}</span>
            </div>
            <div className="p-4 space-y-5 border-t border-slate-800/80">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-300 block text-[13px] uppercase">
                    {isAr ? 'المواصفات المرجعية الأساسية للهاونات' : 'Standard Weapon Reference Baselines'}<InfoTip id="baselines" isAr={isAr} />
                  </span>
                  
                  {/* American M252 Baseline Box */}
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>🇺🇸</span>
                        <span>M252 (81 mm)</span>
                        <span className="text-[11px] bg-sky-950 text-sky-400 px-1 rounded">6400 mil</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {isAr ? 'الحد الأدنى: 800 مل ≈ 45.0° | الحد الأقصى: 1515 مل ≈ 85.2°' : 'Min: 800 mil ≈ 45.0° | Max: 1515 mil ≈ 85.2°'}
                      </div>
                    </div>
                    <span className="text-[11px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                      {isAr ? 'يتطلب التحقق من اللعبة' : 'Requires verification'}
                    </span>
                  </div>

                  {/* Russian 2B14 Baseline Box */}
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>🇷🇺</span>
                        <span>2B14 (82 mm)</span>
                        <span className="text-[11px] bg-rose-950 text-rose-400 px-1 rounded">6000 mil</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {isAr ? 'الحد الأدنى: 748 مل ≈ 44.9° | الحد الأقصى: 1415 مل ≈ 84.9°' : 'Min: 748 mil ≈ 44.9° | Max: 1415 mil ≈ 84.9°'}
                      </div>
                    </div>
                    <span className="text-[11px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                      {isAr ? 'يتطلب التحقق من اللعبة' : 'Requires verification'}
                    </span>
                  </div>

                  {/* Launch Full Mortar Information System */}
                  {onOpenMortarInfo && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenMortarInfo();
                      }}
                      className="w-full p-2.5 rounded-lg bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/40 text-sky-300 hover:text-white flex items-center justify-between font-bold text-[13px] transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Crosshair className="w-4 h-4 text-sky-400" />
                        <span>{t.mortarSystem.title}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono font-normal">
                        {isAr ? 'عرض المواصفات وجداول المدى والتحقق ←' : 'View Full Reference Tables & Specs →'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Personal calibration: each user can nudge each mortar a bit under/over the standard values */}
                <div className="pt-3 border-t border-slate-850 space-y-2">
                  <div className="font-bold text-slate-300">
                    {isAr ? 'معايرة الهاون الشخصية (أقل أو أكثر من القياس)' : 'Personal mortar calibration (a bit under / over standard)'}<InfoTip id="calibration" isAr={isAr} />
                  </div>
                  <p className="text-[13px] text-slate-400">
                    {isAr
                      ? 'القيم الافتراضية صفر = بيانات اللعبة القياسية. إذا القذيفة تسقط أبعد من المطلوب، زِد نسبة المدى؛ وإذا تسقط أقرب، قلّلها. تنحفظ عندك في المتصفح فقط.'
                      : 'Default 0 = standard game data. If shells land long (farther than the table), raise the range %; if short, lower it. Saved only in your browser.'}
                  </p>
                  {tunableWeapons.map((w) => {
                    const cur: WeaponTuning = tunings[w.id] ?? { rangeScalePct: 0, elevationOffsetMils: 0, minElevationLockDeg: 0, closingAngleDeg: 0 };
                    const closeOn = !!cur.closingAngleDeg && cur.closingAngleDeg > 0;
                    const tubeMinDeg = Math.round(((w.minElevation * 360) / w.milsPerCircle) * 10) / 10;
                    const lockOn = !!cur.minElevationLockDeg && cur.minElevationLockDeg > 0;
                    const set = (patch: Partial<WeaponTuning>) => onUpdateTuning(w.id, { ...cur, ...patch });
                    const changed = cur.rangeScalePct !== 0 || cur.elevationOffsetMils !== 0 || lockOn || closeOn || !!cur.freeMode;
                    return (
                      <div key={w.id} className="p-2 rounded bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white">{w.shortName || w.name}</span>
                          <button
                            type="button"
                            disabled={!changed}
                            onClick={() => onUpdateTuning(w.id, null)}
                            className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 disabled:opacity-40"
                          >
                            {isAr ? 'رجوع للقياسي' : 'Reset'}
                          </button>
                        </div>
                        <label className="flex items-center justify-between gap-2 cursor-pointer p-1.5 rounded border border-emerald-700/50 bg-emerald-950/20">
                          <span className="text-[13px] text-emerald-300 font-bold">
                            {isAr ? 'وضع حر كامل (بدون حدود زاوية السبطانة)' : 'Full free mode (no tube angle limits)'}<InfoTip id="freeMode" isAr={isAr} />
                          </span>
                          <input
                            type="checkbox"
                            checked={!!cur.freeMode}
                            onChange={(e) => set({ freeMode: e.target.checked })}
                            className="w-4 h-4 accent-emerald-500 rounded"
                          />
                        </label>
                        <Stepper
                          label={isAr ? 'المدى %' : 'Range %'}
                          value={cur.rangeScalePct}
                          step={0.5}
                          min={-20}
                          max={20}
                          onChange={(v) => set({ rangeScalePct: v })}
                        />
                        <Stepper
                          label={isAr ? 'الارتفاع (مل)' : 'Elevation (mil)'}
                          value={cur.elevationOffsetMils}
                          step={1}
                          min={-60}
                          max={60}
                          onChange={(v) => set({ elevationOffsetMils: v })}
                        />
                        <label className="flex items-center justify-between gap-2 cursor-pointer">
                          <span className="text-[13px] text-slate-300">
                            {isAr ? 'زاوية إغلاق الجدول عند أقصى مدى (إلغاء = القياسي)' : 'Closing angle at max range (off = standard)'}<InfoTip id="closingAngle" isAr={isAr} />
                          </span>
                          <input
                            type="checkbox"
                            checked={closeOn}
                            onChange={(e) => set({ closingAngleDeg: e.target.checked ? tubeMinDeg : 0 })}
                            className="w-4 h-4 accent-emerald-500 rounded"
                          />
                        </label>
                        {closeOn && (
                          <Stepper
                            label={isAr ? 'زاوية الإغلاق °' : 'Closing angle °'}
                            value={cur.closingAngleDeg as number}
                            step={0.5}
                            min={30}
                            max={80}
                            onChange={(v) => set({ closingAngleDeg: v })}
                          />
                        )}
                        <label className="flex items-center justify-between gap-2 cursor-pointer">
                          <span className="text-[13px] text-slate-300">
                            {isAr ? 'قفل أدنى زاوية (إلغاء = حرّ)' : 'Lock minimum angle (off = free)'}<InfoTip id="minAngleLock" isAr={isAr} />
                          </span>
                          <input
                            type="checkbox"
                            checked={lockOn}
                            onChange={(e) => set({ minElevationLockDeg: e.target.checked ? Math.max(50, tubeMinDeg) : 0 })}
                            className="w-4 h-4 accent-amber-500 rounded"
                          />
                        </label>
                        {lockOn && (
                          <Stepper
                            label={isAr ? 'زاوية القفل °' : 'Lock angle °'}
                            value={cur.minElevationLockDeg as number}
                            step={0.5}
                            min={30}
                            max={80}
                            onChange={(v) => set({ minElevationLockDeg: v })}
                          />
                        )}
                        <p className="text-xs text-slate-500">
                          {isAr
                            ? `حد السبطانة الفعلي ${tubeMinDeg}°. القفل الأعلى منه (مثل 50°) يقصّر أقصى مدى لأنه ما يرمي بأقل من هالزاوية. أقل من ${tubeMinDeg}° ما يأثر (السبطانة ما تنزل أكثر).`
                            : `Tube limit is ${tubeMinDeg}°. A lock above it (e.g. 50°) shortens the max range because the gun never fires below that angle. Values under ${tubeMinDeg}° change nothing (the tube cannot go lower).`}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Add User-Defined Custom Mortar Form */}
                <div className="pt-3 border-t border-slate-850 space-y-2">
                  <span className="font-bold text-slate-300 block text-[13px]">
                    {isAr ? 'إضافة سجل هاون مخصص جديد (User-Defined)' : 'Add User-Defined Custom Mortar Record'}<InfoTip id="addMortar" isAr={isAr} />
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder={isAr ? 'اسم الهاون' : 'Mortar Name'}
                      value={newMortarName}
                      onChange={(e) => setNewMortarName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[13px] text-white"
                    />
                    <input
                      type="text"
                      placeholder={isAr ? 'العيار (مثال: 81mm)' : 'Caliber (e.g. 81mm)'}
                      value={newMortarCaliber}
                      onChange={(e) => setNewMortarCaliber(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[13px] text-white"
                    />
                    <select
                      value={newMortarMils}
                      onChange={(e) => setNewMortarMils(parseInt(e.target.value, 10) as 6400 | 6000)}
                      className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[13px] text-white"
                    >
                      <option value="6400">6400 Mils (NATO)</option>
                      <option value="6000">6000 Mils (Warsaw)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-slate-500">
                      {isAr ? 'يحفظ كملف تعريف مخصص في المتصفح' : 'Saves profile in browser local storage'}
                    </span>
                    <button
                      onClick={handleCreateMortar}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[13px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'حفظ السجل' : 'Add Profile'}</span>
                    </button>
                  </div>
                </div>
            </div>
          </div>
          )}

          {activeKey === 'calculator' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center gap-2 font-bold text-white text-base">
              <Calculator className="w-5 h-5 text-sky-400" />
              <span>{isAr ? 'الحاسبة' : 'Calculator'}</span>
            </div>
            <div className="p-4 space-y-5 border-t border-slate-800/80">
                {/* Distance method: exact maths (default) or maths + AI second opinion */}
                <div className="pt-3 border-t border-slate-850 space-y-2">
                  <div className="font-bold text-slate-300">{isAr ? 'طريقة حساب المسافة' : 'Distance calculation method'}<InfoTip id="distMethod" isAr={isAr} /></div>
                  <p className="text-[13px] text-slate-400">
                    {isAr
                      ? 'الرياضيات تحسب المسافة والاتجاه من الإحداثيات مباشرة (دقيقة، لا تعتمد على الخريطة ولا التقريب). خيار الذكاء الاصطناعي يعيد الحساب كرأي ثاني ويكشف المشاكل، لكن الرقم المعتمد يبقى من الرياضيات لأن الذكاء الاصطناعي قد يخطئ بالأرقام.'
                      : 'Maths computes distance and bearing straight from the coordinates (exact, independent of the map and zoom). The AI option re-computes as a second opinion and flags problems, but the maths value stays in use because AI can slip on arithmetic.'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['math', 'ai'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onUpdateAi({ method: m })}
                        className={`p-2 rounded border font-bold ${aiSettings.method === m ? 'bg-sky-600 border-sky-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300'}`}
                      >
                        {m === 'math' ? (isAr ? 'رياضيات (تلقائي)' : 'Maths (auto)') : isAr ? 'رياضيات + ذكاء اصطناعي' : 'Maths + AI check'}
                      </button>
                    ))}
                  </div>
                  {aiSettings.method === 'ai' && (
                    <div className="space-y-2 p-2 rounded bg-slate-950 border border-slate-800">
                      <div className="grid grid-cols-2 gap-2">
                        {(['gemini', 'anthropic'] as const).map((pv) => (
                          <button
                            key={pv}
                            type="button"
                            onClick={() => onUpdateAi({ provider: pv, model: pv === 'gemini' ? 'gemini-3.5-flash' : 'claude-sonnet-5-5' })}
                            className={`p-2 rounded border font-bold ${aiSettings.provider === pv ? 'bg-violet-600 border-violet-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300'}`}
                          >
                            {pv === 'gemini' ? 'Google Gemini' : 'Anthropic Claude'}
                          </button>
                        ))}
                      </div>
                      <label className="block text-[13px] text-slate-400">
                        {isAr ? 'مفتاح API الخاص بك (يُحفظ بمتصفحك فقط، ولا يدخل النسخة الاحتياطية)' : 'Your own API key (kept in this browser only, never in backups)'}<InfoTip id="apiKey" isAr={isAr} />
                        <input
                          type="password"
                          autoComplete="off"
                          value={aiSettings.apiKey}
                          onChange={(e) => onUpdateAi({ apiKey: e.target.value })}
                          placeholder={aiSettings.provider === 'gemini' ? 'AQ.… / AIza…' : 'sk-ant-…'}
                          className="mt-1 w-full h-10 px-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
                          dir="ltr"
                        />
                      </label>
                      <label className="block text-[13px] text-slate-400">
                        {isAr ? 'اسم الموديل' : 'Model name'}<InfoTip id="modelName" isAr={isAr} />
                        <input
                          type="text"
                          value={aiSettings.model}
                          onChange={(e) => onUpdateAi({ model: e.target.value })}
                          className="mt-1 w-full h-10 px-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
                          dir="ltr"
                        />
                      </label>
                      <p className="text-xs text-amber-400">
                        {isAr
                          ? 'عند الضغط على "تحقق الآن" يُرسل فقط: إحداثيات الهاون والهدف ونوع السلاح إلى الشركة المختارة (Google أو Anthropic). لا يُرسل شي ثاني.'
                          : 'When you press "Check now", only the gun/target coordinates and weapon type are sent to the selected company (Google or Anthropic). Nothing else.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Display Formatting & Precision */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-850">
                  <div>
                    <label className="text-[13px] font-bold text-slate-400 block mb-1 uppercase">
                      {isAr ? 'صيغة عرض زاوية الارتفاع' : 'Elevation Display Format'}<InfoTip id="elevFormat" isAr={isAr} />
                    </label>
                    <select
                      value={settings.elevationDisplayFormat}
                      onChange={(e) => onUpdateSettings({ elevationDisplayFormat: e.target.value as ElevationDisplayFormat })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[13px] text-white"
                    >
                      <option value="both">{isAr ? 'الدرجات والمل معاً (Both)' : 'Both (Degrees & Mils)'}</option>
                      <option value="degrees_first">{isAr ? 'الدرجات أولاً (Degrees First)' : 'Degrees First'}</option>
                      <option value="mils_first">{isAr ? 'المل أولاً (Mils First)' : 'Mils First'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-slate-400 block mb-1 uppercase">
                      {isAr ? 'دقة المنازل العشرية (Decimal Precision)' : 'Decimal Precision'}<InfoTip id="decimals" isAr={isAr} />
                    </label>
                    <div className="flex gap-2">
                      {[0, 1, 2].map((dec) => (
                        <button
                          key={dec}
                          onClick={() => onUpdateSettings({ decimalPrecision: dec })}
                          className={`flex-1 py-1.5 rounded border text-center font-bold text-[13px] ${
                            settings.decimalPrecision === dec
                              ? 'bg-sky-500 text-slate-950 border-sky-400'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {dec} {isAr ? 'منازل' : 'dec'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
            </div>
          </div>
          )}

          {activeKey === 'measurementUnits' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center justify-between font-bold text-white text-base">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-indigo-400" />
                <span>{t.settingsCategories.measurementUnits}</span>
              </div>
            </div>

            {(
              <div className="p-4 space-y-3 border-t border-slate-800/80">
                <div>
                  <label className="text-[13px] font-bold text-slate-400 block mb-1.5 uppercase">
                    {isAr ? 'وحدة قياس المسافة' : 'Distance Measurement Unit'}<InfoTip id="distUnit" isAr={isAr} />
                  </label>
                  <div className="flex gap-2">
                    {(['meters', 'kilometers'] as DistanceUnit[]).map((u) => (
                      <button
                        key={u}
                        onClick={() => onUpdateSettings({ distanceUnit: u })}
                        className={`flex-1 py-2 rounded border text-center font-bold capitalize text-[13px] ${
                          settings.distanceUnit === u
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {activeKey === 'weather' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center justify-between font-bold text-white text-base">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-sky-400" />
                <span>{t.settingsCategories.weather}</span>
              </div>
            </div>

            {(
              <div className="p-4 space-y-3 border-t border-slate-800/80">
                <label className="flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                  <span>{isAr ? 'تفعيل نافذة رصد الطقس والرياح على الخارطة' : 'Show Weather HUD on Map'}<InfoTip id="weatherHud" isAr={isAr} /></span>
                  <input
                    type="checkbox"
                    checked={settings.weatherPanelOpen}
                    onChange={(e) => onUpdateSettings({ weatherPanelOpen: e.target.checked })}
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </label>

                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[13px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>{isAr ? 'السرعة الحالية:' : 'Current Speed:'}</span>
                    <span className="text-white font-bold">{weather.windSpeed} {weather.windUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isAr ? 'الاتجاه:' : 'Direction:'}</span>
                    <span className="text-sky-300 font-bold">{weather.windDirectionDeg}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isAr ? 'التصنيف:' : 'Category:'}</span>
                    <span className="text-amber-400 font-bold">{isAr ? 'رصد ميداني يدوي' : 'Manual User Observation'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {activeKey === 'storagePrivacy' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center justify-between font-bold text-white text-base">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                <span>{t.settingsCategories.storagePrivacy}</span>
              </div>
            </div>

            {(
              <div className="p-4 space-y-3 border-t border-slate-800/80 text-[13px]">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isAr ? 'الخصوصية والتخزين المحلي الحصري' : 'Zero-Telemetry & 100% Client-Side Privacy'}</span>
                  </div>
                  <p className="text-[13px] text-slate-300 leading-relaxed">
                    {t.storage.description}
                  </p>
                </div>

                <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg flex items-start gap-2 text-amber-300/90 text-[13px] leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>{t.storage.siteDataNotice}</p>
                </div>
              </div>
            )}
          </div>
          )}

          {activeKey === 'importExport' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center justify-between font-bold text-white text-base">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{t.settingsCategories.importExport}</span>
              </div>
            </div>

            {(
              <div className="p-4 space-y-3 border-t border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleExport}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500 text-left flex items-center gap-3 transition-all"
                  >
                    <Download className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-bold text-white text-[13px]">{t.storage.exportButton}</div>
                      <div className="text-xs text-slate-400">Download portable JSON backup</div>
                    </div>
                  </button>

                  <label className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-sky-500 text-left flex items-center gap-3 transition-all cursor-pointer">
                    <Upload className="w-5 h-5 text-sky-400" />
                    <div>
                      <div className="font-bold text-white text-[13px]">{t.storage.importButton}</div>
                      <div className="text-xs text-slate-400">Upload & validate JSON backup</div>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
          )}

          {activeKey === 'resetRecovery' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="w-full px-4 py-3.5 bg-slate-950/80 flex items-center justify-between font-bold text-white text-base">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>{t.settingsCategories.resetRecovery}</span>
              </div>
            </div>

            {(
              <div className="p-4 space-y-2.5 border-t border-slate-800/80">
                <p className="text-[13px] text-slate-400 mb-2">
                  {isAr 
                    ? 'عمليات إعادة الضبط الحبيبية تسمح باستعادة المظهر أو الإعدادات دون حذف العلامات والبيانات التي أنشأتها.'
                    : 'Granular resets allow reverting appearance or map display without deleting your custom created markers.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onResetSection('appearance');
                      notify(isAr ? 'تمت استعادة إعدادات مظهر الواجهة الافتراضية' : 'Restored default interface appearance');
                    }}
                    className="p-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-left flex items-center justify-between"
                  >
                    <span>{isAr ? 'استعادة مظهر الواجهة' : 'Reset Interface Appearance'}</span>
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onResetSection('map');
                      notify(isAr ? 'تمت استعادة إعدادات عرض الخريطة الافتراضية' : 'Restored default map display settings');
                    }}
                    className="p-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-left flex items-center justify-between"
                  >
                    <span>{isAr ? 'استعادة طبقات وتسميات الخريطة' : 'Reset Map Overlays & Labels'}</span>
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onResetSection('userData');
                      notify(isAr ? 'تم مسح العلامات وسجلات الهاون المخصصة' : 'Cleared custom markers and user mortars');
                    }}
                    className="p-2.5 rounded bg-amber-950/40 hover:bg-amber-900/40 border border-amber-900/60 text-amber-300 text-left flex items-center justify-between"
                  >
                    <span>{t.storage.clearUserDataOnly}</span>
                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(isAr ? 'هل أنت متأكد من رغبتك في إعادة ضبط المصنع ومسح جميع البيانات المحلية؟' : 'Are you sure you want to perform a factory reset? This will erase all local settings and custom markers.')) {
                        onResetSection('factory');
                        notify(isAr ? 'تمت إعادة ضبط المصنع بنجاح' : 'Factory reset completed');
                      }
                    }}
                    className="p-2.5 rounded bg-red-950/60 hover:bg-red-900/60 border border-red-800 text-red-300 text-left flex items-center justify-between"
                  >
                    <span>{t.storage.clearStorageButton}</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
            </div>
          </div>
        </div>


        {/* Footer */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            Arma Reforger FCS v2.12 • LocalStorage Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-[13px] shadow-md transition-all"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
