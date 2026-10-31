/* 망도노트 서비스워커 — 앱 파일을 탭에 저장해 두고 인터넷 없이 실행 */
const VERSION="1.5";
const CACHE="mangdo-"+VERSION;
const ASSETS=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("mangdo-")&&k!==CACHE&&!k.startsWith("mangdo-fonts")).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET")return;
  if(u.pathname.endsWith("/version.json"))return; // always network (version check)
  if(u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.open("mangdo-fonts").then(c=>c.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{c.put(e.request,r.clone());return r}).catch(()=>new Response("",{status:503})))));return}
  if(u.origin!==location.origin)return;
  e.respondWith((async()=>{const hit=await caches.match(e.request,{ignoreSearch:true});if(hit)return hit;
    if(e.request.mode==="navigate"){const idx=await caches.match("./index.html");if(idx)return idx}
    return fetch(e.request)})())});
