/*
 * Service worker MBT : rend l'application disponible hors ligne (numéros d'urgence,
 * conseils, contacts, journal). Les cartes et API externes restent en ligne uniquement.
 */
const CACHE = 'mbt-v3';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/assets/mission-logo.png',
  '/assets/watermark-call.svg',
  '/assets/watermark-warning.svg',
  '/assets/icon-play.svg',
  '/assets/icon-send.svg',
  '/assets/icon-mic.svg',
  '/assets/icon-translate.svg',
  '/assets/psy-avatar.png',
  '/assets/temoignage-1.png',
  '/assets/temoignage-2.png',
  '/assets/player-cover.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// La page envoie la liste des fichiers déjà chargés (JS/CSS) pour les mettre en cache
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    caches.open(CACHE).then((cache) =>
      Promise.all(event.data.urls.map((url) => cache.add(url).catch(() => undefined)))
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // tuiles de carte, API : réseau uniquement

  // Pages : réseau d'abord (pour récupérer les mises à jour), cache si hors ligne
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Fichiers statiques (noms versionnés) : cache d'abord
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          // Ne pas mettre en cache une page HTML servie à la place d'un fichier absent
          const isHtml = (response.headers.get('content-type') || '').includes('text/html');
          if (response.status === 200 && !isHtml) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
