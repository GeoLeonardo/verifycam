const CACHE='verifycam-v1';
const CORE=['index.html','manifest.json','icon.png'];
const NETWORK_FIRST=['config.json'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(CORE.map(u=>{try{return u}catch(e){return u}}))).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  const name=url.pathname.split('/').pop();
  if(NETWORK_FIRST.includes(name)){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached=>{
    if(cached)return cached;
    return fetch(e.request).then(resp=>{
      if(resp&&resp.status===200&&resp.type==='basic'){
        const clone=resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone));
      }
      return resp;
    }).catch(()=>cached);
  }));
});
