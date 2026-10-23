import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { isNativeApp } from './services/installPrompt'; // also starts listening for the browser's "install app" event early

/** Shows the real error on screen instead of a blank page, so problems are easy to report. */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
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
