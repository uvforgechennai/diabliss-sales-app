const GEMINI_API_KEY="AQ.Ab8RN6K-NdAo0l0n61jidWGwG-PboMhq3SIEvL0bUi4jegqU0Q";function myOrders(){return fieldOrders().filter(e=>e.officerMobile&&e.officerMobile===CU?.mobile||e.officer===CU?.name)}function checkNoOrderAlertOnEndDay(){}function checkAutoNoOrderAlert(){}function scheduleNotificationChecks(){setTimeout(()=>{"function"==typeof checkStartDayReminder&&checkStartDayReminder(),"function"==typeof checkEndDayReminder&&checkEndDayReminder()},5e3)}function getOrderAddressLine(e){return e.location?e.location.address?"📍 "+e.location.address.split(",").slice(0,2).join(", "):e.location.lat&&e.location.lng?"📍 "+e.location.lat+", "+e.location.lng:"":""}function openDayRouteMap(){const e=todayKey(),t=myOrders().filter(t=>!t.cancelled&&t.ts&&tsToISTDate(t.ts)===e&&t.location?.lat).sort((e,t)=>new Date(e.ts)-new Date(t.ts));if(!t.length)return void toast("No location data for today's orders");if(1===t.length)return void window.open("https://maps.google.com/?q="+t[0].location.lat+","+t[0].location.lng,"_blank");const n=t[0].location.lat+","+t[0].location.lng,o=t[t.length-1].location.lat+","+t[t.length-1].location.lng,i=t.slice(1,-1).map(e=>e.location.lat+","+e.location.lng).join("|");let a="https://www.google.com/maps/dir/?api=1&origin="+n+"&destination="+o;i&&(a+="&waypoints="+encodeURIComponent(i)),window.open(a,"_blank")}function getDelayedGPSOrders(){return getOrders().filter(e=>{if(!e.location?.capturedAt||!e.ts)return!1;return(new Date(e.location.capturedAt)-new Date(e.ts))/6e4>30})}function addRouteMapButton(){const e=document.getElementById("route-map-btn");e&&e.remove();const t=CU?.role||"Officer";if(!["Officer","ASM","RSM"].includes(t))return;const n=document.getElementById("tab-home");if(!n)return;const o=document.createElement("button");o.id="route-map-btn",o.className="btn-out",o.style.cssText="width:100%;margin-bottom:10px;font-size:13px",o.innerHTML="🗺️ View today's route map",o.onclick=openDayRouteMap;const i=document.getElementById("day-banner");i?n.insertBefore(o,i.nextSibling):n.appendChild(o)}function quickReorder(){const e=myOrders().filter(e=>!e.cancelled).sort((e,t)=>new Date(t.ts)-new Date(e.ts));if(!e.length)return void toast("No previous orders found");const t=e[0];if(t.items&&t.items.length){if(VS=newVS(),VS.visitType="order",t.store){const e=getStores().find(e=>e.name===t.store);e&&(VS.store=e)}t.items.forEach(e=>{e.id&&e.qty&&(VS.order[e.id]=e.qty)}),switchTab("visit"),setTimeout(()=>{"function"==typeof goStep&&goStep(t.store?2:1),toast("Quick reorder loaded — check and submit 🚀")},300)}else toast("No items found in last order")}function getStoreHealthScore(e){const t=getOrders().filter(t=>t.store===e&&!t.cancelled);if(!t.length)return{score:0,label:"No visits",color:"var(--t3)"};const n=new Date,o=new Date(n);o.setDate(n.getDate()-30);const i=t.filter(e=>e.ts&&new Date(e.ts)>=o),a=t.reduce((e,t)=>e+(t.grand||0),0)/t.length,r=Math.min(100,20*i.length+Math.min(50,a/200)),s=r>=70?"Healthy":r>=40?"Moderate":"At risk",d=r>=70?"var(--g)":r>=40?"#EF9F27":"var(--r)";return{score:Math.round(r),label:s,color:d}}function updateVisitStreak(){const e=todayKey();myOrders().filter(t=>!t.cancelled&&t.ts&&tsToISTDate(t.ts)===e).length>0&&DB.set("visit_streak_"+e,!0),renderStreakPill()}function _getStreakCount(){let e=0;const t=new Date(istNow());for(let n=0;n<60;n++){const n="visit_streak_"+t.toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"});if(!DB.get(n,!1))break;e++,t.setDate(t.getDate()-1)}return e}function renderStreakPill(){const e=CU?.role||"Officer";if(!["Officer","ASM","RSM"].includes(e))return;const t=document.getElementById("streak-pill-card");t&&t.remove();const n=_getStreakCount(),o=document.getElementById("tab-home"),i=document.getElementById("day-banner");if(!o||!i)return;const a=document.createElement("div");if(a.id="streak-pill-card",n>=2){const e=n>=7?"🔥🔥":"🔥",t=n>=14?`${e} ${n}-day streak — unstoppable!`:n>=7?`${e} ${n}-day streak — you're on fire!`:n>=3?`🔥 ${n}-day streak — keep it going!`:`🔥 ${n} days in a row — building momentum!`;a.className="streak-pill",a.innerHTML=`<span style="font-size:18px">${n>=7?"🔥":"⚡"}</span><span>${t}</span>`}else a.className="streak-pill cold",a.innerHTML='<span style="font-size:16px">⚡</span><span>Start your streak today — visit a store!</span>';i.insertAdjacentElement("afterend",a)}function getProductSpotlight(){return DB.get("product_spotlight",null)}function setProductSpotlight(e,t){const n={productName:e,message:t,setBy:CU?.name,setAt:(new Date).toISOString(),weekKey:todayKey().slice(0,7)};DB.set("product_spotlight",n),SCRIPT_URL&&fetch(SCRIPT_URL,{method:"POST",body:gasPayload({...n,action:"saveSpotlight"})}).catch(()=>{}),toast("Product spotlight set ✅")}function renderProductSpotlight(){const e=getProductSpotlight();if(!e)return;const t=todayKey().slice(0,7);if(e.weekKey!==t)return;const n=document.getElementById("product-spotlight-card");n&&n.remove();const o=document.createElement("div");o.id="product-spotlight-card",o.style.cssText="background:linear-gradient(135deg,#F39C12,#EF9F27);border-radius:var(--rad);padding:12px 14px;margin-bottom:12px;color:#fff",o.innerHTML=`\n    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;opacity:0.9;margin-bottom:3px">⭐ Product spotlight this week</div>\n    <div style="font-size:14px;font-weight:700;margin-bottom:2px">${e.productName}</div>\n    <div style="font-size:12px;opacity:0.9">${e.message||"Push this product in every visit!"}</div>`;const i=document.getElementById("tab-home"),a=document.getElementById("role-home-block");i&&a?i.insertBefore(o,a.nextSibling):i&&i.appendChild(o)}function checkStoreVisitGaps(){const e=CU?.role||"Officer";if(!["Officer"].includes(e)){const e=document.getElementById("store-gap-card");return void(e&&e.remove())}const t=myOrders().filter(e=>!e.cancelled),n=new Set(t.map(e=>e.store).filter(Boolean)),o=getStores().filter(e=>n.has(e.name)),i=new Date,a=new Date(i);a.setDate(i.getDate()-30);const r=o.filter(e=>{const n=t.filter(t=>t.store===e.name&&t.ts).sort((e,t)=>new Date(t.ts)-new Date(e.ts))[0];return!n||new Date(n.ts)<a});if(!r.length)return;const s=document.getElementById("store-gap-card");s&&s.remove();const d=document.createElement("div");d.id="store-gap-card",d.style.cssText="background:var(--al);border:1px solid #ffc107;border-radius:var(--rad);padding:10px 14px;margin-bottom:10px",d.innerHTML=`\n    <div style="font-size:12px;font-weight:700;color:var(--a);margin-bottom:4px">⚠️ ${r.length} store${r.length>1?"s":""} not visited in 30+ days</div>\n    <div style="font-size:11px;color:var(--a)">${r.slice(0,3).map(e=>e.name).join(", ")}${r.length>3?" +"+(r.length-3)+" more":""}</div>`;const l=document.getElementById("tab-home"),c=document.getElementById("role-home-block");l&&c?l.insertBefore(d,c.nextSibling):l&&l.appendChild(d)}function sendDailyDigest(){}function checkOrderGapAlerts(e){}function renderAttendanceCalendar(){const e=new Date,t=istNow(),n=t.getFullYear(),o=t.getMonth(),i=new Date(n,o,1).getDay(),a=new Date(n,o+1,0).getDate(),r=myOrders().filter(e=>!e.cancelled),s=e.toLocaleDateString("en-IN",{month:"long",year:"numeric",timeZone:"Asia/Kolkata"});let d='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:4px">';["S","M","T","W","T","F","S"].forEach(e=>{d+=`<div style="text-align:center;font-size:10px;font-weight:700;color:var(--t3);padding:3px">${e}</div>`}),d+='</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">';for(let e=0;e<i;e++)d+="<div></div>";for(let e=1;e<=a;e++){const t=n+"-"+String(o+1).padStart(2,"0")+"-"+String(e).padStart(2,"0"),i=0===new Date(n,o,e).getDay(),a=isHoliday(t,CU?.territory||""),s=DB.get("day_"+t,null),l=r.some(e=>e.ts&&tsToISTDate(e.ts)===t),c=t>todayKey();let p="var(--bg)",u="var(--t2)";i||a?(p="#f0f0f0",u="var(--t3)"):c?(p="var(--bg)",u="var(--t3)"):l||s?.started?(p="#d4edda",u="#155724"):"leave"===s?.type?(p="#fff3cd",u="#856404"):(p="#f8d7da",u="#721c24"),d+=`<div style="background:${p};color:${u};border-radius:4px;padding:5px 2px;text-align:center;font-size:11px;font-weight:600">${e}</div>`}return d+="</div>",`<div style="margin-top:12px">\n    <div class="slabel">${s} — Attendance</div>\n    <div style="background:var(--w);border:1px solid var(--bd);border-radius:var(--rad);padding:12px">${d}\n    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;font-size:10px">\n      <span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;border-radius:2px;background:#d4edda;display:inline-block"></span>Active</span>\n      <span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;border-radius:2px;background:#f8d7da;display:inline-block"></span>Missed</span>\n      <span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;border-radius:2px;background:#fff3cd;display:inline-block"></span>Leave</span>\n      <span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;border-radius:2px;background:#f0f0f0;display:inline-block"></span>Holiday/Sun</span>\n    </div>\n    </div></div>`}function submitExpenseForApproval(e){const t=DB.get("expenses_pending",[]),n=t.findIndex(t=>t.id===e);if(-1===n)return void toast("Expense not found");t[n].status="submitted",t[n].submittedAt=(new Date).toISOString(),DB.set("expenses_pending",t);const o=DB.get("employees",[]),i=o.find(e=>e.mobile===CU?.mobile),a=i?.reportsTo,r=a?o.find(e=>e.mobile===a):null,s=r?.alertEmail||r?.personalEmail||"";toast("Expense submitted for approval ✅")}function approveExpense(e,t){const n=CU?.role||"";if(!["ASM","RSM","GM","Admin","Sub-Admin"].includes(n))return void toast("Not permitted");SCRIPT_URL&&fetch(SCRIPT_URL,{method:"POST",body:gasPayload({action:"approveExpense",expId:e,officerMobile:t,approvedBy:CU?.name,approvedAt:(new Date).toISOString()})}).then(()=>toast("Expense approved ✅")).catch(()=>toast("Could not reach server"));const o=DB.get("employees",[]).find(e=>e.mobile===t),i=o?.alertEmail||o?.personalEmail||"";}function rejectExpense(e,t,n){const o=CU?.role||"";if(!["ASM","RSM","GM","Admin","Sub-Admin"].includes(o))return void toast("Not permitted");SCRIPT_URL&&fetch(SCRIPT_URL,{method:"POST",body:gasPayload({action:"rejectExpense",expId:e,officerMobile:t,rejectedBy:CU?.name,reason:n,rejectedAt:(new Date).toISOString()})}).then(()=>toast("Expense rejected")).catch(()=>{});const i=DB.get("employees",[]).find(e=>e.mobile===t),a=i?.alertEmail||i?.personalEmail||"";}function filterEmployeeList(e){const t=(e||"").toLowerCase().trim();document.querySelectorAll(".emp-card").forEach(e=>{const n=e.textContent.toLowerCase();e.style.display=!t||n.includes(t)?"":"none"})}function renderBeatPlanTab(){const e=document.getElementById("tab-beat-plan");e&&(e.innerHTML='\n    <div class="slabel">Beat Plan</div>\n    <div style="background:var(--al);border:1px solid #ffc107;border-radius:var(--rad);padding:16px;margin-bottom:14px;text-align:center">\n      <div style="font-size:32px;margin-bottom:8px">🗓️</div>\n      <div style="font-size:14px;font-weight:700;color:var(--a);margin-bottom:6px">Beat plan — coming soon</div>\n      <div style="font-size:12px;color:var(--a)">Plan your weekly store visit routes.<br>Admin sets the beat, officers follow it.<br>Track planned vs actual visits.</div>\n    </div>\n    <div class="slabel">Upcoming visits (sample)</div>\n    <div style="font-size:12px;color:var(--t2);padding:10px 0">Beat plan feature will appear here once configured by Admin.</div>')}async function getSmartOrderSuggestions(e){if(!e)return;const t=getOrders().filter(t=>t.store===e&&!t.cancelled).sort((e,t)=>new Date(t.ts)-new Date(e.ts)).slice(0,10),n={};t.forEach(e=>{(e.items||[]).forEach(e=>{n[e.name]||(n[e.name]={qty:0,orders:0}),n[e.name].qty+=e.qty||0,n[e.name].orders+=1})});const o=["Sugar 40×5g Sachet","Sugar 500g","Sugar 1kg","Sugar 1.75kg","Sugar 5kg","Sugar 10kg","Jaggery 500g","Jaggery 750g","Jaggery 1.25kg","Jaggery 5kg","Lemon Tea 10×10g","Lemon Tea 30×10g","Lemon Tea 500g","Combo Tea 30×10g","Ginger Tea 10×10g","Masala Chai 10×10g","Millet Cookies 120g","Millet Cookies Moringa 120g","Millet Cookies Chia 120g","Mixed Fruit Jam 225g","Guava Jam 225g","Pineapple Ginger Jam 225g"];let i,a=[];if(t.length){const e=Object.keys(n);a=o.filter(t=>!e.some(e=>e.toLowerCase().includes(t.toLowerCase().split(" ")[0])&&e.toLowerCase().includes(t.toLowerCase().split(" ")[1]||"")));i=`Last order: ${t[0]?.ts?tsToISTDate(t[0].ts):"unknown"}\nProducts ordered (last 10 orders):\n`+Object.entries(n).map(([e,t])=>`- ${e}: ${t.orders} order(s), total qty ${t.qty}`).join("\n"),a.length&&(i+="\n\nProducts NEVER ordered from this store:\n"+a.map(e=>`- ${e}`).join("\n"))}else i="No order history found for this store. This may be a new store.";const r=`You are a field sales assistant for Diabliss, a brand selling low-GI herbal food products in India.\n\nStore: ${e}\n${i}\n\nBased ONLY on the order history above, give 3-4 specific, actionable suggestions for today's visit. Focus on:\n1. Products with high repeat orders — suggest reorder qty based on their pattern\n2. Products never ordered — suggest one to introduce with a reason\n3. If no history, suggest starter pack for a new store\n\nRules:\n- Be specific with product names and quantities\n- Do NOT mention products not in the Diabliss range\n- Keep each point to one line\n- No marketing language, just practical field sales advice`,s=document.getElementById("ai-suggestions-card");s&&s.remove();const d=document.createElement("div");if(d.id="ai-suggestions-card",d.style.cssText="background:linear-gradient(135deg,#f0f8ff,#e8f4fd);border:1px solid #159ADB;border-radius:var(--rad);padding:12px 14px;margin-bottom:12px",!document.getElementById("ai-pulse-style")){const e=document.createElement("style");e.id="ai-pulse-style",e.textContent="@keyframes aiPulse{0%,100%{opacity:0.2;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}",document.head.appendChild(e)}d.innerHTML='<div style="font-size:12px;font-weight:700;color:#159ADB;margin-bottom:8px">🤖 AI order suggestions</div><div style="display:flex;align-items:center;gap:8px"><div style="display:flex;gap:4px"><span style="width:7px;height:7px;border-radius:50%;background:#159ADB;display:inline-block;animation:aiPulse 1.2s ease-in-out infinite"></span><span style="width:7px;height:7px;border-radius:50%;background:#159ADB;display:inline-block;animation:aiPulse 1.2s ease-in-out 0.4s infinite"></span><span style="width:7px;height:7px;border-radius:50%;background:#159ADB;display:inline-block;animation:aiPulse 1.2s ease-in-out 0.8s infinite"></span></div><span style="font-size:12px;color:var(--t2)">Analysing order history…</span></div>';const l=document.getElementById("order-list"),c=document.getElementById("store-selected"),p=l&&l.offsetParent?l:c;if(p)p.insertBefore(d,p.firstChild);else{const e=document.getElementById("tab-home");e&&e.prepend(d)}try{const _res=await fetch(SCRIPT_URL,{method:"POST",body:gasPayload({action:"handleChatbot",prompt:r})}),o=await _res.json(),i=(o?.result||o?.choices?.[0]?.message?.content||"Could not get suggestions.").replace(/\*\*(.*?)\*\*/g,"<b>$1</b>").replace(/\*(.*?)\*/g,"$1").replace(/^[-•*]\s+(.+)$/gm,'<div style="display:flex;gap:6px;margin-bottom:4px"><span>•</span><span>$1</span></div>').replace(/\n\n/g,"<br>");d.innerHTML=`<div style="font-size:12px;font-weight:700;color:#159ADB;margin-bottom:6px">🤖 AI order suggestions for ${e}</div><div style="font-size:12px;color:var(--t1);line-height:1.6">${i}</div>`}catch(e){d.innerHTML='<div style="font-size:12px;color:var(--t2)">🤖 AI suggestions unavailable right now.</div>'}}async function generateVisitSummary(){const e=todayKey(),t=myOrders().filter(t=>!t.cancelled&&t.ts&&tsToISTDate(t.ts)===e);if(!t.length)return void toast("No orders today to summarise");const n=t.reduce((e,t)=>e+(t.grand||0),0),o=[...new Set(t.map(e=>e.store))],i=t.map(e=>{const t=(e.items||[]).map(e=>`${e.name} x${e.qty}`).join(", ");return`${e.store}: ₹${Math.round(e.grand||0)} (${t||"items not listed"})`}).join("\n"),a=`Write a brief, professional WhatsApp-style end-of-day sales report for this field sales officer. Use friendly but professional tone. Include store names, order values, and a positive closing note. Keep it under 150 words.\n\nOfficer: ${CU?.name}\nDate: ${(new Date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",timeZone:"Asia/Kolkata"})}\nTotal orders: ${t.length}\nStores visited: ${o.length}\nTotal value: ₹${Math.round(n).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}\n\nOrder details:\n${i}`,r=document.createElement("div");r.id="ai-summary-overlay",r.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px",r.innerHTML='\n    <div style="background:var(--w);border-radius:16px;padding:20px;width:100%;max-width:340px">\n      <div style="font-size:14px;font-weight:700;color:#159ADB;margin-bottom:8px">🤖 AI Visit Summary</div>\n      <div id="ai-summary-text" style="font-size:13px;color:var(--t1);line-height:1.6;min-height:80px">\n        <div style="display:flex;align-items:center;gap:8px;padding:10px 0">\n          <div style="display:flex;gap:4px">\n            <span style="width:7px;height:7px;border-radius:50%;background:#159ADB;display:inline-block;animation:aiPulse 1.2s ease-in-out infinite"></span>\n            <span style="width:7px;height:7px;border-radius:50%;background:#159ADB;display:inline-block;animation:aiPulse 1.2s ease-in-out 0.4s infinite"></span>\n            <span style="width:7px;height:7px;border-radius:50%;background:#159ADB;display:inline-block;animation:aiPulse 1.2s ease-in-out 0.8s infinite"></span>\n          </div>\n          <span style="font-size:12px;color:var(--t2)">Writing your day summary…</span>\n        </div>\n      </div>\n      <div style="display:flex;gap:8px;margin-top:14px">\n        <button id="ai-copy-btn" class="btn" style="flex:1;font-size:13px;display:none" onclick="copyAISummary()">📋 Copy</button>\n        <button class="btn-out" style="flex:1;font-size:13px" onclick="document.getElementById(\'ai-summary-overlay\').remove()">Close</button>\n      </div>\n    </div>',document.body.appendChild(r);try{const _sres=await fetch(SCRIPT_URL,{method:"POST",body:gasPayload({action:"handleChatbot",prompt:a})}),n=await _sres.json(),o=n?.result||n?.choices?.[0]?.message?.content||"Could not generate summary.";window._aiSummaryText=o,document.getElementById("ai-summary-text").textContent=o;const i=document.getElementById("ai-copy-btn");i&&(i.style.display="block")}catch(e){document.getElementById("ai-summary-text").textContent="AI summary unavailable. Please try again."}}function copyAISummary(){if(window._aiSummaryText)if(navigator.clipboard)navigator.clipboard.writeText(window._aiSummaryText).then(()=>toast("Summary copied ✅"));else{const e=document.createElement("textarea");e.value=window._aiSummaryText,document.body.appendChild(e),e.select(),document.execCommand("copy"),document.body.removeChild(e),toast("Summary copied ✅")}}function addAISummaryButton(){const e=document.getElementById("ai-summary-btn");e&&e.remove();const t=CU?.role||"Officer";if(!["Officer","ASM","RSM"].includes(t))return;const n=document.getElementById("tab-home");if(!n)return;const o=document.createElement("button");o.id="ai-summary-btn",o.className="btn-out",o.style.cssText="width:100%;margin-bottom:10px;font-size:13px;border-color:#159ADB;color:#159ADB",o.innerHTML="🤖 AI: Summarise my day",o.onclick=generateVisitSummary;const i=document.getElementById("day-banner");i?n.insertBefore(o,i.nextSibling):n.appendChild(o)}function renderAdminSpotlightForm(){const e=document.getElementById("admin-spotlight-form");e&&(e.innerHTML=`\n    <div class="slabel">Product spotlight this week</div>\n    <select id="spotlight-product" style="width:100%;padding:10px;border:1px solid var(--bd);border-radius:var(--rads);font-size:13px;margin-bottom:8px">\n      <option value="">Select product</option>\n      ${(allProds?allProds():DEFAULT_PRODUCTS).map(e=>`<option value="${e.name}">${e.name}</option>`).join("")}\n    </select>\n    <input id="spotlight-msg" placeholder="Push message (optional)" style="width:100%;padding:10px;border:1px solid var(--bd);border-radius:var(--rads);font-size:13px;margin-bottom:8px;box-sizing:border-box">\n    <button class="btn" onclick="const p=document.getElementById('spotlight-product').value,m=document.getElementById('spotlight-msg').value;if(!p){toast('Select a product');return;}setProductSpotlight(p,m);">Set spotlight ✅</button>`)}const _newFeaturesLaunch=launchApp;launchApp=function(){_newFeaturesLaunch(),setTimeout(()=>{scheduleNotificationChecks()},12e3)};const _origRenderRoleHomeNew=renderRoleHome;renderRoleHome=function(){_origRenderRoleHomeNew();const e=CU?.role||"Officer";setTimeout(()=>{"Officer"!==e&&(addRouteMapButton(),addAISummaryButton()),renderProductSpotlight(),checkStoreVisitGaps()},300),"Officer"===e&&setTimeout(()=>{const e=document.getElementById("tab-day"),t=document.getElementById("att-calendar-block");if(t&&t.remove(),e){const t=document.createElement("div");t.id="att-calendar-block",t.innerHTML=renderAttendanceCalendar(),e.appendChild(t)}},500)};const _origSelectStoreAI=selectStore;selectStore=function(e){_origSelectStoreAI(e),window._vsStoreForAI=e},setInterval(()=>{const e=document.getElementById("order-list");if(!e||!VS?.store||!e.offsetParent)return;if(e.querySelector("#ai-suggest-btn"))return;const t=document.createElement("div");t.id="ai-suggest-btn",t.style.cssText="margin-bottom:10px",t.innerHTML='<button class="btn-out" style="width:100%;font-size:12px;padding:9px;border-color:#159ADB;color:#159ADB" onclick="getSmartOrderSuggestions(VS.store.name)">🤖 AI: Suggest order for this store</button>',e.insertBefore(t,e.firstChild),"function"==typeof triggerQuickReorderIfNeeded&&triggerQuickReorderIfNeeded()},800);const _origSubmitOrderGap=submitOrder;function _showMilestoneToast(e){const t=document.getElementById("dl-milestone-toast");t&&t.remove();const n=document.createElement("div");n.id="dl-milestone-toast",n.className="milestone-toast",n.textContent=e,document.body.appendChild(n),setTimeout(()=>{n.classList.add("out"),setTimeout(()=>n.remove(),350)},2800)}function checkDayMilestones(){const e=CU?.role||"Officer";if(!["Officer","ASM","RSM"].includes(e))return;const t=todayKey(),n=myOrders().filter(e=>!e.cancelled&&!e.noOrder&&e.ts&&tsToISTDate(e.ts)===t),o=n.reduce((e,t)=>e+(t.grand||0),0),i=n.length,a="milestones_shown_"+t,r=DB.get(a,{}),s=[{key:"first",check:1===i,msg:"🌟 First order of the day — great start!"},{key:"ord3",check:3===i,msg:"🎯 3 orders today — on a roll!"},{key:"ord5",check:5===i,msg:"💪 5 orders today — top performer material!"},{key:"ord8",check:8===i,msg:"🏆 8 orders today — outstanding!"},{key:"val5k",check:o>=5e3&&o-myOrders().filter(e=>!e.cancelled&&!e.noOrder&&e.ts&&tsToISTDate(e.ts)===t).slice(1).reduce((e,t)=>e+(t.grand||0),0)>=1,msg:"💰 ₹5,000 crossed today!"},{key:"val10k",check:o>=1e4&&n.length>0,msg:"🚀 ₹10,000 today — brilliant!"},{key:"val25k",check:o>=25e3&&n.length>0,msg:"🔥 ₹25,000 today — incredible!"},{key:"val50k",check:o>=5e4&&n.length>0,msg:"🏆 ₹50,000 today — legend!"}];let d=!1;for(const e of s)if(e.check&&!r[e.key]){r[e.key]=!0,DB.set(a,r),d||(setTimeout(()=>_showMilestoneToast(e.msg),2400),d=!0);break}}"function"==typeof submitOrder&&(submitOrder=async function(){await _origSubmitOrderGap.apply(this,arguments),setTimeout(()=>{const e=myOrders().sort((e,t)=>new Date(t.ts)-new Date(e.ts));e.length&&checkOrderGapAlerts(e[0]),updateVisitStreak(),checkDayMilestones()},2e3)});
let _veRecog = null, _veTranscript = '', _veMR = null, _veChunks = [];

function _veShowResults(items) {
  if (!items || !items.length) {
    const st = document.getElementById('_ve-status');
    if (st) st.innerHTML = '<span style="color:#ffcdd2">No products recognised — type instead</span>';
    _veShowTextMode(); return;
  }
  // Store items for confirm step
  window._veItems = items;
  // Render items in _ve-result div
  const res = document.getElementById('_ve-result');
  if (res) {
    res.style.display = 'block';
    const prods = (typeof allProds === 'function' ? allProds() : (typeof _rawAllProds === 'function' ? _rawAllProds() : DEFAULT_PRODUCTS || []));
    res.innerHTML = items.map(item => {
      const prod = prods.find(p => p.name.toLowerCase() === (item.name||'').toLowerCase())
        || prods.find(p => p.name.toLowerCase().includes((item.name||'').toLowerCase().split(' ')[0]));
      const displayName = prod ? prod.name : item.name;
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--bd)">'
        + '<span style="font-size:13px;color:var(--t1)">' + displayName + '</span>'
        + '<span style="font-size:13px;font-weight:700;color:#1A7A3C">×' + (item.qty||1) + '</span>'
        + '</div>';
    }).join('');
  }
  // Show confirm button
  const wrap = document.getElementById('_ve-confirm-btn-wrap');
  if (wrap) wrap.style.display = 'block';
  // Hide action btn, show status
  const ab = document.getElementById('_ve-action-btn'); if (ab) ab.style.display = 'none';
  const st = document.getElementById('_ve-status');
  if (st) st.innerHTML = '<span style="color:rgba(255,255,255,0.7)">✅ ' + items.length + ' product(s) found — confirm below</span>';
}

function confirmVoiceEntry(mode) {
  const items = window._veItems || [];
  if (!items.length) { document.getElementById('_voice-modal')?.remove(); return; }
  const prods = (typeof allProds === 'function' ? allProds() : (typeof _rawAllProds === 'function' ? _rawAllProds() : DEFAULT_PRODUCTS || []));
  let added = 0;
  items.forEach(item => {
    const normItem = (item.name || '').toLowerCase().trim();
    let prod = prods.find(p => p.name.toLowerCase() === normItem);
    if (!prod) {
      const words = normItem.split(/\s+/).filter(w => w.length > 2);
      prod = prods.find(p => words.every(w => p.name.toLowerCase().includes(w)));
    }
    if (!prod) prod = prods.find(p => p.name.toLowerCase().includes(normItem.split(' ')[0]));
    if (!prod || !item.qty) return;
    if (mode === 'audit') {
      if (!auditProds.find(p => p.id === prod.id)) auditProds.push(prod);
      VS.audit[prod.id] = (VS.audit[prod.id] || 0) + (parseInt(item.qty) || 0);
      added++;
    } else if (mode === 'order') {
      if (!orderProds.find(p => p.id === prod.id)) orderProds.push(prod);
      VS.order[prod.id] = (VS.order[prod.id] || 0) + (parseInt(item.qty) || 0);
      added++;
    }
  });
  if (mode === 'audit') {
    if (typeof renderAuditList === 'function') renderAuditList();
  } else {
    if (typeof renderOrderList === 'function') renderOrderList();
    if (typeof updateOrderTotal === 'function') updateOrderTotal();
  }
  document.getElementById('_voice-modal')?.remove();
  toast('✅ ' + added + ' product(s) added');
}

function openVoiceEntry(mode) {
  document.getElementById('_voice-modal')?.remove();
  _veRecog = null; _veTranscript = ''; _veMR = null; _veChunks = [];
  window._veShouldProcess = false;
  const modeLabel = mode === 'audit' ? 'Stock Audit' : mode === 'order' ? 'Order Booking' : 'Proforma Invoice';
  const modal = document.createElement('div');
  modal.id = '_voice-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#1a1a2e;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:32px 20px 40px';
  modal.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:6px">🎤 Quick Entry — ${modeLabel}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.8)">Say product names &amp; quantities in English or Tamil.<br><span style="color:#4CAF50">e.g. "Sugar 500g two cases, Jaggery one, Cookies sixteen"</span></div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:14px;width:100%">
      <div id="_ve-rec-indicator" style="display:none;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:#e53935;animation:vepulse 1s infinite"></div>
        <span style="color:#fff;font-size:14px;font-weight:600">Recording… speak now</span>
      </div>
      <div id="_ve-live" style="display:none;width:100%;background:rgba(255,255,255,0.1);border-radius:10px;padding:10px;color:#fff;font-size:13px;min-height:40px;text-align:center"></div>
      <div id="_ve-status" style="font-size:13px;color:rgba(255,255,255,0.85);text-align:center;min-height:20px"></div>
      <textarea id="_ve-text" placeholder="Or type here: sugar 500g 2 case, jaggery one, cookies sixteen..." style="display:none;width:100%;padding:10px;border-radius:10px;border:none;font-size:13px;min-height:60px;box-sizing:border-box"></textarea>
      <div id="_ve-result" style="display:none;width:100%;background:var(--w);border-radius:12px;padding:12px;max-height:240px;overflow-y:auto"></div>
      <div id="_ve-confirm-btn-wrap" style="display:none;width:100%">
        <button id="_ve-confirm-btn" onclick="confirmVoiceEntry('${mode}')" style="width:100%;padding:14px;border:none;border-radius:12px;background:#1A7A3C;color:#fff;font-size:14px;font-weight:700;cursor:pointer">✅ Confirm &amp; add all</button>
      </div>
      <div style="display:flex;gap:12px;width:100%">
        <button onclick="_veStopRecog();document.getElementById('_voice-modal')?.remove()" style="flex:1;padding:14px;border:1.5px solid rgba(255,255,255,0.4);border-radius:12px;background:transparent;color:#fff;font-size:13px;font-weight:600;cursor:pointer">Cancel</button>
        <button id="_ve-action-btn" style="flex:2;padding:14px;border:none;border-radius:12px;background:#e53935;color:#fff;font-size:14px;font-weight:700;cursor:pointer">🎤 Start Recording</button>
        <button id="_ve-retry-btn" style="display:none;flex:1;padding:14px;border:1.5px solid rgba(255,255,255,0.4);border-radius:12px;background:transparent;color:#fff;font-size:13px;font-weight:600;cursor:pointer">🔄 Retry</button>
      </div>
      <a href="#" onclick="event.preventDefault();_veShowTextMode()" style="color:rgba(255,255,255,0.6);font-size:12px" id="_ve-type-toggle">⌨️ Type instead</a>
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
      _veMR ? _veStopRecog(true) : _veStartRecog();
    }
  });
  document.getElementById('_ve-retry-btn').addEventListener('click', _veResetState);
}

function _veResetState() {
  _veStopRecog();
  _veMR = null; _veChunks = []; _veTranscript = '';
  const st = document.getElementById('_ve-status'); if (st) st.innerHTML = '';
  const lv = document.getElementById('_ve-live'); if (lv) { lv.style.display = 'none'; lv.textContent = ''; }
  const res = document.getElementById('_ve-result'); if (res) { res.style.display = 'none'; res.innerHTML = ''; }
  const wrap = document.getElementById('_ve-confirm-btn-wrap'); if (wrap) wrap.style.display = 'none';
  const btn = document.getElementById('_ve-action-btn'); if (btn) { btn.style.display = 'block'; btn.textContent = '🎤 Start Recording'; btn.style.background = '#e53935'; }
  const retry = document.getElementById('_ve-retry-btn'); if (retry) retry.style.display = 'none';
  const tog = document.getElementById('_ve-type-toggle'); if (tog) tog.style.display = 'block';
  const txt = document.getElementById('_ve-text'); if (txt) { txt.style.display = 'none'; txt.value = ''; }
}

function _veShowTextMode() {
  _veStopRecog();
  const el = document.getElementById('_ve-text'); if (el) el.style.display = 'block';
  const btn = document.getElementById('_ve-action-btn'); if (btn) { btn.textContent = '✔ Parse Text'; btn.style.background = '#1A7A3C'; }
  const tog = document.getElementById('_ve-type-toggle'); if (tog) tog.style.display = 'none';
  const ind = document.getElementById('_ve-rec-indicator'); if (ind) ind.style.display = 'none';
}

function _veStartRecog() {
  const st = document.getElementById('_ve-status');
  if (st) st.innerHTML = '<span style="color:rgba(255,255,255,0.7)">Requesting mic…</span>';
  navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
    _veChunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
                     MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
    _veMR = new MediaRecorder(stream, {mimeType, audioBitsPerSecond: 16000});
    _veMR.ondataavailable = e => { if (e.data.size > 0) _veChunks.push(e.data); };
    _veMR.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      if (window._veShouldProcess) { window._veShouldProcess = false; _veProcessAudio(); }
    };
    _veMR.start(1000);
    const btn = document.getElementById('_ve-action-btn'); if (btn) { btn.textContent = '⏹ Stop & Process'; btn.style.background = '#b71c1c'; }
    const ind = document.getElementById('_ve-rec-indicator'); if (ind) ind.style.display = 'flex';
    if (st) st.textContent = '';
    // Timer
    let secs = 0;
    window._veTimer = setInterval(() => {
      secs++;
      const lv = document.getElementById('_ve-live');
      if (lv) { lv.style.display = 'block'; lv.textContent = '🔴 ' + secs + 's — tap Stop when done'; }
      if (secs >= 30) _veStopRecog(true); // auto stop at 30s
    }, 1000);
  }).catch(err => {
    const st = document.getElementById('_ve-status');
    if (st) st.innerHTML = '<span style="color:#ffcdd2">❌ Mic not available — type instead</span>';
    _veShowTextMode();
  });
}

function _veStopRecog(process) {
  clearInterval(window._veTimer);
  const ind = document.getElementById('_ve-rec-indicator'); if (ind) ind.style.display = 'none';
  if (_veMR && _veMR.state !== 'inactive') {
    window._veShouldProcess = !!process;
    _veMR.stop();
  } else {
    _veMR = null;
    if (process && _veChunks.length) _veProcessAudio();
  }
}

async function _veProcessAudio() {
  const st = document.getElementById('_ve-status');
  const ab = document.getElementById('_ve-action-btn'); if (ab) ab.style.display = 'none';
  const lv = document.getElementById('_ve-live'); if (lv) lv.textContent = '';
  if (st) st.innerHTML = '<span style="color:rgba(255,255,255,0.7)">🤖 Transcribing…</span>';
  if (!_veChunks.length) {
    if (st) st.innerHTML = '<span style="color:#ffcdd2">Nothing recorded — tap Retry</span>';
    const rb = document.getElementById('_ve-retry-btn'); if (rb) rb.style.display = 'block';
    return;
  }
  const blob = new Blob(_veChunks, {type: _veChunks[0]?.type || 'audio/webm'});
  if (blob.size === 0) {
    if (st) st.innerHTML = '<span style="color:#ffcdd2">Nothing recorded — tap Retry</span>';
    _veShowTextMode(); return;
  }
  const reader = new FileReader();
  reader.onerror = function() {
    if (st) st.innerHTML = '<span style="color:#ffcdd2">Read error — type instead</span>';
    _veShowTextMode();
  };
  reader.onload = async function() {
    const b64raw = reader.result.includes(',') ? reader.result.split(',')[1] : reader.result;
    const b64 = b64raw ? b64raw.replace(/[^A-Za-z0-9+/=]/g, '') : '';
    if (!b64 || b64.length < 100) {
      if (st) st.innerHTML = '<span style="color:#ffcdd2">Audio too short — try again</span>';
      _veShowTextMode(); return;
    }
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        body: (typeof gasPayload === 'function' ? gasPayload({action: 'voiceEntry', base64Audio: b64, mimeType: blob.type}) : JSON.stringify({action: 'voiceEntry', base64Audio: b64, mimeType: blob.type, token: typeof API_TOKEN !== 'undefined' ? API_TOKEN : ''}))
      });
      let data = {};
      try { data = JSON.parse(await res.text()); } catch(je) {}
      if (data.items && data.items.length) { _veShowResults(data.items.map(i=>({name:i.name,qty:i.qty||1}))); return; }
      const transcript = data.transcript || data.result || '';
      if (!transcript) { _veShowTextMode(); return; }
      const lv2 = document.getElementById('_ve-live');
      if (lv2) { lv2.style.display = 'block'; lv2.textContent = '"' + transcript + '"'; }
      if (st) st.innerHTML = '<span style="color:rgba(255,255,255,0.7)">🤖 Parsing products…</span>';
      _veAIparse(transcript);
    } catch(e) {
      if (st) st.innerHTML = '<span style="color:#ffcdd2">Transcription failed — type instead</span>';
      _veShowTextMode();
    }
  };
  reader.readAsDataURL(blob);
}

async function _veAIparse(transcript) {
  const st = document.getElementById('_ve-status');
  const ab = document.getElementById('_ve-action-btn'); if (ab) ab.style.display = 'none';
  const lv = document.getElementById('_ve-live'); if (lv) lv.style.display = 'none';
  if (st) st.innerHTML = '<span style="color:rgba(255,255,255,0.7)">🤖 AI parsing…</span>';
  const prods = (typeof allProds === 'function' ? allProds() : (typeof _rawAllProds === 'function' ? _rawAllProds() : []));
  const prodList = prods.map(p => `${p.name} (casePack:${p.casePack || (typeof CASES !== 'undefined' ? CASES[p.name] : 0) || 1})`).join(', ');
  const prompt = `You are a product entry parser for Diabliss, an Indian FMCG company. The officer may speak in English, Tamil, Telugu, Kannada, Hindi, or a mix.
Transcript: "${transcript}"
Product list: ${prodList}
Rules:
- Match each product mentioned to the closest name in the list
- If "case"/"cases"/"petti"/"box"/"boxes" is mentioned, multiply qty by casePack to get nos
- Tamil numbers: onnu=1, rendu=2, moonu=3, naalu=4, anju=5, aaru=6, yezhu=7, ettu=8, onbathu=9, pathu=10, pathinaaru=16, irubathu=20
- Hindi: ek=1, do=2, teen=3, char=4, paanch=5, das=10
- If qty not mentioned, assume 1
- Return ONLY a JSON array, no markdown, no explanation: [{"name":"exact product name","qty":number}]`;
  try {
    if (!SCRIPT_URL) throw new Error('No GAS URL');
    const res = await fetch(SCRIPT_URL, {method:'POST', body:gasPayload({action:'handleChatbot',prompt:prompt}), signal: _timeoutSignal(15000)});
    const data = await res.json();
    let text = (data.result || '').replace(/```json|```/g, '').trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array');
    const items = JSON.parse(match[0]);
    if (!items.length) throw new Error('Empty');
    _veShowResults(items);
  } catch(e) {
    _veLocalParse(transcript);
  }
}

function _veLocalParse(transcript) {
  // Fallback: simple keyword match against DEFAULT_PRODUCTS
  const prods = (typeof allProds === 'function' ? allProds() : (typeof _rawAllProds === 'function' ? _rawAllProds() : DEFAULT_PRODUCTS || []));
  const words = transcript.toLowerCase();
  const numMap = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
    onnu:1,rendu:2,moonu:3,naalu:4,anju:5,aaru:6,ezhu:7,ettu:8,onbathu:9,pathu:10};
  const items = [];
  prods.forEach(p => {
    const key = p.name.toLowerCase().split(' ').slice(0,2).join(' ');
    if (words.includes(key.split(' ')[0])) {
      let qty = 1;
      const qMatch = words.match(/(\d+)/);
      if (qMatch) qty = parseInt(qMatch[1]);
      else { for (const [w,n] of Object.entries(numMap)) { if (words.includes(w)) { qty = n; break; } } }
      items.push({name: p.name, qty});
    }
  });
  if (items.length) { _veShowResults(items); return; }
  const st = document.getElementById('_ve-status');
  if (st) st.innerHTML = '<span style="color:#ffcdd2">Could not parse — type instead</span>';
  _veShowTextMode();
}


const GEO_API_KEY="AIzaSyDI_8NNYZWnEDoHD7f8O0p4qoEGt2Vjj3c";function _geoGuessTerritory(e){const t=(e.find(e=>e.types.includes("administrative_area_level_1"))?.long_name||"").toLowerCase()+" "+(e.find(e=>e.types.includes("administrative_area_level_3"))?.long_name||"").toLowerCase()+" "+(e.find(e=>e.types.includes("locality"))?.long_name||"").toLowerCase();return t.includes("chennai")||t.includes("kancheepuram")||t.includes("chengalpattu")||t.includes("tiruvallur")?"Chennai":t.includes("tamil")?"ROTN":t.includes("kerala")?"Kerala":t.includes("andhra")?"AP":t.includes("telangana")?"TS":t.includes("bangalore")||t.includes("bengaluru")?"Bangalore":t.includes("karnataka")?"ROK":t.includes("odisha")||t.includes("orissa")?"Odisha":"Others"}async function autoFillStoreAddress(){const e=document.getElementById("ns-geo-btn"),t=document.getElementById("ns-geo-status");e&&(e.disabled=!0,e.textContent="⏳ Getting…"),t&&(t.style.display="block",t.textContent="📍 Getting GPS…");try{const e=await("function"==typeof getCurrentLocation?getCurrentLocation():Promise.reject(new Error("Location function not found")));if(!e?.lat||!e?.lng)throw new Error("Location unavailable — please enable GPS");t&&(t.textContent="🔍 Fetching address…");const n=`https://maps.googleapis.com/maps/api/geocode/json?latlng=${e.lat},${e.lng}&key=${GEO_API_KEY}`,o=await fetch(n),i=await o.json();if("OK"!==i.status||!i.results?.length)throw new Error("Address not found");const a=i.results[0].address_components||[],r=(a.find(e=>e.types.includes("street_number")),a.find(e=>e.types.includes("route")),a.find(e=>e.types.includes("sublocality_level_1"))?.long_name||""),s=a.find(e=>e.types.includes("locality"))?.long_name||"",d=a.find(e=>e.types.includes("postal_code"))?.long_name||"",l=_geoGuessTerritory(a),c=s||r||"",p=(document.getElementById("ns-addr"),document.getElementById("ns-city")),u=document.getElementById("ns-pincode"),m=document.getElementById("ns-territory");p&&c&&(p.value=c),u&&d&&(u.value=d),m&&l&&(m.value=l);const g=document.getElementById("ns-lat"),y=document.getElementById("ns-lng");g&&(g.value=e.lat),y&&(y.value=e.lng),t&&(t.innerHTML='<span style="color:#1A7A3C">✅ Area filled — add shop name/street in address</span>'),"function"==typeof toast&&toast("Location filled ✅")}catch(e){t&&(t.innerHTML=`<span style="color:var(--r)">❌ ${e.message||"Error"} — fill manually</span>`),"function"==typeof toast&&toast("Could not get address — fill manually")}e&&(e.disabled=!1,e.textContent="📍 Get location")}
// ══ PO UPLOAD ══
function handlePOUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = '';
  const isPDF = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  if (!isPDF && !isImage) return void toast('Please upload a PDF or image file');
  const store = VS.store?.name || '';
  const modal = document.createElement('div');
  modal.id = '_po-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `<div style="background:var(--w);border-radius:16px;padding:20px;width:100%;max-width:360px">
    <div style="font-size:15px;font-weight:700;color:#0A6FA3;margin-bottom:4px">📄 PO Upload</div>
    <div style="font-size:12px;color:var(--t2);margin-bottom:14px">Reading <b>${file.name}</b>…<br>AI will extract Diabliss products only.</div>
    <div id="_po-status" style="font-size:13px;color:var(--t2);text-align:center;padding:20px 0">
      <div style="display:flex;align-items:center;justify-content:center;gap:8px">
        <div style="width:8px;height:8px;border-radius:50%;background:#0A6FA3;animation:vepulse 1s infinite"></div>
        <span>Processing PO…</span>
      </div>
    </div>
    <div id="_po-result" style="display:none;max-height:200px;overflow-y:auto"></div>
    <div id="_po-actions" style="display:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
      <button onclick="document.getElementById('_po-modal').remove()" style="padding:11px;border:1.5px solid var(--bd);border-radius:10px;background:var(--w);font-size:13px;font-weight:600;cursor:pointer">Cancel</button>
      <button id="_po-confirm-btn" style="padding:11px;border:none;border-radius:10px;background:var(--g);color:#fff;font-size:13px;font-weight:700;cursor:pointer" onclick="confirmPOItems()">✅ Add to order</button>
    </div>
  </div>`;
  document.body.appendChild(modal);

  const reader = new FileReader();
  reader.onload = async function() {
    const b64 = reader.result.includes(',') ? reader.result.split(',')[1] : reader.result;
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'parsePO',
          fileBase64: b64,
          mimeType: file.type,
          fileName: file.name,
          store: store,
          token: typeof API_TOKEN !== 'undefined' ? API_TOKEN : ''
        }),
        signal: _timeoutSignal(30000)
      });
      const data = await res.json();
      const items = data.items || [];
      const driveUrl = data.driveUrl || '';
      window._poItems = items;
      window._poDriveUrl = driveUrl;
      const st = document.getElementById('_po-status');
      const res2 = document.getElementById('_po-result');
      const act = document.getElementById('_po-actions');
      if (!items.length) {
        if (st) st.innerHTML = '<span style="color:var(--r)">❌ No Diabliss products found in this PO</span>';
        return;
      }
      if (st) st.style.display = 'none';
      if (res2) {
        res2.style.display = 'block';
        res2.innerHTML = `<div style="font-size:12px;font-weight:700;color:var(--t2);margin-bottom:8px">Found ${items.length} Diabliss product(s) — review:</div>` +
          items.map((item, i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:0.5px solid var(--bd)">
            <div style="font-size:12px;color:var(--t1)">${item.name}</div>
            <input type="number" value="${item.qty}" min="1" onchange="window._poItems[${i}].qty=parseInt(this.value)||1" style="width:60px;padding:4px;border:1px solid var(--bd);border-radius:6px;text-align:center;font-size:13px;font-weight:600">
          </div>`).join('');
        if (driveUrl) res2.innerHTML += `<div style="font-size:11px;color:var(--t3);margin-top:8px">📎 PO saved: <a href="${driveUrl}" target="_blank" style="color:#0A6FA3">View in Drive</a></div>`;
      }
      if (act) act.style.display = 'grid';
    } catch(e) {
      const st = document.getElementById('_po-status');
      if (st) st.innerHTML = '<span style="color:var(--r)">❌ Could not process PO — check connection</span>';
    }
  };
  reader.readAsDataURL(file);
}

function confirmPOItems() {
  const items = window._poItems || [];
  const driveUrl = window._poDriveUrl || '';
  if (!items.length) return;
  const prods = typeof allProds === 'function' ? allProds() : (typeof _rawAllProds === 'function' ? _rawAllProds() : DEFAULT_PRODUCTS);
  let added = 0;
  items.forEach(item => {
    // Fuzzy match: exact first, then keyword overlap (handles Gemini returning short names)
    const normItem = (item.name || '').toLowerCase().trim();
    let prod = prods.find(p => p.name === item.name);
    if (!prod) prod = prods.find(p => p.name.toLowerCase() === normItem);
    if (!prod) {
      const words = normItem.split(/\s+/).filter(w => w.length > 2);
      prod = prods.find(p => words.every(w => p.name.toLowerCase().includes(w)));
    }
    if (!prod || !item.qty) return;
    if (!orderProds.find(p => p.id === prod.id)) orderProds.push(prod);
    VS.order[prod.id] = (VS.order[prod.id] || 0) + (parseInt(item.qty) || 0);
    added++;
  });
  if (driveUrl) VS.poUrl = driveUrl;
  if (typeof renderOrderList === 'function') renderOrderList();
  if (typeof updateOrderTotal === 'function') updateOrderTotal();
  document.getElementById('_po-modal')?.remove();
  toast(`✅ ${added} product(s) added from PO`);
}

// ══ MARKET SUPPLY ENTRY ══
let _msEntries = [], _msDist = null;

function openMarketSupplyEntry() {
  document.getElementById('_ms-modal')?.remove();
  _msEntries = []; _msDist = null;
  const dists = typeof getDists === 'function' ? getDists() : [];
  const modal = document.createElement('div');
  modal.id = '_ms-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:var(--w);overflow-y:auto;display:flex;flex-direction:column';
  modal.innerHTML = `
    <div style="background:#FF6F00;color:#fff;padding:16px 16px 12px;display:flex;align-items:center;gap:12px">
      <button onclick="document.getElementById('_ms-modal').remove()" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:0">←</button>
      <div style="font-size:16px;font-weight:700">📦 Market Supply Entry</div>
    </div>
    <div style="padding:16px;flex:1">
      <div style="font-size:12px;font-weight:700;color:var(--t2);margin-bottom:6px">DISTRIBUTOR</div>
      <select id="_ms-dist-sel" onchange="_msDist=this.value" style="width:100%;padding:11px;border:1.5px solid var(--bd);border-radius:10px;font-size:13px;background:var(--w);margin-bottom:14px">
        <option value="">Select distributor</option>
        ${dists.map(d => `<option value="${d.name}">${d.name} · ${d.territory}</option>`).join('')}
      </select>
      <div style="font-size:12px;font-weight:700;color:var(--t2);margin-bottom:6px">STORE ENTRIES</div>
      <div id="_ms-entries-list"></div>
      <button onclick="_msAddEntry()" style="width:100%;padding:11px;border:1.5px dashed var(--g);border-radius:10px;background:var(--gl);color:var(--gd);font-size:13px;font-weight:600;cursor:pointer;margin-bottom:14px">+ Add Store</button>
      <div id="_ms-review" style="display:none">
        <div style="font-size:12px;font-weight:700;color:var(--t2);margin-bottom:8px">REVIEW</div>
        <div id="_ms-review-content"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <button onclick="document.getElementById('_ms-modal').remove()" style="padding:13px;border:1.5px solid var(--bd);border-radius:10px;background:var(--w);font-size:13px;font-weight:600;cursor:pointer">Cancel</button>
        <button onclick="_msSubmit()" style="padding:13px;border:none;border-radius:10px;background:#FF6F00;color:#fff;font-size:13px;font-weight:700;cursor:pointer">Submit ✅</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function _msAddEntry() {
  const stores = DB.get('stores', []);  // MSE needs all stores, not territory-filtered
  const prods = typeof allProds === 'function' ? allProds() : (typeof _rawAllProds === 'function' ? _rawAllProds() : DEFAULT_PRODUCTS);
  const id = 'mse' + Date.now();
  _msEntries.push({ id, storeName: '', items: [] });
  const idx = _msEntries.length - 1;
  const list = document.getElementById('_ms-entries-list');
  const div = document.createElement('div');
  div.id = id;
  div.style.cssText = 'background:var(--bg);border:1px solid var(--bd);border-radius:12px;padding:12px;margin-bottom:10px';
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:12px;font-weight:700;color:var(--t2)">Store ${idx + 1}</div>
      <button onclick="document.getElementById('${id}').remove();_msEntries.splice(${idx},1)" style="background:none;border:none;color:var(--r);font-size:18px;cursor:pointer;padding:0">×</button>
    </div>
    <select id="${id}-store" onchange="_msEntries[${idx}].storeName=this.value" style="width:100%;padding:9px;border:1px solid var(--bd);border-radius:8px;font-size:13px;background:var(--w);margin-bottom:8px">
      <option value="">Select store</option>
      ${stores.map(s => `<option value="${s.name}">${s.name}${s.city ? ' · ' + s.city : ''}</option>`).join('')}
    </select>
    <div id="${id}-items"></div>
    <button onclick="_msAddItem('${id}',${idx})" style="width:100%;padding:8px;border:1px dashed var(--bd);border-radius:8px;background:transparent;color:var(--g);font-size:12px;font-weight:600;cursor:pointer">+ Add product</button>`;
  list.appendChild(div);
}

function _msAddItem(entryId, entryIdx) {
  const prods = typeof allProds === 'function' ? allProds() : (typeof _rawAllProds === 'function' ? _rawAllProds() : DEFAULT_PRODUCTS);
  const itemId = entryId + 'i' + Date.now();
  if (!_msEntries[entryIdx]) return;
  _msEntries[entryIdx].items.push({ id: itemId, prodName: '', qty: 0 });
  const itemIdx = _msEntries[entryIdx].items.length - 1;
  const list = document.getElementById(entryId + '-items');
  const div = document.createElement('div');
  div.id = itemId;
  div.style.cssText = 'display:grid;grid-template-columns:1fr 80px 32px;gap:6px;margin-bottom:6px;align-items:center';
  div.innerHTML = `
    <select onchange="_msEntries[${entryIdx}].items[${itemIdx}].prodName=this.value" style="padding:8px;border:1px solid var(--bd);border-radius:8px;font-size:12px;background:var(--w)">
      <option value="">Product</option>
      ${prods.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
    </select>
    <input type="number" placeholder="Qty" min="1" onchange="_msEntries[${entryIdx}].items[${itemIdx}].qty=parseInt(this.value)||0" style="padding:8px;border:1px solid var(--bd);border-radius:8px;font-size:13px;text-align:center">
    <button onclick="document.getElementById('${itemId}').remove();_msEntries[${entryIdx}].items.splice(${itemIdx},1)" style="background:none;border:none;color:var(--r);font-size:18px;cursor:pointer;padding:0">×</button>`;
  list.appendChild(div);
}

async function _msSubmit() {
  const dist = document.getElementById('_ms-dist-sel')?.value;
  if (!dist) return void toast('Select a distributor');
  const validEntries = _msEntries.filter(e => e.storeName && e.items.some(i => i.prodName && i.qty > 0));
  if (!validEntries.length) return void toast('Add at least one store with products');

  const prods = typeof allProds === 'function' ? allProds() : (typeof _rawAllProds === 'function' ? _rawAllProds() : DEFAULT_PRODUCTS);
  const now = new Date();
  const date = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const batchId = 'MS' + Date.now().toString().slice(-6);
  const orders = [];

  validEntries.forEach(entry => {
    const store = DB.get('stores', []).find(s => s.name === entry.storeName) || null;
    const items = entry.items.filter(i => i.prodName && i.qty > 0).map(i => {
      const prod = prods.find(p => p.name === i.prodName);
      return prod ? { id: prod.id, name: prod.name, qty: i.qty, price: prod.mrp, mrp: prod.mrp } : null;
    }).filter(Boolean);
    if (!items.length) return;
    const grand = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const order = {
      id: 'ORD' + Date.now().toString().slice(-6) + Math.random().toString(36).slice(-3),
      batchId,
      date, time,
      ts: now.toISOString(),
      officer: CU?.name || '',
      officerMobile: CU?.mobile || '',
      officerRole: CU?.role || 'Officer',
      territory: store?.territory || CU?.territory || '',
      store: entry.storeName,
      storeCity: store?.city || '',
      distributor: dist,
      items,
      grand: Math.round(grand),
      gst: Math.round(grand * 0.05),
      sub: Math.round(grand),
      audit: {}, unsaleable: {},
      orderType: 'market_supply',
      synced: false, cancelled: false
    };
    orders.push(order);
  });

  if (!orders.length) return void toast('No valid entries to submit');

  // Save to local DB
  const existing = typeof getOrders === 'function' ? getOrders() : [];
  DB.set('orders', [...orders, ...existing]);

  // Sync to GAS
  if (SCRIPT_URL) {
    orders.forEach(order => {
      fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ ...order, action: 'saveStoreVisit' }) }).catch(() => {});
    });
  }

  document.getElementById('_ms-modal').remove();
  toast(`✅ Market supply entry submitted — ${orders.length} store(s)`);

  // Generate PDF summary
  setTimeout(() => _msGeneratePDF(batchId, dist, orders), 500);
  if (typeof renderOrders === 'function') renderOrders();
}

function _msGeneratePDF(batchId, dist, orders) {
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const grandTotal = orders.reduce((s, o) => s + o.grand, 0);
  const rows = orders.map(o => o.items.map(i =>
    `<tr><td style="padding:7px 10px;font-size:12px">${o.store}</td><td style="padding:7px 10px;font-size:12px">${i.name}</td><td style="padding:7px 10px;font-size:12px;text-align:center">${i.qty}</td><td style="padding:7px 10px;font-size:12px;text-align:right">₹${(i.price * i.qty).toLocaleString('en-IN')}</td></tr>`
  ).join('')).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:20px;color:#1a1a2e}
  .hdr{background:#FF6F00;color:#fff;padding:14px 18px;border-radius:6px 6px 0 0}
  table{width:100%;border-collapse:collapse}th{background:#FF6F00;color:#fff;padding:9px 10px;font-size:12px;text-align:left}
  tr:nth-child(even){background:#fff3e0}.footer{margin-top:14px;font-size:11px;color:#aaa;text-align:center}
  @media print{body{padding:0}}</style></head><body>
  <div class="hdr"><div style="font-size:16px;font-weight:700">📦 Market Supply Entry</div><div style="font-size:12px;opacity:0.85">Batch: ${batchId} · ${date}</div></div>
  <div style="padding:10px 14px;background:#fff3e0;border:1px solid #FF6F00;border-top:none;margin-bottom:10px">
    <div style="font-size:13px"><b>Distributor:</b> ${dist}</div>
    <div style="font-size:13px"><b>Officer:</b> ${CU?.name} · ${CU?.territory}</div>
    <div style="font-size:13px"><b>Stores:</b> ${orders.length}</div>
  </div>
  <table><thead><tr><th>Store</th><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Value</th></tr></thead>
  <tbody>${rows}<tr style="background:#FF6F00;color:#fff"><td colspan="3" style="padding:9px 10px;font-weight:700;font-size:13px">Grand Total</td><td style="padding:9px 10px;font-weight:700;font-size:13px;text-align:right">₹${grandTotal.toLocaleString('en-IN')}</td></tr></tbody></table>
  <div class="footer">Generated from Diabliss Sales App · ${date}</div>
  <script>window.onload=()=>window.print();<\/script></body></html>`;

  const modal = document.createElement('div');
  modal.id = '_ms-pdf-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `<div style="background:var(--w);border-radius:16px;padding:20px;width:100%;max-width:340px;text-align:center">
    <div style="font-size:36px;margin-bottom:10px">📦</div>
    <div style="font-size:15px;font-weight:700;margin-bottom:6px">Market Supply Submitted!</div>
    <div style="font-size:12px;color:var(--t2);margin-bottom:16px">${orders.length} store(s) · ₹${grandTotal.toLocaleString('en-IN')} total</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button onclick="openHtmlAsPdf&&openHtmlAsPdf('${encodeURIComponent(html).slice(0,100)}...');window._msPdfHtml='${encodeURIComponent(html)}';_msOpenPDF()" style="padding:12px;border:none;border-radius:10px;background:#FF6F00;color:#fff;font-size:13px;font-weight:700;cursor:pointer">📄 PDF</button>
      <button onclick="_msShareWA('${batchId}','${dist}',${grandTotal},${orders.length})" style="padding:12px;border:1.5px solid #25D366;border-radius:10px;background:#fff;color:#25D366;font-size:13px;font-weight:700;cursor:pointer">📲 WhatsApp</button>
    </div>
    <button onclick="document.getElementById('_ms-pdf-modal').remove()" style="width:100%;margin-top:8px;padding:11px;border:1.5px solid var(--bd);border-radius:10px;background:var(--w);font-size:13px;cursor:pointer">Close</button>
  </div>`;
  window._msPdfHtmlFull = html;
  window._msOrders = orders;
  document.body.appendChild(modal);
}

function _msOpenPDF() {
  if (window._msPdfHtmlFull) openHtmlAsPdf ? openHtmlAsPdf(window._msPdfHtmlFull, 'Market_Supply') : window.open('data:text/html,' + encodeURIComponent(window._msPdfHtmlFull), '_blank');
}

function _msShareWA(batchId, dist, total, storeCount) {
  const orders = window._msOrders || [];
  let text = `📦 DIABLISS MARKET SUPPLY ENTRY\nBatch: ${batchId}\nDate: ${new Date().toLocaleDateString('en-IN', {timeZone:'Asia/Kolkata'})}\n\nDistributor: ${dist}\nOfficer: ${CU?.name} · ${CU?.territory}\nStores: ${storeCount}\n\n`;
  orders.forEach(o => {
    text += `🏪 ${o.store}\n`;
    o.items.forEach(i => { text += `  • ${i.name} × ${i.qty}\n`; });
    text += `  Total: ₹${o.grand.toLocaleString('en-IN')}\n\n`;
  });
  text += `Grand Total: ₹${total.toLocaleString('en-IN')}`;
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}

// ══ MARKET SUPPLY ORDER BADGE ══
// Patch renderOrders to add Market Supply badge after render
const _origRenderOrdersMS = typeof renderOrders !== 'undefined' ? renderOrders : null;
if (typeof renderOrders !== 'undefined') {
  const _prevRenderOrders = renderOrders;
  renderOrders = function() {
    _prevRenderOrders.apply(this, arguments);
    setTimeout(() => {
      const orders = typeof getOrders === 'function' ? getOrders() : [];
      orders.filter(o => o.orderType === 'market_supply' && !o.cancelled).forEach(o => {
        const card = document.querySelector(`[onclick*="${o.id}"]`);
        if (card && !card.querySelector('.ms-badge')) {
          const badge = document.createElement('span');
          badge.className = 'ms-badge oflag';
          badge.style.cssText = 'background:#fff3e0;color:#E65100;border:1px solid #FFCCBC';
          badge.textContent = '📦 Market Supply';
          const flags = card.querySelector('.oproducts');
          if (flags) flags.before(badge);
        }
      });
    }, 100);
  };
}
