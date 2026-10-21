/**
 * Mortar Reference Information System Data Model
 * Arma Reforger Mortar FCS - Rigorous Ballistic and Technical Specification Database
 *
 * Strict Rules:
 * - Do not invent missing information.
 * - Distinguish VERIFIED from PARTIALLY_VERIFIED, UNVERIFIED, CONFLICTING, and MISSING.
 * - Keep American M252 (81mm, 6400 mils) and Russian 2B14 (82mm, 6000 mils) strictly separate.
 * - Preserve original ammunition designations and unverified source observations without silent corrections.
 */

export type VerificationStatus = 
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'CONFLICTING'
  | 'MISSING';

export type SourceType =
  | 'IN_GAME_EVIDENCE'
  | 'IMAGE_VIDEO_EVIDENCE'
  | 'OCR_EXTRACTION'
  | 'PRELIMINARY_NOTES'
  | 'UNKNOWN';

export interface RangeReferenceEntry {
  id: string;
  mortarId: 'm252_81mm' | '2b14_82mm';
  mortarName: string;
  ammunitionId: string;
  ammunitionDesignation: string;
  ammunitionCategory: 'HE' | 'SMOKE' | 'ILLUM' | 'PRACTICE';
  categoryLabelEn: string;
  categoryLabelAr: string;
  chargeRing: number;
  chargeName: string;
  minimumRangeMeters: number | null;
  maximumRangeMeters: number | null;
  verificationStatus: VerificationStatus;
  sourceReference: string;
  sourceType: SourceType;
  notesEn: string;
  notesAr: string;
  isConflicting?: boolean;
  conflictingDetailsEn?: string;
  conflictingDetailsAr?: string;
}

export interface MortarAmmunitionProfile {
  id: string;
  designation: string;
  category: 'HE' | 'SMOKE' | 'ILLUM' | 'PRACTICE';
  categoryFullEn: string;
  categoryFullAr: string;
  weightKg: number | null;
  fuzeType: string;
  descriptionEn: string;
  descriptionAr: string;
  verificationStatus: VerificationStatus;
  entries: RangeReferenceEntry[];
}

export interface MortarSystemProfile {
  id: 'm252_81mm' | '2b14_82mm';
  designation: string;
  countryEn: string;
  countryAr: string;
  faction: string;
  caliber: string;
  milsPerCircle: number;
  angularSystemEn: string;
  angularSystemAr: string;
  sightUnitEn: string;
  sightUnitAr: string;
  minimumElevationMil: number;
  maximumElevationMil: number;
  minimumElevationDeg: number;
  maximumElevationDeg: number;
  elevationDisplayMilDeg: string;
  overallStatus: VerificationStatus;
  sourceInfoEn: string;
  sourceInfoAr: string;
  overviewEn: string;
  overviewAr: string;
  ammunition: MortarAmmunitionProfile[];
  notesEn: string[];
  notesAr: string[];
  requiredEvidenceEn: string[];
  requiredEvidenceAr: string[];
}

// ============================================================================
// 1. AMERICAN M252 81mm MORTAR SPECIFICATIONS & RANGE TABLES
// ============================================================================

export const M252_PROFILE: MortarSystemProfile = {
  id: 'm252_81mm',
  designation: 'M252 81mm Mortar',
  countryEn: 'United States (NATO Standard)',
  countryAr: 'الولايات المتحدة (معيار حلف الناتو)',
  faction: 'US Army',
  caliber: '81 mm',
  milsPerCircle: 6400,
  angularSystemEn: '6400 mils per full circle (NATO Mil System)',
  angularSystemAr: '٦٤٠٠ مل لكل دورة كاملة (نظام مل حلف الناتو)',
  sightUnitEn: 'M67 Sight Unit (Mils azimuth & elevation micrometer)',
  sightUnitAr: 'وحدة التسديد M67 (ميكرومتر السمت وزاوية الارتفاع بالمل)',
  minimumElevationMil: 800,
  maximumElevationMil: 1515,
  minimumElevationDeg: 45.0,
  maximumElevationDeg: 85.2,
  elevationDisplayMilDeg: '800 mil ≈ 45.0° to 1515 mil ≈ 85.2°',
  overallStatus: 'VERIFIED',
  sourceInfoEn: 'Official Arma Reforger clipboard firing tables, M67 sight reticle limits, and confirmed vanilla in-game ballistics.',
  sourceInfoAr: 'جداول الرماية الرسمية لحافظة Arma Reforger، وحدود تدريج منظار التسديد M67، والبيانات البالستية المؤكدة داخل اللعبة الأصلية.',
  overviewEn: 'Standard smoothbore battalion mortar fielded by the US Army. Operates on high-angle indirect fire trajectories using 0 to 4 removable propellant charge rings attached to the fin assembly. Verified in-game ranges extend from 50 meters (Charge 0) to 2,900 meters (Charge 4).',
  overviewAr: 'الهاون الأملس القياسي لكتائب المشاة بالجيش الأمريكي. يعمل بمسارات رماية تكتيكية عالية الزاوية باستخدام حلقات شحنة دافعة قابلة للنزع من ٠ إلى ٤ مثبتة على زعانف المقذوف. المدى المؤكد داخل اللعبة يمتد من ٥٠ متراً (الشحنة ٠) حتى ٢٩٠٠ متر (الشحنة ٤).',
  ammunition: [
    {
      id: 'M821_HE',
      designation: 'M821 HE',
      category: 'HE',
      categoryFullEn: 'M821 HE — High Explosive / Fragmentation',
      categoryFullAr: 'M821 HE — شديد الانفجار والشظايا',
      weightKg: 4.06,
      fuzeType: 'M734 Multi-Option Fuze (PRX / NSB / IMP / DLY)',
      descriptionEn: 'High-explosive fragmentation bomb filled with Composition B. Primary anti-personnel and light fortification munition.',
      descriptionAr: 'قذيفة متفجرة متشظية محشوة بمركب Composition B. مخصصة ضد الأفراد والتحصينات الخفيفة والمركبات المكشوفة.',
      verificationStatus: 'VERIFIED',
      entries: [
        {
          id: 'm252_m821_c0',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M821_HE',
          ammunitionDesignation: 'M821 HE',
          ammunitionCategory: 'HE',
          categoryLabelEn: 'High Explosive',
          categoryLabelAr: 'شديد الانفجار',
          chargeRing: 0,
          chargeName: '0 Rings (Charge 0)',
          minimumRangeMeters: 50,
          maximumRangeMeters: 500,
          verificationStatus: 'VERIFIED',
          sourceReference: 'In-game clipboard instruction sheet & M67 firing table',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Primary ignition cartridge only. Elevation range: 1456 mil (50m) to 927 mil (500m). TOF: 15.0s to 12.4s.',
          notesAr: 'كبسولة الإشعال الأولية فقط. زاوية الارتفاع: ١٤٥٦ مل (٥٠م) إلى ٩٢٧ مل (٥٠٠م). زمن الطيران: ١٥.٠ث إلى ١٢.٤ث.',
        },
        {
          id: 'm252_m821_c1',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M821_HE',
          ammunitionDesignation: 'M821 HE',
          ammunitionCategory: 'HE',
          categoryLabelEn: 'High Explosive',
          categoryLabelAr: 'شديد الانفجار',
          chargeRing: 1,
          chargeName: '1 Ring (Charge 1)',
          minimumRangeMeters: 100,
          maximumRangeMeters: 1100,
          verificationStatus: 'VERIFIED',
          sourceReference: 'In-game clipboard instruction sheet & M67 firing table',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Single propellant ring. Elevation range: 1446 mil (100m) to 846 mil (1100m). Muzzle velocity: 115 m/s.',
          notesAr: 'حلقة دافعة واحدة. زاوية الارتفاع: ١٤٤٦ مل (١٠٠م) إلى ٨٤٦ مل (١١٠٠م). السرعة الفوهية: ١١٥ م/ث.',
        },
        {
          id: 'm252_m821_c2',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M821_HE',
          ammunitionDesignation: 'M821 HE',
          ammunitionCategory: 'HE',
          categoryLabelEn: 'High Explosive',
          categoryLabelAr: 'شديد الانفجار',
          chargeRing: 2,
          chargeName: '2 Rings (Charge 2)',
          minimumRangeMeters: 200,
          maximumRangeMeters: 1800,
          verificationStatus: 'VERIFIED',
          sourceReference: 'In-game clipboard instruction sheet & M67 firing table',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Two propellant rings. Elevation range: 1448 mil (200m) to 842 mil (1800m). Muzzle velocity: 165 m/s.',
          notesAr: 'حلقتان دافعتان. زاوية الارتفاع: ١٤٤٨ مل (٢٠٠م) إلى ٨٤٢ مل (١٨٠٠م). السرعة الفوهية: ١٦٥ م/ث.',
        },
        {
          id: 'm252_m821_c3',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M821_HE',
          ammunitionDesignation: 'M821 HE',
          ammunitionCategory: 'HE',
          categoryLabelEn: 'High Explosive',
          categoryLabelAr: 'شديد الانفجار',
          chargeRing: 3,
          chargeName: '3 Rings (Charge 3)',
          minimumRangeMeters: 300,
          maximumRangeMeters: 2400,
          verificationStatus: 'VERIFIED',
          sourceReference: 'In-game clipboard instruction sheet & M67 firing table',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Three propellant rings. Elevation range: 1441 mil (300m) to 852 mil (2400m). Muzzle velocity: 215 m/s.',
          notesAr: 'ثلاث حلقات دافعة. زاوية الارتفاع: ١٤٤١ مل (٣٠٠م) إلى ٨٥٢ مل (٢٤٠٠م). السرعة الفوهية: ٢١٥ م/ث.',
        },
        {
          id: 'm252_m821_c4',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M821_HE',
          ammunitionDesignation: 'M821 HE',
          ammunitionCategory: 'HE',
          categoryLabelEn: 'High Explosive',
          categoryLabelAr: 'شديد الانفجار',
          chargeRing: 4,
          chargeName: '4 Rings (Charge 4)',
          minimumRangeMeters: 400,
          maximumRangeMeters: 2900,
          verificationStatus: 'VERIFIED',
          sourceReference: 'In-game clipboard instruction sheet & M67 firing table',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Maximum charge configuration (4 rings). Elevation range: 1442 mil (400m) to 850 mil (2900m). Peak altitude 1680m.',
          notesAr: 'التكوين الأقصى للشحنات (٤ حلقات). زاوية الارتفاع: ١٤٤٢ مل (٤٠٠م) إلى ٨٥٠ مل (٢٩٠٠م). أقصى ارتفاع للمسار ١٦٨٠م.',
        },
      ],
    },
    {
      id: 'M819_SMOKE',
      designation: 'M819 Smoke',
      category: 'SMOKE',
      categoryFullEn: 'M819 Smoke — Red Phosphorus Screening Smoke',
      categoryFullAr: 'M819 Smoke — دخان الفوسفور الأحمر للحجب والتعمية',
      weightKg: 4.54,
      fuzeType: 'M772 Mechanical Time Superquick',
      descriptionEn: 'Red phosphorus smoke canister munition providing thermal-screening obscurant curtain across the target area.',
      descriptionAr: 'قذيفة دخانية بحشوة الفوسفور الأحمر لتوفير ستائر دخانية كثيفة لحجب الرؤية عن العدو وتغطية التحركات التكتيكية.',
      verificationStatus: 'PARTIALLY_VERIFIED',
      entries: [
        {
          id: 'm252_m819_c0',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M819_SMOKE',
          ammunitionDesignation: 'M819 Smoke',
          ammunitionCategory: 'SMOKE',
          categoryLabelEn: 'Smoke',
          categoryLabelAr: 'دخان',
          chargeRing: 0,
          chargeName: '0 Rings (Charge 0)',
          minimumRangeMeters: 50,
          maximumRangeMeters: 500,
          verificationStatus: 'PARTIALLY_VERIFIED',
          sourceReference: 'Standard M252 propellant ring specification & preliminary ballistic notes',
          sourceType: 'PRELIMINARY_NOTES',
          notesEn: 'Ballistic trajectory follows M821 propellant increments. Smoke expulsion and burn timing require further live testing.',
          notesAr: 'المسار البالستي يتبع زيادات شحنات M821. زمن انتشار الدخان وتفريغه يتطلب مزيداً من الاختبارات الحية داخل اللعبة.',
        },
        {
          id: 'm252_m819_c1',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M819_SMOKE',
          ammunitionDesignation: 'M819 Smoke',
          ammunitionCategory: 'SMOKE',
          categoryLabelEn: 'Smoke',
          categoryLabelAr: 'دخان',
          chargeRing: 1,
          chargeName: '1 Ring (Charge 1)',
          minimumRangeMeters: 100,
          maximumRangeMeters: 1100,
          verificationStatus: 'PARTIALLY_VERIFIED',
          sourceReference: 'Standard M252 propellant ring specification & preliminary ballistic notes',
          sourceType: 'PRELIMINARY_NOTES',
          notesEn: 'Nominal charge 1 bracket. Ballistic calculation is aligned with HE standard in vanilla baseline.',
          notesAr: 'نطاق الشحنة ١ النظري. الحسابات البالستية متطابقة مع معيار القذائف المتفجرة في اللعبة الأصلية.',
        },
        {
          id: 'm252_m819_c2',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M819_SMOKE',
          ammunitionDesignation: 'M819 Smoke',
          ammunitionCategory: 'SMOKE',
          categoryLabelEn: 'Smoke',
          categoryLabelAr: 'دخان',
          chargeRing: 2,
          chargeName: '2 Rings (Charge 2)',
          minimumRangeMeters: 200,
          maximumRangeMeters: 1800,
          verificationStatus: 'PARTIALLY_VERIFIED',
          sourceReference: 'Standard M252 propellant ring specification & preliminary ballistic notes',
          sourceType: 'PRELIMINARY_NOTES',
          notesEn: 'Nominal charge 2 bracket. Trajectory verified against projectile mass; cloud duration pending verification.',
          notesAr: 'نطاق الشحنة ٢ النظري. تم التحقق من المسار مقارنة بكتلة المقذوف؛ مدة بقاء السحابة قيد التحقق.',
        },
        {
          id: 'm252_m819_c3',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M819_SMOKE',
          ammunitionDesignation: 'M819 Smoke',
          ammunitionCategory: 'SMOKE',
          categoryLabelEn: 'Smoke',
          categoryLabelAr: 'دخان',
          chargeRing: 3,
          chargeName: '3 Rings (Charge 3)',
          minimumRangeMeters: 300,
          maximumRangeMeters: 2400,
          verificationStatus: 'PARTIALLY_VERIFIED',
          sourceReference: 'Standard M252 propellant ring specification & preliminary ballistic notes',
          sourceType: 'PRELIMINARY_NOTES',
          notesEn: 'Nominal charge 3 bracket. High-altitude airburst dispersion requires fuze coordination.',
          notesAr: 'نطاق الشحنة ٣ النظري. التشتت الناتج عن الانفجار الجوي على ارتفاع عالٍ يتطلب ضبط الصاعق.',
        },
        {
          id: 'm252_m819_c4',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M819_SMOKE',
          ammunitionDesignation: 'M819 Smoke',
          ammunitionCategory: 'SMOKE',
          categoryLabelEn: 'Smoke',
          categoryLabelAr: 'دخان',
          chargeRing: 4,
          chargeName: '4 Rings (Charge 4)',
          minimumRangeMeters: 400,
          maximumRangeMeters: 2900,
          verificationStatus: 'PARTIALLY_VERIFIED',
          sourceReference: 'Standard M252 propellant ring specification & preliminary ballistic notes',
          sourceType: 'PRELIMINARY_NOTES',
          notesEn: 'Maximum range envelope. Preliminary ranges match M821 table; wind drift sensitivity is elevated.',
          notesAr: 'أقصى مدى رماية. الأمدية الأولية تطابق جدول M821؛ الحساسية لانحراف الرياح مرتفعة.',
        },
      ],
    },
    {
      id: 'M853A1_ILLUM',
      designation: 'M853A1 Illumination',
      category: 'ILLUM',
      categoryFullEn: 'M853A1 Illumination — Parachute Candle Flare',
      categoryFullAr: 'M853A1 Illumination — مشعل إنارة بالمظلة الهابطة',
      weightKg: 4.31,
      fuzeType: 'M772 Mechanical Time Fuze (0 to 55 seconds)',
      descriptionEn: 'Parachute-suspended illuminating flare providing ~600,000 candlepower battlefield illumination for night operations.',
      descriptionAr: 'مشعل إضاءة معلق بمظلة يوفر شدة إضاءة تقارب ٦٠٠ ألف شمعة لإضاءة مسرح العمليات والتصويب أثناء العمليات الليلية.',
      verificationStatus: 'PARTIALLY_VERIFIED',
      entries: [
        {
          id: 'm252_m853_c0',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M853A1_ILLUM',
          ammunitionDesignation: 'M853A1 Illumination',
          ammunitionCategory: 'ILLUM',
          categoryLabelEn: 'Illumination',
          categoryLabelAr: 'إنارة',
          chargeRing: 0,
          chargeName: '0 Rings (Charge 0)',
          minimumRangeMeters: 50,
          maximumRangeMeters: 500,
          verificationStatus: 'PARTIALLY_VERIFIED',
          sourceReference: 'M67 range table & M772 mechanical time fuze specification',
          sourceType: 'PRELIMINARY_NOTES',
          notesEn: 'Short-range illumination. Burn duration ~60 seconds. Minimum ejection altitude recommended at 350m AGL.',
          notesAr: 'إنارة قريبة المدى. مدة الإضاءة حوالي ٦٠ ثانية. الارتفاع الأدنى لفتح المظلة الموصى به هو ٣٥٠ متراً فوق سطح الأرض.',
        },
        {
          id: 'm252_m853_c1',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M853A1_ILLUM',
          ammunitionDesignation: 'M853A1 Illumination',
          ammunitionCategory: 'ILLUM',
          categoryLabelEn: 'Illumination',
          categoryLabelAr: 'إنارة',
          chargeRing: 1,
          chargeName: '1 Ring (Charge 1)',
          minimumRangeMeters: 100,
          maximumRangeMeters: 1100,
          verificationStatus: 'PARTIALLY_VERIFIED',
          sourceReference: 'M67 range table & M772 mechanical time fuze specification',
          sourceType: 'PRELIMINARY_NOTES',
          notesEn: 'Charge 1 illumination bracket. Fuze time setting correlates with TOF table.',
          notesAr: 'نطاق الشحنة ١ للإنارة. توقيت الصاعق الميكانيكي يتطابق مع جدول زمن الطيران (TOF).',
        },
        {
          id: 'm252_m853_c2',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M853A1_ILLUM',
          ammunitionDesignation: 'M853A1 Illumination',
          ammunitionCategory: 'ILLUM',
          categoryLabelEn: 'Illumination',
          categoryLabelAr: 'إنارة',
          chargeRing: 2,
          chargeName: '2 Rings (Charge 2)',
          minimumRangeMeters: 200,
          maximumRangeMeters: 1800,
          verificationStatus: 'PARTIALLY_VERIFIED',
          sourceReference: 'M67 range table & M772 mechanical time fuze specification',
          sourceType: 'PRELIMINARY_NOTES',
          notesEn: 'Mid-range illumination. Deployment apex reaches ~800m altitude.',
          notesAr: 'إنارة متوسطة المدى. قمة المسار لفتح المشعل تصل إلى حوالي ٨٠٠ متر.',
        },
        {
          id: 'm252_m853_c3',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M853A1_ILLUM',
          ammunitionDesignation: 'M853A1 Illumination',
          ammunitionCategory: 'ILLUM',
          categoryLabelEn: 'Illumination',
          categoryLabelAr: 'إنارة',
          chargeRing: 3,
          chargeName: '3 Rings (Charge 3)',
          minimumRangeMeters: 300,
          maximumRangeMeters: 2400,
          verificationStatus: 'PARTIALLY_VERIFIED',
          sourceReference: 'M67 range table & M772 mechanical time fuze specification',
          sourceType: 'PRELIMINARY_NOTES',
          notesEn: 'Long-range illumination bracket. Wind drift can displace parachute up to 200m.',
          notesAr: 'نطاق الإنارة بعيدة المدى. انجراف الرياح قد يزيح المظلة الهابطة حتى ٢٠٠ متر.',
        },
        {
          id: 'm252_m853_c4',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M853A1_ILLUM',
          ammunitionDesignation: 'M853A1 Illumination',
          ammunitionCategory: 'ILLUM',
          categoryLabelEn: 'Illumination',
          categoryLabelAr: 'إنارة',
          chargeRing: 4,
          chargeName: '4 Rings (Charge 4)',
          minimumRangeMeters: 400,
          maximumRangeMeters: 2900,
          verificationStatus: 'PARTIALLY_VERIFIED',
          sourceReference: 'M67 range table & M772 mechanical time fuze specification',
          sourceType: 'PRELIMINARY_NOTES',
          notesEn: 'Maximum envelope. Fuze setting must account for descending trajectory time.',
          notesAr: 'أقصى مدى للإنارة. يجب ضبط الصاعق لمراعاة توقيت المسار الهابط لتجنب الاصطدام قبل الاشتعال.',
        },
      ],
    },
    {
      id: 'M879_PRACTICE',
      designation: 'M879 Practice',
      category: 'PRACTICE',
      categoryFullEn: 'M879 Practice — Full-Range Training Cartridge',
      categoryFullAr: 'M879 Practice — مقذوف تدريبي كامل المدى',
      weightKg: 4.08,
      fuzeType: 'M744 Practice Point Detonating Fuze (Spotting Charge)',
      descriptionEn: 'Full-range training round with inert body and small black powder spotting charge. Identical ballistics to M821 HE.',
      descriptionAr: 'قذيفة تدريبية كاملة المدى بجسم خامل وشحنة كشف دخانية صغيرة لتحديد نقطة السقوط. خصائصها البالستية مطابقة للـ M821 HE.',
      verificationStatus: 'VERIFIED',
      entries: [
        {
          id: 'm252_m879_c0',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M879_PRACTICE',
          ammunitionDesignation: 'M879 Practice',
          ammunitionCategory: 'PRACTICE',
          categoryLabelEn: 'Practice',
          categoryLabelAr: 'تدريب',
          chargeRing: 0,
          chargeName: '0 Rings (Charge 0)',
          minimumRangeMeters: 50,
          maximumRangeMeters: 500,
          verificationStatus: 'VERIFIED',
          sourceReference: 'US Army Technical Manual TM 9-1015-249-10 & in-game tests',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Short-range training with spotting signature. Identical to M821 Charge 0 table.',
          notesAr: 'تدريب قصير المدى مع علامة دخانية للمراقبة. مطابق لجدول الشحنة ٠ لقذيفة M821.',
        },
        {
          id: 'm252_m879_c1',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M879_PRACTICE',
          ammunitionDesignation: 'M879 Practice',
          ammunitionCategory: 'PRACTICE',
          categoryLabelEn: 'Practice',
          categoryLabelAr: 'تدريب',
          chargeRing: 1,
          chargeName: '1 Ring (Charge 1)',
          minimumRangeMeters: 100,
          maximumRangeMeters: 1100,
          verificationStatus: 'VERIFIED',
          sourceReference: 'US Army Technical Manual TM 9-1015-249-10 & in-game tests',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Identical ballistic arc and time of flight to M821 Charge 1.',
          notesAr: 'قوس بالستي وزمن طيران متطابقان تماماً مع الشحنة ١ لقذيفة M821.',
        },
        {
          id: 'm252_m879_c2',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M879_PRACTICE',
          ammunitionDesignation: 'M879 Practice',
          ammunitionCategory: 'PRACTICE',
          categoryLabelEn: 'Practice',
          categoryLabelAr: 'تدريب',
          chargeRing: 2,
          chargeName: '2 Rings (Charge 2)',
          minimumRangeMeters: 200,
          maximumRangeMeters: 1800,
          verificationStatus: 'VERIFIED',
          sourceReference: 'US Army Technical Manual TM 9-1015-249-10 & in-game tests',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Mid-range training. Elevation range: 1448 mil to 842 mil.',
          notesAr: 'تدريب متوسط المدى. زاوية الارتفاع: من ١٤٤٨ مل إلى ٨٤٢ مل.',
        },
        {
          id: 'm252_m879_c3',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M879_PRACTICE',
          ammunitionDesignation: 'M879 Practice',
          ammunitionCategory: 'PRACTICE',
          categoryLabelEn: 'Practice',
          categoryLabelAr: 'تدريب',
          chargeRing: 3,
          chargeName: '3 Rings (Charge 3)',
          minimumRangeMeters: 300,
          maximumRangeMeters: 2400,
          verificationStatus: 'VERIFIED',
          sourceReference: 'US Army Technical Manual TM 9-1015-249-10 & in-game tests',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Long-range training cartridge. Matches M821 Charge 3 table.',
          notesAr: 'مقذوف تدريبي بعيد المدى. مطابق تماماً لجدول الشحنة ٣ لقذيفة M821.',
        },
        {
          id: 'm252_m879_c4',
          mortarId: 'm252_81mm',
          mortarName: 'M252 81mm',
          ammunitionId: 'M879_PRACTICE',
          ammunitionDesignation: 'M879 Practice',
          ammunitionCategory: 'PRACTICE',
          categoryLabelEn: 'Practice',
          categoryLabelAr: 'تدريب',
          chargeRing: 4,
          chargeName: '4 Rings (Charge 4)',
          minimumRangeMeters: 400,
          maximumRangeMeters: 2900,
          verificationStatus: 'VERIFIED',
          sourceReference: 'US Army Technical Manual TM 9-1015-249-10 & in-game tests',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Maximum range practice envelope. Elevation range: 1442 mil to 850 mil.',
          notesAr: 'النطاق الأقصى لمدى التدريب. زاوية الارتفاع: من ١٤٤٢ مل إلى ٨٥٠ مل.',
        },
      ],
    },
  ],
  notesEn: [
    'All M821 HE and M879 ranges have been verified 1:1 against the official in-game manual clipboard tables.',
    'Angular system strictly adheres to the 6400 NATO mil circle (360° = 6400 mil, 1 mil ≈ 0.05625°).',
    'Elevation limits are mechanically restricted to [800 mil, 1515 mil] ≈ [45.0°, 85.2°].',
  ],
  notesAr: [
    'تم التحقق من كافة أمدية M821 HE و M879 بشكل مطابق ١:١ مع جداول الحافظة اليدوية الرسمية داخل اللعبة.',
    'نظام قياس الزوايا يلتزم بصرامة بنظام حلف الناتو ٦٤٠٠ مل (٣٦٠° = ٦٤٠٠ مل، ١ مل ≈ ٠.٠٥٦٢٥ درجة).',
    'حدود الارتفاع مقيدة ميكانيكياً بين [٨٠٠ مل، ١٥١٥ مل] ≈ [٤٥.٠°، ٨٥.٢°].',
  ],
  requiredEvidenceEn: [
    'Live in-game telemetry verification for M819 smoke cloud longevity and opacity.',
    'Live in-game verification for M853A1 illumination candle descent rate and effective lux radius.',
  ],
  requiredEvidenceAr: [
    'التحقق من البيانات الحية داخل اللعبة لمدة بقاء سحابة دخان M819 وكثافتها البصرية.',
    'التحقق المباشر من معدل هبوط مظلة مشعل M853A1 ونصف قطر الإنارة الفعال.',
  ],
};

// ============================================================================
// 2. RUSSIAN 2B14 82mm MORTAR SPECIFICATIONS & RANGE TABLES
// ============================================================================

export const PODNOS_2B14_PROFILE: MortarSystemProfile = {
  id: '2b14_82mm',
  designation: '2B14 82mm Mortar',
  countryEn: 'Soviet Union / Warsaw Pact',
  countryAr: 'الاتحاد السوفيتي / حلف وارسو',
  faction: 'Soviet Army',
  caliber: '82 mm',
  milsPerCircle: 6000,
  angularSystemEn: '6000 mils per full circle (Warsaw Pact Russian Mil System)',
  angularSystemAr: '٦٠٠٠ مل لكل دورة كاملة (نظام مل حلف وارسو السوفيتي)',
  sightUnitEn: 'MPM-44M Sight Unit (Optical collimator & leveling bubbles)',
  sightUnitAr: 'وحدة التسديد MPM-44M (منظار بصري وفقاعات موازنة أفقية وعمودية)',
  minimumElevationMil: 748,
  maximumElevationMil: 1415,
  minimumElevationDeg: 44.9,
  maximumElevationDeg: 84.9,
  elevationDisplayMilDeg: '748 mil ≈ 44.9° to 1415 mil ≈ 84.9°',
  overallStatus: 'PARTIALLY_VERIFIED',
  sourceInfoEn: 'Official Arma Reforger 2B14 range card clipboard, MPM-44M sight graduation limits, and documented source observations.',
  sourceInfoAr: 'بطاقة رماية هاون 2B14 الرسمية في حافظة Arma Reforger، وحدود تدريج منظار MPM-44M، والملاحظات المرجعية الموثقة.',
  overviewEn: 'Soviet-designed 82mm smoothbore light battalion mortar ("Podnos"). Employs Warsaw Pact 6000 mil angular convention. Recorded elevation limits are 748 mil (44.9°) to 1415 mil (84.9°). Confirmed vanilla ranges span from 80 meters (Charge 0) to 2,300 meters (Charge 4).',
  overviewAr: 'هاون خفيف عيار ٨٢ ملم أملس السبطانة سوفيتي الصنع ("بودنس"). يعتمد نظام حلف وارسو البالغ ٦٠٠٠ مل للدورة الواحدة. حدود زوايا الارتفاع المسجلة هي ٧٤٨ مل (٤٤.٩°) إلى ١٤١٥ مل (٨٤.٩°). الأمدية المؤكدة في اللعبة الأصلية تمتد من ٨٠ متراً (الشحنة ٠) إلى ٢٣٠٠ متر (الشحنة ٤).',
  ammunition: [
    {
      id: 'O832DU_HE',
      designation: 'O-832DU',
      category: 'HE',
      categoryFullEn: 'O-832DU — High Explosive / Fragmentation',
      categoryFullAr: 'O-832DU — قذيفة متفجرة متشظية (HE-FRAG)',
      weightKg: 3.1,
      fuzeType: 'M-6 Point Detonating Fuze (Instantaneous & Delay)',
      descriptionEn: 'Standard Soviet cast-iron high-explosive fragmentation finned mortar bomb with M-6 impact nose fuze.',
      descriptionAr: 'القذيفة السوفيتية القياسية من الحديد الزهر شديدة الانفجار المتشظية ذات الزعانف مع صاعق اصطدامي طرازي M-6 فوري أو تأخيري.',
      verificationStatus: 'VERIFIED',
      entries: [
        {
          id: 'podnos_o832_c0',
          mortarId: '2b14_82mm',
          mortarName: '2B14 82mm',
          ammunitionId: 'O832DU_HE',
          ammunitionDesignation: 'O-832DU',
          ammunitionCategory: 'HE',
          categoryLabelEn: 'High Explosive',
          categoryLabelAr: 'شديد الانفجار',
          chargeRing: 0,
          chargeName: '0 Rings (Charge 0)',
          minimumRangeMeters: 80,
          maximumRangeMeters: 450,
          verificationStatus: 'VERIFIED',
          sourceReference: 'Official 2B14 in-game manual table',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Basic ignition cartridge only. Elevation range: 1393 mil (80m) to 911 mil (450m). TOF: 13.9s to 11.2s.',
          notesAr: 'كبسولة الإشعال الأساسية فقط. زاوية الارتفاع: ١٣٩٣ مل (٨٠م) إلى ٩١١ مل (٤٥٠م). زمن الطيران: ١٣.٩ث إلى ١١.٢ث.',
        },
        {
          id: 'podnos_o832_c1',
          mortarId: '2b14_82mm',
          mortarName: '2B14 82mm',
          ammunitionId: 'O832DU_HE',
          ammunitionDesignation: 'O-832DU',
          ammunitionCategory: 'HE',
          categoryLabelEn: 'High Explosive',
          categoryLabelAr: 'شديد الانفجار',
          chargeRing: 1,
          chargeName: '1 Ring (Charge 1)',
          minimumRangeMeters: 150,
          maximumRangeMeters: 900,
          verificationStatus: 'VERIFIED',
          sourceReference: 'Official 2B14 in-game manual table',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'One supplementary propellant ring. Elevation range: 1390 mil (150m) to 874 mil (900m). Muzzle velocity: 110 m/s.',
          notesAr: 'حلقة شحنة إضافية واحدة. زاوية الارتفاع: ١٣٩٠ مل (١٥٠م) إلى ٨٧٤ مل (٩٠٠م). السرعة الفوهية: ١١٠ م/ث.',
        },
        {
          id: 'podnos_o832_c2',
          mortarId: '2b14_82mm',
          mortarName: '2B14 82mm',
          ammunitionId: 'O832DU_HE',
          ammunitionDesignation: 'O-832DU',
          ammunitionCategory: 'HE',
          categoryLabelEn: 'High Explosive',
          categoryLabelAr: 'شديد الانفجار',
          chargeRing: 2,
          chargeName: '2 Rings (Charge 2)',
          minimumRangeMeters: 250,
          maximumRangeMeters: 1400,
          verificationStatus: 'VERIFIED',
          sourceReference: 'Official 2B14 in-game manual table',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Two propellant rings. Elevation range: 1386 mil (250m) to 861 mil (1400m). Muzzle velocity: 145 m/s.',
          notesAr: 'حلقتان دافعتان. زاوية الارتفاع: ١٣٨٦ مل (٢٥٠م) إلى ٨٦١ مل (١٤٠٠م). السرعة الفوهية: ١٤٥ م/ث.',
        },
        {
          id: 'podnos_o832_c3',
          mortarId: '2b14_82mm',
          mortarName: '2B14 82mm',
          ammunitionId: 'O832DU_HE',
          ammunitionDesignation: 'O-832DU',
          ammunitionCategory: 'HE',
          categoryLabelEn: 'High Explosive',
          categoryLabelAr: 'شديد الانفجار',
          chargeRing: 3,
          chargeName: '3 Rings (Charge 3)',
          minimumRangeMeters: 350,
          maximumRangeMeters: 1800,
          verificationStatus: 'VERIFIED',
          sourceReference: 'Official 2B14 in-game manual table',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Three propellant rings. Elevation range: 1378 mil (350m) to 840 mil (1800m). Muzzle velocity: 180 m/s.',
          notesAr: 'ثلاث حلقات دافعة. زاوية الارتفاع: ١٣٧٨ مل (٣٥٠م) إلى ٨٤٠ مل (١٨٠٠م). السرعة الفوهية: ١٨٠ م/ث.',
        },
        {
          id: 'podnos_o832_c4',
          mortarId: '2b14_82mm',
          mortarName: '2B14 82mm',
          ammunitionId: 'O832DU_HE',
          ammunitionDesignation: 'O-832DU',
          ammunitionCategory: 'HE',
          categoryLabelEn: 'High Explosive',
          categoryLabelAr: 'شديد الانفجار',
          chargeRing: 4,
          chargeName: '4 Long Range (Charge 4)',
          minimumRangeMeters: 400,
          maximumRangeMeters: 2300,
          verificationStatus: 'VERIFIED',
          sourceReference: 'Official 2B14 in-game manual table',
          sourceType: 'IN_GAME_EVIDENCE',
          notesEn: 'Maximum documented charge. Elevation range: 1410 mil (400m) to 750 mil (2300m). Peak altitude 1350m.',
          notesAr: 'الشحنة القصوى الموثقة. زاوية الارتفاع: ١٤١٠ مل (٤٠٠م) إلى ٧٥٠ مل (٢٣٠٠م). أقصى ارتفاع للمسار ١٣٥٠ متراً.',
        },
        {
          id: 'podnos_o832_conflict_obs',
          mortarId: '2b14_82mm',
          mortarName: '2B14 82mm',
          ammunitionId: 'O832DU_HE',
          ammunitionDesignation: 'O-832DU',
          ammunitionCategory: 'HE',
          categoryLabelEn: 'High Explosive (Conflicting Note)',
          categoryLabelAr: 'شديد الانفجار (ملاحظة متعارضة)',
          chargeRing: 4,
          chargeName: 'Unverified 2600m Telemetry Observation',
          minimumRangeMeters: 400,
          maximumRangeMeters: 2600,
          verificationStatus: 'CONFLICTING',
          sourceReference: 'Preliminary community telemetry and uncertain text extraction',
          sourceType: 'OCR_EXTRACTION',
          notesEn: 'Conflicting observation: Some preliminary readings claimed a maximum elevation of 1422 mils and reach up to 2600m. This directly conflicts with the confirmed MPM-44M mechanical limit of 1415 mils and the official 2300m range table. Preserved as an unverified observation; do not treat as confirmed.',
          notesAr: 'ملاحظة متعارضة: زعمت بعض القراءات الأولية أن الحد الأقصى للارتفاع يصل إلى ١٤٢٢ مل والمدى إلى ٢٦٠٠م. هذا يتعارض بشكل مباشر مع الحد الميكانيكي المؤكد لمنظار MPM-44M البالغ ١٤١٥ مل وجدول الرماية الرسمي (٢٣٠٠م). تم حفظها كملاحظة مرجعية غير مؤكدة؛ لا تعتمد كحقيقة مؤكدة.',
          isConflicting: true,
          conflictingDetailsEn: 'Source claims 1422 mils / 2600m vs confirmed in-game 1415 mils / 2300m limit.',
          conflictingDetailsAr: 'المصدر الأولي يزعم ١٤٢٢ مل / ٢٦٠٠م مقابل الحد المؤكد داخل اللعبة ١٤١٥ مل / ٢٣٠٠م.',
        },
      ],
    },
    {
      id: 'D832DU_SMOKE',
      designation: 'D-832DU',
      category: 'SMOKE',
      categoryFullEn: 'D-832DU — Smoke Obscurant Shell',
      categoryFullAr: 'D-832DU — قذيفة دخانية للتعمية وحجب الرؤية',
      weightKg: 3.25,
      fuzeType: 'M-6 / MP-82 Smoke Expulsion Fuze',
      descriptionEn: 'Soviet 82mm smoke mortar shell containing white phosphorus / hexachloroethane smoke composition.',
      descriptionAr: 'قذيفة هاون دخانية سوفيتية عيار ٨٢ ملم تحتوي على مركب الفوسفور الأبيض وحمض سداسي كلورو الإيثان لإنشاء حواجز دخانية.',
      verificationStatus: 'UNVERIFIED',
      entries: [
        {
          id: 'podnos_d832_c0',
          mortarId: '2b14_82mm',
          mortarName: '2B14 82mm',
          ammunitionId: 'D832DU_SMOKE',
          ammunitionDesignation: 'D-832DU',
          ammunitionCategory: 'SMOKE',
          categoryLabelEn: 'Smoke',
          categoryLabelAr: 'دخان',
          chargeRing: 0,
          chargeName: '0 Rings (Charge 0)',
          minimumRangeMeters: 80,
          maximumRangeMeters: 450,
          verificationStatus: 'UNVERIFIED',
          sourceReference: 'Preliminary Soviet weapon notes (Arma Reforger in-game card unconfirmed)',
          sourceType: 'PRELIMINARY_NOTES',
          notesEn: 'Values listed as "Not verified". Nominal range assumes shared propellant increments with O-832DU, but requires in-game confirmation.',
          notesAr: 'القيم مسجلة كـ "غير مؤكدة". المدى النظري يفترض استخدام شحنات مشتركة مع O-832DU، لكنه يتطلب تأكيداً مباشراً داخل اللعبة.',
        },
        {
          id: 'podnos_d832_c1_4',
          mortarId: '2b14_82mm',
          mortarName: '2B14 82mm',
          ammunitionId: 'D832DU_SMOKE',
          ammunitionDesignation: 'D-832DU',
          ammunitionCategory: 'SMOKE',
          categoryLabelEn: 'Smoke',
          categoryLabelAr: 'دخان',
          chargeRing: 1,
          chargeName: 'Charges 1 through 4',
          minimumRangeMeters: null,
          maximumRangeMeters: null,
          verificationStatus: 'UNVERIFIED',
          sourceReference: 'Missing verified in-game telemetry',
          sourceType: 'UNKNOWN',
          notesEn: 'Not verified. Exact ballistic drag and wind displacement limits for D-832DU smoke shells in Arma Reforger are currently unavailable in source data.',
          notesAr: 'غير مؤكدة. جداول السحب البالستي وانجراف الرياح لقذائف D-832DU الدخانية في Arma Reforger غير متوفرة حالياً في البيانات المرجعية.',
        },
      ],
    },
    {
      id: 'C832S_ILLUM',
      designation: 'C-832S',
      category: 'ILLUM',
      categoryFullEn: 'C-832S — Illumination Flare (Cyrillic: С-832С)',
      categoryFullAr: 'C-832S — قذيفة إنارة بمظلة (بالسيريلية: С-832С)',
      weightKg: 3.2,
      fuzeType: 'T-1 Time Fuze (pyrotechnic time ring)',
      descriptionEn: 'Parachute illumination munition designed to provide target illumination for Warsaw Pact night combat missions.',
      descriptionAr: 'قذيفة إنارة بمظلة هابطة مخصصة لإنارة الأهداف ومسارح العمليات الليلية لتشكيلات حلف وارسو.',
      verificationStatus: 'MISSING',
      entries: [
        {
          id: 'podnos_c832_all',
          mortarId: '2b14_82mm',
          mortarName: '2B14 82mm',
          ammunitionId: 'C832S_ILLUM',
          ammunitionDesignation: 'C-832S',
          ammunitionCategory: 'ILLUM',
          categoryLabelEn: 'Illumination',
          categoryLabelAr: 'إنارة',
          chargeRing: 0,
          chargeName: 'All Charges (0 to 4)',
          minimumRangeMeters: null,
          maximumRangeMeters: null,
          verificationStatus: 'MISSING',
          sourceReference: 'No confirmed in-game firing table available',
          sourceType: 'UNKNOWN',
          notesEn: 'Information missing. The vanilla Arma Reforger documentation does not provide an official in-game range card for C-832S. Values are omitted rather than invented.',
          notesAr: 'البيانات غير متوفرة. توثيق اللعبة الرسمية لا يوفر بطاقة رماية معتمدة داخل اللعبة لقذيفة C-832S. تم ترك الحقول خالية بدلاً من ابتكار أرقام غير حقيقية.',
        },
      ],
    },
  ],
  notesEn: [
    'O-832DU HE ranges (80m to 2300m) are confirmed from official vanilla clipboard instruction sheets.',
    'Soviet Warsaw Pact angular convention divides the full circle into 6000 mils (360° = 6000 mil, 1 mil = 0.06°).',
    'Sight unit MPM-44M limits elevation between 748 mil (44.9°) and 1415 mil (84.9°).',
    'Russian D-832DU and C-832S data is marked as UNVERIFIED / MISSING in accordance with strict anti-fabrication standards.',
  ],
  notesAr: [
    'أمدية قذائف O-832DU المتفجرة (من ٨٠م إلى ٢٣٠٠م) مؤكدة من أوراق الحافظة اليدوية الرسمية داخل اللعبة.',
    'نظام حلف وارسو السوفيتي يقسم الدائرة الكاملة إلى ٦٠٠٠ مل (٣٦٠° = ٦٠٠٠ مل، ١ مل = ٠.٠٦ درجة).',
    'منظار التسديد MPM-44M يحصر الارتفاع بين ٧٤٨ مل (٤٤.٩°) و ١٤١٥ مل (٨٤.٩°).',
    'بيانات القذائف الدخانية D-832DU والإنارة C-832S مسجلة كـ "غير مؤكدة / مفقودة" التزاماً بمعايير الشفافية وعدم اختلاق البيانات.',
  ],
  requiredEvidenceEn: [
    'Direct in-game screenshots of vanilla Arma Reforger 2B14 inventory cards for D-832DU and C-832S.',
    'Live telemetry data capturing exact fuze ignition height and descent rate for C-832S flares.',
    'Confirmation of whether Russian smoke munitions possess identical ballistic drag to O-832DU in engine scripts.',
  ],
  requiredEvidenceAr: [
    'لقطات شاشة مباشرة من داخل اللعبة لبطاقات عتاد هاون 2B14 لقذائف D-832DU و C-832S.',
    'بيانات حية مباشرة ترصد ارتفاع فتح المظلة ومعدل الهبوط لمشاعل C-832S.',
    'التأكد مما إذا كانت القذائف الدخانية السوفيتية تشترك في نفس معامل السحب البالستي مع قذائف O-832DU في برمجيات اللعبة.',
  ],
};

// ============================================================================
// 3. COMBINED REFERENCE CATALOG & LOOKUP HELPERS
// ============================================================================

export const MORTAR_SYSTEM_PROFILES: Record<'m252_81mm' | '2b14_82mm', MortarSystemProfile> = {
  m252_81mm: M252_PROFILE,
  '2b14_82mm': PODNOS_2B14_PROFILE,
};

export const ALL_RANGE_ENTRIES: RangeReferenceEntry[] = [
  ...M252_PROFILE.ammunition.flatMap((a) => a.entries),
  ...PODNOS_2B14_PROFILE.ammunition.flatMap((a) => a.entries),
];

/**
 * Filter reference range entries with strict criteria
 */
export function filterRangeEntries(options: {
  mortarId?: 'm252_81mm' | '2b14_82mm' | 'ALL';
  ammunitionCategory?: 'ALL' | 'HE' | 'SMOKE' | 'ILLUM' | 'PRACTICE';
  chargeRing?: number | 'ALL';
  verificationStatus?: 'ALL' | VerificationStatus;
}): RangeReferenceEntry[] {
  return ALL_RANGE_ENTRIES.filter((entry) => {
    if (options.mortarId && options.mortarId !== 'ALL' && entry.mortarId !== options.mortarId) {
      return false;
    }
    if (options.ammunitionCategory && options.ammunitionCategory !== 'ALL' && entry.ammunitionCategory !== options.ammunitionCategory) {
      return false;
    }
    if (options.chargeRing !== undefined && options.chargeRing !== 'ALL' && entry.chargeRing !== options.chargeRing) {
      return false;
    }
    if (options.verificationStatus && options.verificationStatus !== 'ALL' && entry.verificationStatus !== options.verificationStatus) {
      return false;
    }
    return true;
  });
}
