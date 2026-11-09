const CACHE_NAME = 'lr-master-ledger-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // Delete any pre-existing caches during install
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Listen for app exit signal to purge all cached files & IndexedDB databases immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PURGE_ALL_APP_CACHES') {
    event.waitUntil(
      Promise.all([
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
        typeof indexedDB !== 'undefined' && 'databases' in indexedDB
          ? indexedDB.databases().then((dbs) =>
              Promise.all(
                dbs.map((db) =>
                  db.name
                    ? new Promise((resolve) => {
                        const req = indexedDB.deleteDatabase(db.name);
                        req.onsuccess = resolve;
                        req.onerror = resolve;
                        req.onblocked = resolve;
                      })
                    : Promise.resolve()
                )
              )
            )
          : Promise.resolve(),
      ])
    );
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }
  // Never store generated files in Cache Storage
});
