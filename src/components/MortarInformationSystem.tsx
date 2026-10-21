import React, { useState, useMemo } from 'react';
import { 
  M252_PROFILE, 
  PODNOS_2B14_PROFILE, 
  MortarSystemProfile, 
  RangeReferenceEntry, 
  VerificationStatus,
  filterRangeEntries
} from '../data/mortarReferenceData';
import { WeaponConfig } from '../types';
import { TRANSLATIONS } from '../locales/translations';
import { 
  Shield, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Filter, 
  Crosshair, 
  FileText, 
  ExternalLink,
  Flame,
  Cloud,
  Sun,
  Target,
  Sparkles,
  AlertOctagon,
  EyeOff
} from 'lucide-react';

interface MortarInformationSystemProps {
  currentWeapon?: WeaponConfig;
  onSelectWeapon?: (weapon: WeaponConfig) => void;
  availableWeapons?: WeaponConfig[];
  lang: 'en' | 'ar';
  isCompact?: boolean;
  onClose?: () => void;
}

export const MortarInformationSystem: React.FC<MortarInformationSystemProps> = ({
  currentWeapon,
  onSelectWeapon,
  availableWeapons,
  lang,
  isCompact = false,
  onClose,
}) => {
  const t = TRANSLATIONS[lang];
  const isAr = lang === 'ar';

  // Selected mortar tab: 'm252_81mm' or '2b14_82mm'
  const initialMortarId = currentWeapon?.id.includes('2b14') ? '2b14_82mm' : 'm252_81mm';
  const [selectedMortarId, setSelectedMortarId] = useState<'m252_81mm' | '2b14_82mm'>(initialMortarId);

  // Section collapse states
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    specifications: true,
    ammunition: true,
    chargeInfo: !isCompact,
    rangeReference: true,
    verificationNotes: true,
    sourceTransparency: !isCompact,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Range Table Filters
  const [filterAmmo, setFilterAmmo] = useState<'ALL' | 'HE' | 'SMOKE' | 'ILLUM' | 'PRACTICE'>('ALL');
  const [filterCharge, setFilterCharge] = useState<number | 'ALL'>(4);
  const [filterStatus, setFilterStatus] = useState<VerificationStatus | 'ALL'>('ALL');

  // Active Profile (guarantees strict separation between American and Russian data)
  const profile: MortarSystemProfile = selectedMortarId === 'm252_81mm' ? M252_PROFILE : PODNOS_2B14_PROFILE;

  // Sync with main app active weapon when user clicks "Equip in Calculator"
  const handleEquipInFcs = () => {
    if (!onSelectWeapon || !availableWeapons) return;
    const targetWeapon = availableWeapons.find((w) => 
      selectedMortarId === 'm252_81mm' ? w.id.includes('m252') : w.id.includes('2b14')
    );
    if (targetWeapon) {
      onSelectWeapon(targetWeapon);
    }
  };

  // Filtered range entries for active mortar
  const filteredEntries = useMemo(() => {
    return filterRangeEntries({
      mortarId: selectedMortarId,
      ammunitionCategory: filterAmmo,
      chargeRing: filterCharge,
      verificationStatus: filterStatus,
    });
  }, [selectedMortarId, filterAmmo, filterCharge, filterStatus]);

  // Status badge styling helper
  const renderStatusBadge = (status: VerificationStatus, isSmall: boolean = false) => {
    const config = {
      VERIFIED: {
        bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
        icon: <CheckCircle className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-400 shrink-0`} />,
        label: t.mortarSystem.verified,
      },
      PARTIALLY_VERIFIED: {
        bg: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
        icon: <AlertTriangle className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 shrink-0`} />,
        label: t.mortarSystem.partiallyVerified,
      },
      UNVERIFIED: {
        bg: 'bg-slate-800/90 text-slate-300 border-slate-600',
        icon: <HelpCircle className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-slate-400 shrink-0`} />,
        label: t.mortarSystem.unverified,
      },
      CONFLICTING: {
        bg: 'bg-rose-950/90 text-rose-300 border-rose-500/60',
        icon: <AlertOctagon className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-rose-400 shrink-0`} />,
        label: t.mortarSystem.conflicting,
      },
      MISSING: {
        bg: 'bg-zinc-900 text-zinc-400 border-zinc-700 border-dashed',
        icon: <EyeOff className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-zinc-500 shrink-0`} />,
        label: t.mortarSystem.missing,
      },
    }[status];

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono font-bold tracking-tight ${config.bg} ${isSmall ? 'text-[9px]' : 'text-[10px]'}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  // Category Icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HE':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'SMOKE':
        return <Cloud className="w-3.5 h-3.5 text-slate-300" />;
      case 'ILLUM':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'PRACTICE':
        return <Target className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div 
      className="bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-slate-200 font-sans"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Header & System Title */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide font-mono">
                {t.mortarSystem.title}
              </h2>
              {renderStatusBadge(profile.overallStatus, true)}
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1 font-mono">
              {t.mortarSystem.subtitle}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors text-xs"
            title={t.mortarSystem.closePanel}
          >
            ✕
          </button>
        )}
      </div>

      {/* 1. MORTAR SELECTION TABS (Guaranteed Separation) */}
      <div className="bg-slate-950 p-2 sm:p-3 border-b border-slate-800/80">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
          {t.mortarSystem.selectMortar}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {/* American M252 Tab */}
          <button
            type="button"
            onClick={() => {
              setSelectedMortarId('m252_81mm');
              setFilterAmmo('ALL');
              setFilterCharge('ALL');
              setFilterStatus('ALL');
            }}
            className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
              selectedMortarId === 'm252_81mm'
                ? 'bg-sky-950/60 border-sky-400 text-white shadow-lg ring-1 ring-sky-500/50'
                : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🇺🇸</span>
              <div>
                <div className="font-bold text-xs sm:text-sm font-mono text-white">
                  M252 81mm
                </div>
                <div className="text-[10px] text-sky-400/90 font-mono">
                  6400 mil (NATO) • 81 mm
                </div>
              </div>
            </div>
            {selectedMortarId === 'm252_81mm' && (
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm animate-pulse"></span>
            )}
          </button>

          {/* Russian 2B14 Tab */}
          <button
            type="button"
            onClick={() => {
              setSelectedMortarId('2b14_82mm');
              setFilterAmmo('ALL');
              setFilterCharge('ALL');
              setFilterStatus('ALL');
            }}
            className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
              selectedMortarId === '2b14_82mm'
                ? 'bg-amber-950/60 border-amber-400 text-white shadow-lg ring-1 ring-amber-500/50'
                : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🇷🇺</span>
              <div>
                <div className="font-bold text-xs sm:text-sm font-mono text-white">
                  2B14 Podnos 82mm
                </div>
                <div className="text-[10px] text-amber-400/90 font-mono">
                  6000 mil (Warsaw) • 82 mm
                </div>
              </div>
            </div>
            {selectedMortarId === '2b14_82mm' && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Main Accordion Body */}
      <div className="p-3 sm:p-4 space-y-3 max-h-[75vh] overflow-y-auto">

        {/* SECTION 1: MORTAR OVERVIEW */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <button
            type="button"
            onClick={() => toggleSection('overview')}
            className="w-full px-3.5 py-2.5 bg-slate-900/80 hover:bg-slate-850 border-b border-slate-800/80 flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2 font-mono font-bold text-xs sm:text-sm text-slate-200">
              <Info className="w-4 h-4 text-sky-400" />
              <span>{t.mortarSystem.overview} — {profile.designation}</span>
            </div>
            {expandedSections.overview ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.overview && (
            <div className="p-3.5 space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                {isAr ? profile.overviewAr : profile.overviewEn}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <div className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                  <span className="text-[9px] text-slate-500 uppercase block">{t.mortarSystem.caliber}</span>
                  <span className="text-sky-300 font-bold">{profile.caliber}</span>
                </div>
                <div className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                  <span className="text-[9px] text-slate-500 uppercase block">{t.mortarSystem.angularSystem}</span>
                  <span className="text-amber-300 font-bold">{profile.milsPerCircle} mils / circle</span>
                </div>
                <div className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                  <span className="text-[9px] text-slate-500 uppercase block">{t.mortarSystem.faction}</span>
                  <span className="text-emerald-300 font-bold">{isAr ? profile.countryAr : profile.countryEn}</span>
                </div>
                <div className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                  <span className="text-[9px] text-slate-500 uppercase block">{t.mortarSystem.verificationNotes}</span>
                  <div className="mt-0.5">{renderStatusBadge(profile.overallStatus, true)}</div>
                </div>
              </div>

              {onSelectWeapon && availableWeapons && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleEquipInFcs}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تجهيز هذا الهاون في حاسبة الرماية' : 'Equip in Calculator (FCS)'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: TECHNICAL SPECIFICATIONS (Elevation Limits, Angles & Sight Unit) */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <button
            type="button"
            onClick={() => toggleSection('specifications')}
            className="w-full px-3.5 py-2.5 bg-slate-900/80 hover:bg-slate-850 border-b border-slate-800/80 flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2 font-mono font-bold text-xs sm:text-sm text-slate-200">
              <Crosshair className="w-4 h-4 text-emerald-400" />
              <span>{t.mortarSystem.specifications}</span>
            </div>
            {expandedSections.specifications ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.specifications && (
            <div className="p-3.5 space-y-3">
              {/* Elevation limits showcase boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                {/* Minimum Elevation */}
                <div className="p-3 rounded-xl border border-sky-500/40 bg-sky-950/20">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                    <span>{t.mortarSystem.minElevation}</span>
                    <span className="text-sky-400">{profile.id === 'm252_81mm' ? 'NATO 6400' : 'SOVIET 6000'}</span>
                  </div>
                  <div className="text-lg font-extrabold text-sky-400">
                    {profile.minimumElevationMil} mil ≈ {profile.minimumElevationDeg.toFixed(1)}°
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isAr 
                      ? 'الحد الأدنى لزاوية الارتفاع المقيدة ميكانيكياً (أقصى مدى رماية للشحنة).' 
                      : 'Mechanical lower quadrant limit (yields maximum horizontal range per charge).'}
                  </p>
                </div>

                {/* Maximum Elevation */}
                <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                    <span>{t.mortarSystem.maxElevation}</span>
                    <span className="text-emerald-400">{profile.id === 'm252_81mm' ? 'NATO 6400' : 'SOVIET 6000'}</span>
                  </div>
                  <div className="text-lg font-extrabold text-emerald-400">
                    {profile.maximumElevationMil} mil ≈ {profile.maximumElevationDeg.toFixed(1)}°
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isAr 
                      ? 'الحد الأعلى لزاوية الارتفاع الميكانيكي (أقصر مدى رماية بمسار شاهق).' 
                      : 'Mechanical upper quadrant limit (yields shortest minimum range with steep plunge).'}
                  </p>
                </div>
              </div>

              {/* Sight Unit and Angular System Notes */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2 text-xs font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0 uppercase text-[10px]">{t.mortarSystem.sightUnit}:</span>
                  <span className="text-slate-200 font-semibold">{isAr ? profile.sightUnitAr : profile.sightUnitEn}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0 uppercase text-[10px]">{t.mortarSystem.angularSystem}:</span>
                  <span className="text-amber-300 font-semibold">{isAr ? profile.angularSystemAr : profile.angularSystemEn}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: AMMUNITION CATEGORIES */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <button
            type="button"
            onClick={() => toggleSection('ammunition')}
            className="w-full px-3.5 py-2.5 bg-slate-900/80 hover:bg-slate-850 border-b border-slate-800/80 flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2 font-mono font-bold text-xs sm:text-sm text-slate-200">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>{t.mortarSystem.ammunition} ({profile.ammunition.length})</span>
            </div>
            {expandedSections.ammunition ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.ammunition && (
            <div className="p-3.5 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {profile.ammunition.map((ammo) => (
                  <div 
                    key={ammo.id}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-slate-900 border border-slate-800">
                          {getCategoryIcon(ammo.category)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white font-mono">
                            {ammo.designation}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {isAr ? ammo.categoryFullAr : ammo.categoryFullEn}
                          </span>
                        </div>
                      </div>
                      {renderStatusBadge(ammo.verificationStatus, true)}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {isAr ? ammo.descriptionAr : ammo.descriptionEn}
                    </p>

                    <div className="pt-1.5 border-t border-slate-850 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{isAr ? 'الوزن:' : 'Mass:'} {ammo.weightKg ? `${ammo.weightKg.toFixed(2)} kg` : t.mortarSystem.notVerifiedLabel}</span>
                      <span className="text-slate-500 truncate max-w-[150px]">{ammo.fuzeType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: RANGE REFERENCE TABLES WITH FILTERS */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <button
            type="button"
            onClick={() => toggleSection('rangeReference')}
            className="w-full px-3.5 py-2.5 bg-slate-900/80 hover:bg-slate-850 border-b border-slate-800/80 flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2 font-mono font-bold text-xs sm:text-sm text-slate-200">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>{t.mortarSystem.rangeReference}</span>
            </div>
            {expandedSections.rangeReference ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.rangeReference && (
            <div className="p-3.5 space-y-3">
              {/* Interactive Filter Bar */}
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase font-mono">
                  <Filter className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isAr ? 'تصفية جداول المدى والتحقق' : 'Filter Range Tables'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  {/* Category Filter */}
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">{t.mortarSystem.filterByAmmo}</label>
                    <select
                      value={filterAmmo}
                      onChange={(e) => setFilterAmmo(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="ALL">{t.mortarSystem.allAmmo}</option>
                      <option value="HE">HE (High Explosive)</option>
                      <option value="SMOKE">SMOKE (Obscurant)</option>
                      <option value="ILLUM">ILLUM (Flare)</option>
                      {selectedMortarId === 'm252_81mm' && <option value="PRACTICE">PRACTICE (Training)</option>}
                    </select>
                  </div>

                  {/* Charge Filter */}
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">{t.mortarSystem.filterByCharge}</label>
                    <select
                      value={filterCharge === 'ALL' ? 'ALL' : String(filterCharge)}
                      onChange={(e) => setFilterCharge(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="4">{isAr ? 'الحلقة 4 (المعتمدة)' : 'Ring 4 (verified)'}</option>
                    </select>
                  </div>

                  {/* Verification Status Filter */}
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">{t.mortarSystem.filterByStatus}</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="ALL">{t.mortarSystem.allStatuses}</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="PARTIALLY_VERIFIED">PARTIALLY VERIFIED</option>
                      <option value="UNVERIFIED">UNVERIFIED</option>
                      <option value="CONFLICTING">CONFLICTING</option>
                      <option value="MISSING">MISSING</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabular Range Reference Data */}
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs font-mono" dir={isAr ? 'rtl' : 'ltr'}>
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">{t.mortarSystem.colAmmo}</th>
                      <th className="p-2.5">{t.mortarSystem.colCharge}</th>
                      <th className="p-2.5">{t.mortarSystem.colMinRange}</th>
                      <th className="p-2.5">{t.mortarSystem.colMaxRange}</th>
                      <th className="p-2.5">{t.mortarSystem.colStatus}</th>
                      <th className="p-2.5 min-w-[200px]">{t.mortarSystem.colNotes}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500 text-xs font-sans">
                          {isAr ? 'لا توجد سجلات تطابق عوامل التصفية الحالية.' : 'No entries match the selected filters.'}
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map((entry) => (
                        <tr 
                          key={entry.id}
                          className={`hover:bg-slate-900/60 transition-colors ${
                            entry.isConflicting ? 'bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="p-2.5 whitespace-nowrap">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {getCategoryIcon(entry.ammunitionCategory)}
                              <span>{entry.ammunitionDesignation}</span>
                            </div>
                            <span className="text-[9px] text-slate-500">
                              {isAr ? entry.categoryLabelAr : entry.categoryLabelEn}
                            </span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap text-sky-300 font-semibold">
                            {entry.chargeName}
                          </td>
                          <td className="p-2.5 whitespace-nowrap font-bold text-slate-200">
                            {entry.minimumRangeMeters !== null ? `${entry.minimumRangeMeters} m` : (
                              <span className="text-zinc-500 italic">{t.mortarSystem.notVerifiedLabel}</span>
                            )}
                          </td>
                          <td className="p-2.5 whitespace-nowrap font-bold text-emerald-400">
                            {entry.maximumRangeMeters !== null ? `${entry.maximumRangeMeters} m` : (
                              <span className="text-zinc-500 italic">{t.mortarSystem.notVerifiedLabel}</span>
                            )}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            {renderStatusBadge(entry.verificationStatus, true)}
                          </td>
                          <td className="p-2.5 text-[11px] text-slate-400 font-sans leading-relaxed">
                            <div>{isAr ? entry.notesAr : entry.notesEn}</div>
                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                              {entry.sourceReference}
                            </div>
                            {entry.isConflicting && (
                              <div className="mt-1 p-1 bg-rose-950/50 border border-rose-800/60 rounded text-[10px] text-rose-300 font-mono">
                                ⚠️ {isAr ? entry.conflictingDetailsAr : entry.conflictingDetailsEn}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: DATA CONFIDENCE & SOURCE TRANSPARENCY */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <button
            type="button"
            onClick={() => toggleSection('verificationNotes')}
            className="w-full px-3.5 py-2.5 bg-slate-900/80 hover:bg-slate-850 border-b border-slate-800/80 flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2 font-mono font-bold text-xs sm:text-sm text-slate-200">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{t.mortarSystem.verificationNotes}</span>
            </div>
            {expandedSections.verificationNotes ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.verificationNotes && (
            <div className="p-3.5 space-y-3 text-xs font-sans">
              {/* Definition of Verification Status Levels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-950/70 border border-emerald-500/30 rounded-lg space-y-1">
                  {renderStatusBadge('VERIFIED')}
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {t.mortarSystem.statusVerifiedDesc}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-amber-500/30 rounded-lg space-y-1">
                  {renderStatusBadge('PARTIALLY_VERIFIED')}
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {t.mortarSystem.statusPartiallyVerifiedDesc}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-slate-700 rounded-lg space-y-1">
                  {renderStatusBadge('UNVERIFIED')}
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {t.mortarSystem.statusUnverifiedDesc}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-rose-500/30 rounded-lg space-y-1">
                  {renderStatusBadge('CONFLICTING')}
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {t.mortarSystem.statusConflictingDesc}
                  </p>
                </div>

                <div className="col-span-1 sm:col-span-2 p-2.5 bg-slate-950/70 border border-zinc-700 border-dashed rounded-lg space-y-1">
                  {renderStatusBadge('MISSING')}
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {t.mortarSystem.statusMissingDesc}
                  </p>
                </div>
              </div>

              {/* Snapshot Notice (Section 5 explicit requirement) */}
              <div className="p-3 bg-amber-950/30 border border-amber-700/60 rounded-xl text-amber-200/90 text-[11px] leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-300 font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Workspace Documentation Notice</span>
                </div>
                <p>{t.mortarSystem.missingSnapshotNotice}</p>
              </div>

              {/* Required Evidence List */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                <div className="text-[11px] font-bold text-sky-300 uppercase font-mono flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t.mortarSystem.requiredEvidenceTitle}</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                  {(isAr ? profile.requiredEvidenceAr : profile.requiredEvidenceEn).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
