const BASE=new URL('./',self.location).href;
const PREFIX='steadily-'+new URL(BASE).pathname+':';
const CACHE=PREFIX+'__BUILD__';
const ASSETS=['./','./index.html','./src/app.js','./src/model.js','./src/db.js','./src/styles.css','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png'].map(p=>new URL(p,BASE).href);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request);if(hit)return hit;try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return cache.match(new URL('./index.html',BASE).href);throw error;}}));});
