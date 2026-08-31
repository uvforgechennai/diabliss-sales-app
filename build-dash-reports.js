function getExpConfig() {
  return DB.get('exp_config', { local:0,exmarket:0,exmarket_night:0 });
}

function onExpTypeChange() {
  const type = document.getElementById('exp-type').value;
  const cfg = getExpConfig();
  const fares = { local: cfg.local, exmarket: cfg.exmarket, exmarket_night: cfg.exmarket_night };
  const baseFare = fares[type] || 0;
  const _efr=document.getElementById('exp-base-fare-row'); if(_efr)_efr.style.display=type?'block':'none';
  const _ebd=document.getElementById('exp-base-display'); if(_ebd)_ebd.textContent='₹'+baseFare.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
  const _ees=document.getElementById('exp-extra-section'); if(_ees)_ees.style.display=(type==='exmarket'||type==='exmarket_night')?'block':'none';
  const _esb=document.getElementById('exp-submit-btn'); if(_esb)_esb.style.display=type?'block':'none';
  const _etr=document.getElementById('exp-total-row'); if(_etr)_etr.style.display=type?'block':'none';
  expRows = []; expRowCount = 0;
  const _er=document.getElementById('exp-rows'); if(_er)_er.innerHTML='';
  updateExpTotal();
}

function addExpRow() {
  expRowCount++;
  const id = 'er' + expRowCount;
  expRows.push(id);
  const div = document.createElement('div');
  div.id = id;
  div.style.cssText = 'background:var(--w);border:1px solid var(--bd);border-radius:var(--rads);padding:10px;margin-bottom:8px';
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:12px;font-weight:600;color:var(--t2)">Expense ${expRowCount}</div>
      <button onclick="removeExpRow('${id}')" style="background:none;border:none;color:var(--r);cursor:pointer;font-size:18px">×</button>
    </div>
    <div class="field"><label>Particulars</label>
      <input type="text" id="${id}-desc" placeholder="e.g. Fuel, Toll, Food, Hotel" autocomplete="off" style="font-size:13px">
    </div>
    <div class="field-row">
      <div class="field"><label>Amount (₹)</label>
        <input type="number" id="${id}-amt" placeholder="0" min="0" oninput="updateExpTotal()" style="font-size:13px">
      </div>
      <div class="field"><label>Bill photo</label>
        <button onclick="takeExpPhoto('${id}')" style="width:100%;padding:9px;border:1.5px dashed var(--bd);border-radius:var(--rads);background:var(--bg);font-size:12px;cursor:pointer">📷 Take photo</button>
        <input type="file" id="${id}-photo" accept="image/*" capture="environment" style="display:none" onchange="onExpPhoto(event,'${id}')">
      </div>
    </div>
    <div id="${id}-photo-preview" style="display:none;margin-top:6px">
      <img id="${id}-photo-img" style="width:100%;border-radius:6px;max-height:120px;object-fit:cover">
      <div style="font-size:10px;color:var(--g);margin-top:3px">✅ Bill photo captured</div>
    </div>`;
  const _erWrap=document.getElementById('exp-rows'); if(_erWrap)_erWrap.appendChild(div);
}

function removeExpRow(id) {
  expRows = expRows.filter(r => r !== id);
  document.getElementById(id)?.remove();
  updateExpTotal();
}

function takeExpPhoto(id) { document.getElementById(id + '-photo')?.click(); }

function onExpPhoto(e, id) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    document.getElementById(id + '-photo-img').src = ev.target.result;
    document.getElementById(id + '-photo-preview').style.display = 'block';
  };
  r.readAsDataURL(f);
}

function updateExpTotal() {
  const type = document.getElementById('exp-type').value;
  if (!type) return;
  const cfg = getExpConfig();
  const baseFare = { local: cfg.local, exmarket: cfg.exmarket, exmarket_night: cfg.exmarket_night }[type] || 0;
  let extra = 0;
  expRows.forEach(id => { extra += parseFloat(document.getElementById(id + '-amt')?.value || 0); });
  const total = baseFare + extra;
  document.getElementById('exp-t-base').textContent = '₹' + baseFare.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
  document.getElementById('exp-t-extra').textContent = '₹' + extra.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
  document.getElementById('exp-t-total').textContent = '₹' + total.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
}

function submitExpense() {
  const type = document.getElementById('exp-type').value;
  if (!type) { toast('Select travel type'); return; }
  const cfg = getExpConfig();
  const baseFare = { local: cfg.local, exmarket: cfg.exmarket, exmarket_night: cfg.exmarket_night }[type] || 0;
  const typeLabels = { local: 'Local', exmarket: 'Ex-market', exmarket_night: 'Ex-market with night stay' };
  const items = expRows.map(id => ({
    desc: document.getElementById(id + '-desc')?.value.trim() || '',
    amt: parseFloat(document.getElementById(id + '-amt')?.value || 0),
    photo: document.getElementById(id + '-photo-img')?.src || ''
  })).filter(i => i.amt > 0 || i.desc);
  const extra = items.reduce((a, i) => a + i.amt, 0);
  const total = baseFare + extra;
  const exp = {
    id: 'EXP' + Date.now().toString().slice(-6),
    date: todayKey(),
    dateLabel: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }),
    type, typeLabel: typeLabels[type],
    baseFare, items, extra, total,
    notes: document.getElementById('exp-notes').value.trim(),
    officer: CU.name, officerMobile: CU.mobile, officerRole: CU.role || 'Officer', territory: CU.territory || '',
    ts: new Date().toISOString(), status: 'Submitted'
  };
  const all = DB.get('expenses', []); all.unshift(exp); DB.set('expenses', all);
  if (SCRIPT_URL) fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ ...exp, action: 'saveExpense' }) }).catch(() => {});
  toast('Expenses submitted!');
  document.getElementById('exp-type').value = '';
  onExpTypeChange();
  renderExpHistory();
}

function renderExpHistory() {
  const el = document.getElementById('exp-history'); if (!el) return;
  const exps = DB.get('expenses', []).filter(e => e.officer === CU?.name).slice(0, 10);
  const reportBtn = `<div style="margin-bottom:12px"><button class="btn btn-sm" onclick="showMonthlyExpenseReport()" style="width:100%">📊 Monthly expense report</button></div>`;
  if (!exps.length) { el.innerHTML = reportBtn + '<div class="empty" style="padding:20px">No expenses submitted yet.</div>'; return; }
  el.innerHTML = exps.map(e => `
    <div class="ocard">
      <div class="ocard-top">
        <div><div class="ostore" style="font-size:16px">${e.typeLabel}</div><div class="odate">${e.dateLabel}</div></div>
        <span class="obadge">#${e.id}</span>
      </div>
      <div class="ometa">Base: ₹${e.baseFare.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} · Extra: ₹${e.extra.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</div>
      <div class="ototal">Total: ₹${e.total.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</div>
      <div class="oactions">
        <button class="abtn" onclick="generateExpReport('${e.id}')" style="color:var(--g);font-weight:600">📄 Report</button>
        <button class="abtn" onclick="shareExpReport('${e.id}')">Share</button>
      </div>
    </div>`).join('');
}

function showMonthlyExpenseReport(){
  document.getElementById('_monthly-exp-modal')?.remove();
  const now=new Date();const monthLabel=now.toLocaleDateString('en-IN',{month:'long',year:'numeric',timeZone:'Asia/Kolkata'});
  window._leRows=[];
  const modal=document.createElement('div');modal.id='_monthly-exp-modal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:flex-end;justify-content:center;overflow-y:auto';
  modal.innerHTML=`<div style="background:var(--w);border-radius:20px 20px 0 0;padding:20px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto"><div style="font-size:16px;font-weight:700;margin-bottom:4px">📊 ${monthLabel} expense report</div><div style="font-size:12px;color:var(--t2);margin-bottom:14px">Add any additional expenses, then download your report</div><div id="_le-rows"></div><button onclick="_addLeRow()" style="width:100%;padding:10px;border:1.5px dashed var(--bd);border-radius:var(--rads);background:transparent;color:var(--g);font-size:13px;font-weight:600;cursor:pointer;margin-bottom:14px">+ Add expense item</button><div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;padding:10px 0;border-top:1px solid var(--bd);margin-bottom:14px"><span>Total</span><span id="_le-total" style="color:var(--g)">₹0</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button onclick="document.getElementById('_monthly-exp-modal').remove()" style="padding:12px;border:1.5px solid var(--bd);border-radius:10px;background:var(--w);font-size:13px;font-weight:600;cursor:pointer">Cancel</button><button onclick="_submitMonthlyExpenses('pdf')" style="padding:12px;border:none;border-radius:10px;background:var(--g);color:#fff;font-size:13px;font-weight:600;cursor:pointer">📄 PDF</button></div><button onclick="_submitMonthlyExpenses('excel')" style="width:100%;margin-top:8px;padding:12px;border:1.5px solid var(--g);border-radius:10px;background:var(--w);color:var(--g);font-size:13px;font-weight:600;cursor:pointer">📊 Excel</button></div>`;
  document.body.appendChild(modal);_addLeRow();
}
function _addLeRow(){
  if((window._leRows||[]).length>=5){toast('Max 5 items');return;}
  const id='le-'+Date.now();window._leRows=window._leRows||[];window._leRows.push(id);const n=window._leRows.length;
  const div=document.createElement('div');div.id=id;div.style.cssText='background:var(--bg);border-radius:var(--rads);padding:10px;margin-bottom:10px;border:1px solid var(--bd)';
  div.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-size:12px;font-weight:600;color:var(--t2)">Item ${n}</div><button onclick="document.getElementById('${id}').remove();window._leRows=window._leRows.filter(x=>x!=='${id}');_leUpdateTotal()" style="background:none;border:none;color:var(--r);cursor:pointer;font-size:18px;padding:0">×</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px"><input type="text" id="${id}-desc" placeholder="e.g. Fuel, Auto" style="padding:8px;border:1px solid var(--bd);border-radius:var(--rads);font-size:13px"><input type="number" id="${id}-amt" placeholder="₹ Amount" min="0" oninput="_leUpdateTotal()" style="padding:8px;border:1px solid var(--bd);border-radius:var(--rads);font-size:13px"></div><div style="display:flex;gap:8px"><button onclick="_leCapture('${id}')" style="flex:1;padding:7px;border:1px solid var(--bd);border-radius:var(--rads);background:var(--w);font-size:12px;cursor:pointer">📷 Camera</button><label style="flex:1;padding:7px;border:1px solid var(--bd);border-radius:var(--rads);background:var(--w);font-size:12px;cursor:pointer;text-align:center">📎 Upload<input type="file" accept="image/*,application/pdf" style="display:none" onchange="_leUpload('${id}',this)"></label><div id="${id}-status" style="flex:1;font-size:10px;color:var(--g);display:flex;align-items:center;padding:0 4px"></div></div>`;
  document.getElementById('_le-rows').appendChild(div);
}
function _leCapture(id){const i=document.createElement('input');i.type='file';i.accept='image/*';i.capture='environment';i.onchange=()=>_leUpload(id,i);i.click();}
function _leUpload(id,inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{const s=document.getElementById(id+'-status');if(s)s.textContent='✅ '+f.name.slice(0,12);window['_le_photo_'+id]=e.target.result;};r.readAsDataURL(f);}
function _leUpdateTotal(){const t=(window._leRows||[]).reduce((s,id)=>s+(parseFloat(document.getElementById(id+'-amt')?.value||0)),0);const el=document.getElementById('_le-total');if(el)el.textContent='₹'+t.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});}
function _submitMonthlyExpenses(format){
  const items=(window._leRows||[]).map(id=>({desc:document.getElementById(id+'-desc')?.value.trim()||'',amt:parseFloat(document.getElementById(id+'-amt')?.value||0),photo:window['_le_photo_'+id]||''})).filter(i=>i.amt>0||i.desc);
  const total=items.reduce((a,i)=>a+i.amt,0);
  const now=new Date();
  const exp={id:'EXP'+Date.now().toString().slice(-6),date:todayKey(),dateLabel:now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}),type:'additional',typeLabel:'Additional',baseFare:0,items,extra:total,total,notes:'Monthly report',officer:CU.name,officerMobile:CU.mobile,officerRole:CU.role||'Officer',territory:CU.territory||'',ts:now.toISOString(),status:'Submitted'};
  if(items.length){const all=DB.get('expenses',[]);all.unshift(exp);DB.set('expenses',all);if(SCRIPT_URL)fetch(SCRIPT_URL,{method:'POST',body:gasPayload({...exp,action:'saveExpense'})}).catch(()=>{});}
  document.getElementById('_monthly-exp-modal')?.remove();toast('Downloading report…');renderExpHistory();
  if(format==='pdf')downloadExpReportPDF();else downloadExpReportExcel();
}

function generateExpReport(id) {
  const e = DB.get('expenses', []).find(x => x.id === id);
  if (!e) return;
  const html = `
    <div class="inv-wrap" id="exp-report-${id}">
      <div class="inv-hdr">
        <div class="inv-company">${COMPANY.name}</div>
        <div class="inv-addr">${COMPANY.addr}<br>GSTIN: ${COMPANY.gstin}</div>
      </div>
      <div style="text-align:center;font-size:14px;font-weight:700;margin:10px 0">EXPENSE CLAIM</div>
      <div class="inv-num"><span>Ref: ${e.id}</span><span>${e.dateLabel}</span></div>
      <div class="inv-party" style="margin-bottom:10px">
        <div class="inv-party-label">Officer details</div>
        <div class="inv-party-name">${e.officer}</div>
        <div class="inv-party-detail">${e.officerRole} · ${e.territory}<br>Mobile: ${e.officerMobile}</div>
      </div>
      <table class="inv-table">
        <thead><tr><th>Particulars</th><th style="text-align:right">Amount (₹)</th></tr></thead>
        <tbody>
          <tr><td>Base fare — ${e.typeLabel}</td><td style="text-align:right">${e.baseFare.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td></tr>
          ${e.items.map(i => `<tr><td>${i.desc || 'Expense'}</td><td style="text-align:right">${i.amt.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td></tr>`).join('')}
          <tr><td style="font-weight:700">Total claim</td><td style="text-align:right;font-weight:700;color:var(--gd)">₹${e.total.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td></tr>
        </tbody>
      </table>
      ${e.notes ? `<div class="inv-remarks"><div class="inv-remarks-label">Notes</div><div class="inv-remarks-text">${e.notes}</div></div>` : ''}
      <div style="margin-top:12px;font-size:11px;color:var(--t2)">Bills enclosed: ${e.items.filter(i => i.photo && i.photo.length > 50).length} photos attached</div>
      <div class="inv-footer">This is a computer generated expense report. No signature required.<br>For ${COMPANY.name}</div>
    </div>`;
  // Show in modal-style overlay
  let overlay = document.getElementById('exp-report-overlay');
  if (!overlay) { overlay = document.createElement('div'); overlay.id = 'exp-report-overlay'; overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:200;overflow-y:auto;padding:20px'; document.body.appendChild(overlay); }
  overlay.innerHTML = `<div style="max-width:480px;margin:0 auto">${html}<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"><button class="btn" onclick="shareExpReport('${id}')">Share</button><button class="btn-out" onclick="document.getElementById('exp-report-overlay').style.display='none'">Close</button></div></div>`;
  overlay.style.display = 'block';
}

function shareExpReport(id) {
  const e = DB.get('expenses', []).find(x => x.id === id);
  if (!e) return;
  const text = `DIABLISS EXPENSE CLAIM\n\nRef: ${e.id}\nDate: ${e.dateLabel}\nOfficer: ${e.officer} (${e.officerRole})\nTerritory: ${e.territory}\n\nTravel type: ${e.typeLabel}\nBase fare: ₹${e.baseFare.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}\n${e.items.map(i => i.desc + ': ₹' + i.amt.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})).join('\n')}\n\nTotal claim: ₹${e.total.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}${e.notes ? '\n\nNotes: ' + e.notes : ''}`;
  if (navigator.share) { navigator.share({ title: 'Expense Claim ' + e.id, text }).catch(() => {}); }
  else { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank'); }
}

// ══ EXPENSE CONFIG (Admin) ══
// saveExpConfig consolidated below


// loadExpConfig consolidated below


function toggleTargetType(type) {
  const types = DB.get('active_target_types', { monthly_order_value: true });
  types[type] = !types[type];
  DB.set('active_target_types', types);
  document.getElementById('tt-' + type)?.classList.toggle('on', types[type]);
}

function toggleMandatory(field) {
  const fields = DB.get('mandatory_fields', {});
  fields[field] = !fields[field];
  DB.set('mandatory_fields', fields);
  document.getElementById('mf-' + field)?.classList.toggle('on', fields[field]);
}

// ══ TARGET SETTING ══
function renderTargetEmpList() {
  const el = document.getElementById('target-emp-list'); if (!el) return;
  el.innerHTML = '<div style="padding:12px 0">' + Array(3).fill('<div style="height:48px;background:linear-gradient(90deg,var(--bg) 25%,var(--bd) 50%,var(--bg) 75%);background-size:200% 100%;animation:skPulse 1.2s ease-in-out infinite;border-radius:10px;margin-bottom:8px"></div>').join('') + '</div>';
  // Step 1: fetch fresh orders from sheet so achieved values reflect ALL officers
  const ordersReady = (SCRIPT_URL && navigator.onLine) ? fetchAndCacheOrders().catch(()=>{}) : Promise.resolve();
  // Step 2: fetch employees (targets come from here), then render with up-to-date orders
  ordersReady.then(() => {
    if (SCRIPT_URL) {
      fetch(gasGetUrl(SCRIPT_URL+'?action=getEmployees')).then(r => r.json()).then(d => {
        if (d.employees) {
          DB.set('employees', d.employees);
          const targets = DB.get('officer_targets', {});
          d.employees.forEach(e => {
            if (e.monthlyTarget) {
              if (!targets[e.mobile]) targets[e.mobile] = {};
              targets[e.mobile].monthly = e.monthlyTarget;
              targets[e.mobile].month = e.targetMonth || '';
            }
          });
          DB.set('officer_targets', targets);
          _renderTargetList(d.employees, targets);
        }
      }).catch(() => {
        _renderTargetList(DB.get('employees',[]), DB.get('officer_targets',{}));
      });
    } else {
      _renderTargetList(DB.get('employees',[]), DB.get('officer_targets',{}));
    }
  });
}

function _renderTargetList(emps, targets) {
  const el = document.getElementById('target-emp-list'); if (!el) return;
  if (!emps.length) { el.innerHTML = '<div class="empty" style="padding:20px">No employees found.</div>'; return; }
  // Compute real month-to-date achieved value per officer from actual orders
  const now = new Date();
  const monthStart = new Date(new Date().toLocaleString('en-US', {timeZone:'Asia/Kolkata'})); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const achievedByMobile = {};
  const achievedByName = {};
  getOrders().forEach(o => {
    if (o.cancelled || !o.ts) return;
    if (new Date(o.ts) < monthStart) return;
    if (o.officerMobile) achievedByMobile[o.officerMobile] = (achievedByMobile[o.officerMobile]||0) + (o.grand||0);
    if (o.officer) achievedByName[o.officer] = (achievedByName[o.officer]||0) + (o.grand||0);
  });
  el.innerHTML = emps.filter(e => !['Admin', 'Sub-Admin'].includes(e.role)).map(e => {
    const target = targets[e.mobile]?.monthly ? parseInt(targets[e.mobile].monthly) : 0;
    const achieved = Math.round(achievedByMobile[e.mobile] || achievedByName[e.name] || 0);
    const pct = target ? Math.round(achieved/target*100) : 0;
    const pctColor = pct>=100 ? 'var(--g)' : pct>=70 ? 'var(--a)' : 'var(--r)';
    return `
    <div class="card" style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div><div style="font-size:13px;font-weight:600">${e.name}</div><div style="font-size:11px;color:var(--t2)">${e.role} · ${e.territory || 'All'}</div></div>
        <span class="role-tag r-${(e.role || 'officer').toLowerCase()}">${e.role}</span>
      </div>
      <div class="field-row">
        <div class="field"><label>Monthly target (₹)</label>
          <input type="number" id="tgt-${e.mobile}" value="${targets[e.mobile]?.monthly || ''}" placeholder="e.g. 100000" oninput="saveOfficerTarget('${e.mobile}',this.value)" style="font-size:13px">
        </div>
        <div class="field" style="display:flex;align-items:flex-end">
          <div style="font-size:12px;color:var(--t2);padding-bottom:8px">
            ${target ? 'Achieved: <b style="color:'+pctColor+';cursor:pointer" onclick="showDrillDown(\'target-achieved\',\''+e.name+'\')">₹'+achieved.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' ›</b> (' + pct + '%)' : 'Achieved: <span style="cursor:pointer" onclick="showDrillDown(\'target-achieved\',\''+e.name+'\')">₹'+achieved.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' ›</span>'}
          </div>
        </div>
      </div>
      ${target?`<div style="height:6px;background:var(--bd);border-radius:3px;overflow:hidden;margin-top:2px"><div style="height:100%;width:${Math.min(pct,100)}%;background:${pctColor}"></div></div>`:''}
    </div>`;
  }).join('') || '<div class="empty" style="padding:20px">No officers/ASM/RSM/GM found.</div>';
}

function saveOfficerTarget(mobile, value) {
  const targets = DB.get('officer_targets', {});
  if (!targets[mobile]) targets[mobile] = {};
  targets[mobile].monthly = parseFloat(value) || 0;
  DB.set('officer_targets', targets);
  if (SCRIPT_URL) fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'saveTarget', mobile, monthly: targets[mobile].monthly, setBy: CU.name }) }).catch(() => {});
}

// updateTargetProgress consolidated below


// ══ BROADCAST ══
// saveBroadcast consolidated below


function checkBroadcast() {
  const broadcasts = DB.get('broadcasts', []);
  const now = new Date();
  const dismissed = DB.get('dismissed_broadcasts', []);
  const active = broadcasts.find(b => b.active && !dismissed.includes(b.id) && (!b.expiry || new Date(b.expiry) >= now));
  const banner = document.getElementById('broadcast-banner');
  const text = document.getElementById('broadcast-text');
  if (active && banner && text) { text.textContent = active.msg; banner.style.display = 'block'; banner.dataset.bcId = active.id; }
  else if (banner) banner.style.display = 'none';
}

function dismissBroadcast() {
  const banner = document.getElementById('broadcast-banner');
  const id = banner?.dataset.bcId;
  if (id) { const d = DB.get('dismissed_broadcasts', []); d.push(id); DB.set('dismissed_broadcasts', d); }
  if (banner) banner.style.display = 'none';
}

function renderBroadcastList() {
  const el = document.getElementById('broadcast-list'); if (!el) return;
  const all = DB.get('broadcasts', []);
  el.innerHTML = all.slice(0, 5).map(b => `
    <div class="card" style="margin-bottom:8px">
      <div style="font-size:13px;margin-bottom:4px">${b.msg}</div>
      <div style="font-size:11px;color:var(--t3)">${b.ts ? new Date(b.ts).toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'}) : ''} · By ${b.by}${b.expiry ? ' · Expires ' + new Date(b.expiry+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''}</div>
      <button onclick="deactivateBroadcast('${b.id}')" style="font-size:11px;color:var(--r);background:none;border:none;cursor:pointer;padding:4px 0">Deactivate</button>
    </div>`).join('') || '<div style="font-size:13px;color:var(--t3);padding:12px 0">No broadcasts yet.</div>';
}

function deactivateBroadcast(id) {
  const all = DB.get('broadcasts', []);
  const idx = all.findIndex(b => b.id === id);
  if (idx !== -1) { all[idx].active = false; DB.set('broadcasts', all); }
  if (SCRIPT_URL) fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deactivateBroadcast', id }) }).catch(() => {});
  renderBroadcastList();
  toast('Broadcast deactivated');
}

// ══ MIS ══
function saveMISConfig() {
  const cfg = { recipients: document.getElementById('mis-recipients')?.value.trim(), from: document.getElementById('mis-from')?.value.trim() };
  DB.set('mis_config', cfg);
  toast('MIS configuration saved');
}

function toggleMISSection(idx) {
  const sections = DB.get('mis_sections', Array(10).fill(true));
  sections[idx] = !sections[idx];
  DB.set('mis_sections', sections);
  document.getElementById('mis-sec-' + idx)?.classList.toggle('on', sections[idx]);
}

function sendMISNow(type) {
  if (!SCRIPT_URL) { toast('Script URL not configured'); return; }
  toast('Sending ' + type + ' MIS report...');
  const cfg = DB.get('mis_config', {});
  const sentTs = new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
  fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'sendMIS', type, recipients: cfg.recipients, from: cfg.from, sentBy: CU.name, ts: new Date().toISOString() }) })
    .then(r => r.json()).then(d => {
      toast(type + ' MIS sent successfully ✅');
      const logs = DB.get('mis_log', []);
      logs.unshift({ type, ts: sentTs, status: 'sent', sentBy: CU.name });
      DB.set('mis_log', logs.slice(0, 50));
      renderMISLog();
    })
    .catch(() => {
      toast('MIS sent — check email');
      const logs = DB.get('mis_log', []);
      logs.unshift({ type, ts: sentTs, status: 'sent', sentBy: CU.name });
      DB.set('mis_log', logs.slice(0, 50));
      renderMISLog();
    });
}

function renderMISLog() {
  const el = document.getElementById('mis-log'); if (!el) return;
  const logs = DB.get('mis_log', []);
  el.innerHTML = logs.slice(0, 10).map(l => `
    <div style="padding:8px 0;border-bottom:0.5px solid var(--bd);font-size:12px;color:var(--t2)">
      <span style="font-weight:500;color:var(--t)">${l.type}</span> · ${l.ts} · ${l.status === 'sent' ? '✅ Sent' : '❌ Failed'}
    </div>`).join('') || '<div style="font-size:13px;color:var(--t3);padding:12px 0">No reports sent yet.</div>';
}

// ══ BACKUP AND RESTORE ══
// backupAllData consolidated below


// doHandover consolidated below


// generateHandoverReport consolidated below


function populateHandoverDropdowns() {
  const emps = DB.get('employees', []);
  ['handover-from', 'handover-to'].forEach(id => {
    const sel = document.getElementById(id); if (!sel) return;
    sel.innerHTML = '<option value="">Select officer</option>';
    emps.filter(e => e.role === 'Officer' || e.role === 'ASM').forEach(e => {
      const o = document.createElement('option'); o.value = e.name; o.textContent = e.name + ' (' + e.territory + ')'; sel.appendChild(o);
    });
  });
}

// ══ DATA EXPORT ══
function exportData() {
  // Show proper export modal
  const existing = document.getElementById('export-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'export-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `
    <div style="background:var(--w);border-radius:16px;padding:24px;width:100%;max-width:320px">
      <div style="font-size:15px;font-weight:700;margin-bottom:16px">Export data</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${[['Orders','📋'],['Attendance','🗓️'],['Expenses','💸'],['Stores','🏪'],['Distributors','🚚'],['Institutions','🏥']].map(([label,icon]) => `
          <button onclick="exportCSV('${label}');document.getElementById('export-modal').remove()"
            style="display:flex;align-items:center;gap:12px;padding:12px 16px;border:1.5px solid var(--bd);border-radius:10px;background:var(--w);font-size:14px;cursor:pointer;text-align:left">
            <span style="font-size:20px">${icon}</span>
            <div>
              <div style="font-weight:600">${label}</div>
              <div style="font-size:11px;color:var(--t2)">Download as CSV</div>
            </div>
          </button>`).join('')}
      </div>
      <button onclick="document.getElementById('export-modal').remove()" 
        style="width:100%;margin-top:12px;padding:10px;border:none;border-radius:10px;background:var(--bg);font-size:14px;cursor:pointer">Cancel</button>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
}

function exportCSV(type) {
  let data, filename;
  const now = new Date().toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'}).replace(/\//g,'-');
  if (type === 'Orders') {
    data = DB.get('orders', []);
    filename = 'Orders_' + now + '.csv';
    if (!data.length) { toast('No orders to export'); return; }
    const rows = [['Order ID','Date','Time','Officer','Store','City','Distributor','Territory','Items','Grand Total','GST']];
    data.forEach(o => rows.push([o.id,o.date,o.time,o.officer,o.store,o.storeCity,o.distributor,o.territory,(o.items||[]).map(i=>i.name+'x'+i.qty).join(';'),o.grand,o.gst]));
    downloadCSV(rows, filename);
  } else if (type === 'Attendance') {
    data = DB.get('attendance', []);
    filename = 'Attendance_' + now + '.csv';
    if (!data.length) { toast('No attendance to export'); return; }
    const rows = [['Date','Officer','Action','Time','Travel Type','Territory']];
    data.forEach(a => rows.push([a.date,a.officer,a.action,a.time,a.travelType||'',a.territory||'']));
    downloadCSV(rows, filename);
  } else if (type === 'Expenses') {
    data = DB.get('expenses', []);
    filename = 'Expenses_' + now + '.csv';
    if (!data.length) { toast('No expenses to export'); return; }
    const rows = [['Date','Officer','Type','Base Fare','Extra','Total','Territory']];
    data.forEach(e => rows.push([e.date,e.officer,e.type,e.baseFare||0,e.extra||0,e.total||0,e.territory||'']));
    downloadCSV(rows, filename);
  } else if (type === 'Stores') {
    data = DB.get('stores', []);
    filename = 'Stores_' + now + '.csv';
    if (!data.length) { toast('No stores to export'); return; }
    const rows = [['Store ID','Name','Address','City','Territory','Contact','Mobile','GSTIN','Margin']];
    data.forEach(s => rows.push([s.id,s.name,s.address,s.city,s.territory,s.contact,s.mobile,s.gstin,s.margin]));
    downloadCSV(rows, filename);
  } else if (type === 'Distributors') {
    data = DB.get('dists', []);
    filename = 'Distributors_' + now + '.csv';
    if (!data.length) { toast('No distributors to export'); return; }
    const rows = [['ID','Name','Type','Pattern','Territory','City','Mobile','GSTIN']];
    data.forEach(d => rows.push([d.id,d.name,d.type,d.pattern,d.territory,d.city,d.mobile,d.gstin]));
    downloadCSV(rows, filename);
  } else if (type === 'Institutions') {
    data = DB.get('insts', []);
    filename = 'Institutions_' + now + '.csv';
    if (!data.length) { toast('No institutions to export'); return; }
    const rows = [['ID','Name','Type','City','Territory','Contact','Mobile']];
    data.forEach(i => rows.push([i.id,i.name,i.type,i.city,i.territory,i.contact,i.mobile]));
    downloadCSV(rows, filename);
  }
}

function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => '"'+String(c||'').replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
  toast(filename + ' downloaded ✅');
}


function checkAppVersion() {
  if (!SCRIPT_URL) return;
  fetch(gasGetUrl(SCRIPT_URL+'?action=getVersion')).then(r => r.json()).then(d => {
    if (d.version && d.version !== APP_VERSION) {
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#185FA5;color:#fff;padding:10px 16px;font-size:13px;font-weight:500;z-index:999;text-align:center;cursor:pointer';
      banner.textContent = '🔄 New version available — tap to refresh';
      banner.onclick = () => window.location.reload(true);
      document.body.prepend(banner);
    }
    // Show version in footer
    const footer = document.getElementById('app-version');
    if (footer) footer.textContent = 'v' + APP_VERSION;
  }).catch(() => {});
}

// ══ NEW STORE GM ALERT — disabled ══
function alertGMNewStore(store) { /* alert removed */ }
function checkDuplicateStore(name, territory) {
  const stores = getStores();
  const q = name.toLowerCase().trim();
  return stores.find(s => s.name.toLowerCase().includes(q.slice(0, 5)) && s.territory === territory);
}

// ══ STORE RANKING ══
function getStoreRanking(territory) {
  const orders = getOrders().filter(o => !o.cancelled && (!territory || o.storeTerritory === territory));
  const storeMap = {};
  orders.forEach(o => {
    if (!storeMap[o.store]) storeMap[o.store] = { name: o.store, city: o.storeCity, territory: o.storeTerritory, value: 0, orders: 0 };
    storeMap[o.store].value += o.grand;
    storeMap[o.store].orders += 1;
  });
  return Object.values(storeMap).sort((a, b) => b.value - a.value).slice(0, 10);
}

// ══ OFFICER SCORECARD ══
// generateScorecard consolidated below


// ══ VISIT NOTES FOR ASM ══
function getVisitNotes(storeName) {
  const orders = getOrders().filter(o => o.store === storeName && o.notes).slice(0, 5);
  return orders.map(o => ({ date: o.date, officer: o.officer, note: o.notes }));
}

// Patch saveNewStore to check duplicates and alert GM
const _origSaveNewStore = saveNewStore;
saveNewStore = function() {
  const name = document.getElementById('ns-name')?.value.trim();
  const territory = document.getElementById('ns-territory')?.value;
  const dup = checkDuplicateStore(name, territory);
  if (dup) {
    showModal({icon:'⚠️', title:'Similar store exists', body:`A similar store "<b>${dup.name}</b>" already exists in ${territory}. Add anyway?`, confirmText:'Add Anyway', confirmClass:'var(--amber,#EF9F27)', onConfirm(){ _origSaveNewStore(); const store = getStores().find(s => s.name === name); if (store) setTimeout(() => alertGMNewStore(store), 1000); }});
    return;
  }
  _origSaveNewStore();
  // Alert GM after store saved
  const store = getStores().find(s => s.name === name);
  if (store) setTimeout(() => alertGMNewStore(store), 1000);
};

// ══ PATCH LAUNCH APP ══


// ══ PATCH SWITCH TAB ══
const _origSwitchTab = switchTab;
switchTab = function(name) {
  _origSwitchTab(name);
  if (name === 'orders') renderOrders();
  if (name === 'admin-targets') renderTargetEmpList();
  if (name === 'admin-expenses-config') loadExpConfig();
  if (name === 'admin-broadcast') { renderBroadcastList(); }
  if (name === 'admin-mis') renderMISLog();
  if (name === 'admin-backup') populateHandoverDropdowns();
  if (name === 'day') renderExpHistory();
};

// Patch setupNavForRole to add admin sub-tabs
const _origSetupNav = setupNavForRole;
setupNavForRole = function(role) {
  _origSetupNav(role);
  // Add invoice tab to nav for officer too
  const nav = document.getElementById('bot-nav');
  if (!nav) return;
  // Check if invoice button exists
  if (!document.getElementById('bn-invoice')) {
    const b = document.createElement('button');
    b.className = 'bnav'; b.id = 'bn-invoice';
    b.innerHTML = '<span class="bi">🧾</span>Invoice';
    b.onclick = () => switchTab('invoice');
    // Insert before master/admin
    const master = document.getElementById('bn-master') || document.getElementById('bn-admin');
    if (master) nav.insertBefore(b, master);
    else nav.appendChild(b);
  }
};

// ══ ALERT RECIPIENTS MANAGEMENT ══

// ══ CENTRAL ALERT EMAIL SENDER ══
const DEFAULT_ALERT_EMAILS = 'info@diabliss.com,ramesh@diabliss.com';

function sendAlertEmail(subject, htmlBody) {
  if (!SCRIPT_URL) return;
  const officerEmail = CU?.alertEmail || '';
  // Combine default + officer specific emails, remove duplicates
  const all = [DEFAULT_ALERT_EMAILS, officerEmail].filter(Boolean).join(',');
  const unique = [...new Set(all.split(',').map(e=>e.trim().toLowerCase()).filter(e=>e.includes('@')))].join(',');
  if (!unique) return;
  fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'sendAlertEmail', recipients: unique, subject, htmlBody })
  }).catch(() => {});
}

function buildAlertEmailTemplate(title, color, rows, footer) {
  const rowsHtml = rows.map(([label, value]) =>
    `<tr><td style="padding:6px 0;color:#666;width:140px;font-size:13px">${label}</td><td style="padding:6px 0;font-size:13px;font-weight:500">${value||'—'}</td></tr>`
  ).join('');
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
    <div style="background:${color};color:#fff;padding:14px 18px;border-radius:6px 6px 0 0">
      <div style="font-size:15px;font-weight:700">${title}</div>
      <div style="font-size:12px;opacity:0.85;margin-top:3px">Automated alert — Diabliss Sales App</div>
    </div>
    <div style="background:#f9f9f9;padding:16px 18px;border:1px solid #eee;border-top:none;border-radius:0 0 6px 6px">
      <table style="width:100%;border-collapse:collapse">${rowsHtml}</table>
      ${footer ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#555">${footer}</div>` : ''}
      <div style="margin-top:10px;font-size:11px;color:#aaa">This is an automated notification from Diabliss Sales App.</div>
    </div>
  </div>`;
}

// ══ PATCH: SPECIAL PRICE ALERT — add email ══
const _origGmAlert = gmAlert;
gmAlert = function(type, order) {
  _origGmAlert(type, order);
  // Also send email
  if (type === 'special') {
    const items = order.items.filter(i => i.isSpecial).map(i =>
      `${i.name} ×${i.qty} @ ₹${i.price} (MRP ₹${i.mrp})`).join('<br>');
    const html = buildAlertEmailTemplate(
      '⚠️ Special Price Alert — Order #' + order.id, '#EF9F27',
      [
        ['Officer', order.officer + ' (' + order.officerRole + ')'],
        ['Territory', order.territory || ''],
        ['Store', order.store + (order.storeCity ? ', ' + order.storeCity : '')],
        ['Distributor', order.distributor || ''],
        ['Products', items],
        ['Order total', '₹' + order.grand.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})],
        ['Date / Time', order.date + ' ' + order.time],
      ],
      'Please review and approve if applicable.'
    );
    sendAlertEmail('Special Price Alert — ' + order.officer + ' — Order #' + order.id, html);
  } else if (type === 'unsaleable') {
    const prods = allProds();
    const items = Object.entries(order.unsaleable || {})
      .filter(([,q]) => q > 0)
      .map(([id,q]) => { const p = prods.find(x=>x.id===id); return p ? p.name + ': ' + q + ' units' : ''; })
      .filter(Boolean).join('<br>');
    const html = buildAlertEmailTemplate(
      '⚠️ Unsaleable Stock Alert — Order #' + order.id, '#E24B4A',
      [
        ['Officer', order.officer + ' (' + order.officerRole + ')'],
        ['Territory', order.territory || ''],
        ['Store', order.store + (order.storeCity ? ', ' + order.storeCity : '')],
        ['Products', items],
        ['Date / Time', order.date + ' ' + order.time],
      ],
      'Please arrange for pickup or replacement.'
    );
    sendAlertEmail('Unsaleable Stock Alert — ' + order.officer + ' — ' + order.store, html);
  }
};

// ══ PATCH: NEW STORE ALERT — REMOVED v1.7.71 ══

// ══ PATCH: LEAVE ALERT — add to central recipients too ══
const _origMarkLeave = markLeave;
// Already patched above — just ensure central recipients also get leave email
// Override sendLeaveEmail call to include central recipients
const _origSendLeave = window.markLeave;

// ══ FEATURE 2 & 3: OFFLINE INDICATOR + SYNC STATUS ══

function updateConnectivityStatus() {
  const offlineBanner = document.getElementById('offline-banner');
  const syncBanner    = document.getElementById('sync-banner');
  const isOnline      = navigator.onLine;

  if (offlineBanner) {
    offlineBanner.style.display = isOnline ? 'none' : 'flex';
  }

  // Count pending orders (not yet synced)
  const pending = getOrders().filter(o => !o.synced && !o.cancelled).length;
  if (syncBanner) {
    if (pending > 0 && isOnline) {
      syncBanner.style.display = 'block';
      document.getElementById('sync-count-text').textContent =
        pending + ' order' + (pending > 1 ? 's' : '') + ' pending sync — tap to sync now';
    } else {
      syncBanner.style.display = 'none';
    }
  }
}

function syncPendingOrders() {
  if (!SCRIPT_URL || !navigator.onLine) { toast('No internet connection'); return; }
  const pending = getOrders().filter(o => !o.synced && !o.cancelled);
  if (!pending.length) { toast('All orders synced'); return; }
  toast('Syncing ' + pending.length + ' orders...');
  let synced = 0;
  pending.forEach(order => {
    const prods = allProds();
    const payload = {
      ...order, action: 'order',
      products: order.items.map(i => `${i.name}×${i.qty}@₹${i.price}`).join(', '),
      auditSummary: Object.entries(order.audit||{}).map(([id,q])=>{const p=prods.find(x=>x.id===id);return p&&q>0?p.name+':'+q:null;}).filter(Boolean).join(', '),
      subtotal: order.sub, gst: order.gst, total: order.grand
    };
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) })
      .then(() => {
        const all = getOrders();
        const idx = all.findIndex(o => o.id === order.id);
        if (idx !== -1) { all[idx].synced = true; DB.set('orders', all); }
        synced++;
        if (synced === pending.length) { toast('All orders synced ✅'); updateConnectivityStatus(); }
      }).catch(() => {});
  });
}

// Listen for online/offline events
window.addEventListener('online',  () => { updateConnectivityStatus(); toast('Back online — syncing...'); syncPendingOrders(); });
window.addEventListener('offline', () => { updateConnectivityStatus(); toast('No internet — working offline'); });

// ══ FEATURE 1: ERROR LOGGING ══
const _errorLog = [];
const _origConsoleError = console.error;
console.error = function(...args) {
  _origConsoleError.apply(console, args);
  _errorLog.unshift({ ts: new Date().toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata'}), msg: args.join(' ') });
  if (_errorLog.length > 10) _errorLog.pop();
  DB.set('error_log', _errorLog);
};

window.addEventListener('unhandledrejection', e => {
  const msg = e.reason?.message || String(e.reason);
  _errorLog.unshift({ ts: new Date().toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata'}), msg: 'Unhandled: ' + msg });
  if (_errorLog.length > 10) _errorLog.pop();
  DB.set('error_log', _errorLog);
});

function renderErrorLog() {
  const logs = DB.get('error_log', []);
  const tab = document.getElementById('tab-admin');
  if (!tab) return;
  let el = document.getElementById('error-log-section');
  if (!el) {
    el = document.createElement('div');
    el.id = 'error-log-section';
    tab.appendChild(el);
  }
  if (!logs.length) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="slabel">Error log (last 10)</div>
    <div class="card">
      ${logs.map(l => `<div style="padding:6px 0;border-bottom:0.5px solid var(--bd);font-size:11px"><span style="color:var(--t3)">${l.ts}</span> <span style="color:var(--r)">${l.msg}</span></div>`).join('')}
      <button class="btn-out btn-sm" onclick="DB.set('error_log',[]);renderErrorLog();toast('Log cleared')" style="margin-top:8px;font-size:11px">Clear log</button>
    </div>`;
}

// ══ FEATURE 4: STORE VISIT HISTORY ══
function showStoreVisitHistory(storeName) {
  const el = document.getElementById('store-visit-history');
  const list = document.getElementById('store-visit-history-list');
  if (!el || !list) return;
  const visits = getOrders()
    .filter(o => o.store === storeName && !o.cancelled)
    .slice(0, 3);
  if (!visits.length) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  list.innerHTML = visits.map(v => `
    <div style="background:var(--w);border:1px solid var(--bd);border-radius:var(--rads);padding:9px 12px;margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <div style="font-size:12px;font-weight:600">${v.date} · ${v.time}</div>
        <div style="font-size:12px;font-weight:600;color:var(--gd)">₹${v.grand.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</div>
      </div>
      <div style="font-size:11px;color:var(--t2)">By: ${v.officer} · ${(v.items||[]).length} products · ${v.distributor||''}</div>
    </div>`).join('');
}

// Patch selectStore to show visit history
const _origSelectStore = selectStore;
selectStore = function(store) {
  _origSelectStore(store);
  showStoreVisitHistory(store.name);
};

// ══ FEATURE 5: QUICK REORDER ══
function checkQuickReorder(storeName) {
  const lastOrder = getOrders()
    .filter(o => o.store === storeName && !o.cancelled && o.items && o.items.length)
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))[0];
  const sec = document.getElementById('quick-reorder-section');
  const info = document.getElementById('quick-reorder-info');
  if (!sec || !info) return;
  if (!lastOrder) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  info.textContent = lastOrder.date + ' · ' + lastOrder.items.length + ' products · ₹' + lastOrder.grand.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
  window._lastOrderForStore = lastOrder;
}

function applyQuickReorder() {
  const lastOrder = window._lastOrderForStore;
  if (!lastOrder || !lastOrder.items) { toast('No previous order found'); return; }
  // Pre-fill order products
  orderProds = [];
  VS.order = {};
  SP = {};
  lastOrder.items.forEach(item => {
    const p = allProds().find(x => x.name === item.name);
    if (p) {
      orderProds.push(p);
      VS.order[p.id] = item.qty;
      if (item.isSpecial) SP[p.id] = item.price;
    }
  });
  renderOrderList();
  updateOrderTotal();
  document.getElementById('quick-reorder-section').style.display = 'none';
  toast('Last order loaded — modify quantities if needed');
}

// Patch goStep3 to check quick reorder
const _origGoStep3 = goStep3;
goStep3 = function() {
  _origGoStep3();
  if (VS.store) checkQuickReorder(VS.store.name);
};

// ══ FEATURE 7: DAILY ATTENDANCE SUMMARY FOR ASM ══
function renderASMAttendanceSummary() {
  const role = CU?.role || 'Officer';
  if (!['ASM', 'RSM', 'GM', 'Admin'].includes(role)) return;
  const now = new Date();
  const hour = now.getHours();
  if (hour < 19) return; // Only show after 7 PM
  const today = todayKey();
  const emps = DB.get('employees', []).filter(e => e.role === 'Officer');
  if (!emps.length) return;
  const existing = document.getElementById('asm-attendance-summary');
  if (existing) return;
  const tab = document.getElementById('tab-home');
  if (!tab) return;
  const started = emps.filter(e => DB.get('day_' + today + '_' + e.mobile, null)?.started).length;
  const ended   = emps.filter(e => DB.get('day_' + today + '_' + e.mobile, null)?.ended).length;
  const pending = emps.length - ended;
  if (pending <= 0) return;
  // Check if this ASM accompanied an officer today
  const myDayRec = DB.get('day_'+today, null);
  const accompanyNote = myDayRec?.accompanyingName
    ? `<div style="font-size:12px;color:var(--a);margin-top:4px">📍 You accompanied ${myDayRec.accompanyingName} today</div>`
    : '';
  const div = document.createElement('div');
  div.id = 'asm-attendance-summary';
  div.style.cssText = 'background:var(--al);border:1px solid #ffc107;border-radius:var(--rad);padding:12px 13px;margin-bottom:12px';
  div.innerHTML = `
    <div style="font-size:13px;font-weight:600;color:var(--a);margin-bottom:4px">📋 End of day status</div>
    <div style="font-size:12px;color:var(--a)">${ended} of ${emps.length} officers ended their day · ${pending} pending</div>
    ${accompanyNote}`;
  const firstChild = tab.firstElementChild;
  if (firstChild) tab.insertBefore(div, firstChild);
}

// ══ FEATURE 8: ATTENDANCE EXPORT ══
// exportAttendanceReport consolidated below


// ══ PATCH LAUNCH APP ══


// (synced flag now set in fetch .then() inside base submitOrder)

// Add attendance export button to admin panel
const _origRenderAdminPanel = renderAdminPanel;
renderAdminPanel = function() {
  _origRenderAdminPanel();
  // att-export-btn is now in static HTML — no dynamic injection needed
  renderErrorLog();
};

// ══ CORRECTIONS MODULE ══

