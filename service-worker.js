// CRM Magenta - Service Worker
// Cambiá la versión cuando actualices archivos para forzar refresco del cache.
const CACHE = 'crm-magenta-v1';

// Archivos propios de la app (app shell). No cacheamos las APIs de Google.
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './isologo.png',
  './logotipo.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];

// Instalar: precargar el app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activar: borrar caches viejos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch:
// - Nunca interceptamos llamadas a Google (auth/drive) ni cosas que no sean GET.
// - Navegación (abrir la app): red primero, si falla usamos el index cacheado (offline).
// - Resto de GET: cache primero, si no está vamos a la red y lo guardamos.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  if (/googleapis\.com|google\.com|gstatic\.com|accounts\.google/.test(url.hostname)) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && (url.origin === location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
