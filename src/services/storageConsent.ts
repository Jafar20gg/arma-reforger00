import { useSyncExternalStore } from 'react';

/**
 * Permission to save data in this browser.
 * Nothing (settings, markers, widget positions…) is written to the browser until the user says yes.
 * Only the yes/no answer itself is remembered, otherwise we could not ask just once.
 */
export type StorageConsent = 'granted' | 'denied' | null; // null = not asked yet

const CONSENT_KEY = 'fcs_storage_consent';
const OWN_PREFIXES = ['arma_reforger_fcs_', 'fcs_'];

function readStored(): StorageConsent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

let consent: StorageConsent = readStored();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getStorageConsent(): StorageConsent {
  return consent;
}

export function isStorageAllowed(): boolean {
  return consent === 'granted';
}

function writeAnswer(v: 'granted' | 'denied') {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* browser blocks storage completely: the app still works, it just cannot remember anything */
  }
}

/** User said yes. Also asks the browser to keep the data permanently (it may show its own prompt). */
export function grantStorage() {
  consent = 'granted';
  writeAnswer('granted');
  try {
    void navigator.storage?.persist?.();
  } catch {
    /* not supported: ignore */
  }
  emit();
}

/** User said no (or took it back): stop saving and delete what this app saved before. */
export function denyStorage() {
  consent = 'denied';
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k !== CONSENT_KEY && OWN_PREFIXES.some((p) => k.startsWith(p))) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  writeAnswer('denied');
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useStorageConsent(): StorageConsent {
  return useSyncExternalStore(subscribe, getStorageConsent, () => null);
}
