// sw.js: after the first visit, the front door loads from this device. The live readings of the flagship pages are
// always fetched fresh; only this page's own files are kept. This worker touches only caches named "house-standard-".
const CACHE = 'house-standard-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'data/flagships.json', 'data/gates.json'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {})));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('house-standard-') && k !== CACHE).map((k) => caches.delete(k))))));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.includes('/house-standard/')) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}); return r; }).catch(() => caches.match(e.request)));
});
