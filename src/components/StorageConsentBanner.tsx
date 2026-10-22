import React from 'react';
import { Database } from 'lucide-react';

interface Props {
  lang: 'en' | 'ar';
  onAllow: () => void;
  onDeny: () => void;
}

/** Asked once: may this site save your settings in this browser? */
export const StorageConsentBanner: React.FC<Props> = ({ lang, onAllow, onDeny }) => {
  const isAr = lang === 'ar';
  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      role="dialog"
      aria-label={isAr ? 'السماح بحفظ البيانات' : 'Allow saving data'}
      className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-[1200] rounded-2xl bg-slate-900/97 border border-sky-500/50 shadow-2xl p-3.5 text-slate-200"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div className="text-[13px] leading-relaxed">
          <div className="font-bold text-white mb-0.5">{isAr ? 'تسمح للموقع يحفظ بياناتك على متصفحك؟' : 'Allow this site to save data in your browser?'}</div>
          {isAr
            ? 'نحفظ إعداداتك وعلاماتك ومواضع البوصلة والعناصر عشان تلقاها جاهزة المرة الجاية. تبقى على جهازك فقط ولا تُرسل لأي سيرفر. إذا رفضت، الموقع يشتغل عادي بس ما يتذكر شي بعد ما تسكّره.'
            : 'We save your settings, markers and widget positions so they are ready next time. They stay on your device only and are never sent to a server. If you decline, the site still works but forgets everything when you close it.'}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onAllow} className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm">
          {isAr ? 'سماح' : 'Allow'}
        </button>
        <button onClick={onDeny} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700">
          {isAr ? 'لا، شكراً' : 'No thanks'}
        </button>
      </div>
    </div>
  );
};
