import { useEffect, useState } from 'react';
import { isOfflineSimulated } from '../services/offlineMapStorage';

export function useOnlineStatus() {
  const [isSimulated, setIsSimulated] = useState(isOfflineSimulated());
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleSimChange = (e: any) => {
      setIsSimulated(e.detail?.enabled ?? isOfflineSimulated());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('arma-offline-sim-changed', handleSimChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('arma-offline-sim-changed', handleSimChange);
    };
  }, []);

  return {
    isOnline: !isSimulated && isOnline,
    isSimulated,
    isDeviceOnline: isOnline,
  };
}
