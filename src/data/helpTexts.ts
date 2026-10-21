export interface HelpText {
  ar: { title: string; body: string };
  en: { title: string; body: string };
}

const h = (arT: string, arB: string, enT: string, enB: string): HelpText => ({
  ar: { title: arT, body: arB },
  en: { title: enT, body: enB },
});

/** Detailed explanations shown by the (i) buttons. Keys are used by <InfoTip id="..." />. */
export const HELP_TEXTS: Record<string, HelpText> = {
  // ---- Sections ----
  sec_general: h('عام', 'هنا تضبط شكل البرنامج الأساسي: نمط التخطيط الجاهز، حجم الخط، وعرض لوحة الحاسبة. أي تغيير يُحفظ تلقائياً.', 'General', 'Basic look of the app: ready-made layout, text size and calculator panel width. Changes are saved automatically.'),
  sec_interfaceVisibility: h('إظهار وإخفاء العناصر', 'تتحكم بأي عنصر يظهر على الشاشة: الشريط العلوي، اللوحات، الأدوات. تگدر تخلي الخريطة نظيفة بالكامل أو تظهر فقط اللي تحتاجه.', 'Show / Hide Elements', 'Choose which screen elements are visible: header, panels and tools. You can keep a clean map or show only what you need.'),
  sec_interfaceLayout: h('التخطيط والقوائم', 'مكان لوحة الحاسبة (يمين أو يسار) وشفافية اللوحات حتى تشوف الخريطة من خلفها.', 'Layout & Menus', 'Where the calculator panel sits (left or right) and how transparent panels are so you can see the map behind them.'),
  sec_language: h('اللغة', 'لغة الواجهة (عربي أو إنجليزي). تغيّر كل القوائم والنصوص.', 'Language', 'Interface language (Arabic or English). It changes all menus and texts.'),
  sec_mapAppearance: h('مظهر الخريطة', 'ألوان البرنامج (السمة) وشبكات الإحداثيات فوق الخريطة.', 'Map Appearance', 'The color theme of the app and the coordinate grids drawn over the map.'),
  sec_mapLabels: h('نصوص الخريطة', 'أي أسماء تظهر على الخريطة (مدن، قرى، تلال، منشآت عسكرية) وبأي لغة.', 'Map Labels', 'Which place names appear on the map (cities, villages, hills, military sites) and in which language.'),
  sec_markers: h('العلامات والمواقع', 'ما يظهر فوق الخريطة: مربض الهاون، الهدف، خط المسار، دوائر المدى، البوصلة، وعلاماتك المخصصة.', 'Markers', 'What is drawn over the map: gun position, target, trajectory line, range rings, compass and your own custom markers.'),
  sec_mortars: h('الهاونات', 'مواصفات كل هاون، معايرتك الشخصية له إذا النتائج بالعبة تختلف عن الجداول، وإضافة هاون جديد.', 'Mortars', 'Specs of each mortar, your personal calibration if in-game results differ from the tables, and adding a custom mortar.'),
  sec_calculator: h('الحاسبة', 'كيف تنحسب المسافة والاتجاه، والذكاء الاصطناعي كرأي ثاني، وطريقة عرض الزاوية والأرقام العشرية.', 'Calculator', 'How distance and direction are calculated, the optional AI second opinion, and how angles and decimals are displayed.'),
  sec_measurementUnits: h('وحدات القياس', 'اختار تعرض المسافات بالمتر أو غيره.', 'Units', 'Choose which unit distances are shown in.'),
  sec_weather: h('الطقس والرياح', 'إظهار نافذة الرياح على الخريطة. تدخل سرعة الرياح واتجاهها وتظهر بطاقة تصحيح الرياح بلوحة الحاسبة.', 'Weather & Wind', 'Show the wind window on the map. Enter wind speed and direction and a wind correction card appears in the calculator panel.'),
  sec_storagePrivacy: h('التخزين والخصوصية', 'كل بياناتك تنحفظ بمتصفحك فقط على جهازك. ما ينرسل شي لأي سيرفر. مفتاح الذكاء الاصطناعي ما يدخل بالنسخة الاحتياطية.', 'Storage & Privacy', 'All your data is saved only in this browser on your device. Nothing is sent to a server. The AI key is never included in backups.'),
  sec_importExport: h('استيراد وتصدير', 'احفظ إعداداتك وعلاماتك بملف نسخة احتياطية، أو رجّعها من ملف قديم أو على جهاز ثاني.', 'Import & Export', 'Save your settings and markers to a backup file, or restore them from an old file or on another device.'),
  sec_resetRecovery: h('إعادة الضبط', 'ترجع جزء أو كل الإعدادات للأصل إذا خربت شي. انتبه: بعض الخيارات تمسح بياناتك.', 'Reset', 'Return part or all of the settings to default if something broke. Careful: some options delete your data.'),

  // ---- General / layout ----
  layoutPresets: h('أنماط التخطيط السريعة', 'تضبط عرض اللوحة وإظهارها بضغطة وحدة.\n• خريطة فقط: تخفي لوحة الحاسبة.\n• مضغوط: لوحة ضيقة.\n• قياسي: الوضع العادي.\n• غني بالمعلومات: لوحة عريضة بتفاصيل أكثر.', 'Layout Presets', 'Sets panel width and visibility in one tap.\n• Minimal map: hides the calculator panel.\n• Compact: narrow panel.\n• Standard: normal.\n• Info rich: wide panel with more detail.'),
  textSize: h('حجم الخط', 'يكبّر أو يصغّر نصوص البرنامج كلها. إذا الكتابة صغيرة على جوالك اختار كبير.', 'UI Text Size', 'Makes all app text smaller or larger. If text is small on your phone, choose large.'),
  panelWidth: h('عرض لوحة التحكم', 'عرض لوحة الحاسبة بالبكسل. رقم أكبر = لوحة أعرض وخريطة أضيق.', 'Panel Width', 'Calculator panel width in pixels. Bigger number = wider panel and narrower map.'),
  quickDisplay: h('أوضاع العرض السريعة', 'اختصارات: خريطة فقط (نظيفة)، إخفاء كل العناصر الاختيارية، إظهار الكل، أو الرجوع للوضع الافتراضي.', 'Quick Display Presets', 'Shortcuts: map only (clean), hide all optional elements, show everything, or restore the default.'),
  visComponents: h('عناصر الواجهة', 'شغّل أو طفّي كل عنصر لحاله (الشريط العلوي، التبويبات، الأدوات...). العنصر المطفي يختفي من الشاشة.', 'Interface Components', 'Turn each element on or off individually (header, tabs, tools...). A turned-off element disappears from the screen.'),
  menuPosition: h('مكان زر القائمة', 'أي زاوية من الشاشة يكون بها زر القائمة (النقاط الثلاث).', 'Menu Button Position', 'Which screen corner holds the menu (three dots) button.'),
  menuSize: h('حجم زر القائمة', 'يصغّر أو يكبّر زر القائمة حتى يسهل الضغط عليه.', 'Menu Button Size', 'Makes the menu button smaller or larger so it is easier to tap.'),
  fcsDock: h('موقع لوحة الحاسبة', 'تحط لوحة الحاسبة (FCS) على اليسار أو اليمين حسب راحتك.', 'Calculator Panel Docking', 'Put the calculator (FCS) panel on the left or right, whichever suits you.'),
  panelOpacity: h('شفافية اللوحات', 'كلما قلّت النسبة صارت اللوحات أشفّ وتشوف الخريطة من خلفها. انتبه إذا قللتها كثير يصعب قراءة الأرقام.', 'Panel Opacity', 'The lower the value, the more see-through panels are. If too low, numbers get harder to read.'),

  // ---- Map ----
  theme: h('سمة الألوان', 'تغيّر ألوان البرنامج كله.\n• Dark Tactical: داكن عادي.\n• Night Ops: أسود كامل يوفر البطارية بشاشات OLED ومريح بالليل.\n• Forest: أخضر.\n• Desert: رملي.\n• High Contrast: تباين عالي لقراءة أسهل.', 'Color Theme', 'Changes the colors of the whole app.\n• Dark Tactical: normal dark.\n• Night Ops: pure black, saves battery on OLED.\n• Forest: green.\n• Desert: sand.\n• High Contrast: easier to read.'),
  grid1km: h('شبكة 1 كم', 'خطوط الشبكة الكبيرة كل كيلومتر. تساعدك تقرأ الإحداثيات بسرعة وتحدد المربع العام.', '1 km Grid', 'Large grid lines every kilometre. Helps you read coordinates quickly and find the general square.'),
  grid100m: h('شبكة 100 م', 'شبكة دقيقة كل 100 متر. تفيدك لتحديد الهدف بدقة. تظهر عادة لما تقرّب الخريطة.', '100 m Grid', 'Fine grid every 100 metres. Useful for placing a target precisely. Usually visible when zoomed in.'),
  labelLang: h('لغة أسماء الخريطة', 'أسماء الأماكن تتبع لغة الواجهة، أو إنجليزي فقط، أو عربي فقط، أو الاثنين مع بعض.', 'Map place-name language', 'Place names follow the UI language, or English only, Arabic only, or both together.'),
  capitals: h('العواصم والمدن الكبرى', 'يظهر أو يخفي أسماء أكبر المدن على الخريطة.', 'Capitals', 'Shows or hides the names of the biggest cities on the map.'),
  towns: h('البلدات', 'يظهر أو يخفي أسماء البلدات.', 'Towns', 'Shows or hides town names.'),
  villages: h('القرى والمزارع', 'يظهر أو يخفي أسماء القرى والمزارع الصغيرة. إذا الخريطة مزدحمة طفّيها.', 'Villages', 'Shows or hides small village and farm names. Turn off if the map feels crowded.'),
  hills: h('التلال والارتفاعات', 'يظهر أسماء التلال وارتفاعها. مفيد لأن فرق الارتفاع بين الهاون والهدف يغيّر زاوية الرمي.', 'Hills / Elevations', 'Shows hill names and heights. Useful because the height difference between gun and target changes the firing angle.'),
  military: h('المعالم العسكرية', 'يظهر المنشآت العسكرية ونقاط الاهتمام على الخريطة.', 'Military Landmarks', 'Shows military sites and points of interest on the map.'),
  gunPos: h('مربض الهاون', 'يظهر علامة موقع الهاون (مكانك) على الخريطة.', 'Gun Position', 'Shows the mortar (your) position marker on the map.'),
  targetMarker: h('موقع الهدف', 'يظهر علامة الهدف على الخريطة.', 'Target Marker', 'Shows the target marker on the map.'),
  trajectory: h('خط المسار', 'خط مستقيم بين الهاون والهدف يوضح اتجاه الرمي.', 'Trajectory Line', 'A straight line between gun and target that shows the firing direction.'),
  rangeRings: h('دوائر المدى', 'تظهر أقصى وأدنى مدى لكل شحنة (Ring). إذا الهدف خارج الدائرة ما راح توصله هذي الشحنة.', 'Range Rings', 'Shows the min and max range of each charge (ring). If the target is outside the circle this charge cannot reach it.'),
  distCircles: h('دوائر المسافة', 'دوائر حول الهاون كل مسافة معينة (مثلاً كل 200 م) تعطيك فكرة سريعة عن البعد.', 'Distance Circles', 'Circles around the gun at fixed steps (for example every 200 m) for a quick sense of distance.'),
  circleStep: h('الفاصل بين الدوائر', 'كم متر بين دائرة وأخرى. رقم أصغر = دوائر أكثر.', 'Circle spacing', 'How many metres between circles. Smaller number = more circles.'),
  circleRadius: h('أقصى نصف قطر', 'آخر دائرة تنرسم تبعد كم متر عن الهاون.', 'Outer radius', 'How far from the gun the last circle is drawn.'),
  circleText: h('كتابة المسافة', 'يكتب رقم المسافة على كل دائرة.', 'Distance text', 'Writes the distance number on each circle.'),
  compass: h('البوصلة', 'يظهر وردة البوصلة على الخريطة لمعرفة الشمال والاتجاهات.', 'Compass', 'Shows a compass rose on the map for north and directions.'),
  customMarkers: h('سجل العلامات المخصصة', 'قائمة العلامات اللي أضفتها بنفسك (أهداف، نقاط، ملاحظات). تگدر تحذف أي وحدة منها.', 'Custom Markers Registry', 'The list of markers you added (targets, points, notes). You can delete any of them.'),

  // ---- Mortars / calculator ----
  baselines: h('المواصفات المرجعية', 'القيم الأصلية للهاون: الحد الأدنى والأقصى لزاوية السبطانة ونظام الميل (6400 للأمريكي، 6000 للروسي). تحتاج تتحقق منها داخل اللعبة.', 'Reference Baselines', 'Original mortar values: min and max tube angle and mil system (6400 US, 6000 Russian). Verify them in the game.'),
  calibration: h('معايرة الهاون الشخصية', 'إذا الرمية بالعبة تنزل أقصر أو أبعد من الحساب، عدّل هنا.\n• مقياس المدى %: يمدد أو يقلص كل المسافات بالجدول.\n• تعويض الارتفاع بالميل: يضاف على الزاوية النهائية.\nالقيمة 0 تعني الجداول الأصلية بدون تعديل.', 'Personal Mortar Calibration', 'If shells in-game land shorter or longer than calculated, adjust here.\n• Range scale %: stretches or shrinks all table ranges.\n• Elevation offset in mils: added to the final angle.\nA value of 0 means the original tables.'),
  freeMode: h('الوضع الحر', 'يلغي حدود زاوية السبطانة وقفل الزاوية. مفيد للتجارب، بس ممكن يعطي زوايا ما تشتغل بالهاون الحقيقي.', 'Free Mode', 'Ignores tube angle limits and the angle lock. Handy for experiments, but may give angles the real mortar cannot do.'),
  closingAngle: h('زاوية إغلاق الجدول', 'الزاوية اللي ينتهي عندها الجدول عند أقصى مدى. اتركه فاضي للقياسي.', 'Table Closing Angle', 'The angle where the table ends at max range. Leave empty for standard.'),
  minAngleLock: h('قفل أدنى زاوية', 'يمنع الرمي بزاوية أقل من رقم تحدده (مثلاً 50°). أقصى مدى يقل بسبب ذلك. اتركه فاضي لإلغائه.', 'Lock Minimum Angle', 'Prevents firing below an angle you choose (for example 50°). Max range shrinks accordingly. Leave empty to disable.'),
  addMortar: h('إضافة هاون مخصص', 'تضيف هاون جديد باسمه وعياره ونظام الميل وحدود الزاوية، حتى تستخدمه بالحاسبة.', 'Add Custom Mortar', 'Adds a new mortar with its name, caliber, mil system and angle limits so you can use it in the calculator.'),
  distMethod: h('طريقة حساب المسافة', '• الرياضيات: تحسب المسافة والاتجاه مباشرة من الإحداثيات (دقيقة وبدون إنترنت). هذا الافتراضي.\n• رياضيات + ذكاء اصطناعي: نفس الحساب، وبعدها الذكاء الاصطناعي يراجعه ويعطي ملاحظات. الأرقام المعتمدة تبقى من الرياضيات دائماً.', 'Distance Method', '• Maths: distance and direction come straight from coordinates (exact, works offline). Default.\n• Maths + AI: same calculation, then the AI double-checks and adds notes. The numbers used always come from the maths.'),
  apiKey: h('مفتاح API', 'مفتاحك الخاص من شركة الذكاء الاصطناعي (Google AI Studio لـ Gemini). ينحفظ بمتصفحك فقط. لا تشاركه مع أحد، وإذا انكشف احذفه واسوي جديد.', 'API Key', 'Your own key from the AI provider (Google AI Studio for Gemini). Saved only in your browser. Never share it; if it leaks, delete it and create a new one.'),
  modelName: h('اسم الموديل', 'اسم نموذج الذكاء الاصطناعي المستخدم. إذا طلع خطأ "غير موجود" جرب اسم ثاني مثل gemini-3.6-flash.', 'Model Name', 'Name of the AI model used. If you get a "not found" error, try another name such as gemini-3.6-flash.'),
  elevFormat: h('صيغة عرض الزاوية', 'كيف تظهر زاوية الارتفاع: بالدرجات والمل معاً، أو الدرجات أولاً، أو المل أولاً. بالمل هو اللي تضبطه على الهاون بالعبة.', 'Elevation Display Format', 'How the elevation angle is shown: degrees and mils together, degrees first, or mils first. Mils is what you set on the mortar in game.'),
  decimals: h('المنازل العشرية', 'كم رقم بعد الفاصلة يظهر بالنتائج (0 أو 1 أو 2).', 'Decimal Precision', 'How many digits after the decimal point appear in results (0, 1 or 2).'),
  distUnit: h('وحدة المسافة', 'الوحدة اللي تظهر بها المسافات.', 'Distance Unit', 'The unit distances are shown in.'),
  weatherHud: h('نافذة الطقس والرياح', 'تظهر نافذة صغيرة على الخريطة تدخل بها سرعة الرياح واتجاهها (من وين تجي). الحاسبة تستخدمها لتصحيح الرمية.', 'Weather HUD', 'Shows a small window on the map where you enter wind speed and direction (where it comes from). The calculator uses it to correct the shot.'),


  // ---- Calculator panel ----
  fcsAzimuth: h('السمت (الاتجاه)', 'الزاوية اللي توجّه عليها الهاون: من الشمال باتجاه عقارب الساعة. تظهر بالمل (اللي تحتاجه) وبالدرجات.', 'Azimuth', 'The direction to aim the mortar: clockwise from north. Shown in mils (what you need) and degrees.'),
  fcsElevation: h('زاوية الارتفاع', 'ارتفاع سبطانة الهاون. زاوية أعلى = قذيفة تنزل أقرب وأكثر عمودية. تظهر بالدرجات والمل.', 'Elevation', 'How high the mortar tube is raised. A higher angle = a shorter, steeper shot. Shown in degrees and mils.'),
  fcsWind: h('تصحيح الرياح', 'تقدير لتأثير الرياح على القذيفة (استشاري).\n• انحراف: كم متر تزيحها الرياح يمين أو يسار.\n• المدى: هل تنزل أبعد أم أقصر.\n• السمت المصحّح والمسافة المصحّحة: اضبط عليهم بدل الأصلية للتعويض.\nالمعامل 0.5 تقريبي، فاعتمد على ملاحظتك بالعبة.', 'Wind Correction', 'An estimate of how wind affects the shell (advisory).\n• Drift: metres pushed right or left.\n• Range: lands longer or shorter.\n• Corrected azimuth and range: aim with these instead to compensate.\nThe 0.5 factor is approximate, so trust what you observe in game.'),
};
