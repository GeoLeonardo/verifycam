const V='vc8';
const F=['./','./index.html','./manifest.json','./icon.png','./config.json'];
self.addEventListener('install',e=>e.waitUntil(
  caches.open(V).then(c=>Promise.all(F.map(f=>
    cache_add(c,f)
  ))).then(()=>self.skipWaiting())
));
function cache_add(c,url){
  return fetch(new Request(url,{cache:'reload'}))
    .then(r=>{if(r.ok)return c.put(url,r);})
    .catch(()=>{});
}
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  if(e.request.url.includes('config.json')){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
