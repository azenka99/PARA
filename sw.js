// PARA service worker — çevrimdışı destek.
// Strateji: önbellekten sun, arka planda tazele (stale-while-revalidate).
// Yeni sürüm yayınlandığında CACHE adını değiştirmek eski önbelleği temizler.
const CACHE = 'para-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const onbellekte = await cache.match(request);
      const agdan = fetch(request)
        .then((yanit) => {
          if (yanit.ok) cache.put(request, yanit.clone());
          return yanit;
        })
        .catch(() => onbellekte);
      return onbellekte || agdan;
    }),
  );
});
