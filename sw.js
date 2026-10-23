const CACHE="diabliss-v1.7.187",ASSETS=["./","./index.html","./Diabliss_Logo-01.png","./pricing.js?v=1.7.187","./app-core.js?v=1.7.187","./app-ui-helpers.js?v=1.7.187","./app-visit-flow.js?v=1.7.187","./app-admin-master.js?v=1.7.187","./app-dash-reports.js?v=1.7.187","./app-corrections.js?v=1.7.187","./app-targets-expenses.js?v=1.7.187","./app-ledger-invoice.js?v=1.7.187","./app-data-sync.js?v=1.7.187","./app-features-new.js?v=1.7.187","./app-features-v2.js?v=1.7.187","./app-chatbot.js?v=1.7.187","./mis-report.html"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(e=>e.addAll(ASSETS)).then(()=>self.skipWaiting()))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE).map(e=>caches.delete(e)))).then(()=>self.clients.claim()))}),self.addEventListener("fetch",e=>{
  if("GET"!==e.request.method)return;
  const t=new URL(e.request.url),s=t.searchParams.get("action");
  if(t.pathname.includes("script.google.com")&&s&&["getFiles","getProductPhotos","getOfficerLocations","getCompanyFiles"].includes(s)){
    e.respondWith(caches.open(CACHE).then(t=>t.match(e.request).then(s=>{const a=fetch(e.request).then(s=>(s.ok&&t.put(e.request,s.clone()),s)).catch(()=>s);return s||a})));
    return;
  }
  if(t.pathname.includes("script.google.com")||t.pathname.includes("googleapis.com")||t.searchParams.has("action"))return;
  // Detect page-load requests several ways — "mode" alone isn't reliably reported
  // as "navigate" by every Android WebView/Chrome build for an installed PWA, so
  // a single-signal check can silently never fire on some devices.
  const isPageLoad = "navigate"===e.request.mode
    || "document"===e.request.destination
    || (e.request.headers.get("accept")||"").includes("text/html")
    || t.pathname===self.registration.scope.replace(location.origin,"")
    || t.pathname.endsWith("/")
    || t.pathname.endsWith("/index.html");
  if(isPageLoad){
    // App-shell fallback: on every page load (including a cold resume after
    // Android kills and restarts the webview), always try the network first, but
    // NEVER let a transient network/server failure show the user a raw error page
    // — fall back to the cached shell, which is always known-good.
    e.respondWith(
      fetch(e.request).then(r=>{
        if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c));return r}
        return caches.match(e.request).then(c=>c||caches.match("./index.html")).then(c=>c||caches.match("./")).then(c=>c||r);
      }).catch(()=>caches.match(e.request).then(c=>c||caches.match("./index.html")).then(c=>c||caches.match("./")))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(t=>t||fetch(e.request).then(t=>{if(t.ok){const s=t.clone();caches.open(CACHE).then(t=>t.put(e.request,s))}return t})));
});function _safeAppUrl(u){try{const r=new URL(u,self.location.origin);return r.origin===self.location.origin?r.href:"/diabliss-sales-app/"}catch(e){return "/diabliss-sales-app/"}}
self.addEventListener("push",e=>{if(!e.data)return;try{const d=e.data.json();if(d.type==="force_refresh"){e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k)))).then(()=>self.clients.matchAll({type:"window",includeUncontrolled:true})).then(clients=>clients.forEach(c=>c.postMessage({type:"force_refresh"}))));return;}self.registration.showNotification(d.title||"Diabliss",{body:d.body||"",icon:"/diabliss-sales-app/Diabliss_Logo-01.png",data:{url:_safeAppUrl(d.url||"/diabliss-sales-app/")}});}catch(err){const t=e.data.text();self.registration.showNotification("Diabliss",{body:t,icon:"/diabliss-sales-app/Diabliss_Logo-01.png"});}});
self.addEventListener("notificationclick",e=>{e.notification.close();const url=_safeAppUrl(e.notification.data?.url||"/diabliss-sales-app/");e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{const c=cs.find(c=>c.url.includes("diabliss-sales-app"));if(c)return c.focus();return self.clients.openWindow(url);}));});
