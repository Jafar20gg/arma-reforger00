import { useSyncExternalStore } from 'react';

/**
 * "Install app" support. Chrome/Edge/Android fire `beforeinstallprompt` once; we keep it and show our own
 * button. iPhone/iPad Safari never fires it: there the user must use Share > Add to Home Screen.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
let snapshot = { canPrompt: false, installed: false };
const emit = () => {
  snapshot = { canPrompt: !!deferred, installed };
  listeners.forEach((l) => l());
};

/** True inside the Android app built with Capacitor (the app is already installed, nothing to offer). */
export function isNativeApp(): boolean {
  try {
    return (window as any).Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

export function isStandalone(): boolean {
  try {
    if (isNativeApp()) return true;
    return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  } catch {
    return false;
  }
}

export function isIosSafari(): boolean {
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
  return ios;
}

if (typeof window !== 'undefined') {
  installed = isStandalone();
  snapshot = { canPrompt: false, installed };
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    emit();
  });
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  const d = deferred;
  deferred = null;
  emit();
  await d.prompt();
  const choice = await d.userChoice;
  return choice.outcome;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useInstallState() {
  return useSyncExternalStore(subscribe, () => snapshot, () => ({ canPrompt: false, installed: false }));
}
