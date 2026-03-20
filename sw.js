const CACHE='vc9';
const FILES=['./','./index.html','./manifest.json','./icon.png','./config.json'];
self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(c=>
    Promise.allSettled(FILES.map(f=>
      c.add(new Request(f,{cache:'no-cache'})).catch(err=>console.warn(f,err))
    ))
  ).then(()=>self.skipWaiting())
));
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  if(e.request.url.includes('config.json')){
    e.respondWith(fetch(e.request).then(r=>{caches.open(CACHE).then(c=>c.put(e.request,r.clone()));return r;}).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(r2=>{if(r2.ok){const cl=r2.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));}return r2;}).catch(()=>new Response('offline',{status:503}))));
});
