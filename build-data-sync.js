function callNumber(number) {
  if (!number) { toast('No number available'); return; }
  const clean = String(number).replace(/[^0-9]/g, '');
  window.location.href = 'tel:' + clean;
}

// Patch renderMasterLists to add call buttons for distributors
const _origRenderMasterLists3 = renderMasterLists;
renderMasterLists = function() {
  _origRenderMasterLists3();
  // Dist list is now handled by original renderMasterLists with edit/delete buttons
};

// ══ FEATURE 4 & 6: LAST ORDER/INVOICE SHOWN WHEN SELECTING ══
// Patch selectStore to show last order
const _origSelectStore2 = selectStore;
selectStore = function(store) {
  _origSelectStore2(store);
  // Show last order for this store
  const lastOrder = getOrders().filter(o => o.store === store.name && !o.cancelled)
    .sort((a,b) => new Date(b.ts) - new Date(a.ts))[0];
  if (lastOrder) {
    const el = document.getElementById('store-selected');
    if (el) {
      const existing = el.querySelector('.last-order-info');
      if (!existing) {
        const div = document.createElement('div');
        div.className = 'last-order-info';
        div.style.cssText = 'font-size:11px;color:var(--t2);padding:4px 13px 8px;background:var(--gl);border-radius:0 0 var(--rad) var(--rad);margin-top:-8px';
        div.textContent = `Last order: ${lastOrder.date} · ₹${lastOrder.grand.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}`;
        el.appendChild(div);
      }
    }
  }
  // Show store phone if available
  if (store.mobile || store.phone) {
    const num = store.mobile || store.phone;
    const el = document.getElementById('store-selected');
    if (el && !el.querySelector('.call-btn')) {
      const btn = document.createElement('button');
      btn.className = 'call-btn';
      btn.style.cssText = 'display:block;width:100%;padding:8px;margin-top:4px;background:var(--gl);border:none;border-radius:var(--rads);color:var(--gd);font-size:13px;cursor:pointer;font-weight:500';
      btn.innerHTML = '📞 Call store — ' + num;
      btn.onclick = () => callNumber(num);
      el.appendChild(btn);
    }
  }
};

// Patch selectInvDist to show last invoice
const _origSelectInvDist2 = selectInvDist;
selectInvDist = function(dist, side) {
  _origSelectInvDist2(dist, side);
  if (side === 'bill') {
    // Show last invoice for this distributor
    const invoices = DB.get('invoice_history', []).filter(i => i.billTo === dist.name);
    const lastInv = invoices.sort((a,b) => new Date(b.ts) - new Date(a.ts))[0];
    const el = document.getElementById('inv-bill-selected');
    if (el) {
      // Remove existing info
      el.querySelectorAll('.last-inv-info').forEach(e => e.remove());
      if (lastInv) {
        const div = document.createElement('div');
        div.className = 'last-inv-info';
        div.style.cssText = 'font-size:11px;color:var(--t2);padding:4px 13px 6px;background:var(--al);border-radius:0 0 var(--rad) var(--rad);margin-top:-6px';
        div.textContent = `Last invoice: ${lastInv.date} · ₹${(lastInv.grand||0).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}`;
        el.appendChild(div);
      }
      // Add call button for distributor
      if (dist.mobile) {
        el.querySelectorAll('.dist-call-btn').forEach(e => e.remove());
        const btn = document.createElement('button');
        btn.className = 'dist-call-btn';
        btn.style.cssText = 'display:block;width:100%;padding:8px;margin-top:4px;background:var(--bl);border:none;border-radius:var(--rads);color:var(--b);font-size:13px;cursor:pointer;font-weight:500';
        btn.innerHTML = '📞 Call distributor — ' + dist.mobile;
        btn.onclick = () => callNumber(dist.mobile);
        el.appendChild(btn);
      }
    }
    // Also show in ledger balance
    loadInvLedger();
  }
};

// ══ FEATURE 7: INVOICE TOTAL SUMMARY ══
function updateInvoiceHistorySummary() {
  const now = new Date();
  const monthStart = istMonthStart();
  const invoices = DB.get('invoice_history', []).filter(i => i.ts && new Date(i.ts) >= monthStart);
  const total = invoices.reduce((a,i) => a + (i.grand||0), 0);
  const existing = document.getElementById('inv-history-summary');
  if (existing) existing.remove();
  if (!invoices.length) return;
  const slabel = document.querySelector('#tab-invoice .slabel');
  if (!slabel) return;
  const div = document.createElement('div');
  div.id = 'inv-history-summary';
  div.style.cssText = 'background:var(--gl);border-radius:var(--rads);padding:9px 12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center';
  div.innerHTML = `<span style="font-size:12px;color:var(--gd)">${now.toLocaleDateString('en-IN',{month:'long',timeZone:'Asia/Kolkata'})} — ${invoices.length} invoices</span><span style="font-size:14px;font-weight:700;color:var(--gd)">₹${Math.round(total).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</span>`;
  slabel.parentNode.insertBefore(div, slabel);
}

// ══ FEATURE 8: END OF DAY NOTIFICATION ══
function requestNotificationPermission() {
  // Throttle: only attempt once per device per day
  if (DB.get('push_subscribed_'+todayKey(), false)) return;
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendEndOfDayNotification() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const today = todayKey();
  const orders = getOrders().filter(o => o.officer===CU?.name && o.ts && tsToISTDate(o.ts)===today && !o.cancelled);
  const val = orders.reduce((a,o) => a+o.grand, 0);
  const targets = DB.get('officer_targets', {});
  const emps = DB.get('employees', []);
  const emp = emps.find(e => e.mobile===CU?.mobile);
  const target = emp?.monthlyTarget || targets[CU?.mobile]?.monthly || 0;
  const now = new Date();
  const monthStart = istMonthStart();
  const monthOrders = getOrders().filter(o => (o.officerMobile===CU?.mobile||o.officer===CU?.name) && !o.cancelled && o.ts && tsToISTDate(o.ts)>=monthStart.toLocaleDateString('en-CA'));
  const monthVal = monthOrders.reduce((a,o) => a+o.grand, 0);
  const pct = target ? Math.round(monthVal/target*100) : 0;
  const title = 'Diabliss Sales — Day Summary';
  const bodyLine1 = 'Today: '+orders.length+' orders, Rs.'+Math.round(val).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
  const bodyLine2 = target ? ' | Month: '+pct+'% of target' : '';
  const body = bodyLine1 + bodyLine2;
  new Notification(title, { body, icon: LOGO_URL });
}

// Patch endDay to send notification
const _origEndDay4 = endDay;
endDay = function() {
  _origEndDay4();
  setTimeout(sendEndOfDayNotification, 1500);
};

// ══ FEATURE 8: AUTO BACKUP ══
function autoBackup() {
  if (!SCRIPT_URL || !CU) return;
  const lastBackup = DB.get('last_auto_backup', 0);
  const now = Date.now();
  const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  if (now - lastBackup < BACKUP_INTERVAL) return; // Already backed up today
  const data = {
    action: 'backup',
    stores: getStores(), dists: getDists(), insts: getInsts(),
    products: DB.get('products', []),
    territories: DB.get('custom_territories', []),
    targets: DB.get('officer_targets', {}),
    expConfig: DB.get('exp_config_per_emp', {}),
    holidays: DB.get('holidays', []),
    officer: CU?.name, territory: CU?.territory,
    ts: new Date().toISOString(), version: APP_VERSION, auto: true
  };
  fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) })
    .then(() => {
      DB.set('last_auto_backup', now);
      console.log('Auto backup completed:', new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}));
    })
    .catch(() => {});
}

// Patch launchApp to request notification permission and setup auto backup
const _masterLaunch2 = launchApp;
launchApp = function() {
  _masterLaunch2();
  setTimeout(() => {
    requestNotificationPermission();
    autoBackup();
    updateInvoiceHistorySummary();
  }, 10000);
};

// Patch switchTab for invoice summary
const _origSwitchTab8 = switchTab;
switchTab = function(name) {
  _origSwitchTab8(name);
  if (name === 'invoice') {
    setTimeout(updateInvoiceHistorySummary, 200);
  }
};


// ══ MASTER DATA LAYER — SHEET AS PRIMARY ══

// Roles that see ALL territories
const ALL_TERRITORY_ROLES = ['GM','Admin','Sub-Admin'];
// Roles filtered by own territory
const OWN_TERRITORY_ROLES = ['Officer','ASM','RSM'];

function getMyTerritory() {
  if (ALL_TERRITORY_ROLES.includes(CU?.role||'')) return 'All';
  return CU?.territory || '';
}

// ── FETCH FROM SHEET ──
async function fetchFromSheet(action, params={}) {
  if (!SCRIPT_URL || !navigator.onLine) return null;
  try {
    console.log('fetchFromSheet:', action);
    const qs = Object.entries({action, ...params}).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
    const r = await fetch(gasGetUrl(SCRIPT_URL+'?'+qs), {signal: AbortSignal.timeout(10000)});
    return await r.json();
  } catch(e) { 
    console.error('fetchFromSheet error:', action, e.message||e);
    return null; 
  }
}

// ── STORES ──
async function fetchAndCacheStores() {
  const territory = getMyTerritory();
  const data = await fetchFromSheet('getStores', {territory});
  if (data?.stores) {
    DB.set('stores', data.stores);
    DB.set('stores_fetched_at', Date.now());
    updateSyncBadges();
    DB.set('stores_territory', territory);
    return data.stores;
  }
  return DB.get('stores', []);
}

function getStores() {
  const territory = getMyTerritory();
  const stores = DB.get('stores', []);
  // Filter by territory for non-admin roles
  if (territory === 'All') return stores;
  return stores.filter(s => !s.territory || s.territory === territory);
}

async function saveStoreToSheet(store) {
  store.addedBy = store.addedBy || CU?.name;
  store.addedAt = store.addedAt || new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"});
  store.territory = store.territory || getMyTerritory();
  // Save to local cache first
  const stores = DB.get('stores', []);
  const idx = stores.findIndex(s => s.id === store.id);
  if (idx >= 0) stores[idx] = store; else stores.push(store);
  DB.set('stores', stores);
  // Sync to Sheet
  if (SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({...store, action:'saveStore'})})
    .then(()=>fetchAndCacheStores())
    .then(()=>renderMasterLists())
    .catch(()=>{});
}

// ── DISTRIBUTORS ──
async function fetchAndCacheDists() {
  const territory = getMyTerritory();
  const data = await fetchFromSheet('getDists', {territory});
  if (data?.dists) {
    DB.set('dists', data.dists);
    DB.set('dists_fetched_at', Date.now());
    updateSyncBadges();
    return data.dists;
  }
  return DB.get('dists', []);
}

function getDists() {
  const territory = getMyTerritory();
  const dists = DB.get('dists', []);
  if (territory === 'All') return dists;
  return dists.filter(d => !d.territory || d.territory === territory);
}

async function saveDistToSheet(dist) {
  dist.addedBy = dist.addedBy || CU?.name;
  dist.addedAt = dist.addedAt || new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"});
  dist.territory = dist.territory || getMyTerritory();
  const dists = DB.get('dists', []);
  const idx = dists.findIndex(d => d.id === dist.id);
  if (idx >= 0) dists[idx] = dist; else dists.push(dist);
  DB.set('dists', dists);
  // Sheet sync handled in saveNewDist/saveInvDist directly
}

// ── INSTITUTIONS ──
async function fetchAndCacheInsts() {
  const territory = getMyTerritory();
  const data = await fetchFromSheet('getInsts', {territory});
  if (data?.insts) {
    DB.set('insts', data.insts);
    DB.set('insts_fetched_at', Date.now());
    return data.insts;
  }
  return DB.get('insts', []);
}

function getInsts() {
  const territory = getMyTerritory();
  const insts = DB.get('insts', []);
  if (territory === 'All') return insts;
  return insts.filter(i => !i.territory || i.territory === territory);
}

async function saveInstToSheet(inst) {
  inst.addedBy = inst.addedBy || CU?.name;
  inst.addedAt = inst.addedAt || new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"});
  inst.territory = inst.territory || getMyTerritory();
  const insts = DB.get('insts', []);
  const idx = insts.findIndex(i => i.id === inst.id);
  if (idx >= 0) insts[idx] = inst; else insts.push(inst);
  DB.set('insts', insts);
  if (SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({...inst, action:'saveInstitution'})}).catch(()=>{});
}

// ── HOLIDAYS ──
async function fetchAndCacheHolidays() {
  const data = await fetchFromSheet('getHolidays');
  if (data?.holidays) {
    DB.set('holidays', data.holidays);
    DB.set('holidays_fetched_at', Date.now());
    return data.holidays;
  }
  return DB.get('holidays', []);
}

// ── PRODUCTS ──
async function fetchAndCacheProducts() {
  const data = await fetchFromSheet('getProducts');
  if (data?.products) {
    // Migrate: also absorb any local custom_products and legacy products into sheet_products
    const existing = DB.get('sheet_products', []);
    const custom = DB.get('custom_products', []);
    const legacy = DB.get('products', []);
    const seen = new Set(data.products.map(p => (p.name||'').toLowerCase().trim()));
    // Add local-only products not yet in sheet
    [...custom, ...legacy].forEach(p => {
      const key = (p.name||'').toLowerCase().trim();
      if (!seen.has(key)) { seen.add(key); data.products.push(p); }
    });
    DB.set('sheet_products', data.products);
    return data.products;
  }
  return DB.get('sheet_products', []);
}

// ── TARGETS ──
async function fetchAndCacheTargets() {
  const data = await fetchFromSheet('getTargets');
  if (data?.targets) {
    DB.set('officer_targets', data.targets);
    return data.targets;
  }
  return DB.get('officer_targets', {});
}

// ── LEDGER ──
async function fetchAndCacheLedger(partyId) {
  const data = await fetchFromSheet('getLedger', {partyId});
  if (data?.entries) {
    // Sheet is source of truth — normalize dates and overwrite local cache
    const normalized = data.entries.map(e => ({...e, date: normalizeAttDate_(e.date)||e.date||''}));
    normalized.sort((a,b) => (a.date||'').localeCompare(b.date||''));
    DB.set('ledger_'+partyId, normalized);
    return normalized;
  }
  return DB.get('ledger_'+partyId, []);
}

// Override getLedger to fetch from Sheet
// getLedger patched below
getLedger = function(partyId) {
  // Return cached first, fetch in background
  const cached = DB.get('ledger_'+partyId, []);
  if (navigator.onLine) {
    fetchAndCacheLedger(partyId).then(() => {
      // Re-render ledger if invoice tab is open
      const invTab = document.getElementById('tab-invoice');
      if (invTab && invTab.classList.contains('active')) loadInvLedger();
    });
  }
  return cached;
};

// ── BROADCASTS ──
async function fetchAndCacheBroadcast() {
  const data = await fetchFromSheet('getBroadcast');
  if (data?.broadcast) {
    DB.set('broadcasts', [data.broadcast]);
    return data.broadcast;
  }
  return null;
}

// ── MASTER DATA REFRESH — load all on launch ──
async function fetchAndCacheOfficerLocations() {
  // Only fetch for GM/Admin/ASM/RSM — officers don't need this
  const role = CU?.role || 'Officer';
  if (!['GM','Admin','Sub-Admin','ASM','RSM'].includes(role)) return;
  if (!SCRIPT_URL || !navigator.onLine) return;
  try {
    const res = await fetch(gasGetUrl(SCRIPT_URL+'?action=getOfficerLocations&date=' + todayKey()));
    const data = await res.json();
    if (data?.locations) {
      // Store as map: mobile → location data
      const locMap = {};
      data.locations.forEach(l => { locMap[l.mobile] = l; });
      DB.set('officer_locations_today', locMap);
      DB.set('officer_locations_ts', new Date().toISOString());
    }
  } catch(e) {}
}

// Get cached location data for a specific officer mobile
function getOfficerLocationData(mobile) {
  const locMap = DB.get('officer_locations_today', {});
  return locMap[mobile] || null;
}

async function loadMasterDataFromSheet() {
  if (!navigator.onLine) return;
  // PERF: previously this awaited all six fetches (each 2-3.5s on Apps Script)
  // before the app was usable — ~20-30s of dead time on every launch. The app
  // already reads from local storage, and each fetch already caches there, so
  // we now refresh in the BACKGROUND without blocking. The officer sees their
  // last-known data instantly; fresh data slots in silently as each returns.
  const refreshUiIfNeeded = () => {
    if (document.getElementById('tab-master')?.classList.contains('active')) renderMasterLists();
    if (document.getElementById('tab-invoice')?.classList.contains('active')) initInvLedger();
  };
  const _prevStoreCnt = (DB.get('stores',[])).length;
  const _prevDistCnt  = (DB.get('dists',[])).length;
  const _prevProdCnt  = (DB.get('sheet_products',[])).length;
  // Staggered fetches — 400ms apart to avoid concurrent GAS request timeouts
  const _delay = ms => new Promise(r => setTimeout(r, ms));
  (async () => {
    try { await fetchAndCacheStores();   refreshUiIfNeeded(); const n1=DB.get('stores',[]).length;        if(n1>_prevStoreCnt) toast(''+(n1-_prevStoreCnt)+' new store(s) synced'); }   catch(e){}
    await _delay(150);
    try { await fetchAndCacheDists();    refreshUiIfNeeded(); const n2=DB.get('dists',[]).length;         if(n2>_prevDistCnt)  toast(''+(n2-_prevDistCnt)+' new distributor(s) synced'); } catch(e){}
    await _delay(150);
    try { await fetchAndCacheInsts();    refreshUiIfNeeded(); }                                                                                                                           catch(e){}
    await _delay(150);
    try { await fetchAndCacheHolidays(); checkTodayHoliday(); }                                                                                                                          catch(e){}
    await _delay(150);
    try { await fetchAndCacheTargets();  if(typeof updateTargetProgress==='function') updateTargetProgress(); }                                                                           catch(e){}
    await _delay(150);
    try { await fetchAndCacheBroadcast(); checkBroadcast(); }                                                                                                                            catch(e){}
    await _delay(150);
    try { await fetchAndCacheProducts(); const n3=DB.get('sheet_products',[]).length; if(n3>_prevProdCnt) toast(''+(n3-_prevProdCnt)+' new product(s) synced'); }                       catch(e){}
  })();
}

// ── PATCH SAVE FUNCTIONS to use Sheet ──

// Patch saveNewStore
const _origSaveNewStore3 = saveNewStore;
saveNewStore = function() {
  _origSaveNewStore3();
  // Get the store that was just saved and sync to sheet
  setTimeout(() => {
    const stores = DB.get('stores', []);
    const latest = stores[stores.length-1];
    if (latest) saveStoreToSheet(latest);
  }, 300);
};

// Patch saveMStore (edit store)
const _origSaveMStore2 = saveMStore;
saveMStore = function() {
  _origSaveMStore2();
  setTimeout(() => {
    const stores = DB.get('stores', []);
    const latest = stores[stores.length-1];
    if (latest) saveStoreToSheet(latest);
  }, 300);
};

// Patch saveNewDist


// Patch saveMDist


// Patch // institution save patch
const _origSaveNewInst2 = saveNewInstitution;
saveNewInstitution = function() {
  _origSaveNewInst2();
  setTimeout(() => {
    const insts = DB.get('insts', []);
    const latest = insts[insts.length-1];
    if (latest) saveInstToSheet(latest);
  }, 300);
};

// toggleStoreClosed with sheet sync (safe guard)
if (typeof toggleStoreClosed === 'function') {
  const _origToggleStoreClosedSheet = toggleStoreClosed;
  toggleStoreClosed = function(storeId) {
    _origToggleStoreClosedSheet(storeId);
    setTimeout(() => {
      const store = getStores().find(s => s.id === storeId);
      if (store) saveStoreToSheet(store);
    }, 300);
  };
} else {
  toggleStoreClosed = function(storeId) {
    const stores = DB.get('stores',[]);
    const idx = stores.findIndex(s=>s.id===storeId);
    if (idx===-1) return;
    stores[idx].closed = !stores[idx].closed;
    stores[idx].closedAt = stores[idx].closed ? new Date().toISOString() : null;
    DB.set('stores',stores);
    renderMasterLists();
    toast(stores[idx].closed?'Store marked as closed':'Store marked as active');
    setTimeout(()=>{ const store=stores[idx]; if(store)saveStoreToSheet(store); },300);
  };
}

// Patch saveHoliday to use Sheet
const _origSaveHolidaySheet = saveHoliday;
saveHoliday = function() {
  _origSaveHolidaySheet();
  setTimeout(() => {
    const holidays = DB.get('holidays', []);
    const latest = holidays[holidays.length-1];
    if (latest && SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({...latest, action:'saveHoliday'})}).catch(()=>{});
  }, 300);
};

// Set territory on new store/dist if officer
// Called on DOMContentLoaded AND whenever a form opens (via switchTab patch)
function autoFillOfficerTerritory() {
  const role = CU?.role || '';
  if (!OWN_TERRITORY_ROLES.includes(role)) return;
  const terr = CU?.territory || '';
  if (!terr) return;
  ['ns-territory','ms-territory','nd-territory','md-territory','ni-territory'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = terr; el.disabled = true; }
  });
}
document.addEventListener('DOMContentLoaded', () => { setTimeout(autoFillOfficerTerritory, 1500); });

// Also fire when any add-form button is clicked
document.addEventListener('click', e => {
  if (e.target?.onclick?.toString?.().includes('toggleForm') || e.target?.getAttribute?.('onclick')?.includes('toggleForm')) {
    setTimeout(autoFillOfficerTerritory, 100);
  }
});


// ══ FEATURE 1 & 2: PRODUCT MANAGEMENT ══

function getCustomProducts() { return DB.get('custom_products', []); }

function allProds() {
  // DEFAULT_PRODUCTS always included — never suppressed by custom/sheet entries
  const defaultNames = new Set(DEFAULT_PRODUCTS.map(p => (p.name||'').toLowerCase().trim()));
  // Only include sheet/custom/legacy products that are active AND not already a built-in name
  const sheetProds = DB.get('sheet_products', []).filter(p => p.active !== false && !defaultNames.has((p.name||'').toLowerCase().trim()));
  const custom = getCustomProducts().filter(p => p.active !== false && !defaultNames.has((p.name||'').toLowerCase().trim()));
  const legacy = DB.get('products', []).filter(p => !defaultNames.has((p.name||'').toLowerCase().trim()));
  // Deduplicate among non-default products
  const seen = new Set(defaultNames);
  const extra = [];
  for (const p of [...sheetProds, ...custom, ...legacy]) {
    const key = (p.name||'').toLowerCase().trim();
    if (!seen.has(key)) { seen.add(key); extra.push(p); }
  }
  return [...DEFAULT_PRODUCTS, ...extra];
}

function saveNewProduct() {
  const name     = document.getElementById('np-name')?.value.trim();
  const mrp      = parseFloat(document.getElementById('np-mrp')?.value||0);
  const caseQty  = parseInt(document.getElementById('np-case')?.value||0);
  const category = document.getElementById('np-category')?.value;
  const hsn      = document.getElementById('np-hsn')?.value.trim();
  if (!name || !mrp || !caseQty) { toast('Fill name, MRP and case qty'); return; }
  const prod = {
    id: 'CP' + Date.now(),
    name, mrp, case: caseQty, category, hsn,
    active: true, addedBy: CU?.name, addedAt: new Date().toISOString()
  };
  const prods = getCustomProducts();
  prods.push(prod);
  DB.set('custom_products', prods);
  // Also write to sheet_products so allProds() picks it up immediately without waiting for sync
  const _sp = DB.get('sheet_products', []);
  _sp.push(prod);
  DB.set('sheet_products', _sp);
  // Sync to Sheet
  if (SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({...prod, action:'saveProduct'})}).catch(()=>{});
  // Clear form
  ['np-name','np-mrp','np-case','np-hsn'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  toast('Product added ✅');
  renderAdminProducts();
}

function toggleProductActive(id) {
  const prods = getCustomProducts();
  const idx = prods.findIndex(p => p.id === id);
  if (idx === -1) return;
  prods[idx].active = !prods[idx].active;
  DB.set('custom_products', prods);
  if (SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({...prods[idx], action:'saveProduct'})}).catch(()=>{});
  renderAdminProducts();
  toast(prods[idx].active ? 'Product activated' : 'Product deactivated');
}

function renderAdminProducts() {
  const el = document.getElementById('admin-product-list'); if (!el) return;
  const standard = DEFAULT_PRODUCTS;
  const custom = getCustomProducts();
  el.innerHTML = `
    <div style="font-size:12px;color:var(--t2);margin-bottom:8px">Standard products (${standard.length}) — built-in, cannot be edited</div>
    ${standard.map(p => `
      <div class="mi" style="opacity:0.7">
        <div style="flex:1"><div class="mi-name">${p.name}</div><div class="mi-sub">MRP: ₹${p.mrp} · Case: ${p.casePack||p.case||'—'} units · ${p.cat||p.category||''}</div></div>
        <span style="font-size:10px;color:var(--t3);background:var(--bg);padding:3px 8px;border-radius:10px">Built-in</span>
      </div>`).join('')}
    ${custom.length ? `<div style="font-size:12px;color:var(--t2);margin-top:14px;margin-bottom:8px">Custom products (${custom.length})</div>
    ${custom.map(p => `
      <div class="mi" style="${!p.active?'opacity:0.5':''}">
        <div style="flex:1"><div class="mi-name">${p.name}</div><div class="mi-sub">MRP: ₹${p.mrp} · Case: ${p.casePack||p.case||'—'} units · ${p.cat||p.category||''}</div></div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:10px;color:${p.active?'var(--g)':'var(--r)'};background:${p.active?'var(--gl)':'var(--rl)'};padding:3px 8px;border-radius:10px">${p.active?'Active':'Inactive'}</span>
          <button onclick="toggleProductActive('${p.id}')" style="background:none;border:1px solid var(--bd);border-radius:var(--rads);padding:4px 10px;font-size:11px;cursor:pointer">${p.active?'Deactivate':'Activate'}</button>
        </div>
      </div>`).join('')}` : ''}`;
}

// Patch switchTab for products
const _origSwitchTab9 = switchTab;
switchTab = function(name) {
  _origSwitchTab9(name);
  if (name === 'admin-products') renderAdminProducts();
};

// ══ FEATURE 3: NEW STORE ALERT TO ASM ══
function alertASMNewStore(store) {
  const emps = DB.get('employees', []);
  const officer = emps.find(e => e.mobile === CU?.mobile);
  const asmMobile = officer?.reportsTo;
  const asm = asmMobile ? emps.find(e => e.mobile === asmMobile) : null;
  if (!asm?.alertEmail && !asm?.personalEmail) return;
  const gmRecipients = getAlertRecipients();
  const asmEmails = [asm.alertEmail, asm.personalEmail].filter(Boolean);
  const newRecipients = asmEmails.filter(e => !gmRecipients.includes(e));
  if (!newRecipients.length) return;
  const recipients = newRecipients.join(',');
  const html = buildAlertEmailTemplate('&#127978; New Store Added', '#159ADB', [
    ['Store name', store.name],
    ['City', store.city||''],
    ['Territory', store.territory||''],
    ['Contact', store.contact||''],
    ['Mobile', store.mobile||''],
    ['GSTIN', store.gstin||''],
    ['Margin', store.margin+'%'],
    ['Added by', CU?.name||''],
    ['Date', new Date().toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'})],
  ], 'A new store has been added by your team officer.');
  if (SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({action:'sendAlertEmail', recipients, subject:'New Store — '+store.name+' — '+CU?.name, htmlBody:html})}).catch(()=>{});
}

// Patch saveNewStore to alert ASM
const _origSaveNewStore4 = saveNewStore;
saveNewStore = function() {
  _origSaveNewStore4();
  setTimeout(() => {
    const stores = DB.get('stores', []);
    const latest = stores[stores.length-1];
    if (latest) alertASMNewStore(latest);
  }, 500);
};

// ══ FEATURE 4: DISTRIBUTOR PRE-FILL BY TERRITORY ══
function getDefaultDistributor() {
  const territory = CU?.territory || '';
  if (!territory) return null;
  const dists = getDists().filter(d => d.territory === territory && d.type === 'Distributor');
  // Return most recently used distributor for this territory
  const lastUsed = DB.get('last_dist_' + territory, null);
  if (lastUsed) {
    const found = dists.find(d => d.id === lastUsed);
    if (found) return found;
  }
  return dists.length === 1 ? dists[0] : null; // Auto-fill only if one distributor in territory
}

// Patch goStep3 to pre-fill distributor
const _origGoStep3_2 = goStep3;
goStep3 = function() {
  _origGoStep3_2();
  if (!VS.distributor) {
    const def = getDefaultDistributor();
    if (def) {
      VS.distributor = def;
      // Trigger selectDist equivalent
      const el = document.getElementById('dist-selected');
      if (el) {
        el.style.display = 'block';
        el.innerHTML = `<div class="selected-card"><div style="font-size:13px;font-weight:600">${def.name}</div><div style="font-size:11px;color:var(--t2)">${def.type} · ${def.territory}</div></div>`;
        toast('Distributor pre-filled: ' + def.name);
      }
    }
  }
  // Save last used distributor on submit
};

// (last_dist_ save consolidated into base submitOrder)

// ══ FEATURE 5: VISIT FOLLOW-UP ══
function getFollowUpDate(type) {
  const now = istNow();
  if (type === '1week') { now.setDate(now.getDate()+7); return now.toLocaleDateString('en-CA'); }
  if (type === '2weeks') { now.setDate(now.getDate()+14); return now.toLocaleDateString('en-CA'); }
  if (type === '1month') { now.setMonth(now.getMonth()+1); return now.toLocaleDateString('en-CA'); }
  if (type === 'custom') return document.getElementById('visit-followup-date')?.value || '';
  return '';
}

// Patch submitInstitutionVisit to include follow-up
const _origSubmitInstVisit = submitInstitutionVisit;
submitInstitutionVisit = function() {
  const followupType = document.getElementById('visit-followup')?.value || '';
  const followupNote = document.getElementById('visit-followup-note')?.value.trim() || '';
  const followupDate = followupType ? getFollowUpDate(followupType) : '';
  if (followupDate || followupNote) {
    const followup = {
      id: 'FU' + Date.now(),
      store: VS.store?.name || VS.institution?.name || '',
      type: VS.visitType || 'pitch',
      note: followupNote,
      followupDate,
      officer: CU?.name,
      territory: CU?.territory,
      createdAt: new Date().toISOString(),
      done: false
    };
    const followups = DB.get('followups', []);
    followups.unshift(followup);
    DB.set('followups', followups);
    if (SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({...followup, action:'saveFollowup'})}).catch(()=>{});
  }
  _origSubmitInstVisit();
};

function renderFollowUps() {
  const followups = DB.get('followups', []).filter(f => !f.done);
  const role = CU?.role || 'Officer';
  // Filter by territory for non-admin
  const myFollowups = ['Admin','Sub-Admin','GM'].includes(role)
    ? followups
    : followups.filter(f => f.officer === CU?.name || f.territory === CU?.territory);
  const today = todayKey();
  const overdue = myFollowups.filter(f => f.followupDate && f.followupDate < today);
  const dueSoon = myFollowups.filter(f => f.followupDate && f.followupDate >= today);
  const noDate = myFollowups.filter(f => !f.followupDate);
  if (!myFollowups.length) return;
  const existing = document.getElementById('followup-card');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'followup-card';
  div.style.cssText = 'margin-bottom:12px';
  div.innerHTML = `
    <div class="slabel">Pending follow-ups (${myFollowups.length})</div>
    ${overdue.length ? `<div style="background:var(--rl);border-radius:var(--rad);padding:10px 13px;margin-bottom:8px"><div style="font-size:12px;font-weight:600;color:var(--r);margin-bottom:6px">⚠️ Overdue (${overdue.length})</div>
    ${overdue.map(f=>`<div style="font-size:12px;padding:5px 0;border-bottom:0.5px solid rgba(0,0,0,0.1)"><span style="font-weight:500">${f.store}</span> — ${f.note||'Follow up'} <span style="color:var(--r);font-size:11px">(${f.followupDate})</span> <button onclick="markFollowupDone('${f.id}')" style="float:right;background:none;border:1px solid var(--r);color:var(--r);border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer">Done</button></div>`).join('')}
    </div>` : ''}
    ${dueSoon.slice(0,3).map(f=>`<div class="card" style="margin-bottom:6px;padding:10px 13px"><div style="display:flex;justify-content:space-between"><span style="font-size:13px;font-weight:500">${f.store}</span><span style="font-size:11px;color:var(--t3)">${f.followupDate}</span></div><div style="font-size:12px;color:var(--t2);margin-top:3px">${f.note||'Follow up required'} <button onclick="markFollowupDone('${f.id}')" style="float:right;background:none;border:1px solid var(--bd);border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer">Done</button></div></div>`).join('')}`;
  const homeTab = document.getElementById('tab-home');
  const targetCard = document.getElementById('target-progress-card');
  if (homeTab && targetCard) homeTab.insertBefore(div, targetCard.nextSibling);
  else if (homeTab) homeTab.appendChild(div);
}

function markFollowupDone(id) {
  const followups = DB.get('followups', []);
  const idx = followups.findIndex(f => f.id === id);
  if (idx >= 0) {
    followups[idx].done = true;
    followups[idx].doneAt = new Date().toISOString();
    DB.set('followups', followups);
    if (SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({action:'saveFollowup', ...followups[idx]})}).catch(()=>{});
  }
  renderFollowUps();
  toast('Follow-up marked as done ✅');
}

// ══ FEATURE 6: STORE PHOTO MISSING ALERT — REMOVED v1.7.71 ══

// ══ FEATURE 7: DATA MIGRATION ══
async function migrateLocalDataToSheet() {
  if (!SCRIPT_URL) { toast('Script URL not configured'); return; }
  showModal({icon:'☁️', title:'Upload to Sheet?', body:'This will upload all stores, distributors and institutions from this device to Google Sheet.', confirmText:'Upload', confirmClass:'var(--g)', async onConfirm(){
    toast('Uploading data to Sheet...');
    const stores = DB.get('stores', []);
    const dists  = DB.get('dists', []);
    const insts  = DB.get('insts', []);
    let count = 0;
    for (const s of stores) {
      await fetch(SCRIPT_URL, {method:'POST', body:gasPayload({...s, action:'saveStore'})}).catch(()=>{});
      count++;
    }
    for (const d of dists) {
      await fetch(SCRIPT_URL, {method:'POST', body:gasPayload({...d, action:'saveDist'})}).catch(()=>{});
      count++;
    }
    for (const i of insts) {
      await fetch(SCRIPT_URL, {method:'POST', body:gasPayload({...i, action:'saveInstitution'})}).catch(()=>{});
      count++;
    }
    DB.set('data_migrated', true);
    toast(count + ' records uploaded to Sheet ✅');
  }});
}

// Patch launchApp to render follow-ups
const _masterLaunch3 = launchApp;
launchApp = function() {
  _masterLaunch3();
  setTimeout(renderFollowUps, 6000);
};


// ══ RESTRICT DISTRIBUTOR ADDITION TO ADMIN/SUB-ADMIN ══
function restrictDistributorAddition() {
  const role = CU?.role || 'Officer';
  const isAdmin = ['Admin','Sub-Admin'].includes(role);
  // All roles can add Distributor — only Admin/Sub-Admin can add SS
  // Hide SS option from type dropdown for non-admin
  const typeSelects = document.querySelectorAll('#nd-type, #iad-type, #md-type');
  typeSelects.forEach(sel => {
    const ssOpt = [...sel.options].find(o => o.value === 'Super Stockist');
    if (ssOpt) ssOpt.style.display = isAdmin ? '' : 'none';
    // Reset to Distributor if SS was selected and user is not admin
    if (!isAdmin && sel.value === 'Super Stockist') {
      sel.value = 'Distributor';
      toggleDistPattern('Distributor');
    }
  });
}

// Also validate in saveNewDist and saveMDist
const _origSaveNewDistRestrict = saveNewDist;


// ══ FETCH EMPLOYEE CONFIG FROM SHEET ON LOGIN ══
async function fetchEmployeeConfig() {
  if (!SCRIPT_URL || !CU?.mobile) return;
  try {
    const r = await fetch(gasGetUrl(SCRIPT_URL+'?action=getEmployeeConfig&mobile=' + encodeURIComponent(CU.mobile)), {signal: AbortSignal.timeout(8000)});
    const data = await r.json();
    if (data?.config) {
      const cfg = data.config;
      // Save expense config — check for existence not truthiness (values can be 0)
      if (cfg.hasOwnProperty && (cfg.hasOwnProperty('fareLocal') || cfg.hasOwnProperty('monthlyTarget'))) {
        cfg.fareLocal = cfg.fareLocal !== undefined ? cfg.fareLocal : 0;
        cfg.fareExmarket = cfg.fareExmarket !== undefined ? cfg.fareExmarket : 0;
        cfg.fareNight = cfg.fareNight !== undefined ? cfg.fareNight : 0;
      }
      if (cfg !== null) {
        const expCfg = DB.get('exp_config_per_emp', {});
        expCfg[CU.mobile] = {
          local: cfg.fareLocal !== undefined ? cfg.fareLocal : 0,
          exmarket: cfg.fareExmarket !== undefined ? cfg.fareExmarket : 0,
          exmarket_night: cfg.fareNight !== undefined ? cfg.fareNight : 0,
          expExmarket: cfg.expExmarket || false,
          expNight: cfg.expNight || false
        };
        DB.set('exp_config_per_emp', expCfg);
      }
      // Save targets — always save even if 0
      if (cfg.monthlyTarget !== undefined) {
        const targets = DB.get('officer_targets', {});
        targets[CU.mobile] = {
          monthly: cfg.monthlyTarget || 0,
          month: cfg.targetMonth || ''
        };
        DB.set('officer_targets', targets);
        // Update employee cache
        const emps = DB.get('employees', []);
        const idx = emps.findIndex(e => e.mobile === CU.mobile);
        if (idx !== -1) {
          emps[idx].monthlyTarget = cfg.monthlyTarget;
          emps[idx].targetMonth = cfg.targetMonth;
          emps[idx].fareLocal = cfg.fareLocal;
          emps[idx].fareExmarket = cfg.fareExmarket;
          emps[idx].fareNight = cfg.fareNight;
          emps[idx].expExmarket = cfg.expExmarket;
          emps[idx].expNight = cfg.expNight;
          emps[idx].inc1 = cfg.inc1;
          emps[idx].inc2 = cfg.inc2;
          DB.set('employees', emps);
        }
      }
      if(typeof updateTargetProgress==="function")updateTargetProgress();
      console.log('Employee config loaded from Sheet');
    }
  } catch(e) {
    console.log('Employee config fetch failed — using local values');
  }
}


// ══ GET ALERT RECIPIENTS BASED ON HIERARCHY ══
function getAlertRecipients() {
  const emps = DB.get('employees', []);
  const officer = emps.find(e => e.mobile === CU?.mobile);
  const recipients = new Set();
  // Always include default alert emails
  DEFAULT_ALERT_EMAILS.split(',').map(e=>e.trim()).filter(e=>e.includes('@')).forEach(e=>recipients.add(e));
  // Add GM emails
  emps.filter(e=>e.role==='GM').forEach(e=>{if(e.alertEmail)recipients.add(e.alertEmail);if(e.personalEmail)recipients.add(e.personalEmail);});
  // Add ASM/RSM via hierarchy
  if (officer?.reportsTo) {
    const mgr = emps.find(e=>e.mobile===officer.reportsTo);
    if (mgr?.alertEmail) recipients.add(mgr.alertEmail);
    if (mgr?.personalEmail) recipients.add(mgr.personalEmail);
  }
  if (officer?.reportsTo2) {
    const mgr2 = emps.find(e=>e.mobile===officer.reportsTo2);
    if (mgr2?.alertEmail) recipients.add(mgr2.alertEmail);
    if (mgr2?.personalEmail) recipients.add(mgr2.personalEmail);
  }
  // Add officer's own alert email
  if (CU?.alertEmail) recipients.add(CU.alertEmail);
  return [...recipients].filter(Boolean).join(',');
}


// ══ ANDROID BACK BUTTON HANDLER ══
document.addEventListener('backbutton', function(e) {
  e.preventDefault();
  handleBackButton();
}, false);

let _allowExit = false;
window.addEventListener('popstate', function(e) {
  if (_allowExit) return; // user confirmed Exit — let this back-press go through for real
  // Re-arm the trap immediately, or only the very first back-press ever
  // gets intercepted — every press after that would fall through and
  // exit the app directly, bypassing the confirmation popup entirely.
  window.history.pushState({app: true}, '', window.location.href);
  handleBackButton();
});

function handleBackButton() {
  // If in visit flow — go back a step
  const vs1 = document.getElementById('vs1');
  const vs2 = document.getElementById('vs2');
  const vs3 = document.getElementById('vs3');
  const vs4 = document.getElementById('vs4');
  if (vs4?.style.display !== 'none' && vs4?.style.display !== '') { goStep(3); return; }
  if (vs3?.style.display !== 'none' && vs3?.style.display !== '') { goStep(2); return; }
  if (vs2?.style.display !== 'none' && vs2?.style.display !== '') { goStep(1); return; }
  // If in sub-tab — go to main tab
  const activeSub = document.querySelector('.tab.active[id^="tab-admin-"]');
  if (activeSub) { switchTab('admin'); return; }
  // If not on home — go to home
  const homeTab = document.getElementById('tab-home');
  if (!homeTab?.classList.contains('active')) { switchTab('home'); return; }
  // On home — show exit confirmation popup
  showExitConfirm();
}

function showExitConfirm() {
  // Remove existing if any
  const existing = document.getElementById('exit-confirm-modal');
  if (existing) existing.remove();
  
  const modal = document.createElement('div');
  modal.id = 'exit-confirm-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `
    <div style="background:var(--w);border-radius:16px;padding:24px;width:100%;max-width:300px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2)">
      <div style="font-size:36px;margin-bottom:12px">👋</div>
      <div style="font-size:16px;font-weight:700;color:var(--t1);margin-bottom:8px">Exit Diabliss Sales?</div>
      <div style="font-size:13px;color:var(--t2);margin-bottom:20px">Are you sure you want to exit the app?</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button onclick="document.getElementById('exit-confirm-modal').remove()" 
          style="padding:12px;border:1.5px solid var(--bd);border-radius:10px;background:var(--w);font-size:14px;font-weight:600;color:var(--t1);cursor:pointer">
          Stay
        </button>
        <button onclick="exitApp()" 
          style="padding:12px;border:none;border-radius:10px;background:var(--r);font-size:14px;font-weight:600;color:#fff;cursor:pointer">
          Exit
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  // Close on backdrop tap
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.remove();
  });
}

function exitApp() {
  document.getElementById('exit-confirm-modal')?.remove();
  if (navigator.app) { navigator.app.exitApp(); return; }
  // window.close() is silently ignored by browsers for any page not opened
  // via script — which is every real PWA launch. Instead, let this
  // back-press fall through for real by skipping the trap just this once.
  _allowExit = true;
  window.history.back();
  // Safety net in case there's nowhere left to go back to
  setTimeout(() => { window.close(); }, 300);
}

// Push a history state on launch to intercept back button
window.history.pushState({app: true}, '', window.location.href);


// ══ TOGGLE BILLING PATTERN FOR DISTRIBUTOR VS SS ══
function toggleDistPattern(type) {
  const isSS = type === 'Super Stockist';
  // Billing pattern only for SS
  ['nd-pattern-field','iad-pattern-field','md-pattern-field'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isSS ? 'block' : 'none';
  });
  // GSTIN mandatory for SS, optional for Distributor
  ['nd-gstin-label','iad-gstin-label'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = isSS ? 'GSTIN <span class="req">*</span>' : 'GSTIN (optional)';
  });
}

// Also patch saveNewDist to not require pattern for Distributor
const _origSaveNewDistPattern = _saveNewDistOrig;


// ══ STORE EDIT / DELETE ══
let _editStoreId = null;

function editStore(storeId) {
  const stores = DB.get('stores', []);
  const s = stores.find(x => x.id === storeId);
  if (!s) { toast('Store not found'); return; }
  _editStoreId = storeId;
  // Pre-fill the add store form with existing data
  const f = fid => document.getElementById(fid);
  if(f('ms-name')) f('ms-name').value = s.name||'';
  if(f('ms-addr')) f('ms-addr').value = s.address||'';
  if(f('ms-city')) f('ms-city').value = s.city||'';
  if(f('ms-territory')) f('ms-territory').value = s.territory||'';
  if(f('ms-contact')) f('ms-contact').value = s.contact||'';
  if(f('ms-phone')) f('ms-phone').value = s.phone||'';
  if(f('ms-mobile')) f('ms-mobile').value = s.mobile||'';
  if(f('ms-email')) f('ms-email').value = s.email||'';
  if(f('ms-gstin')) f('ms-gstin').value = s.gstin||'';
  if(f('ms-margin')) f('ms-margin').value = s.margin||'';
  populateDistSelect('ms-distributor', s.territory||'');
  if(f('ms-distributor')) f('ms-distributor').value = s.distId||'';
  // Change button to Update
  const btn = document.querySelector('#mstore-form .btn');
  if(btn) { btn.textContent = 'Update store'; btn.onclick = saveStoreEdit; }
  // Show mstore-form (in Master tab)
  const form = document.getElementById('mstore-form');
  if(form) { form.style.display = 'block'; form.scrollIntoView({behavior:'smooth'}); }
}

function saveStoreEdit() {
  const f = id => document.getElementById(id);
  const stores = DB.get('stores', []);
  const idx = stores.findIndex(s => s.id === _editStoreId);
  if (idx === -1) { toast('Store not found'); return; }
  const margin = f('ms-margin')?.value||'';
  if (!margin) { toast('Select a margin % for this store before saving'); return; }
  const distId = f('ms-distributor')?.value||'';
  if (!distId) { toast('Select a distributor / SS for this store before saving'); return; }
  const distObj = getDists().find(d=>d.id===distId);
  stores[idx] = {
    ...stores[idx],
    name: f('ms-name')?.value.trim()||stores[idx].name,
    address: f('ms-addr')?.value.trim()||'',
    city: f('ms-city')?.value.trim()||stores[idx].city,
    territory: f('ms-territory')?.value||stores[idx].territory,
    contact: f('ms-contact')?.value.trim()||'',
    phone: f('ms-phone')?.value.trim()||'',
    mobile: f('ms-mobile')?.value.trim()||'',
    email: f('ms-email')?.value.trim()||'',
    gstin: f('ms-gstin')?.value.trim()||'',
    margin: margin,
    distId: distId,
    distName: distObj?.name||'',
  };
  DB.set('stores', stores);
  if(SCRIPT_URL) fetch(SCRIPT_URL,{method:'POST',body:gasPayload({...stores[idx],action:'saveStore'})})
    .then(()=>fetchAndCacheStores()).then(()=>renderMasterLists()).catch(()=>renderMasterLists());
  else renderMasterLists();
  // Reset form
  document.getElementById('mstore-form').style.display = 'none';
  const btn = document.querySelector('#mstore-form .btn');
  if(btn) { btn.textContent = 'Save store'; btn.onclick = saveMStore; }
  _editStoreId = null;
  toast('Store updated ✅');
}

function deleteStore(id) {
  showModal({icon:'🗑️', title:'Delete Store?', body:'This cannot be undone.', confirmText:'Delete', confirmClass:'var(--r)', onConfirm(){
    const stores = DB.get('stores', []).filter(s => s.id !== id);
    DB.set('stores', stores);
    if (SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({id, action:'deleteStore'})}).catch(()=>{});
    fetchAndCacheStores().then(()=>renderMasterLists()).catch(()=>renderMasterLists());
    toast('Store deleted');
  }});
}

// ══ DISTRIBUTOR EDIT / DELETE ══
let _editDistId = null;

function editDist(distId) {
  const dists = DB.get('dists', []);
  const d = dists.find(x => x.id === distId);
  if (!d) { toast('Distributor not found'); return; }
  _editDistId = distId;
  const f = fid => document.getElementById(fid);
  if(f('md-name')) f('md-name').value = d.name||'';
  if(f('md-type')) { f('md-type').value = d.type||'Distributor'; toggleDistPattern(d.type||'Distributor'); }
  if(f('md-pattern')) f('md-pattern').value = d.pattern||'';
  if(f('md-territory')) f('md-territory').value = d.territory||'';
  if(f('md-city')) f('md-city').value = d.city||'';
  if(f('md-contact')) f('md-contact').value = d.contact||'';
  if(f('md-mobile')) f('md-mobile').value = d.mobile||'';
  if(f('md-gstin')) f('md-gstin').value = d.gstin||'';
  if(f('md-addr')) f('md-addr').value = d.address||'';
  // Change button to Update
  const btn = document.querySelector('#mdist-form .btn');
  if(btn) { btn.textContent = 'Update'; btn.onclick = saveDistEdit; }
  document.getElementById('mdist-form').style.display = 'block';
  document.getElementById('mdist-form').scrollIntoView({behavior:'smooth'});
}

function saveDistEdit() {
  const f = id => document.getElementById(id);
  const dists = DB.get('dists', []);
  const idx = dists.findIndex(d => d.id === _editDistId);
  if (idx === -1) { toast('Distributor not found'); return; }
  const type = f('md-type')?.value||'Distributor';
  const gstin = f('md-gstin')?.value.trim()||'';
  if(type==='Super Stockist' && !gstin){ toast('GSTIN mandatory for Super Stockist'); return; }
  dists[idx] = {
    ...dists[idx],
    name: f('md-name')?.value.trim()||dists[idx].name,
    type,
    pattern: f('md-pattern')?.value||'',
    territory: f('md-territory')?.value||dists[idx].territory,
    city: f('md-city')?.value.trim()||'',
    contact: f('md-contact')?.value.trim()||'',
    mobile: f('md-mobile')?.value.trim()||'',
    gstin,
    address: f('md-addr')?.value.trim()||'',
  };
  DB.set('dists', dists);
  if(SCRIPT_URL) fetch(SCRIPT_URL,{method:'POST',body:gasPayload({...dists[idx],action:'saveDist'})})
    .then(()=>fetchAndCacheDists()).then(()=>renderMasterLists()).catch(()=>renderMasterLists());
  else renderMasterLists();
  document.getElementById('mdist-form').style.display = 'none';
  const btn = document.querySelector('#mdist-form .btn');
  if(btn) { btn.textContent = 'Save distributor'; btn.onclick = saveMDist; }
  _editDistId = null;
  toast('Distributor updated ✅');
}

function deleteDist(id) {
  showModal({icon:'🗑️', title:'Delete Distributor?', body:'This cannot be undone.', confirmText:'Delete', confirmClass:'var(--r)', onConfirm(){
    const dists = DB.get('dists', []).filter(d => d.id !== id);
    DB.set('dists', dists);
    if (SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({id, action:'deleteDist'})}).catch(()=>{});
    fetchAndCacheDists().then(()=>renderMasterLists()).catch(()=>renderMasterLists());
    toast('Distributor deleted');
  }});
}


// ══ FETCH ORDERS FROM SHEET FOR DASHBOARD ══
let _lastOrderFetch = 0;
let _orderFetchInFlight = null;
async function fetchAndCacheOrders() {
  if (!SCRIPT_URL || !navigator.onLine) return;
  // PERF: this used to fire on launch, on every order submit, and on every
  // return to Home — sometimes several times within seconds, each a 2-3s
  // Apps Script round-trip. Reuse an in-flight request, and skip refetching
  // if we pulled fresh orders in the last 30s.
  if (_orderFetchInFlight) return _orderFetchInFlight;
  if (Date.now() - _lastOrderFetch < 30000) return DB.get('orders', []);
  _orderFetchInFlight = (async () => {
  try {
    const territory = getMyTerritory();
    const r = await fetch(gasGetUrl(SCRIPT_URL+'?action=getOrders&territory=' + encodeURIComponent(territory)), {signal: AbortSignal.timeout(15000)});
    const data = await r.json();
    if (data?.orders && Array.isArray(data.orders)) {
      // FIX: orders coming back from the sheet use a "total" field and have
      // no "items" array, but every reduce/aggregation elsewhere in the app
      // (home stats, team dashboard) reads o.grand and o.items. Without this
      // normalization those totals would silently come out as 0/NaN once
      // real multi-officer sheet data started flowing into the merge below.
      const normalized = data.orders.map(o => ({...o, grand: (o.grand ?? o.total ?? 0), items: o.items || []}));
      // Merge with local orders. For any order that exists both locally and on
      // the server, keep whichever copy actually has line items — the local
      // copy is the original with full detail, so we never let a thinner
      // server copy clobber it. (The backend now returns items too, but this
      // guards against any older/partial rows.)
      const local = DB.get('orders', []);
      const localById = {};
      local.forEach(o => { if (o.id) localById[o.id] = o; });
      const merged = normalized.map(srv => {
        const loc = localById[srv.id];
        if (!loc) return srv;
        delete localById[srv.id];
        const srvHasItems = Array.isArray(srv.items) && srv.items.length;
        const locHasItems = Array.isArray(loc.items) && loc.items.length;
        // Prefer the richer record; fill any gaps from the other.
        const base = (locHasItems && !srvHasItems) ? loc : srv;
        return {
          ...srv, ...loc, ...base,
          items: locHasItems ? loc.items : srv.items,
          officerRole: loc.officerRole || srv.officerRole || 'Officer',
          grand: base.grand ?? srv.grand ?? loc.grand ?? 0
        };
      });
      // Mark server-side orders as synced so they don't show in pending sync banner
      normalized.forEach(srv => { if (localById[srv.id]) localById[srv.id].synced = true; });
      merged.forEach(o => { if (!localById[o.id]) o.synced = true; });
      Object.values(localById).forEach(o => merged.push(o));
      DB.set('orders', merged);
      DB.set('orders_fetched_at', Date.now());
      updateSyncBadges();
      return merged;
    }
  } catch(e) { console.error('fetchOrders error:', e); }
  })();
  try {
    const result = await _orderFetchInFlight;
    _lastOrderFetch = Date.now();
    return result;
  } finally {
    _orderFetchInFlight = null;
  }
}


function blockEmployee(mobile) {
  const emps = DB.get('employees', []);
  const idx = emps.findIndex(e => e.mobile === mobile);
  if (idx === -1) return;
  const newStatus = emps[idx].status === 'Active' ? 'Blocked' : 'Active';
  const _empName = emps[idx].name;
  showModal({icon: newStatus==='Blocked'?'🚫':'✅', title:(newStatus==='Blocked'?'Block':'Unblock')+' '+_empName+'?', body:'Employee status will change to '+newStatus+'.', confirmText:newStatus==='Blocked'?'Block':'Unblock', confirmClass:newStatus==='Blocked'?'var(--r)':'var(--g)', onConfirm(){
    emps[idx].status = newStatus;
    DB.set('employees', emps);
    if (SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({
      action:'addEmployee', mobile, status:newStatus, name:emps[idx].name,
      role:emps[idx].role, territory:emps[idx].territory
    })}).catch(()=>{});
    renderEmployees();
    toast(emps[idx].name + (newStatus === 'Blocked' ? ' blocked' : ' unblocked'));
  }});
}

function deleteInst(id) {
  showModal({icon:'🗑️', title:'Delete Institution?', body:'This cannot be undone.', confirmText:'Delete', confirmClass:'var(--r)', onConfirm(){
    const insts = DB.get('insts', []).filter(i => i.id !== id);
    DB.set('insts', insts);
    if (SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({id, action:'deleteInstitution'})}).catch(()=>{});
    fetchAndCacheInsts().then(()=>renderMasterLists()).catch(()=>renderMasterLists());
    toast('Institution deleted');
  }});
}


// ══ FEATURE: VISIT HISTORY PER STORE ══
// showStoreVisitHistory(storeId) removed — storeName version is active

// ══ FEATURE: QUICK REORDER ══
// applyQuickReorder(orderId) removed — no-args version is active

// ══ FEATURE: EXPENSE SUMMARY VIEW (ADMIN) ══
function exportExpensePDF(expenses, byOfficer) {
  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-IN',{month:'long',year:'numeric',timeZone:'Asia/Kolkata'});
  let rows = '';
  let grandTotal = 0;
  Object.entries(byOfficer).forEach(([officer, data]) => {
    grandTotal += data.total;
    data.entries.forEach((e, i) => {
      rows += `<tr style="background:${i%2===0?'#f9f9f9':'#fff'}">
        <td style="padding:8px 10px;font-size:13px">${i===0?officer:''}</td>
        <td style="padding:8px 10px;font-size:13px">${e.date||''}</td>
        <td style="padding:8px 10px;font-size:13px">${e.type||''}</td>
        <td style="padding:8px 10px;font-size:13px">${e.remarks||''}</td>
        <td style="padding:8px 10px;font-size:13px;text-align:right">₹${parseFloat(e.total||0).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td>
      </tr>`;
    });
    rows += `<tr style="background:#e8f5e9"><td colspan="4" style="padding:8px 10px;font-size:13px;font-weight:700;text-align:right">${officer} Total</td><td style="padding:8px 10px;font-size:13px;font-weight:700;text-align:right">₹${Math.round(data.total).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td></tr>`;
  });
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    *{box-sizing:border-box}@page{size:A4 portrait;margin:15mm}
    body{font-family:'Segoe UI',Arial,sans-serif;padding:20px 24px;color:#1a1a2e;font-size:14px}
    .co-name{font-size:20px;font-weight:800;color:#0A6FA3}
    .co-meta{font-size:12px;color:#444;margin-top:4px;line-height:1.7}
    .co-gstin{font-size:12px;color:#0A6FA3;font-weight:700;margin-top:5px}
    h2{font-size:15px;color:#0A6FA3;margin:16px 0 10px}
    table{width:100%;border-collapse:collapse}
    th{background:#0A6FA3;color:#fff;padding:10px 12px;font-size:13px;text-align:left}
    th:last-child{text-align:right}
    .grand{background:#0A6FA3;color:#fff;font-weight:700;font-size:14px}
    .grand td{padding:10px 12px}
    .footer{margin-top:20px;padding-top:10px;border-top:1.5px solid #eee;font-size:13px;color:#666;text-align:center;line-height:1.9}
    @media print{body{padding:0}}
  </style></head><body>
  <div class="co-name">${COMPANY.name}</div>
  <div class="co-meta">${COMPANY.addr}<br>Tel: ${COMPANY.tel}</div>
  <div class="co-gstin">GSTIN: ${COMPANY.gstin}</div>
  <h2>Expense Summary — ${monthLabel}</h2>
  <table>
    <thead><tr><th>Officer</th><th>Date</th><th>Type</th><th>Remarks</th><th style="text-align:right">Amount (₹)</th></tr></thead>
    <tbody>${rows}
    <tr class="grand"><td colspan="4" style="text-align:right">Grand Total</td><td style="text-align:right">₹${Math.round(grandTotal).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td></tr>
    </tbody>
  </table>
  <div class="footer">Generated from <strong>Diabliss Sales App</strong>. Please check with accounts team for any discrepancies.</div>
  <script>window.onload=()=>window.print();<\/script>
  </body></html>`;
  openHtmlAsPdf(html, 'Expense_PDF');
}

function exportExpenseExcel(expenses, byOfficer) {
  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-IN',{month:'long',year:'numeric',timeZone:'Asia/Kolkata'});
  // Build CSV
  let csv = '﻿'; // BOM for Excel UTF-8
  csv += `${COMPANY.name} — Expense Summary — ${monthLabel}\n\n`;
  csv += 'Officer,Date,Type,Remarks,Amount (Rs)\n';
  let grandTotal = 0;
  Object.entries(byOfficer).forEach(([officer, data]) => {
    grandTotal += data.total;
    data.entries.forEach(e => {
      const amt = parseFloat(e.total||0);
      csv += `"${officer}","${e.date||''}","${e.type||''}","${(e.remarks||'').replace(/"/g,'""')}",${amt.toFixed(2)}\n`;
    });
    csv += `"","","","${officer} Total",${data.total.toFixed(2)}\n`;
  });
  csv += `"","","","Grand Total",${grandTotal.toFixed(2)}\n`;
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Diabliss_Expenses_' + monthLabel.replace(' ','_') + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast('Excel (CSV) downloaded ✅');
}

function renderAdminExpenseSummary() {
  const el = document.getElementById('admin-expense-summary-list');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:20px;font-size:13px;color:var(--t3)">Loading...</div>';
  if (!SCRIPT_URL) { el.innerHTML = '<div class="empty">Script not configured</div>'; return; }
  fetch(gasGetUrl(SCRIPT_URL+'?action=getExpenses'))
    .then(r => r.json())
    .then(d => {
      if (!d.expenses || !d.expenses.length) {
        el.innerHTML = '<div class="empty" style="padding:20px">No expenses recorded yet</div>';
        return;
      }
      // Group by officer
      const byOfficer = {};
      d.expenses.forEach(e => {
        if (!byOfficer[e.officer]) byOfficer[e.officer] = { total:0, entries:[] };
        byOfficer[e.officer].total += parseFloat(e.total||0);
        byOfficer[e.officer].entries.push(e);
      });
      // Store for export use
      window._lastExpenseData = { expenses: d.expenses, byOfficer };
      const grandTotal = Object.values(byOfficer).reduce((a,v) => a+v.total, 0);
      el.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <button class="btn" onclick="if(window._lastExpenseData){exportExpensePDF(window._lastExpenseData.expenses,window._lastExpenseData.byOfficer);}" style="font-size:13px">📄 Download PDF</button>
          <button class="btn-out" onclick="if(window._lastExpenseData){exportExpenseExcel(window._lastExpenseData.expenses,window._lastExpenseData.byOfficer);}" style="font-size:13px">📊 Download Excel</button>
        </div>
        <div style="background:var(--gl);border-radius:var(--rad);padding:12px 14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:13px;font-weight:600;color:var(--gd)">Grand Total</div>
          <div style="font-size:16px;font-weight:800;color:var(--gd)">₹${Math.round(grandTotal).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</div>
        </div>
      ` + Object.entries(byOfficer).map(([officer, data]) => `
        <div class="card" style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:13px;font-weight:600">${officer}</div>
            <div style="font-size:14px;font-weight:700;color:var(--g)">₹${Math.round(data.total).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</div>
          </div>
          <div style="font-size:11px;color:var(--t2);margin-top:4px">${data.entries.length} expense entries</div>
          <div style="font-size:11px;color:var(--t3);margin-top:2px">
            ${data.entries.slice(-2).map(e => e.date + ' · ' + e.type + ' · ₹' + e.total).join('<br>')}
          </div>
        </div>`).join('');
    })
    .catch(() => el.innerHTML = '<div class="empty" style="padding:20px">Could not load expenses</div>');
}

// ══ FEATURE: ATTENDANCE SUMMARY VIEW (ADMIN) ══
function renderAdminAttendanceSummary() {
  const el = document.getElementById('admin-attendance-list');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:20px;font-size:13px;color:var(--t3)">Loading...</div>';
  if (!SCRIPT_URL) { el.innerHTML = '<div class="empty">Script not configured</div>'; return; }
  const dateInput = document.getElementById('admin-att-date');
  const selDate = (dateInput && dateInput.value) ? dateInput.value : todayKey();
  if (dateInput && !dateInput.value) dateInput.value = selDate;
  const canForceEnd = ['Admin','Sub-Admin','GM'].includes(CU?.role||'');
  fetch(gasGetUrl(SCRIPT_URL+'?action=getAttendance'))
    .then(r => r.json())
    .then(d => {
      if (!d.attendance || !d.attendance.length) {
        el.innerHTML = '<div class="empty" style="padding:20px">No attendance records yet</div>';
        return;
      }
      const byMobile = {};
      d.attendance.forEach(a => {
        // FIX: match on the actual attendance DATE, not Synced At (the row's
        // write time). A backdated force-end row is written today, so keying
        // off Synced At filed it under today instead of the day it closes —
        // which is why the old day stayed "Active" even after force-ending.
        const recDate = normalizeAttDate_(a.date) || (a.synced_at||'').slice(0,10) || '';
        if (recDate !== selDate) return;
        const mobile = a.mobile || a.officer;
        if (!mobile) return;
        if (!byMobile[mobile]) byMobile[mobile] = { name:a.officer||mobile, mobile, role:a.role||'', territory:a.territory||'', start:null, end:null, leave:null, date:recDate };
        if (a.action === 'startDay') byMobile[mobile].start = cleanAttTime_(a.start_time || a.synced_at);
        if (a.action === 'endDay') byMobile[mobile].end = cleanAttTime_(a.end_time || a.synced_at || 'Ended');
        if (a.action === 'leave') byMobile[mobile].leave = a.leave_type || 'Leave';
      });
      const entries = Object.values(byMobile);
      if (!entries.length) {
        el.innerHTML = '<div class="empty" style="padding:20px">No attendance activity on this date</div>';
        return;
      }
      el.innerHTML = entries.map(x => {
        const badge = x.leave ? 'ab-leave' : x.end ? 'ab-leave' : x.start ? 'ab-present' : 'ab-absent';
        const label = x.leave ? 'Leave ('+x.leave+')' : x.end ? 'Day ended' : x.start ? 'Active' : 'Not started';
        const isActive = x.start && !x.end && !x.leave;
        const forceBtn = (canForceEnd && isActive)
          ? `<button class="btn-out btn-sm" style="width:100%;margin-top:8px;color:var(--r);border-color:var(--r)" onclick="adminForceEndDay('${x.mobile}','${(x.name||'').replace(/'/g,'')}','${selDate}')">⏹ Force end this day</button>`
          : '';
        return `
        <div class="card" style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div><div style="font-size:13px;font-weight:600">${x.name}</div><div style="font-size:11px;color:var(--t2)">${x.role}${x.territory?' · '+x.territory:''}</div></div>
            <span class="abadge ${badge}">${label}</span>
          </div>
          <div style="font-size:11px;color:var(--t2);margin-top:4px">
            ${x.start ? '▶ Started: ' + x.start : 'Not started'}${x.end ? ' · ⏹ Ended: ' + x.end : ''}
          </div>
          ${forceBtn}
        </div>`;
      }).join('');
    })
    .catch(() => el.innerHTML = '<div class="empty" style="padding:20px">Could not load attendance</div>');
}

// Extract a clean readable time from an attendance time cell. These are often
// stored/returned as a full datetime string ("Sat Dec 30 1899 09:49:00 ...")
// when the underlying cell was a time-only value — show just HH:MM.
function cleanAttTime_(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (s === 'Ended' || s === '—') return s;
  // ISO timestamp → format to IST time
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'});
  }
  // Pull an HH:MM(:SS) out of anything (handles the 1899 datetime case)
  const m = s.match(/(\d{1,2}:\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?/);
  if (m) return m[1] + (m[2] ? ' ' + m[2].toUpperCase() : '');
  return s;
}

// Normalize an attendance "Date" cell to YYYY-MM-DD for reliable matching.
// startDay writes ISO (todayKey()), but tolerate other shapes just in case.
function normalizeAttDate_(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    // Use IST to avoid an off-by-one from UTC conversion
    return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata', year:'numeric', month:'2-digit', day:'2-digit'}).format(d);
  }
  return s;
}

// ══ ADMIN FORCE-END ANOTHER PERSON'S DAY ══
function adminForceEndDay(mobile, name, dateStr) {
  if (!['Admin','Sub-Admin','GM'].includes(CU?.role||'')) { toast('Not permitted'); return; }
  showModal({icon:'🔚', title:"End "+name+"'s Day?", body:`End <b>${name}</b>'s day for ${dateStr}? This will close it out and record that you did it.`, confirmText:'End Day', confirmClass:'var(--amber,#EF9F27)', onConfirm(){
    const payload = {
      action: 'endDay',
      date: dateStr,
      officer: name,
      officerMobile: mobile,
      endTime: '—',
      remarks: '⏹ Force-ended by ' + (CU?.name||'Admin') + ' (' + (CU?.role||'') + ')',
      forcedBy: CU?.name || 'Admin'
    };
    if (SCRIPT_URL) {
      fetch(SCRIPT_URL, {method:'POST', body:gasPayload(payload)})
        .then(() => { toast(name+"'s day ended"); renderAdminAttendanceSummary(); })
        .catch(() => toast('Could not reach server — try again'));
    }
  }});
}
