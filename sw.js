// ============================================================
// SERVICE WORKER — BricoBol
// Cache l'app pour hors-ligne + mises à jour auto
// ============================================================

const CACHE = 'bricobol-v22';
const ASSETS = [
  '/', '/bricobol/',
  '/bricobol/index.html',
  '/bricobol/manifest.json',
  '/bricobol/icon.svg',
  '/bricobol/css/style.css',
  '/bricobol/js/storage.js',
  '/bricobol/js/utils.js',
  '/bricobol/js/router.js',
  '/bricobol/js/supabase-client.js',
  '/bricobol/js/app.js',
  '/bricobol/js/module-dashboard.js',
  '/bricobol/js/module-tournee.js',
  '/bricobol/js/module-missions.js',
  '/bricobol/js/module-adherents.js',
  '/bricobol/js/module-formulaire.js',
  '/bricobol/js/module-interventions.js',
  '/bricobol/js/module-agenda.js',
  '/bricobol/js/module-frais.js',
  '/bricobol/js/module-cotisations.js',
  '/bricobol/js/module-dons.js',
  '/bricobol/js/module-comptabilite.js',
  '/bricobol/js/module-documents.js',
  '/bricobol/js/module-parametres.js'
];

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