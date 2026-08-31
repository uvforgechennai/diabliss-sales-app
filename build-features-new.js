// ══════════════════════════════════════════════════════════════════
// DIABLISS SALES APP — NEW FEATURES MODULE
// v1.6.18 → v1.6.25 (built 2026-07-11)
// Covers: Auto no-order alert, Push notifications, Location features,
// Officer engagement, Manager intelligence, Expense approval,
// Admin features, Beat plan placeholder, Gemini AI features
// ══════════════════════════════════════════════════════════════════

const GEMINI_API_KEY = 'AQ.Ab8RN6K-NdAo0l0n61jidWGwG-PboMhq3SIEvL0bUi4jegqU0Q';
// AI calls use SCRIPT_URL directly (defined in app-core.js)

// ══ v1.6.18 — AUTO NO-ORDER ALERT ══
// Fires on app open for Admin/GM — checks each officer for 2+ working days with no orders
// Throttled once per officer per day

// ── myOrders() — mobile-first filter for current officer's orders ──
// Use this everywhere instead of o.officer === CU?.name to handle name inconsistencies
function myOrders() {
  return fieldOrders().filter(o =>
    (o.officerMobile && o.officerMobile === CU?.mobile) || o.officer === CU?.name
  );
}

// ══ NO-ORDER ALERT — disabled ══
function checkNoOrderAlertOnEndDay() { /* alert removed */ }

// Legacy no-op — kept to avoid errors if referenced anywhere else
function checkAutoNoOrderAlert() {}

// ══ v1.6.19 — PUSH NOTIFICATIONS (scheduled) ══
// Start day reminder: 10am if not started
// End day reminder: 7pm if not ended
// Uses setInterval set in launchApp (already in app-core.js)
// These enhance the existing checkStartDayReminder / checkEndDayReminder in app-core.js

function scheduleNotificationChecks() {
  // Already running in app-core.js via setInterval every 10 min
  // Additional: fire once immediately on launch
  setTimeout(() => {
    if (typeof checkStartDayReminder === 'function') checkStartDayReminder();
    if (typeof checkEndDayReminder === 'function') checkEndDayReminder();
  }, 5000);
}

// ══ v1.6.20 — LOCATION FEATURES ══

// Show address inline on order card (patched into renderOrders via helper)
function getOrderAddressLine(o) {
  if (!o.location) return '';
  if (o.location.address) return '📍 ' + o.location.address.split(',').slice(0, 2).join(', ');
  if (o.location.lat && o.location.lng) return '📍 ' + o.location.lat + ', ' + o.location.lng;
  return '';
}

// Day route map — open Google Maps with all today's orders as waypoints
function openDayRouteMap() {
  const todayStr = todayKey();
  const orders = myOrders().filter(o =>
    !o.cancelled && o.ts && tsToISTDate(o.ts) === todayStr && o.location?.lat
  ).sort((a, b) => new Date(a.ts) - new Date(b.ts));

  if (!orders.length) { toast('No location data for today\'s orders'); return; }

  if (orders.length === 1) {
    window.open('https://maps.google.com/?q=' + orders[0].location.lat + ',' + orders[0].location.lng, '_blank');
    return;
  }

  const origin = orders[0].location.lat + ',' + orders[0].location.lng;
  const dest = orders[orders.length - 1].location.lat + ',' + orders[orders.length - 1].location.lng;
  const waypoints = orders.slice(1, -1).map(o => o.location.lat + ',' + o.location.lng).join('|');
  let url = 'https://www.google.com/maps/dir/?api=1&origin=' + origin + '&destination=' + dest;
  if (waypoints) url += '&waypoints=' + encodeURIComponent(waypoints);
  window.open(url, '_blank');
}

// Flag orders where GPS was captured >30 min after order submission
function getDelayedGPSOrders() {
  return getOrders().filter(o => {
    if (!o.location?.capturedAt || !o.ts) return false;
    const diff = (new Date(o.location.capturedAt) - new Date(o.ts)) / 60000;
    return diff > 30;
  });
}

// Add route map button to Officer home
function addRouteMapButton() {
  const _existRmb = document.getElementById('route-map-btn');
  if (_existRmb) _existRmb.remove();
  const role = CU?.role || 'Officer';
  if (!['Officer','ASM','RSM'].includes(role)) return;
  const homeTab = document.getElementById('tab-home');
  if (!homeTab) return;
  const btn = document.createElement('button');
  btn.id = 'route-map-btn';
  btn.className = 'btn-out';
  btn.style.cssText = 'width:100%;margin-bottom:10px;font-size:13px';
  btn.innerHTML = '🗺️ View today\'s route map';
  btn.onclick = openDayRouteMap;
  const dayBanner = document.getElementById('day-banner');
  if (dayBanner) homeTab.insertBefore(btn, dayBanner.nextSibling);
  else homeTab.appendChild(btn);
}

// ══ v1.6.21 — OFFICER ENGAGEMENT ══

// Quick reorder — last order to same store in one tap
function quickReorder() {
  const orders = myOrders().filter(o => !o.cancelled).sort((a, b) => new Date(b.ts) - new Date(a.ts));
  if (!orders.length) { toast('No previous orders found'); return; }
  const last = orders[0];
  if (!last.items || !last.items.length) { toast('No items found in last order'); return; }
  // Pre-fill visit flow
  VS = newVS();
  VS.visitType = 'order';
  if (last.store) {
    const stores = getStores();
    const store = stores.find(s => s.name === last.store);
    if (store) { VS.store = store; }
  }
  // Pre-fill order items
  last.items.forEach(item => {
    if (item.id && item.qty) VS.order[item.id] = item.qty;
  });
  switchTab('visit');
  setTimeout(() => {
    if (typeof goStep === 'function') goStep(last.store ? 2 : 1);
    toast('Quick reorder loaded — check and submit 🚀');
  }, 300);
}

// Store health score — visit frequency + last order value
function getStoreHealthScore(storeName) {
  const orders = getOrders().filter(o => o.store === storeName && !o.cancelled);
  if (!orders.length) return { score: 0, label: 'No visits', color: 'var(--t3)' };
  const now = new Date();
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30); // now=istNow()
  const recentOrders = orders.filter(o => o.ts && new Date(o.ts) >= thirtyDaysAgo);
  const avgValue = orders.reduce((a, o) => a + (o.grand || 0), 0) / orders.length;
  const score = Math.min(100, (recentOrders.length * 20) + Math.min(50, avgValue / 200));
  const label = score >= 70 ? 'Healthy' : score >= 40 ? 'Moderate' : 'At risk';
  const color = score >= 70 ? 'var(--g)' : score >= 40 ? '#EF9F27' : 'var(--r)';
  return { score: Math.round(score), label, color };
}

// Visit streak — tracks consecutive active days and displays on home
function updateVisitStreak() {
  const todayStr = todayKey();
  const todayOrders = myOrders().filter(o => !o.cancelled && o.ts && tsToISTDate(o.ts) === todayStr);
  if (todayOrders.length > 0) {
    DB.set('visit_streak_' + todayStr, true);
  }
  renderStreakPill();
}

function _getStreakCount() {
  let count = 0;
  const d = new Date(istNow());
  for (let i = 0; i < 60; i++) {
    const key = 'visit_streak_' + d.toLocaleDateString('en-CA', {timeZone:'Asia/Kolkata'});
    if (DB.get(key, false)) { count++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return count;
}

function renderStreakPill() {
  const role = CU?.role || 'Officer';
  if (!['Officer','ASM','RSM'].includes(role)) return;
  const existing = document.getElementById('streak-pill-card');
  if (existing) existing.remove();
  const count = _getStreakCount();
  const homeTab = document.getElementById('tab-home');
  const dayBanner = document.getElementById('day-banner');
  if (!homeTab || !dayBanner) return;
  const div = document.createElement('div');
  div.id = 'streak-pill-card';
  if (count >= 2) {
    const fire = count >= 7 ? '🔥🔥' : '🔥';
    const msg = count >= 14 ? `${fire} ${count}-day streak — unstoppable!`
              : count >= 7  ? `${fire} ${count}-day streak — you're on fire!`
              : count >= 3  ? `🔥 ${count}-day streak — keep it going!`
              :               `🔥 ${count} days in a row — building momentum!`;
    div.className = 'streak-pill';
    div.innerHTML = `<span style="font-size:18px">${count>=7?'🔥':'⚡'}</span><span>${msg}</span>`;
  } else {
    div.className = 'streak-pill cold';
    div.innerHTML = '<span style="font-size:16px">⚡</span><span>Start your streak today — visit a store!</span>';
  }
  dayBanner.insertAdjacentElement('afterend', div);
}

// Product spotlight — admin pushes one SKU per week
function getProductSpotlight() {
  return DB.get('product_spotlight', null);
}

function setProductSpotlight(productName, message) {
  const spotlight = { productName, message, setBy: CU?.name, setAt: new Date().toISOString(), weekKey: todayKey().slice(0, 7) };
  DB.set('product_spotlight', spotlight);
  if (SCRIPT_URL) fetch(SCRIPT_URL, { method: 'POST', body: gasPayload({ ...spotlight, action: 'saveSpotlight' }) }).catch(() => {});
  toast('Product spotlight set ✅');
}

function renderProductSpotlight() {
  const spotlight = getProductSpotlight();
  if (!spotlight) return;
  const weekKey = todayKey().slice(0, 7);
  if (spotlight.weekKey !== weekKey) return;
  const existing = document.getElementById('product-spotlight-card');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'product-spotlight-card';
  div.style.cssText = 'background:linear-gradient(135deg,#F39C12,#EF9F27);border-radius:var(--rad);padding:12px 14px;margin-bottom:12px;color:#fff';
  div.innerHTML = `
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;opacity:0.9;margin-bottom:3px">⭐ Product spotlight this week</div>
    <div style="font-size:14px;font-weight:700;margin-bottom:2px">${spotlight.productName}</div>
    <div style="font-size:12px;opacity:0.9">${spotlight.message || 'Push this product in every visit!'}</div>`;
  const homeTab = document.getElementById('tab-home');
  const roleBlock = document.getElementById('role-home-block');
  if (homeTab && roleBlock) homeTab.insertBefore(div, roleBlock.nextSibling);
  else if (homeTab) homeTab.appendChild(div);
}

// Store visit gap alert (30+ days not visited) — show on home for officers
function checkStoreVisitGaps() {
  const role = CU?.role || 'Officer';
  if (!['Officer'].includes(role)) {
    const existing = document.getElementById('store-gap-card');
    if (existing) existing.remove();
    return;
  }
  const orders = myOrders().filter(o => !o.cancelled);
  // Only check stores this officer has previously ordered from
  const myStoreNames = new Set(orders.map(o => o.store).filter(Boolean));
  const allStores = getStores();
  const stores = allStores.filter(s => myStoreNames.has(s.name));
  const now = new Date();
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30); // now=istNow()
  const gapStores = stores.filter(s => {
    const lastOrder = orders.filter(o => o.store === s.name && o.ts).sort((a, b) => new Date(b.ts) - new Date(a.ts))[0];
    return !lastOrder || new Date(lastOrder.ts) < thirtyDaysAgo;
  });
  if (!gapStores.length) return;
  const existing = document.getElementById('store-gap-card');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'store-gap-card';
  div.style.cssText = 'background:var(--al);border:1px solid #ffc107;border-radius:var(--rad);padding:10px 14px;margin-bottom:10px';
  div.innerHTML = `
    <div style="font-size:12px;font-weight:700;color:var(--a);margin-bottom:4px">⚠️ ${gapStores.length} store${gapStores.length > 1 ? 's' : ''} not visited in 30+ days</div>
    <div style="font-size:11px;color:var(--a)">${gapStores.slice(0, 3).map(s => s.name).join(', ')}${gapStores.length > 3 ? ' +' + (gapStores.length - 3) + ' more' : ''}</div>`;
  const homeTab = document.getElementById('tab-home');
  const roleBlock = document.getElementById('role-home-block');
  if (homeTab && roleBlock) homeTab.insertBefore(div, roleBlock.nextSibling);
  else if (homeTab) homeTab.appendChild(div);
}

// ══ v1.6.22 — MANAGER INTELLIGENCE ══
// Daily digest — disabled
function sendDailyDigest() { /* alert removed */ }

// Order drop alert — disabled
function checkOrderGapAlerts(newOrder) { /* alert removed */ }

// Attendance calendar view (monthly colour-coded) — for officer
function renderAttendanceCalendar() {
  const now = new Date();
  const _n = istNow();
  const year = _n.getFullYear();
  const month = _n.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const allOrders = myOrders().filter(o => !o.cancelled);
  const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

  let cells = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:4px">';
  ['S','M','T','W','T','F','S'].forEach(d => {
    cells += `<div style="text-align:center;font-size:10px;font-weight:700;color:var(--t3);padding:3px">${d}</div>`;
  });
  cells += '</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">';

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) cells += '<div></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dk = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const isSun = new Date(year, month, d).getDay() === 0; // local calendar days OK
    const isHol = isHoliday(dk, CU?.territory || '');
    const dayRec = DB.get('day_' + dk, null);
    const hasOrder = allOrders.some(o => o.ts && tsToISTDate(o.ts) === dk);
    const isFuture = dk > todayKey();

    let bg = 'var(--bg)';
    let color = 'var(--t2)';
    if (isSun || isHol) { bg = '#f0f0f0'; color = 'var(--t3)'; }
    else if (isFuture) { bg = 'var(--bg)'; color = 'var(--t3)'; }
    else if (hasOrder || dayRec?.started) { bg = '#d4edda'; color = '#155724'; }
    else if (dayRec?.type === 'leave') { bg = '#fff3cd'; color = '#856404'; }
    else { bg = '#f8d7da'; color = '#721c24'; }

    cells += `<div style="background:${bg};color:${color};border-radius:4px;padding:5px 2px;text-align:center;font-size:11px;font-weight:600">${d}</div>`;
  }
  cells += '</div>';

  return `<div style="margin-top:12px">
    <div class="slabel">${monthLabel} — Attendance</div>
    <div style="background:var(--w);border:1px solid var(--bd);border-radius:var(--rad);padding:12px">${cells}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;font-size:10px">
      <span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;border-radius:2px;background:#d4edda;display:inline-block"></span>Active</span>
      <span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;border-radius:2px;background:#f8d7da;display:inline-block"></span>Missed</span>
      <span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;border-radius:2px;background:#fff3cd;display:inline-block"></span>Leave</span>
      <span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;border-radius:2px;background:#f0f0f0;display:inline-block"></span>Holiday/Sun</span>
    </div>
    </div></div>`;
}

// ══ v1.6.23 — EXPENSE APPROVAL WORKFLOW ══

function submitExpenseForApproval(expId) {
  const expenses = DB.get('expenses_pending', []);
  const idx = expenses.findIndex(e => e.id === expId);
  if (idx === -1) { toast('Expense not found'); return; }
  expenses[idx].status = 'submitted';
  expenses[idx].submittedAt = new Date().toISOString();
  DB.set('expenses_pending', expenses);

  // Alert ASM
  const emps = DB.get('employees', []);
  const officer = emps.find(e => e.mobile === CU?.mobile);
  const asmMobile = officer?.reportsTo;
  const asm = asmMobile ? emps.find(e => e.mobile === asmMobile) : null;
  const asmEmail = asm?.alertEmail || asm?.personalEmail || '';
  if (asmEmail && SCRIPT_URL) {
    const html = buildAlertEmailTemplate('💰 Expense Submitted for Approval', '#EF9F27', [
      ['Officer', CU?.name || ''],
      ['Territory', CU?.territory || ''],
      ['Amount', '₹' + (expenses[idx].total || 0)],
      ['Type', expenses[idx].type || ''],
      ['Date', expenses[idx].date || ''],
      ['Remarks', expenses[idx].remarks || ''],
    ], 'Please review and approve this expense.');
    fetch(SCRIPT_URL, { method: 'POST', body: gasPayload({ action: 'sendAlertEmail', recipients: asmEmail, subject: 'Expense Approval Required — ' + CU?.name, htmlBody: html }) }).catch(() => {});
  }
  toast('Expense submitted for approval ✅');
}

function approveExpense(expId, officerMobile) {
  const role = CU?.role || '';
  if (!['ASM','RSM','GM','Admin','Sub-Admin'].includes(role)) { toast('Not permitted'); return; }

  if (SCRIPT_URL) {
    fetch(SCRIPT_URL, { method: 'POST', body: gasPayload({ action: 'approveExpense', expId, officerMobile, approvedBy: CU?.name, approvedAt: new Date().toISOString() }) })
      .then(() => toast('Expense approved ✅'))
      .catch(() => toast('Could not reach server'));
  }

  // Alert officer
  const emps = DB.get('employees', []);
  const emp = emps.find(e => e.mobile === officerMobile);
  const officerEmail = emp?.alertEmail || emp?.personalEmail || '';
  if (officerEmail && SCRIPT_URL) {
    const html = buildAlertEmailTemplate('✅ Expense Approved', '#2ECC71', [
      ['Approved by', CU?.name || ''],
      ['Date', new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })],
    ], 'Your expense has been approved.');
    fetch(SCRIPT_URL, { method: 'POST', body: gasPayload({ action: 'sendAlertEmail', recipients: officerEmail, subject: 'Expense Approved — ' + new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }), htmlBody: html }) }).catch(() => {});
  }
}

function rejectExpense(expId, officerMobile, reason) {
  const role = CU?.role || '';
  if (!['ASM','RSM','GM','Admin','Sub-Admin'].includes(role)) { toast('Not permitted'); return; }

  if (SCRIPT_URL) {
    fetch(SCRIPT_URL, { method: 'POST', body: gasPayload({ action: 'rejectExpense', expId, officerMobile, rejectedBy: CU?.name, reason, rejectedAt: new Date().toISOString() }) })
      .then(() => toast('Expense rejected'))
      .catch(() => {});
  }

  const emps = DB.get('employees', []);
  const emp = emps.find(e => e.mobile === officerMobile);
  const officerEmail = emp?.alertEmail || emp?.personalEmail || '';
  if (officerEmail && SCRIPT_URL) {
    const html = buildAlertEmailTemplate('❌ Expense Rejected', '#E74C3C', [
      ['Rejected by', CU?.name || ''],
      ['Reason', reason || 'Not specified'],
      ['Date', new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })],
    ], 'Please check with your manager for details.');
    fetch(SCRIPT_URL, { method: 'POST', body: gasPayload({ action: 'sendAlertEmail', recipients: officerEmail, subject: 'Expense Rejected', htmlBody: html }) }).catch(() => {});
  }
}

// ══ v1.6.24 — ADMIN FEATURES ══

// Search in Employee list
function filterEmployeeList(query) {
  const q = (query || '').toLowerCase().trim();
  const cards = document.querySelectorAll('.emp-card');
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
}

// Quick call button — already in app-data-sync.js via callNumber()
// Prospect follow-up reminder card — renderFollowUps() already in app-data-sync.js

// ══ v1.6.25 — BEAT PLAN (PLACEHOLDER UI) ══

function renderBeatPlanTab() {
  const el = document.getElementById('tab-beat-plan');
  if (!el) return;
  el.innerHTML = `
    <div class="slabel">Beat Plan</div>
    <div style="background:var(--al);border:1px solid #ffc107;border-radius:var(--rad);padding:16px;margin-bottom:14px;text-align:center">
      <div style="font-size:32px;margin-bottom:8px">🗓️</div>
      <div style="font-size:14px;font-weight:700;color:var(--a);margin-bottom:6px">Beat plan — coming soon</div>
      <div style="font-size:12px;color:var(--a)">Plan your weekly store visit routes.<br>Admin sets the beat, officers follow it.<br>Track planned vs actual visits.</div>
    </div>
    <div class="slabel">Upcoming visits (sample)</div>
    <div style="font-size:12px;color:var(--t2);padding:10px 0">Beat plan feature will appear here once configured by Admin.</div>`;
}

// ══ v1.6.25 — AI FEATURES (Gemini) ══

// 1. Smart order suggestions — recommends products based on store history
async function getSmartOrderSuggestions(storeName) {
  if (!storeName) return;
  const storeOrders = getOrders().filter(o => o.store === storeName && !o.cancelled)
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 10);

  // Even with no history, ask AI for general suggestions based on store name

  const productSummary = {};
  storeOrders.forEach(o => {
    (o.items || []).forEach(item => {
      if (!productSummary[item.name]) productSummary[item.name] = { qty: 0, orders: 0 };
      productSummary[item.name].qty += item.qty || 0;
      productSummary[item.name].orders += 1;
    });
  });

  const allProducts = ['Sugar 40×5g Sachet','Sugar 500g','Sugar 1kg','Sugar 1.75kg','Sugar 5kg','Sugar 10kg','Jaggery 500g','Jaggery 750g','Jaggery 1.25kg','Jaggery 5kg','Lemon Tea 10×10g','Lemon Tea 30×10g','Lemon Tea 500g','Combo Tea 30×10g','Ginger Tea 10×10g','Masala Chai 10×10g','Millet Cookies 120g','Millet Cookies Moringa 120g','Millet Cookies Chia 120g','Mixed Fruit Jam 225g','Guava Jam 225g','Pineapple Ginger Jam 225g'];

  let historyText, neverOrdered = [];
  if (storeOrders.length) {
    const orderedProducts = Object.keys(productSummary);
    neverOrdered = allProducts.filter(p => !orderedProducts.some(op => op.toLowerCase().includes(p.toLowerCase().split(' ')[0]) && op.toLowerCase().includes(p.toLowerCase().split(' ')[1]||'')));
    const lastOrderDate = storeOrders[0]?.ts ? tsToISTDate(storeOrders[0].ts) : 'unknown';
    historyText = `Last order: ${lastOrderDate}\nProducts ordered (last 10 orders):\n` +
      Object.entries(productSummary).map(([name, d]) => `- ${name}: ${d.orders} order(s), total qty ${d.qty}`).join('\n');
    if (neverOrdered.length) historyText += `\n\nProducts NEVER ordered from this store:\n` + neverOrdered.map(p => `- ${p}`).join('\n');
  } else {
    historyText = 'No order history found for this store. This may be a new store.';
  }

  const prompt = `You are a field sales assistant for Diabliss, a brand selling low-GI herbal food products in India.

Store: ${storeName}
${historyText}

Based ONLY on the order history above, give 3-4 specific, actionable suggestions for today's visit. Focus on:
1. Products with high repeat orders — suggest reorder qty based on their pattern
2. Products never ordered — suggest one to introduce with a reason
3. If no history, suggest starter pack for a new store

Rules:
- Be specific with product names and quantities
- Do NOT mention products not in the Diabliss range
- Keep each point to one line
- No marketing language, just practical field sales advice`;


  const existing = document.getElementById('ai-suggestions-card');
  if (existing) existing.remove();
  const card = document.createElement('div');
  card.id = 'ai-suggestions-card';
  card.style.cssText = 'background:linear-gradient(135deg,#f0f8ff,#e8f4fd);border:1px solid #159ADB;border-radius:var(--rad);padding:12px 14px;margin-bottom:12px';
  if (!document.getElementById('ai-pulse-style')) {
    const st = document.createElement('style');
    st.id = 'ai-pulse-style';
    st.textContent = '@keyframes aiPulse{0%,100%{opacity:0.2;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}';
    document.head.appendChild(st);
  }
  card.innerHTML = '<div style="font-size:12px;font-weight:700;color:#159ADB;margin-bottom:8px">🤖 AI order suggestions</div>' +
    '<div style="display:flex;align-items:center;gap:8px">' +
    '<div style="display:flex;gap:4px">' +
    '<span style="width:7px;height:7px;border-radius:50%;background:#159ADB;display:inline-block;animation:aiPulse 1.2s ease-in-out infinite"></span>' +
    '<span style="width:7px;height:7px;border-radius:50%;background:#159ADB;display:inline-block;animation:aiPulse 1.2s ease-in-out 0.4s infinite"></span>' +
    '<span style="width:7px;height:7px;border-radius:50%;background:#159ADB;display:inline-block;animation:aiPulse 1.2s ease-in-out 0.8s infinite"></span>' +
    '</div>' +
    '<span style="font-size:12px;color:var(--t2)">Analysing order history…</span></div>';

  const orderList = document.getElementById('order-list');
  const storeSelected = document.getElementById('store-selected');
  const target = (orderList && orderList.offsetParent) ? orderList : storeSelected;
  if (target) target.insertBefore(card, target.firstChild);
  else {
    const homeTab = document.getElementById('tab-home');
    if (homeTab) homeTab.prepend(card);
  }

  try {
    const aiUrl = SCRIPT_URL + '?action=aiPrompt&model=' + encodeURIComponent('openrouter/auto') + '&apiKey=' + encodeURIComponent(GEMINI_API_KEY) + '&prompt=' + encodeURIComponent(prompt);
    const res = await fetch(aiUrl);
    const data = await res.json();
    const text = data?.result || data?.choices?.[0]?.message?.content || 'Could not get suggestions.';
    const html = text.replace(/\*\*(.*?)\*\*/g,'<b>$1</b>').replace(/\*(.*?)\*/g,'$1').replace(/^[-•*]\s+(.+)$/gm,'<div style="display:flex;gap:6px;margin-bottom:4px"><span>•</span><span>$1</span></div>').replace(/\n\n/g,'<br>');
    card.innerHTML = `<div style="font-size:12px;font-weight:700;color:#159ADB;margin-bottom:6px">🤖 AI order suggestions for ${storeName}</div><div style="font-size:12px;color:var(--t1);line-height:1.6">${html}</div>`;
  } catch (e) {
    card.innerHTML = '<div style="font-size:12px;color:var(--t2)">🤖 AI suggestions unavailable right now.</div>';
  }
}

// 2. Visit summary generator — officer taps "Summarise my day" → AI writes summary
async function generateVisitSummary() {
  const todayStr = todayKey();
  const todayOrders = myOrders().filter(o =>
    !o.cancelled && o.ts && tsToISTDate(o.ts) === todayStr
  );

  if (!todayOrders.length) { toast('No orders today to summarise'); return; }

  const totalValue = todayOrders.reduce((a, o) => a + (o.grand || 0), 0);
  const stores = [...new Set(todayOrders.map(o => o.store))];
  const orderDetails = todayOrders.map(o => {
    const items = (o.items || []).map(i => `${i.name} x${i.qty}`).join(', ');
    return `${o.store}: ₹${Math.round(o.grand || 0)} (${items || 'items not listed'})`;
  }).join('\n');

  const prompt = `Write a brief, professional WhatsApp-style end-of-day sales report for this field sales officer. Use friendly but professional tone. Include store names, order values, and a positive closing note. Keep it under 150 words.\n\nOfficer: ${CU?.name}\nDate: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })}\nTotal orders: ${todayOrders.length}\nStores visited: ${stores.length}\nTotal value: ₹${Math.round(totalValue).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nOrder details:\n${orderDetails}`;

  // Show loading modal
  const overlay = document.createElement('div');
  overlay.id = 'ai-summary-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:var(--w);border-radius:16px;padding:20px;width:100%;max-width:340px">
      <div style="font-size:14px;font-weight:700;color:#159ADB;margin-bottom:8px">🤖 AI Visit Summary</div>
      <div id="ai-summary-text" style="font-size:13px;color:var(--t1);line-height:1.6;min-height:80px">
        <div style="display:flex;align-items:center;gap:8px;padding:10px 0">
          <div style="display:flex;gap:4px">
            <span style="width:7px;height:7px;border-radius:50%;background:#159ADB;display:inline-block;animation:aiPulse 1.2s ease-in-out infinite"></span>
            <span style="width:7px;height:7px;border-radius:50%;background:#159ADB;display:inline-block;animation:aiPulse 1.2s ease-in-out 0.4s infinite"></span>
            <span style="width:7px;height:7px;border-radius:50%;background:#159ADB;display:inline-block;animation:aiPulse 1.2s ease-in-out 0.8s infinite"></span>
          </div>
          <span style="font-size:12px;color:var(--t2)">Writing your day summary…</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button id="ai-copy-btn" class="btn" style="flex:1;font-size:13px;display:none" onclick="copyAISummary()">📋 Copy</button>
        <button class="btn-out" style="flex:1;font-size:13px" onclick="document.getElementById('ai-summary-overlay').remove()">Close</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  try {
    const aiUrl = SCRIPT_URL + '?action=aiPrompt&model=' + encodeURIComponent('openrouter/auto') + '&apiKey=' + encodeURIComponent(GEMINI_API_KEY) + '&prompt=' + encodeURIComponent(prompt);
    const res = await fetch(aiUrl);
    const data = await res.json();
    const text = data?.result || data?.choices?.[0]?.message?.content || 'Could not generate summary.';
    window._aiSummaryText = text;
    document.getElementById('ai-summary-text').textContent = text;
    const copyBtn = document.getElementById('ai-copy-btn');
    if (copyBtn) copyBtn.style.display = 'block';
  } catch (e) {
    document.getElementById('ai-summary-text').textContent = 'AI summary unavailable. Please try again.';
  }
}

function copyAISummary() {
  if (!window._aiSummaryText) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window._aiSummaryText).then(() => toast('Summary copied ✅'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = window._aiSummaryText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('Summary copied ✅');
  }
}

// Add AI summary button to Officer home
function addAISummaryButton() {
  const _existAsb = document.getElementById('ai-summary-btn');
  if (_existAsb) _existAsb.remove();
  const role = CU?.role || 'Officer';
  if (!['Officer','ASM','RSM'].includes(role)) return;
  const homeTab = document.getElementById('tab-home');
  if (!homeTab) return;
  const btn = document.createElement('button');
  btn.id = 'ai-summary-btn';
  btn.className = 'btn-out';
  btn.style.cssText = 'width:100%;margin-bottom:10px;font-size:13px;border-color:#159ADB;color:#159ADB';
  btn.innerHTML = '🤖 AI: Summarise my day';
  btn.onclick = generateVisitSummary;
  const dayBanner = document.getElementById('day-banner');
  if (dayBanner) homeTab.insertBefore(btn, dayBanner.nextSibling);
  else homeTab.appendChild(btn);
}

// Admin: set product spotlight UI (in admin panel)
function renderAdminSpotlightForm() {
  const el = document.getElementById('admin-spotlight-form');
  if (!el) return;
  el.innerHTML = `
    <div class="slabel">Product spotlight this week</div>
    <select id="spotlight-product" style="width:100%;padding:10px;border:1px solid var(--bd);border-radius:var(--rads);font-size:13px;margin-bottom:8px">
      <option value="">Select product</option>
      ${(allProds ? allProds() : DEFAULT_PRODUCTS).map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
    </select>
    <input id="spotlight-msg" placeholder="Push message (optional)" style="width:100%;padding:10px;border:1px solid var(--bd);border-radius:var(--rads);font-size:13px;margin-bottom:8px;box-sizing:border-box">
    <button class="btn" onclick="const p=document.getElementById('spotlight-product').value,m=document.getElementById('spotlight-msg').value;if(!p){toast('Select a product');return;}setProductSpotlight(p,m);">Set spotlight ✅</button>`;
}

// ══ PATCH launchApp — UI/notification checks only on app open ══
// NOTE: Email alerts (no-order, daily digest) must NEVER fire from here.
// They are triggered server-side by GAS timed triggers only.
const _newFeaturesLaunch = launchApp;
launchApp = function() {
  _newFeaturesLaunch();
  setTimeout(() => {
    scheduleNotificationChecks();
  }, 12000); // after master data loads
  // buttons now injected via renderRoleHome patch — no separate timeout needed
};

// ══ PATCH renderRoleHome — inject buttons + attendance calendar every render ══
const _origRenderRoleHomeNew = renderRoleHome;
renderRoleHome = function() {
  _origRenderRoleHomeNew();
  const role = CU?.role || 'Officer';
  // For non-Officer roles (ASM/RSM/GM/Admin): inject AI + Route Map buttons
  // For Officers: these are already in the static quick-actions section
  setTimeout(() => {
    if (role !== 'Officer') {
      addRouteMapButton();
      addAISummaryButton();
    }
    renderProductSpotlight();
    checkStoreVisitGaps();
  }, 300);
  if (role === 'Officer') {
    // Attendance calendar on Day tab
    setTimeout(() => {
      const dayTab = document.getElementById('tab-day');
      const existing = document.getElementById('att-calendar-block');
      if (existing) existing.remove();
      if (dayTab) {
        const div = document.createElement('div');
        div.id = 'att-calendar-block';
        div.innerHTML = renderAttendanceCalendar();
        dayTab.appendChild(div);
      }
    }, 500);
  }
};

// ══ AI suggest on order page (step 3) — injected into order-list ══
const _origSelectStoreAI = selectStore;
selectStore = function(store) {
  _origSelectStoreAI(store);
  // Store reference for use when order page renders
  window._vsStoreForAI = store;
};

// Watch for order-list becoming visible and inject AI button + quick reorder
setInterval(() => {
  const orderList = document.getElementById('order-list');
  if (!orderList || !VS?.store || !orderList.offsetParent) return;
  if (orderList.querySelector('#ai-suggest-btn')) return;
  const aiDiv = document.createElement('div');
  aiDiv.id = 'ai-suggest-btn';
  aiDiv.style.cssText = 'margin-bottom:10px';
  aiDiv.innerHTML = '<button class="btn-out" style="width:100%;font-size:12px;padding:9px;border-color:#159ADB;color:#159ADB" onclick="getSmartOrderSuggestions(VS.store.name)">🤖 AI: Suggest order for this store</button>';
  orderList.insertBefore(aiDiv, orderList.firstChild);
  if (typeof triggerQuickReorderIfNeeded === 'function') triggerQuickReorderIfNeeded();
}, 800);

// ══ PATCH submitOrder — check order gap alert after submit ══
const _origSubmitOrderGap = submitOrder;
if (typeof submitOrder === 'function') {
  submitOrder = async function() {
    await _origSubmitOrderGap.apply(this, arguments);
    // Check for order gap after a short delay (order will be in local DB)
    setTimeout(() => {
      const orders = myOrders().sort((a, b) => new Date(b.ts) - new Date(a.ts));
      if (orders.length) checkOrderGapAlerts(orders[0]);
      updateVisitStreak();
      checkDayMilestones();
    }, 2000);
  };
}



// ══ MILESTONE TOASTS ══
function _showMilestoneToast(msg) {
  const existing = document.getElementById('dl-milestone-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'dl-milestone-toast';
  el.className = 'milestone-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 350);
  }, 2800);
}

function checkDayMilestones() {
  const role = CU?.role || 'Officer';
  if (!['Officer','ASM','RSM'].includes(role)) return;
  const todayStr = todayKey();
  const todayOrders = myOrders().filter(o => !o.cancelled && !o.noOrder && o.ts && tsToISTDate(o.ts) === todayStr);
  const todayVal = todayOrders.reduce((a,o) => a + (o.grand||0), 0);
  const count = todayOrders.length;
  const shownKey = 'milestones_shown_' + todayStr;
  const shown = DB.get(shownKey, {});
  const milestones = [
    { key:'first',  check: count === 1,           msg: '🌟 First order of the day — great start!' },
    { key:'ord3',   check: count === 3,            msg: '🎯 3 orders today — on a roll!' },
    { key:'ord5',   check: count === 5,            msg: '💪 5 orders today — top performer material!' },
    { key:'ord8',   check: count === 8,            msg: '🏆 8 orders today — outstanding!' },
    { key:'val5k',  check: todayVal >= 5000  && todayVal - (myOrders().filter(o=>!o.cancelled&&!o.noOrder&&o.ts&&tsToISTDate(o.ts)===todayStr).slice(1).reduce((a,o)=>a+(o.grand||0),0)) >= 1, msg: '💰 ₹5,000 crossed today!' },
    { key:'val10k', check: todayVal >= 10000 && todayOrders.length > 0, msg: '🚀 ₹10,000 today — brilliant!' },
    { key:'val25k', check: todayVal >= 25000 && todayOrders.length > 0, msg: '🔥 ₹25,000 today — incredible!' },
    { key:'val50k', check: todayVal >= 50000 && todayOrders.length > 0, msg: '🏆 ₹50,000 today — legend!' },
  ];
  let fired = false;
  for (const m of milestones) {
    if (m.check && !shown[m.key]) {
      shown[m.key] = true;
      DB.set(shownKey, shown);
      if (!fired) { setTimeout(() => _showMilestoneToast(m.msg), 2400); fired = true; }
      break; // one milestone toast per order submit
    }
  }
}

// ══ VOICE ENTRY — Web Speech API + OpenRouter AI parsing ══
let _veRecog = null, _veTranscript = '';

function openVoiceEntry(mode) {
  document.getElementById('_voice-modal')?.remove();
  _veRecog = null; _veTranscript = '';
  const modeLabel = mode === 'audit' ? 'Stock Audit' : mode === 'order' ? 'Order Booking' : 'Proforma Invoice';
  const hasSpeech = ('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window);
  const modal = document.createElement('div');
  modal.id = '_voice-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#1a1a2e;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:32px 20px 40px';
  modal.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:6px">🎤 Quick Entry — ${modeLabel}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.8)">Say product names &amp; quantities in any language.<br><span style="color:#4CAF50">e.g. "Sugar 500g rendu case, Jaggery onnu, Cookies pathinaaru"</span></div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:14px;width:100%">
      <div id="_ve-rec-indicator" style="display:none;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:#e53935;animation:vepulse 1s infinite"></div>
        <span style="color:#fff;font-size:14px;font-weight:600">Listening… speak now</span>
      </div>
      <div id="_ve-live" style="display:none;width:100%;background:rgba(255,255,255,0.1);border-radius:10px;padding:10px;color:#fff;font-size:13px;min-height:40px;text-align:center"></div>
      <div id="_ve-status" style="font-size:13px;color:rgba(255,255,255,0.85);text-align:center;min-height:20px"></div>
      <textarea id="_ve-text" placeholder="Or type here: sugar 500g 2 case, jaggery onnu..." style="display:${hasSpeech ? 'none' : 'block'};width:100%;padding:10px;border-radius:10px;border:none;font-size:13px;min-height:60px;box-sizing:border-box"></textarea>
      <div id="_ve-result" style="display:none;width:100%;background:var(--w);border-radius:12px;padding:12px;max-height:240px;overflow-y:auto"></div>
      <div id="_ve-confirm-btn-wrap" style="display:none;width:100%">
        <button id="_ve-confirm-btn" onclick="confirmVoiceEntry('${mode}')" style="width:100%;padding:14px;border:none;border-radius:12px;background:#1A7A3C;color:#fff;font-size:14px;font-weight:700;cursor:pointer">✅ Confirm &amp; add all</button>
      </div>
      <div style="display:flex;gap:12px;width:100%">
        <button onclick="_veStopRecog();document.getElementById('_voice-modal')?.remove()" style="flex:1;padding:14px;border:1.5px solid rgba(255,255,255,0.4);border-radius:12px;background:transparent;color:#fff;font-size:13px;font-weight:600;cursor:pointer">Cancel</button>
        <button id="_ve-action-btn" style="flex:2;padding:14px;border:none;border-radius:12px;background:#e53935;color:#fff;font-size:14px;font-weight:700;cursor:pointer">${hasSpeech ? '🎤 Start Speaking' : '✔ Parse Text'}</button>
        <button id="_ve-retry-btn" style="display:none;flex:1;padding:14px;border:1.5px solid rgba(255,255,255,0.4);border-radius:12px;background:transparent;color:#fff;font-size:13px;font-weight:600;cursor:pointer">🔄 Retry</button>
      </div>
      <div id="_ve-type-toggle" style="display:${hasSpeech ? 'block' : 'none'}"><a href="#" onclick="event.preventDefault();_veShowTextMode()" style="color:rgba(255,255,255,0.6);font-size:12px">⌨️ Type instead</a></div>
    </div>
    <style>@keyframes vepulse{0%,100%{opacity:1}50%{opacity:0.3}}</style>`;
  document.body.appendChild(modal);
  document.getElementById('_ve-action-btn').addEventListener('click', function() {
    const textEl = document.getElementById('_ve-text');
    if (textEl && textEl.style.display !== 'none') {
      const t = (textEl.value || '').trim();
      if (!t) return void(document.getElementById('_ve-status').innerHTML = '<span style="color:#ffcdd2">Type something first</span>');
      _veAIparse(t);
    } else {
      _veRecog ? _veStopRecog(true) : _veStartRecog();
    }
  });
  document.getElementById('_ve-retry-btn').addEventListener('click', _veResetState);
}

function _veShowTextMode() {
  _veStopRecog();
  const el = document.getElementById('_ve-text'); if (el) el.style.display = 'block';
  const btn = document.getElementById('_ve-action-btn'); if (btn) { btn.textContent = '✔ Parse Text'; btn.style.background = '#1A7A3C'; }
  const tog = document.getElementById('_ve-type-toggle'); if (tog) tog.style.display = 'none';
  const ind = document.getElementById('_ve-rec-indicator'); if (ind) ind.style.display = 'none';
}

function _veStartRecog() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return _veShowTextMode();
  _veTranscript = '';
  _veRecog = new SR();
  _veRecog.lang = 'ta-IN';
  _veRecog.continuous = true;
  _veRecog.interimResults = true;
  _veRecog.onresult = function(e) {
    let fin = '', int = '';
    for (let i = 0; i < e.results.length; i++) {
      if (e.results[i].isFinal) fin += e.results[i][0].transcript + ' ';
      else int += e.results[i][0].transcript;
    }
    _veTranscript = fin.trim();
    const lv = document.getElementById('_ve-live');
    if (lv) { lv.style.display = 'block'; lv.textContent = (fin + int).trim() || '…'; }
  };
  _veRecog.onerror = function(e) {
    const st = document.getElementById('_ve-status');
    if (e.error === 'not-allowed') { if (st) st.innerHTML = '<span style="color:#ffcdd2">❌ Mic permission denied</span>'; }
    else if (e.error === 'no-speech') { if (st) st.innerHTML = '<span style="color:#ffcdd2">No speech heard — tap Retry</span>'; }
    else { if (st) st.innerHTML = '<span style="color:#ffcdd2">❌ Speech error — try typing instead</span>'; _veShowTextMode(); }
    _veRecog = null;
    const rb = document.getElementById('_ve-retry-btn'); if (rb) rb.style.display = 'block';
  };
  _veRecog.start();
  const btn = document.getElementById('_ve-action-btn'); if (btn) { btn.textContent = '⏹ Stop & Process'; btn.style.background = '#b71c1c'; }
  const ind = document.getElementById('_ve-rec-indicator'); if (ind) ind.style.display = 'flex';
}

function _veStopRecog(process) {
  if (_veRecog) { try { _veRecog.onend = null; _veRecog.stop(); } catch(e) {} _veRecog = null; }
  const ind = document.getElementById('_ve-rec-indicator'); if (ind) ind.style.display = 'none';
  if (process) {
    setTimeout(function() {
      if (_veTranscript) {
        _veAIparse(_veTranscript);
      } else {
        const st = document.getElementById('_ve-status'); if (st) st.innerHTML = '<span style="color:#ffcdd2">Nothing heard — tap Retry or type</span>';
        const rb = document.getElementById('_ve-retry-btn'); if (rb) rb.style.display = 'block';
        const ab = document.getElementById('_ve-action-btn'); if (ab) ab.style.display = 'none';
      }
    }, 400);
  }
}

async function _veAIparse(transcript) {
  const st = document.getElementById('_ve-status');
  const ab = document.getElementById('_ve-action-btn'); if (ab) ab.style.display = 'none';
  const lv = document.getElementById('_ve-live'); if (lv) lv.style.display = 'none';
  if (st) st.innerHTML = '<span style="color:rgba(255,255,255,0.7)">🤖 AI parsing…</span>';
  const prods = (typeof allProds === 'function' ? allProds() : (typeof _rawAllProds === 'function' ? _rawAllProds() : []));
  const prodList = prods.map(p => `${p.name} (casePack:${p.casePack || (typeof CASES !== 'undefined' ? CASES[p.name] : 0) || 1})`).join(', ');
  const prompt = `You are a product entry parser for Diabliss, an Indian FMCG company. The officer may speak in English, Tamil, Telugu, Kannada, Hindi, Malayalam, or a mix.

Transcript: "${transcript}"

Product list: ${prodList}

Rules:
- Match each product mentioned to the closest name in the list
- If "case"/"cases"/"petti"/"pettis"/"box"/"boxes" is mentioned, multiply qty by casePack to get nos
- Tamil numbers: onnu=1, rendu=2, moonu=3, naalu=4, anju=5, aaru=6, yezhu=7, ettu=8, onbathu=9, pathu=10, pathinaaru=16, irubathu=20
- Hindi: ek=1, do=2, teen=3, char=4, paanch=5, das=10
- If qty not mentioned, assume 1
- Return ONLY a JSON array, no markdown, no explanation: [{"name":"exact product name","qty":number}]`;

  try {
    if (!SCRIPT_URL) throw new Error('No GAS URL');
    const url = SCRIPT_URL + '?action=aiPrompt&model=' + encodeURIComponent('google/gemini-2.0-flash-001') + '&apiKey=&prompt=' + encodeURIComponent(prompt);
    const res = await fetch(url);
    const data = await res.json();
    let text = (data.result || '').replace(/```json|```/g, '').trim();
    // Find JSON array in response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array in response');
    const items = JSON.parse(match[0]);
    if (!items.length) throw new Error('No products found');
    _veShowResults(items);
  } catch(e) {
    // Fallback: local keyword matching
    _veLocalParse(transcript);
  }
}

function _veLocalParse(transcript) {
  const numWords = {onnu:1,ondru:1,oru:1,rendu:2,irandu:2,moonu:3,moondru:3,naalu:4,nalu:4,anju:5,aindhu:5,aaru:6,yezhu:7,ezhu:7,ettu:8,onbathu:9,pathu:10,pathinaaru:16,irubathu:20,ek:1,do:2,teen:3,char:4,paanch:5,das:10,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
  const caseWords = ['case','cases','petti','pettis','petty','box','boxes','carton','cartons'];
  const prods = (typeof allProds === 'function' ? allProds() : (typeof _rawAllProds === 'function' ? _rawAllProds() : []));
  const st = document.getElementById('_ve-status');
  if (!prods.length) { if (st) st.innerHTML = '<span style="color:#ffcdd2">Products not loaded — sync first</span>'; return; }
  let t = ' ' + transcript.toLowerCase() + ' ';
  Object.keys(numWords).forEach(w => { t = t.replace(new RegExp('\\b' + w + '\\b', 'g'), ' ' + numWords[w] + ' '); });
  const segments = t.split(/,|and|then|plus/).map(s => s.trim()).filter(Boolean);
  const items = [];
  segments.forEach(seg => {
    const nums = seg.match(/\d+(?:\.\d+)?/g) || [];
    const isCaseMentioned = caseWords.some(cw => new RegExp('\\b' + cw + '\\b').test(seg));
    let cleanSeg = seg; caseWords.forEach(cw => { cleanSeg = cleanSeg.replace(new RegExp('\\b' + cw + '\\b', 'g'), ' '); });
    let best = null, bestScore = 0;
    prods.forEach(p => {
      const pn = p.name.toLowerCase().replace(/[^a-z0-9 .]/g, ' ').split(/\s+/).filter(Boolean);
      const sw = cleanSeg.split(' ');
      let score = 0;
      sw.forEach(w => { pn.forEach(pw => { if (pw === w) score += 3; else if ((pw.startsWith(w) && w.length >= 3) || (w.startsWith(pw) && pw.length >= 3)) score += 2; }); });
      const dm = cleanSeg.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm)?/g);
      if (dm) dm.forEach(m => { if (p.name.toLowerCase().includes(m.replace(/\s+/g,''))) score += 4; });
      if (score > bestScore) { bestScore = score; best = p; }
    });
    if (!best || bestScore < 3) return;
    const pNums = best.name.toLowerCase().match(/\d+(?:\.\d+)?/g) || [];
    let qty = null;
    for (let i = nums.length - 1; i >= 0; i--) { if (!pNums.includes(nums[i])) { qty = parseFloat(nums[i]); break; } }
    if (qty === null && nums.length) qty = parseFloat(nums[nums.length - 1]);
    if (!qty || qty <= 0) qty = 1;
    const cp = best.casePack || (typeof CASES !== 'undefined' ? CASES[best.name] : 0) || 1;
    const finalQty = isCaseMentioned ? Math.round(qty * cp) : Math.round(qty);
    if (!items.find(i => i.name === best.name)) items.push({ name: best.name, qty: finalQty });
  });
  if (!items.length) {
    if (st) st.innerHTML = '<span style="color:#ffcdd2">❌ No products matched — tap Retry or type</span>';
    const rb = document.getElementById('_ve-retry-btn'); if (rb) rb.style.display = 'block';
    return;
  }
  _veShowResults(items);
}

function _veShowResults(items) {
  window._veItems = items;
  const res = document.getElementById('_ve-result');
  const st = document.getElementById('_ve-status');
  const rows = items.map((item, i) => `<tr style="background:${i%2===0?'var(--bg)':'var(--w)'}">
    <td style="padding:7px 8px;font-size:12px;color:var(--t1)">${item.name}</td>
    <td style="padding:7px 8px;text-align:center"><input type="number" value="${item.qty}" min="0" onchange="window._veItems[${i}].qty=parseInt(this.value)||0" style="width:60px;padding:4px;border:1px solid var(--bd);border-radius:var(--rads);text-align:center;font-size:13px;font-weight:600"></td>
    <td style="padding:7px 8px;font-size:11px;color:var(--t3)">nos</td>
  </tr>`).join('');
  res.innerHTML = `<div style="font-size:11px;font-weight:700;color:var(--t2);margin-bottom:6px">Review — edit if needed:</div>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:var(--g);color:#fff">
        <th style="padding:7px 8px;text-align:left;font-size:11px">Product</th>
        <th style="padding:7px 8px;text-align:center;font-size:11px">Qty (nos)</th>
        <th style="padding:7px 8px;font-size:11px">Unit</th>
      </tr></thead><tbody>${rows}</tbody></table></div>`;
  res.style.display = 'block';
  const cw = document.getElementById('_ve-confirm-btn-wrap'); if (cw) cw.style.display = 'block';
  const rb = document.getElementById('_ve-retry-btn'); if (rb) rb.style.display = 'block';
  if (st) st.innerHTML = `<span style="color:#a5d6a7">✅ ${items.length} product(s) found — review and confirm</span>`;
}

function _veResetState() {
  _veStopRecog(); _veTranscript = '';
  const ab = document.getElementById('_ve-action-btn');
  if (ab) { ab.disabled = false; ab.style.display = 'block'; ab.textContent = '🎤 Start Speaking'; ab.style.background = '#e53935'; }
  const rb = document.getElementById('_ve-retry-btn'); if (rb) rb.style.display = 'none';
  const st = document.getElementById('_ve-status'); if (st) st.textContent = '';
  const res = document.getElementById('_ve-result'); if (res) { res.style.display = 'none'; res.innerHTML = ''; }
  const cw = document.getElementById('_ve-confirm-btn-wrap'); if (cw) cw.style.display = 'none';
  const lv = document.getElementById('_ve-live'); if (lv) { lv.style.display = 'none'; lv.textContent = ''; }
  const tog = document.getElementById('_ve-type-toggle'); if (tog) tog.style.display = 'block';
  const te = document.getElementById('_ve-text'); if (te) te.style.display = 'none';
}

function resetVoiceEntry() { _veResetState(); }

function confirmVoiceEntry(mode) {
  const items = window._veItems || [];
  const prods = (typeof allProds === 'function' ? allProds() : (typeof _rawAllProds === 'function' ? _rawAllProds() : []));
  let added = 0;
  items.forEach(item => {
    if (!item.qty || item.qty <= 0 || (item.name||'').startsWith('UNKNOWN')) return;
    const prod = prods.find(p => p.name === item.name);
    if (!prod) return;
    const qty = parseInt(item.qty) || 0;
    if (mode === 'audit') { if (!auditProds.find(p => p.id === prod.id)) auditProds.push(prod); VS.audit[prod.id] = qty; added++; }
    else if (mode === 'order') { if (!orderProds.find(p => p.id === prod.id)) orderProds.push(prod); VS.order[prod.id] = qty; added++; }
    else if (mode === 'invoice') {
      if (!invProds.find(p => p.id === prod.id)) invProds.push(prod);
      setTimeout(() => { const el = document.getElementById('iq-'+prod.id); if (el) { el.value = qty; window._invQtys = window._invQtys||{}; window._invQtys[prod.id] = qty; } }, 150);
      added++;
    }
  });
  if (mode === 'audit' && typeof renderAuditList === 'function') renderAuditList();
  if (mode === 'order') { if (typeof renderOrderList === 'function') renderOrderList(); if (typeof updateOrderTotal === 'function') updateOrderTotal(); }
  if (mode === 'invoice') { if (typeof renderInvProductList === 'function') renderInvProductList(); setTimeout(() => { if (typeof updateInvTotal === 'function') updateInvTotal(); }, 300); }
  document.getElementById('_voice-modal')?.remove();
  if (typeof toast === 'function') toast(`✅ ${added} product(s) added`);
}

// ══ ADDRESS AUTO-FILL — Google Geocoding API ══
const GEO_API_KEY = 'AIzaSyDI_8NNYZWnEDoHD7f8O0p4qoEGt2Vjj3c';

function _geoGuessTerritory(components) {
  const state = (components.find(c => c.types.includes('administrative_area_level_1'))?.long_name||'').toLowerCase();
  const dist  = (components.find(c => c.types.includes('administrative_area_level_3'))?.long_name||'').toLowerCase();
  const city  = (components.find(c => c.types.includes('locality'))?.long_name||'').toLowerCase();
  const s = state + ' ' + dist + ' ' + city;
  if (s.includes('chennai')||s.includes('kancheepuram')||s.includes('chengalpattu')||s.includes('tiruvallur')) return 'Chennai';
  if (s.includes('tamil')) return 'ROTN';
  if (s.includes('kerala')) return 'Kerala';
  if (s.includes('andhra')) return 'AP';
  if (s.includes('telangana')) return 'TS';
  if (s.includes('bangalore')||s.includes('bengaluru')) return 'Bangalore';
  if (s.includes('karnataka')) return 'ROK';
  if (s.includes('odisha')||s.includes('orissa')) return 'Odisha';
  return 'Others';
}

async function autoFillStoreAddress() {
  const btn = document.getElementById('ns-geo-btn');
  const statusEl = document.getElementById('ns-geo-status');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Getting…'; }
  if (statusEl) { statusEl.style.display = 'block'; statusEl.textContent = '📍 Getting GPS…'; }
  try {
    const pos = await (typeof getCurrentLocation === 'function' ? getCurrentLocation() : Promise.reject(new Error('Location function not found')));
    if (!pos?.lat || !pos?.lng) throw new Error('Location unavailable — please enable GPS');
    if (statusEl) statusEl.textContent = '🔍 Fetching address…';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.lat},${pos.lng}&key=${GEO_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) throw new Error('Address not found');
    const components = data.results[0].address_components || [];
    const streetNum = components.find(c=>c.types.includes('street_number'))?.long_name||'';
    const route     = components.find(c=>c.types.includes('route'))?.long_name||'';
    const sublocal  = components.find(c=>c.types.includes('sublocality_level_1'))?.long_name||'';
    const locality  = components.find(c=>c.types.includes('locality'))?.long_name||'';
    const pincode   = components.find(c=>c.types.includes('postal_code'))?.long_name||'';
    const territory = _geoGuessTerritory(components);
    // ns-addr left blank — officer types shop street address manually
    // city = locality, fallback to sublocality if locality empty
    const cityVal = locality || sublocal || '';
    const addrEl = document.getElementById('ns-addr');
    const cityEl = document.getElementById('ns-city');
    const pinEl  = document.getElementById('ns-pincode');
    const terrEl = document.getElementById('ns-territory');
    if (cityEl && cityVal) cityEl.value = cityVal;
    if (pinEl  && pincode)  pinEl.value  = pincode;
    if (terrEl && territory) terrEl.value = territory;
    if (statusEl) statusEl.innerHTML = '<span style="color:#1A7A3C">✅ Area filled — add shop name/street in address</span>';
    if(typeof toast==='function') toast('Location filled ✅');
  } catch(e) {
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--r)">❌ ${e.message||'Error'} — fill manually</span>`;
    if(typeof toast==='function') toast('Could not get address — fill manually');
  }
  if (btn) { btn.disabled = false; btn.textContent = '📍 Get location'; }
}
