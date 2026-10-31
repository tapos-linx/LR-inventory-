const CACHE_NAME = 'lr-master-ledger-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/@vite') || url.pathname.startsWith('/src/') || url.pathname.startsWith('/node_modules/')) {
    return;
  }
});
