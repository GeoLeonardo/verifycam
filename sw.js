// VerifyCam Service Worker v2 — примусово очищає старий кеш
const CACHE = 'verifycam-v2';  // <-- змінили версію з v1 на v2
const ALWAYS_CACHE = ['index.html','manifest.json','icon.png'];
const NETWORK_FIRST = ['config.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ALWAYS_CACHE))
      .catch(() => {})
  );
  self.skipWaiting(); // одразу активуємося
});

self.addEventListener('activate', e => {
  e.waitUntil(
    // Видаляємо ВСІ старі кеші (v1 та інші)
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim(); // одразу контролюємо всі вкладки
});

self.addEventListener('fetch', e => {
  const name = new URL(e.request.url).pathname.split('/').pop();
  if (NETWORK_FIRST.includes(name)) {
    e.respondWith(
      fetch(e.request)
        .then(r => { caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        if (r && r.status === 200 && r.type === 'basic') {
          caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        }
        return r;
      }).catch(() => cached);
    })
  );
});
