const CACHE='vc10';
const ASSETS=['./','./index.html','./manifest.json','./icon.png','./config.json'];

self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(c=>Promise.allSettled(
    ASSETS.map(url=>c.add(new Request(url,{cache:'no-cache'})).catch(err=>console.warn('SW cache miss:',url)))
  )).then(()=>self.skipWaiting())
));

self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

self.addEventListener('fetch',e=>{
  // config.json — всегда пробуем сеть (чтобы видеть обновлённый ключ)
  if(e.request.url.endsWith('config.json')){
    e.respondWith(
      fetch(e.request).then(r=>{
        const cl=r.clone();
        caches.open(CACHE).then(c=>c.put(e.request,cl));
        return r;
      }).catch(()=>caches.match(e.request))
    );return;
  }
  // Остальное: cache-first
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached)return cached;
      return fetch(e.request).then(r=>{
        if(r.ok){const cl=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));}
        return r;
      }).catch(()=>new Response('',{status:503}));
    })
  );
});
