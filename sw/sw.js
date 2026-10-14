// Service worker for offline use. Built into dist/sw.js by the `serviceWorker` plugin in vite.config.ts,
// which replaces the two placeholders below with the build's file list and a content hash.
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const CACHE = 'taskmanager-' + VERSION;
const FONTS = 'taskmanager-fonts';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: serve from cache, refresh in the background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; });
      return hit || net;
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // App shell: every navigation gets the precached index.html.
  if (req.mode === 'navigate') {
    event.respondWith(caches.match(new URL('index.html', self.registration.scope).href).then(hit => hit || fetch(req)));
    return;
  }
  // Hashed build assets and icons: cache first.
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
