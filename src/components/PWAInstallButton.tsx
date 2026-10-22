import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ lang?: 'en' | 'ar' }> = ({ lang = 'en' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isAr = lang === 'ar';

  // If already running as an installed PWA or native app, don't show the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition whitespace-nowrap shrink-0"
        title={isAr ? 'تثبيت التطبيق على جهازك' : 'Install Tactical FCS App'}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{isAr ? 'تثبيت التطبيق' : 'Install App'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{isAr ? 'تثبيت iOS' : 'Install iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div
              dir={isAr ? 'rtl' : 'ltr'}
              className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white font-mono">
                  {isAr ? 'تثبيت على iPhone / iPad' : 'Install on iPhone / iPad'}
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  1. {isAr ? 'اضغط على زر' : 'Tap the'}{' '}
                  <strong className="text-sky-400">{isAr ? 'المشاركة (Share)' : 'Share'}</strong>{' '}
                  {isAr ? 'في شريط سفلي لسفاري.' : 'button in Safari toolbar.'}
                </p>
                <p>
                  2. {isAr ? 'مرر للأسفل واختر' : 'Scroll down and tap'}{' '}
                  <strong className="text-emerald-400">
                    {isAr ? 'إضافة إلى الصفحة الرئيسية (Add to Home Screen)' : 'Add to Home Screen'}
                  </strong>
                  .
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  {isAr
                    ? 'سيفتح التطبيق كشاشة كاملة وبدون إطارات المتصفح للعمل الميداني بدون إنترنت.'
                    : 'The app will launch full-screen with offline map caching enabled.'}
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
