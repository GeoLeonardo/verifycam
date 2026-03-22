// ВерифиКам Service Worker v1.0
const CACHE = 'verifycam-v1';
const ALWAYS_CACHE = ['index.html','manifest.json','icon.png'];
const NETWORK_FIRST = ['config.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ALWAYS_CACHE))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
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
