// ВерифиКам Service Worker — полный офлайн
const CACHE = 'verifycam-v8';
const OFFLINE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './config.json'
];

// Установка: кешируем все файлы приложения
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      // Кешируем каждый файл отдельно чтобы ошибка одного не ломала всё
      return Promise.allSettled(
        OFFLINE_FILES.map(url =>
          cache.add(new Request(url, { cache: 'no-cache' }))
            .catch(err => console.warn('Cache miss:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Активация: удаляем старые кеши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Запросы: сначала кеш, потом сеть
// config.json: всегда пробуем сеть (чтобы видеть обновления ключа)
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // config.json — сначала сеть, fallback на кеш
  if (url.includes('config.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Обновляем кеш свежей версией
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Всё остальное — сначала кеш (офлайн работает мгновенно)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      // Не в кеше — берём из сети и кешируем
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Совсем нет сети и нет кеша
        return new Response('Офлайн — файл недоступен', { status: 503 });
      });
    })
  );
});
