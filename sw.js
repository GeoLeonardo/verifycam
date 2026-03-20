const V='vc7';
const F=['/','index.html','manifest.json','icon.png','config.json'];
self.addEventListener('install',e=>e.waitUntil(
  caches.open(V).then(c=>c.addAll(F.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting())
));
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  // config.json всегда берём из сети (чтобы видеть изменения ключа)
  if(e.request.url.includes('config.json')){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
