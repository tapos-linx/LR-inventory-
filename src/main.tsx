import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerExitCacheCleanup } from './utils/cacheCleaner';

// Immediately install Blob URL tracker and register exit listeners (beforeunload, pagehide, unload)
// so that every time the user exits the app, all generated cached files are deleted automatically.
registerExitCacheCleanup();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore service worker registration errors in restricted iframe contexts
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
