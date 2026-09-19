    // ============================================================
// SERVICE WORKER — BricoBol
// Cache l'app pour hors-ligne + mises à jour auto
// ============================================================

const CACHE = 'bricobol-v3';
const ASSETS = ['/', '/bricobol/', '/bricobol/index.html', '/bricobol/manifest.json', '/bricobol/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Ne pas intercepter les appels externes (Supabase, CDN, API gouv...)
  if (url.hostname !== self.location.hostname) return;

  // Pour le HTML : network first, cache en fallback
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/bricobol/') {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('/bricobol/index.html')))
    );
    return;
  }

  // Pour le reste : cache first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});