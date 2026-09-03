function callNumber(t){if(!t)return void toast("No number available");const e=String(t).replace(/[^0-9]/g,"");window.location.href="tel:"+e}const _origRenderMasterLists3=renderMasterLists;renderMasterLists=function(){_origRenderMasterLists3()};const _origSelectStore2=selectStore;selectStore=function(t){_origSelectStore2(t);const e=getOrders().filter(e=>e.store===t.name&&!e.cancelled).sort((t,e)=>new Date(e.ts)-new Date(t.ts))[0];if(e){const t=document.getElementById("store-selected");if(t){if(!t.querySelector(".last-order-info")){const o=document.createElement("div");o.className="last-order-info",o.style.cssText="font-size:11px;color:var(--t2);padding:4px 13px 8px;background:var(--gl);border-radius:0 0 var(--rad) var(--rad);margin-top:-8px",o.textContent=`Last order: ${e.date} · ₹${e.grand.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}`,t.appendChild(o)}}}if(t.mobile||t.phone){const e=t.mobile||t.phone,o=document.getElementById("store-selected");if(o&&!o.querySelector(".call-btn")){const t=document.createElement("button");t.className="call-btn",t.style.cssText="display:block;width:100%;padding:8px;margin-top:4px;background:var(--gl);border:none;border-radius:var(--rads);color:var(--gd);font-size:13px;cursor:pointer;font-weight:500",t.innerHTML="📞 Call store — "+e,t.onclick=()=>callNumber(e),o.appendChild(t)}}};const _origSelectInvDist2=selectInvDist;function updateInvoiceHistorySummary(){const t=new Date,e=istMonthStart(),o=DB.get("invoice_history",[]).filter(t=>t.ts&&new Date(t.ts)>=e),n=o.reduce((t,e)=>t+(e.grand||0),0),i=document.getElementById("inv-history-summary");if(i&&i.remove(),!o.length)return;const a=document.querySelector("#tab-invoice .slabel");if(!a)return;const r=document.createElement("div");r.id="inv-history-summary",r.style.cssText="background:var(--gl);border-radius:var(--rads);padding:9px 12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center",r.innerHTML=`<span style="font-size:12px;color:var(--gd)">${t.toLocaleDateString("en-IN",{month:"long",timeZone:"Asia/Kolkata"})} — ${o.length} invoices</span><span style="font-size:14px;font-weight:700;color:var(--gd)">₹${Math.round(n).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</span>`,a.parentNode.insertBefore(r,a)}function requestNotificationPermission(){DB.get("push_subscribed_"+todayKey(),!1)||"Notification"in window&&"default"===Notification.permission&&Notification.requestPermission()}function sendEndOfDayNotification(){if(!("Notification"in window)||"granted"!==Notification.permission)return;const t=todayKey(),e=getOrders().filter(e=>e.officer===CU?.name&&e.ts&&tsToISTDate(e.ts)===t&&!e.cancelled),o=e.reduce((t,e)=>t+e.grand,0),n=DB.get("officer_targets",{}),i=DB.get("employees",[]).find(t=>t.mobile===CU?.mobile),a=i?.monthlyTarget||n[CU?.mobile]?.monthly||0,r=(new Date,istMonthStart()),s=getOrders().filter(t=>(t.officerMobile===CU?.mobile||t.officer===CU?.name)&&!t.cancelled&&t.ts&&tsToISTDate(t.ts)>=r.toLocaleDateString("en-CA")).reduce((t,e)=>t+e.grand,0),d=a?Math.round(s/a*100):0,c="Today: "+e.length+" orders, Rs."+Math.round(o).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"});new Notification("Diabliss Sales — Day Summary",{body:c+(a?" | Month: "+d+"% of target":""),icon:LOGO_URL})}selectInvDist=function(t,e){if(_origSelectInvDist2(t,e),"bill"===e){const e=DB.get("invoice_history",[]).filter(e=>e.billTo===t.name).sort((t,e)=>new Date(e.ts)-new Date(t.ts))[0],o=document.getElementById("inv-bill-selected");if(o){if(o.querySelectorAll(".last-inv-info").forEach(t=>t.remove()),e){const t=document.createElement("div");t.className="last-inv-info",t.style.cssText="font-size:11px;color:var(--t2);padding:4px 13px 6px;background:var(--al);border-radius:0 0 var(--rad) var(--rad);margin-top:-6px",t.textContent=`Last invoice: ${e.date} · ₹${(e.grand||0).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}`,o.appendChild(t)}if(t.mobile){o.querySelectorAll(".dist-call-btn").forEach(t=>t.remove());const e=document.createElement("button");e.className="dist-call-btn",e.style.cssText="display:block;width:100%;padding:8px;margin-top:4px;background:var(--bl);border:none;border-radius:var(--rads);color:var(--b);font-size:13px;cursor:pointer;font-weight:500",e.innerHTML="📞 Call distributor — "+t.mobile,e.onclick=()=>callNumber(t.mobile),o.appendChild(e)}}loadInvLedger()}};const _origEndDay4=endDay;function autoBackup(){if(!SCRIPT_URL||!CU)return;const t=DB.get("last_auto_backup",0),e=Date.now();if(e-t<864e5)return;const o={action:"backup",stores:getStores(),dists:getDists(),insts:getInsts(),products:DB.get("products",[]),territories:DB.get("custom_territories",[]),targets:DB.get("officer_targets",{}),expConfig:DB.get("exp_config_per_emp",{}),holidays:DB.get("holidays",[]),officer:CU?.name,territory:CU?.territory,ts:(new Date).toISOString(),version:APP_VERSION,auto:!0};fetch(SCRIPT_URL,{method:"POST",body:JSON.stringify(o)}).then(()=>{DB.set("last_auto_backup",e),console.log("Auto backup completed:",(new Date).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}))}).catch(()=>{})}endDay=function(){_origEndDay4(),setTimeout(sendEndOfDayNotification,1500)};const _masterLaunch2=launchApp;launchApp=function(){_masterLaunch2(),setTimeout(()=>{requestNotificationPermission(),autoBackup(),updateInvoiceHistorySummary()},1e4)};const _origSwitchTab8=switchTab;switchTab=function(t){_origSwitchTab8(t),"invoice"===t&&setTimeout(updateInvoiceHistorySummary,200)};const ALL_TERRITORY_ROLES=["GM","Admin","Sub-Admin"],OWN_TERRITORY_ROLES=["Officer","ASM","RSM"];function getMyTerritory(){return ALL_TERRITORY_ROLES.includes(CU?.role||"")?"All":CU?.territory||""}async function fetchFromSheet(t,e={}){if(!SCRIPT_URL||!navigator.onLine)return null;try{console.log("fetchFromSheet:",t);const o=Object.entries({action:t,...e}).map(([t,e])=>t+"="+encodeURIComponent(e)).join("&"),n=await fetch(gasGetUrl(SCRIPT_URL+"?"+o),{signal:_timeoutSignal(2e4)});return await n.json()}catch(e){return console.error("fetchFromSheet error:",t,e.message||e),null}}const _pendingFetches={};function _dedupFetch(t,e){if(_pendingFetches[t])return _pendingFetches[t];const o=e().finally(()=>{delete _pendingFetches[t]});return _pendingFetches[t]=o,o}async function fetchAndCacheStores(){const t=getMyTerritory(),e=await fetchFromSheet("getStores",{territory:t});return e?.stores?(DB.set("stores",e.stores),DB.set("stores_fetched_at",Date.now()),updateSyncBadges(),DB.set("stores_territory",t),e.stores):DB.get("stores",[])}function getStores(){const t=getMyTerritory(),e=DB.get("stores",[]);return"All"===t?e:e.filter(e=>!e.territory||e.territory===t)}async function saveStoreToSheet(t){t.addedBy=t.addedBy||CU?.name,t.addedAt=t.addedAt||(new Date).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}),t.territory=t.territory||getMyTerritory();const e=DB.get("stores",[]),o=e.findIndex(e=>e.id===t.id);o>=0?e[o]=t:e.push(t),DB.set("stores",e),SCRIPT_URL&&fetch(SCRIPT_URL,{method:"POST",body:gasPayload({...t,action:"saveStore"})}).then(()=>fetchAndCacheStores()).then(()=>renderMasterLists()).catch(()=>{})}async function fetchAndCacheDists(){const t=getMyTerritory(),e=await fetchFromSheet("getDists",{territory:t});return e?.dists?(DB.set("dists",e.dists),DB.set("dists_fetched_at",Date.now()),updateSyncBadges(),e.dists):DB.get("dists",[])}function getDists(){const t=getMyTerritory(),e=DB.get("dists",[]);return"All"===t?e:e.filter(e=>!e.territory||e.territory===t)}async function saveDistToSheet(t){t.addedBy=t.addedBy||CU?.name,t.addedAt=t.addedAt||(new Date).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}),t.territory=t.territory||getMyTerritory();const e=DB.get("dists",[]),o=e.findIndex(e=>e.id===t.id);o>=0?e[o]=t:e.push(t),DB.set("dists",e)}async function fetchAndCacheInsts(){const t=getMyTerritory(),e=await fetchFromSheet("getInsts",{territory:t});return e?.insts?(DB.set("insts",e.insts),DB.set("insts_fetched_at",Date.now()),e.insts):DB.get("insts",[])}function getInsts(){const t=getMyTerritory(),e=DB.get("insts",[]);return"All"===t?e:e.filter(e=>!e.territory||e.territory===t)}async function saveInstToSheet(t){t.addedBy=t.addedBy||CU?.name,t.addedAt=t.addedAt||(new Date).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}),t.territory=t.territory||getMyTerritory();const e=DB.get("insts",[]),o=e.findIndex(e=>e.id===t.id);o>=0?e[o]=t:e.push(t),DB.set("insts",e),SCRIPT_URL&&fetch(SCRIPT_URL,{method:"POST",body:gasPayload({...t,action:"saveInstitution"})}).catch(()=>{})}async function fetchAndCacheHolidays(){const t=await fetchFromSheet("getHolidays");return t?.holidays?(DB.set("holidays",t.holidays),DB.set("holidays_fetched_at",Date.now()),t.holidays):DB.get("holidays",[])}async function fetchAndCacheProducts(){const t=await fetchFromSheet("getProducts");if(t?.products){DB.get("sheet_products",[]);const e=DB.get("custom_products",[]),o=DB.get("products",[]),n=new Set(t.products.map(t=>(t.name||"").toLowerCase().trim()));return[...e,...o].forEach(e=>{const o=(e.name||"").toLowerCase().trim();n.has(o)||(n.add(o),t.products.push(e))}),DB.set("sheet_products",t.products),t.products}return DB.get("sheet_products",[])}async function fetchAndCacheTargets(){const t=await fetchFromSheet("getTargets");return t?.targets?(DB.set("officer_targets",t.targets),t.targets):DB.get("officer_targets",{})}async function fetchAndCacheLedger(t){const e="action=getLedger&partyId="+encodeURIComponent(t||"");let o=null;try{const t=await fetch(gasGetUrl(SCRIPT_URL+"?"+e),{signal:_timeoutSignal(2e4)});o=await t.json()}catch(t){console.error("fetchAndCacheLedger error:",t.message||t)}if(o?.entries){const e=o.entries.map(t=>({...t,date:normalizeAttDate_(t.date)||t.date||""}));return e.sort((t,e)=>(t.date||"").localeCompare(e.date||"")),DB.set("ledger_"+t,e),e}return DB.get("ledger_"+t,[])}async function fetchAndCacheEmployees(){const t=await fetchFromSheet("getEmployees");if(t?.employees){DB.set("employees",t.employees);return t.employees;}return DB.get("employees",[]);}async function fetchAndCacheBroadcast(){const t=await fetchFromSheet("getBroadcast");return t?.broadcast?(DB.set("broadcasts",[t.broadcast]),t.broadcast):null}async function fetchAndCacheOfficerLocations(){const t=CU?.role||"Officer";if(["GM","Admin","Sub-Admin","ASM","RSM"].includes(t)&&SCRIPT_URL&&navigator.onLine)try{const t=await fetch(gasGetUrl(SCRIPT_URL+"?action=getOfficerLocations&date="+todayKey()),{signal:_timeoutSignal(2e4)}),e=await t.json();if(e?.locations){const t={};e.locations.forEach(e=>{t[e.mobile]=e}),DB.set("officer_locations_today",t),DB.set("officer_locations_ts",(new Date).toISOString())}}catch(t){}}function getOfficerLocationData(t){return DB.get("officer_locations_today",{})[t]||null}async function loadMasterDataFromSheet(){if(!navigator.onLine)return;const prevStores=DB.get("stores",[]).length,prevDists=DB.get("dists",[]).length,prevProds=DB.get("sheet_products",[]).length;const refresh=()=>{document.getElementById("tab-master")?.classList.contains("active")&&renderMasterLists();document.getElementById("tab-invoice")?.classList.contains("active")&&initInvLedger()};const _empFetch=["ASM","RSM","GM","Admin","Sub-Admin"].includes(CU?.role||"")?fetchAndCacheEmployees().catch(()=>null):Promise.resolve(null);Promise.all([fetchAndCacheStores().catch(()=>null),fetchAndCacheDists().catch(()=>null),fetchAndCacheInsts().catch(()=>null),fetchAndCacheHolidays().catch(()=>null),fetchAndCacheTargets().catch(()=>null),fetchAndCacheBroadcast().catch(()=>null),fetchAndCacheProducts().catch(()=>null),_empFetch]).then(()=>{refresh();if(["ASM","RSM"].includes(CU?.role||""))renderRoleHome();const s=DB.get("stores",[]).length,d=DB.get("dists",[]).length,p=DB.get("sheet_products",[]).length;if(s>prevStores)toast(s-prevStores+" new store(s) synced");if(d>prevDists)toast(d-prevDists+" new distributor(s) synced");if(p>prevProds)toast(p-prevProds+" new product(s) synced");checkTodayHoliday();"function"==typeof updateTargetProgress&&updateTargetProgress();checkBroadcast()}).catch(()=>{})}
// ══ MISSING FUNCTIONS RESTORED (Session 30) ══

const SB_URL='https://ndxbbuejunkawfomvjrl.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5keGJidWVqdW5rYXdmb212anJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDI5NjEsImV4cCI6MjEwMTUxODk2MX0.gKn6Slz3SX9LacwKJU3uN9Pw3BO3PKlh3TBwDxxFj-4';

function _sbRowToOrder(r){
  const items=(r.products&&r.products.indexOf('NO ORDER')!==0)?r.products.split(',').map(s=>{s=s.trim();const m=s.match(/^(.*?)[×x]\s*(\d+)\s*@\s*₹?([\d.]+)/i);return m?{name:m[1].trim(),qty:parseInt(m[2]),price:parseFloat(m[3]),total:Math.round(parseInt(m[2])*parseFloat(m[3])*100)/100}:{name:s,qty:0,price:0,total:0}}).filter(i=>i.name):[];
  return{id:r.id,date:r.order_date,time:r.order_time,officer:r.officer,officerMobile:r.officer_mobile,officerRole:r.role||'Officer',territory:r.territory,store:r.store,storeCity:r.store_city,storeTerritory:r.store_territory,storeMargin:r.margin,distributor:r.distributor,distType:r.dist_type,distTerritory:r.dist_territory,distCity:r.dist_city,productsText:r.products,items,sub:r.basic_value||0,gst:r.gst||0,grand:r.grand_total||0,total:r.grand_total||0,hasSpecial:r.has_special,hasUns:r.has_unsaleable,notes:r.notes,noOrder:(r.products||'').indexOf('NO ORDER')===0,ts:(r.order_date&&r.order_time?r.order_date+'T'+r.order_time:r.order_date?r.order_date+'T00:00:00':r.synced_at),synced:true};
}

async function _fetchOrdersFromSupabase(){
  const cutoff=new Date();cutoff.setDate(cutoff.getDate()-90);
  const from=cutoff.toISOString().slice(0,10);
  const url=SB_URL+'/rest/v1/orders?select=*&order_date=gte.'+from+'&order=synced_at.asc&limit=5000';
  const r=await fetch(url,{headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY},signal:_timeoutSignal(8000)});
  if(!r.ok)throw new Error('SB '+r.status);
  return (await r.json()).map(_sbRowToOrder);
}

let _orderFetchInFlight = null, _lastOrderFetch = 0;

function allProds() {
  const defaultNames = new Set(DEFAULT_PRODUCTS.map(p => (p.name||'').toLowerCase().trim()));
  const sheetProds = DB.get('sheet_products', []).filter(p => p.active !== false && !defaultNames.has((p.name||'').toLowerCase().trim()));
  const custom = (typeof getCustomProducts === 'function' ? getCustomProducts() : []).filter(p => p.active !== false && !defaultNames.has((p.name||'').toLowerCase().trim()));
  const legacy = DB.get('products', []).filter(p => !defaultNames.has((p.name||'').toLowerCase().trim()));
  const seen = new Set(defaultNames);
  const extra = [];
  for (const p of [...sheetProds, ...custom, ...legacy]) {
    const key = (p.name||'').toLowerCase().trim();
    if (!seen.has(key)) { seen.add(key); extra.push(p); }
  }
  return [...DEFAULT_PRODUCTS, ...extra];
}

function restrictDistributorAddition() {
  const role = CU?.role || 'Officer';
  const isAdmin = ['Admin','Sub-Admin'].includes(role);
  const typeSelects = document.querySelectorAll('#nd-type, #iad-type, #md-type');
  typeSelects.forEach(sel => {
    const ssOpt = [...sel.options].find(o => o.value === 'Super Stockist');
    if (ssOpt) ssOpt.style.display = isAdmin ? '' : 'none';
    if (!isAdmin && sel.value === 'Super Stockist') {
      sel.value = 'Distributor';
      if (typeof toggleDistPattern === 'function') toggleDistPattern('Distributor');
    }
  });
}

async function fetchAndCacheOrders(){
  if(!navigator.onLine)return DB.get('orders',[]);
  if(_orderFetchInFlight)return _orderFetchInFlight;
  if(Date.now()-_lastOrderFetch<30000)return DB.get('orders',[]);
  _orderFetchInFlight=(async()=>{
    try{
      const territory=typeof getMyTerritory==='function'?getMyTerritory():(CU?.territory||'');
      let normalized=null;
      // Retry each source once (1s backoff) before falling through — a single
      // transient timeout used to mean a silent zero on the dashboard with no
      // error shown, since callers just render whatever's already cached.
      let rows=null;
      for(let i=0;i<2&&!rows;i++){
        try{rows=await _fetchOrdersFromSupabase();}
        catch(e){if(i===0)await new Promise(res=>setTimeout(res,1000));}
      }
      if(rows){
        normalized=territory&&territory!=='All'?rows.filter(o=>!o.territory||o.territory===territory):rows;
      }else{
        if(!SCRIPT_URL)return;
        let data=null;
        for(let i=0;i<2&&!data;i++){
          try{
            const r=await fetch(gasGetUrl(SCRIPT_URL+'?action=getOrders&territory='+encodeURIComponent(territory)),{signal:_timeoutSignal(15000)});
            data=await r.json();
          }catch(e){if(i===0)await new Promise(res=>setTimeout(res,1000));}
        }
        if(!data)return;
        normalized=(data?.orders||[]).map(o=>({...o,grand:(o.grand??o.total??0),items:o.items||[]}));
      }
      if(!normalized||!normalized.length)return;
      const local=DB.get('orders',[]);
      const localById={};
      local.forEach(o=>{if(o.id)localById[o.id]=o;});
      const merged=normalized.map(srv=>{
        const loc=localById[srv.id];
        if(!loc)return srv;
        delete localById[srv.id];
        const locHasItems=Array.isArray(loc.items)&&loc.items.length;
        const srvHasItems=Array.isArray(srv.items)&&srv.items.length;
        const base=(locHasItems&&!srvHasItems)?loc:srv;
        return{...srv,...loc,...base,items:locHasItems?loc.items:srv.items,officerRole:loc.officerRole||srv.officerRole||'Officer',grand:base.grand??srv.grand??loc.grand??0};
      });
      Object.values(localById).forEach(o=>merged.push(o));
      DB.set('orders',merged);
      DB.set('orders_fetched_at',Date.now());
      if(typeof updateSyncBadges==='function')updateSyncBadges();
      return merged;
    }catch(e){}
  })();
  try{const result=await _orderFetchInFlight;_lastOrderFetch=Date.now();return result;}
  finally{_orderFetchInFlight=null;}
}
