import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, HardDrive } from 'lucide-react';

export const OfflineIndicator: React.FC<{ lang?: 'en' | 'ar' }> = ({ lang = 'en' }) => {
  const { isOnline, isSimulated } = useOnlineStatus();
  const isAr = lang === 'ar';

  if (isOnline) return null;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed bottom-20 lg:bottom-4 left-3 z-[1100] flex items-center gap-2 rounded-lg bg-amber-600/95 text-white px-3 py-1.5 text-xs font-mono font-bold shadow-xl border border-amber-400/50 backdrop-blur-sm pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
      </span>
      <div className="flex items-center gap-1.5">
        <WifiOff className="w-3.5 h-3.5" />
        <span>
          {isSimulated
            ? isAr
              ? 'وضع أوفلاين تجريبي (الخرائط المحفوظة فقط)'
              : 'Simulated Offline Mode (Cached Maps Only)'
            : isAr
              ? 'وضع عدم الاتصال — جاري استخدام الخرائط المحفوظة'
              : 'Offline Mode — Operating on Local Tile Cache'}
        </span>
      </div>
    </div>
  );
};
