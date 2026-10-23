import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { isChunkError, recoverFromStaleBuild, installPreloadErrorHandler } from './services/lazyWithReload';
import { isNativeApp } from './services/installPrompt'; // also starts listening for the browser's "install app" event early

/** Shows the real error on screen instead of a blank page, so problems are easy to report. */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    if (isChunkError(this.state.error)) {
      // a new version was published while this page was open: just reload, nothing is lost
      return (
        <div style={{ padding: 20, color: '#e2e8f0', background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ marginBottom: 8 }}>نزل تحديث جديد / A new version is available</h2>
          <p style={{ fontSize: 14, opacity: 0.8 }}>إعداداتك وبياناتك محفوظة. اضغط لإعادة التحميل. / Your data is safe. Tap to reload.</p>
          <button
            style={{ marginTop: 12, padding: '12px 18px', borderRadius: 8, background: '#0ea5e9', color: '#fff', border: 0, fontSize: 16 }}
            onClick={() => void recoverFromStaleBuild()}
          >
            إعادة التحميل / Reload
          </button>
        </div>
      );
    }
    return (
      <div style={{ padding: 20, color: '#fecaca', background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <h2 style={{ marginBottom: 8 }}>حدث خطأ / Something went wrong</h2>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{String(this.state.error?.message || this.state.error)}</pre>
        <button
          style={{ marginTop: 12, padding: '10px 16px', borderRadius: 8, background: '#0ea5e9', color: '#fff', border: 0 }}
          onClick={() => { try { localStorage.clear(); } catch {} location.reload(); }}
        >
          مسح البيانات المحفوظة وإعادة التحميل / Reset saved data & reload
        </button>
      </div>
    );
  }
}

installPreloadErrorHandler();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Offline support (PWA): cache the app shell and map tiles for field use without a connection.
// Not inside the installed Android app: its files are bundled in the APK, so a service worker would only risk showing an old copy after an update.
if (import.meta.env.PROD && 'serviceWorker' in navigator && !isNativeApp()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('[FCS] SW registration failed:', err));
  });
}
