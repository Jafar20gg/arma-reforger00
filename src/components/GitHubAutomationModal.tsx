import React, { useState } from 'react';
import {
  Github,
  Smartphone,
  Terminal,
  CheckCircle2,
  Copy,
  ExternalLink,
  Download,
  Play,
  Cpu,
  Layers,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  X,
  PackageCheck,
} from 'lucide-react';

interface GitHubAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
}

export const GitHubAutomationModal: React.FC<GitHubAutomationModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'android' | 'github' | 'scripts'>('android');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  const repoUrl = 'https://github.com/Jafar20gg/arma-reforger00';

  const terminalCommands = `# 1. Clone or pull latest code with Capacitor & PWA
git clone ${repoUrl}.git
cd arma-reforger00

# 2. Install all dependencies including Capacitor
npm install

# 3. Build optimized web production bundle
npm run build

# 4. Sync web assets with native Android project
npx cap sync android

# 5. Build native Android APK (Debug / Release)
cd android
./gradlew assembleDebug

# Output APK path:
# android/app/build/outputs/apk/debug/app-debug.apk`;

  return (
    <div
      className="fixed inset-0 z-[1200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-wide">
                  {isAr ? 'منصة بناء وتطوير أندرويد وGitHub' : 'Android App & GitHub Automation Hub'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-300">
                  Capacitor 6.x / Android
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'حزم الكود إلى تطبيق أندرويد أصلي (APK) ومزامنته مع مستودع arma-reforger00'
                  : 'Package web application into native Android APK and manage GitHub repository'}
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

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/60 border-b border-slate-800 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('android')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'android'
                ? 'bg-purple-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{isAr ? 'بناء تطبيق أندرويد (APK)' : 'Capacitor Android (APK)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'github'
                ? 'bg-purple-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>{isAr ? 'مستودع GitHub والأتمتة' : 'GitHub Repository & CI/CD'}</span>
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'scripts'
                ? 'bg-purple-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{isAr ? 'أوامر الطرفية والسكريبتات' : 'Terminal Commands'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: ANDROID CAPACITOR */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              {/* Architecture Overview */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    CAPACITOR DUAL-TARGET ARCHITECTURE
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Web + Android APK
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isAr
                    ? 'تم تهيئة المشروع بحزمة @capacitor/core و@capacitor/android ليتمكن نفس الكود المكتوب بـ React وTypeScript وTailwind من العمل كـ Progressive Web App وكـ تطبيق أندرويد أصلي مستقل (APK).'
                    : 'The codebase is configured with @capacitor/core and @capacitor/android, enabling simultaneous deployment as a Web App (PWA) and a native Android APK with hardware acceleration, wake-lock, and offline tile caching.'}
                </p>
              </div>

              {/* Step-by-Step Build Pipeline */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {isAr ? 'خطوات توليد ملف APK للأندرويد:' : 'Android APK Generation Steps:'}
                </h3>

                <div className="space-y-2 text-xs">
                  {/* Step 1 */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-950 border border-purple-600 text-purple-300 font-bold flex items-center justify-center shrink-0 font-mono text-xs">
                      1
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-white font-mono">npm run build</div>
                      <p className="text-slate-400 mt-0.5">
                        {isAr
                          ? 'يقوم بترجمة وتجميع كود React وTailwind والأصول إلى مجلد dist'
                          : 'Compiles and bundles the production web app and offline service worker into /dist'}
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-950 border border-purple-600 text-purple-300 font-bold flex items-center justify-center shrink-0 font-mono text-xs">
                      2
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-white font-mono">npx cap sync android</div>
                      <p className="text-slate-400 mt-0.5">
                        {isAr
                          ? 'ينقل حزمة الويب إلى مجلد android/app/src/main/assets/public ويحدث المكونات'
                          : 'Syncs web assets and native plugins into the android/ project'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-950 border border-purple-600 text-purple-300 font-bold flex items-center justify-center shrink-0 font-mono text-xs">
                      3
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-white font-mono">cd android && ./gradlew assembleDebug</div>
                      <p className="text-slate-400 mt-0.5">
                        {isAr
                          ? 'يقوم ببناء حزمة APK جاهزة للتثبيت المباشر على أي هاتف أندرويد أو تابلت'
                          : 'Builds app-debug.apk in android/app/build/outputs/apk/debug/ for instant install'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Android Capabilities Configured */}
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase font-mono">
                  {isAr ? 'الخصائص المضمنة في AndroidManifest.xml:' : 'Features Configured in AndroidManifest:'}
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WAKE_LOCK (Screen stays on)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>INTERNET & ACCESS_NETWORK_STATE</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Full-screen tactical viewport</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Offline Tile Storage Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB REPO & CI/CD */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              {/* Repository Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Github className="w-5 h-5 text-white" />
                    <span className="font-bold text-white font-mono text-sm">Jafar20gg/arma-reforger00</span>
                  </div>
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 flex items-center gap-1 text-xs font-mono"
                  >
                    <span>{isAr ? 'فتح المستودع' : 'Open Repo'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">BRANCH</div>
                    <div className="font-bold text-white">main</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">FRAMEWORK</div>
                    <div className="font-bold text-sky-400">Vite + React 19</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">TARGETS</div>
                    <div className="font-bold text-emerald-400">Web / Android</div>
                  </div>
                </div>
              </div>

              {/* GitHub Actions CI/CD for Automatic APK Builds */}
              <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-300 font-mono flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4" />
                    GITHUB ACTIONS CLOUD APK BUILDER (.github/workflows/android-build.yml)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-900 text-sky-200">
                    Automated CI/CD
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isAr
                    ? 'قمنا بإنشاء ملف سير العمل .github/workflows/android-build.yml داخل المستودع. عند الدفع لفرع main أو الضغط على Run Workflow في GitHub، يتم بناء ملف APK في سحابة GitHub وتحميله تلقائياً كـ Artifact وكـ Release جاهز للتحميل المباشر دون الحاجة لتثبيت Android Studio على حاسوبك!'
                    : 'The repository includes .github/workflows/android-build.yml. Whenever code is pushed to main or triggered via GitHub Actions, GitHub servers automatically build the Android APK and attach it as a downloadable release asset!'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SCRIPTS */}
          {activeTab === 'scripts' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase font-mono">
                  {isAr ? 'أوامر البناء الكاملة:' : 'Complete Terminal Commands:'}
                </span>
                <button
                  onClick={() => copyToClipboard(terminalCommands, 'cmd')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  {copiedKey === 'cmd' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'cmd' ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الأوامر' : 'Copy All')}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-sky-300 overflow-x-auto whitespace-pre leading-relaxed select-text">
                {terminalCommands}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Capacitor 6 + Android SDK Ready</span>
          <button onClick={onClose} className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200">
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
