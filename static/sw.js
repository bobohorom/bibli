/* Service Worker for BibliPartage */
const CACHE_NAME = 'bp-cache-v6';
const CORE_ASSETS = [
  '/',
  '/library',
  '/friends',
  '/add',
  '/scan',
  '/confirm',
  '/static/site.css',
  '/static/library.css',
  '/static/welcome.css',
  '/static/scan.css',
  '/static/fonts.css',
  '/static/nocover300x450.svg',
  '/static/favicon.svg',
  '/static/quagga.min.js',
  '/static/js/ui.js',
  '/static/js/db.js',
  '/static/js/library.js',
  '/static/js/friends.js',
  '/static/js/book.js',
  '/static/js/add.js',
  '/static/js/confirm.js',
  '/static/js/isbn.js',
  '/static/js/pwa.js',
  '/static/manifest.webmanifest',
  '/manifest.webmanifest',
  '/static/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ensure manifest is always served as a static asset (cache-first)
  if (url.pathname.endsWith('/manifest.webmanifest') || url.pathname === '/manifest.webmanifest') {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }))
    );
    return;
  }

  // Navigation requests: cache-first with background update (stale-while-revalidate)
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        }).catch(() => null);
        
        // Return cached version immediately, update in background
        return cached || fetchPromise || caches.match('/static/offline.html');
      })
    );
    return;
  }

  // Static assets: cache-first
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => cached))
    );
    return;
  }

  // Default: try network then cache
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
