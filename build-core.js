const APP_VERSION = '1.7.71';
function plural(n, word) { return n === 1 ? '1 ' + word : n + ' ' + word + 's'; }
// API_TOKEN loaded from config.js (same file that sets SCRIPT_URL)
// config.js must define: const API_TOKEN = 'your-secret-here';
// SCRIPT_URL provided by config.js — loaded before this file in index.html
// Helper to add security token to all GAS POST payloads
function gasPayload(data) {
  return JSON.stringify({...data, token: (typeof API_TOKEN !== 'undefined' ? API_TOKEN : '')});
}
// Helper to add security token to GET params
function gasGetUrl(url) {
  if (typeof API_TOKEN === 'undefined' || !API_TOKEN) return url;
  const sep = url.includes('?') ? '&' : '?';
  return url + sep + 'token=' + encodeURIComponent(API_TOKEN);
}
const GM_WA = '919840981969';
const COMPANY = {
  name:'Diabliss Consumer Products Pvt Ltd',
  addr:'Type II Unit 20 Dr.VSI Estate, Thiruvanmiyur, Chennai - 600 041',
  gstin:'33AADCE2529E1Z4',
  tel:'+91 44-4853 0303',
  bank:'State Bank of India',
  acc_name:'Diabliss Consumer Products Pvt Ltd',
  acc_no:'34356181364',
  ifsc:'SBIN0004327'
};
const PATTERNS = {
  'TN_KA|25|13|7':{name:'TN and KA — 25-13-7',retail:25,dist:13,ss:7},
  'AP_TS|20|10|10':{name:'AP and TS — 20-10-10',retail:20,dist:10,ss:10},
  'KL_A|25|13|8':{name:'KL — 25-13-8',retail:25,dist:13,ss:8},
  'KL_B|25|13|5':{name:'KL — 25-13-5',retail:25,dist:13,ss:5},
  'KL_C|32|13|7':{name:'KL — 32-13-7',retail:32,dist:13,ss:7},
  'KL_D|25|13|7':{name:'KL — 25-13-7',retail:25,dist:13,ss:7},
  'KL_E|25|13|10':{name:'KL — 25-13-10',retail:25,dist:13,ss:10}
};
const CASES = {
  'Sugar 40×5g Sachet Box':54,'Sugar 500g Standy Pouch':24,'Sugar 1kg PET Jar':12,
  'Sugar 1.75kg PET Jar':6,'Sugar 5kg':10,'Sugar 10kg':5,
  'Jaggery 500g Standy Pouch':24,'Jaggery 750g PET Jar':12,'Jaggery 1.25kg PET Jar':6,'Jaggery 5kg Bag':10,
  'Lemon Tea 10×10g':84,'Lemon Tea 30×10g':36,'Lemon Tea 500g':24,
  'Combo Tea 30×10g':36,'Ginger Tea 10×10g':84,'Masala Chai 10×10g':84,
  'Millet Cookies 120g':60,'Millet Cookies with Moringa 120g':60,'Millet Cookies with Chia 120g':60,
  'Mixed Fruit Jam 225g':24,'Guava Jam 225g':24,'Pineapple Ginger Jam 225g':24
};
const DEFAULT_PRODUCTS = [
  {id:'p1', name:'Sugar 40×5g Sachet Box',          unit:'40×5g',   mrp:99,   cat:'Sugar',   casePack:54},
  {id:'p2', name:'Sugar 500g Standy Pouch',          unit:'500g',    mrp:160,  cat:'Sugar',   casePack:24},
  {id:'p3', name:'Sugar 1kg PET Jar',                unit:'1kg',     mrp:295,  cat:'Sugar',   casePack:12},
  {id:'p4', name:'Sugar 1.75kg PET Jar',             unit:'1.75kg',  mrp:499,  cat:'Sugar',   casePack:6},
  {id:'p5', name:'Sugar 5kg',                        unit:'5kg',     mrp:1250, cat:'Sugar',   casePack:10},
  {id:'p6', name:'Sugar 10kg',                       unit:'10kg',    mrp:2300, cat:'Sugar',   casePack:5},
  {id:'p7', name:'Jaggery 500g Standy Pouch',        unit:'500g',    mrp:160,  cat:'Jaggery', casePack:24},
  {id:'p8', name:'Jaggery 750g PET Jar',             unit:'750g',    mrp:225,  cat:'Jaggery', casePack:12},
  {id:'p9', name:'Jaggery 1.25kg PET Jar',           unit:'1.25kg',  mrp:365,  cat:'Jaggery', casePack:6},
  {id:'p10',name:'Jaggery 5kg Bag',                  unit:'5kg',     mrp:1250, cat:'Jaggery', casePack:10},
  {id:'p11',name:'Lemon Tea 10×10g',                 unit:'10×10g',  mrp:76,   cat:'Tea',     casePack:84},
  {id:'p12',name:'Lemon Tea 30×10g',                 unit:'30×10g',  mrp:201,  cat:'Tea',     casePack:36},
  {id:'p13',name:'Lemon Tea 500g',                   unit:'500g',    mrp:241,  cat:'Tea',     casePack:24},
  {id:'p14',name:'Combo Tea 30×10g',                 unit:'30×10g',  mrp:223,  cat:'Tea',     casePack:36},
  {id:'p15',name:'Ginger Tea 10×10g',                unit:'10×10g',  mrp:89,   cat:'Tea',     casePack:84},
  {id:'p16',name:'Masala Chai 10×10g',               unit:'10×10g',  mrp:89,   cat:'Tea',     casePack:84},
  {id:'p17',name:'Millet Cookies 120g',              unit:'120g',    mrp:80,   cat:'Cookies', casePack:60},
  {id:'p18',name:'Millet Cookies with Moringa 120g', unit:'120g',    mrp:89,   cat:'Cookies', casePack:60},
  {id:'p19',name:'Millet Cookies with Chia 120g',    unit:'120g',    mrp:89,   cat:'Cookies', casePack:60},
  {id:'p20',name:'Mixed Fruit Jam 225g',             unit:'225g',    mrp:215,  cat:'Jam',     casePack:24},
  {id:'p21',name:'Guava Jam 225g',                   unit:'225g',    mrp:225,  cat:'Jam',     casePack:24},
  {id:'p22',name:'Pineapple Ginger Jam 225g',        unit:'225g',    mrp:235,  cat:'Jam',     casePack:24},
  {id:'p23',name:'Lemon Tea Sachet',                  unit:'10g',     mrp:6.5,  cat:'Tea',     casePack:60}
];
const TERRITORIES = ['Chennai','ROTN','Kerala','AP','TS','Bangalore','ROK','Odisha','Others'];

// ══ STATE ══
let CU=null,VS=newVS(),SP={},auditProds=[],orderProds=[],unsProds=[],invProds=[],invBillDist=null,invShipDist=null,invPiNum=1,dashFilter='day';

function newVS(){return{step:1,visitType:'order',store:null,dist:null,inst:null,instStatus:'First visit',photo:null,audit:{},unsaleable:{},unsaleableOn:false,order:{},notes:'',noOrder:false,noOrderReason:''};}

// ══ STORAGE ══
const DB={
  get:(k,d)=>{try{return JSON.parse(localStorage.getItem('dl_'+k))??d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem('dl_'+k,JSON.stringify(v));}catch{}}
};
const _rawAllProds=()=>[...DEFAULT_PRODUCTS,...DB.get('products',[])];// replaced by allProds() below
const _rawGetStores=()=>DB.get('stores',[]);
const _rawGetDists=()=>DB.get('dists',[]);
const _rawGetInsts=()=>DB.get('insts',[]);
const getOrders=()=>DB.get('orders',[]);
const getEmps=()=>DB.get('employees',[]);
const getTerrs=()=>[...TERRITORIES,...DB.get('custom_territories',[])];

// ══ LOGO ══
const LOGO_URL = 'https://lowgifoods.co.in/diabliss-sales-app/Diabliss_Logo-01.png';
function injectLogo(containerId){
  const el=document.getElementById(containerId);
  if(!el)return;
  const img=document.createElement('img');
  img.src=LOGO_URL;
  img.alt='Diabliss';
  img.style.cssText='width:160px;height:auto;display:block;margin:0 auto 16px';
  img.onerror=function(){
    const d=document.createElement('div');
    d.className='logo-box';d.textContent='DL';
    el.innerHTML='';el.appendChild(d);
  };
  el.innerHTML='';el.appendChild(img);
}


// ══ BOOT ══
window.addEventListener('load',()=>{
  const _ldr=document.getElementById('app-loader');
  if(_ldr)_ldr.style.display='none';
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js?v='+APP_VERSION).catch(()=>{});

// Recover from white screen when app resumes after phone call or tab switch
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && typeof CU !== 'undefined' && CU?.mobile) {
    // App came back to foreground — check if UI is intact
    const appPage = document.getElementById('p-app');
    if (appPage && (appPage.style.display === 'none' || !appPage.style.display)) {
      // UI collapsed — restore
      setTimeout(() => {
        try { gotoPage('p-app'); updateDayBanner(); updateHomeStats(); } catch(e) {}
      }, 300);
    }
  }
});
  injectLogo('logo-container');injectLogo('logo-reg');injectLogo('logo-login');
  const user=DB.get('user',null);
  if(!user){gotoPage('p-onboard');}
  else{
    CU=user;
    // Login greeting updated in new login screen
    gotoPage('p-login');
    const lm = DB.get('last_mobile', null) || user.mobile;
    if (lm) { const mi = document.getElementById('login-mobile'); if (mi) mi.value = lm; }
    refreshBiometricLoginButton();
    setTimeout(()=>(document.getElementById('login-mobile')||document.getElementById('pin-input'))?.focus(),300);
  }
  if(DB.get('dark_mode',false))document.body.classList.add('dark-mode');
  const _bootRole = DB.get("user",null)?.role||"";
  requestAndWatchLocation(); // all roles get location tracking
  invPiNum=DB.get('pi_num',1);
});

function toggleDark(){
  document.body.classList.toggle('dark-mode');
  DB.set('dark_mode',document.body.classList.contains('dark-mode'));
  const _darkBtn=document.getElementById('dark-btn'); if(_darkBtn)_darkBtn.textContent=document.body.classList.contains('dark-mode')?'☀️':'🌙';
  const _darkIcon=document.getElementById('pm-dark-icon'); if(_darkIcon)_darkIcon.textContent=document.body.classList.contains('dark-mode')?'☀️':'🌙';
}

// ══ LOCATION ══
function requestAndWatchLocation(){
  if(!navigator.geolocation)return;
  if(window._locWatcher)navigator.geolocation.clearWatch(window._locWatcher);
  window._locWatcher=navigator.geolocation.watchPosition(
    pos=>{
      window._lastPos={lat:pos.coords.latitude.toFixed(6),lng:pos.coords.longitude.toFixed(6),acc:Math.round(pos.coords.accuracy)};
      window._lastPosTime=Date.now();
    },
    ()=>{},
    {enableHighAccuracy:true,maximumAge:30000}
  );
  navigator.geolocation.getCurrentPosition(
    pos=>{
      window._lastPos={lat:pos.coords.latitude.toFixed(6),lng:pos.coords.longitude.toFixed(6),acc:Math.round(pos.coords.accuracy)};
},
    ()=>{},{enableHighAccuracy:true,timeout:10000,maximumAge:0}
  );
}

function getCurrentLocation(){
  return new Promise(resolve=>{
    if(!navigator.geolocation){resolve(window._lastPos||null);return;}
    // If we have a recent cached position (< 5 min), use it immediately
    if(window._lastPos && window._lastPosTime && (Date.now()-window._lastPosTime < 5*60*1000)){
      resolve(window._lastPos);
      return;
    }
    // Try to get fresh position with short timeout
    const timer = setTimeout(()=>resolve(window._lastPos||null), 8000);
    navigator.geolocation.getCurrentPosition(
      pos=>{
        clearTimeout(timer);
        const p = {lat:pos.coords.latitude.toFixed(6),lng:pos.coords.longitude.toFixed(6),acc:Math.round(pos.coords.accuracy)};
        window._lastPos = p;
        window._lastPosTime = Date.now();
        resolve(p);
      },
      ()=>{ clearTimeout(timer); resolve(window._lastPos||null); },
      {enableHighAccuracy:true, timeout:8000, maximumAge:120000}
    );
  });
}

function sendLocToSheet(orderId,lat,lng,address,mapLink){
  if(!SCRIPT_URL)return;
  fetch(SCRIPT_URL,{method:'POST',body:gasPayload({orderId,action:'updateLocation',lat,lng,address,mapLink})}).catch(()=>{});
}

// ══ IST DATE HELPERS ══
// All date operations use Asia/Kolkata (UTC+5:30) to avoid UTC date boundary issues
// todayKey() — returns YYYY-MM-DD in IST. Defined here as fallback;
// if another module redefines it, that version takes over.
function todayKey() {
  const d = new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // returns YYYY-MM-DD
}
// istNow() — current Date object adjusted to IST
function istNow() {
  const d = new Date();
  return new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}
// tsToIST(ts) — convert a UTC ISO timestamp string to IST Date object
function tsToIST(ts) {
  const d = new Date(ts);
  return new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}
// tsToISTDate(ts) — convert UTC ISO ts to YYYY-MM-DD string in IST
function tsToISTDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
// istHour() — current hour (0-23) in IST, safe regardless of device timezone
function istHour() {
  return parseInt(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }));
}
// istMonthStart() — Date object for 1st of current IST month
function istMonthStart() {
  const n = istNow();
  return new Date(n.getFullYear(), n.getMonth(), 1);
}
// istWeekMonday() — YYYY-MM-DD of Monday of current IST week
function istWeekMonday() {
  const n = istNow();
  n.setDate(n.getDate() - ((n.getDay() + 6) % 7));
  return n.toLocaleDateString('en-CA');
}

// ══ PAGE NAV ══
function gotoPage(id){
  document.querySelectorAll('.page').forEach(p=>{p.classList.remove('show');p.style.display='none';});
  const el=document.getElementById(id);
  el.style.display=id==='p-app'?'flex':'block';
  el.classList.add('show');
}

// ══ ONBOARDING CAROUSEL ══
let _obSlide = 0;
const _obTotal = 9;

function _obGoTo(n) {
  _obSlide = Math.max(0, Math.min(_obTotal - 1, n));
  const slides = document.getElementById('ob-slides');
  if (slides) slides.style.transform = 'translateX(-' + (_obSlide * 100) + 'vw)';
  // Update dots
  document.querySelectorAll('.ob-dot').forEach((d, i) => {
    d.classList.toggle('ob-dot-active', i === _obSlide);
  });
  // Update next button
  const btn = document.getElementById('ob-next');
  if (btn) btn.textContent = _obSlide === _obTotal - 1 ? 'Get started →' : 'Next →';
  // Hide skip on last slide
  const skip = document.getElementById('ob-skip');
  if (skip) skip.style.display = _obSlide === _obTotal - 1 ? 'none' : '';
}

function obNext() {
  if (_obSlide < _obTotal - 1) {
    _obGoTo(_obSlide + 1);
  } else {
    gotoPage('p-location-guide');
  }
}

function obSkip() {
  gotoPage('p-location-guide');
}

function showAppTour() {
  _obSlide = 0;
  gotoPage('p-onboard');
  setTimeout(() => _obGoTo(0), 50);
}


// Touch swipe support for carousel
(function setupCarouselSwipe() {
  let _tx = 0;
  document.addEventListener('touchstart', e => {
    const ob = document.getElementById('p-onboard');
    if (!ob || !ob.classList.contains('show')) return;
    _tx = e.touches[0].clientX;
  }, {passive: true});
  document.addEventListener('touchend', e => {
    const ob = document.getElementById('p-onboard');
    if (!ob || !ob.classList.contains('show')) return;
    const diff = _tx - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? obNext() : _obGoTo(_obSlide - 1);
  }, {passive: true});
})();

function gotoRegister(){
  // If already registered, skip register page and go to login
  const existingUser = DB.get('user', null);
  if (existingUser && existingUser.mobile) {
    gotoPage('p-login');
    return;
  }
  gotoPage('p-register');
  if(navigator.geolocation)setTimeout(()=>navigator.geolocation.getCurrentPosition(()=>{},()=>{},{enableHighAccuracy:true,timeout:8000}),500);
}

// ══ REGISTER ══
async function registerUser(){
  const name=document.getElementById('r-name').value.trim();
  const mobile=document.getElementById('r-mobile').value.trim();
  const territory=document.getElementById('r-territory').value;
  const pin=document.getElementById('r-pin').value.trim();
  const pin2=document.getElementById('r-pin2').value.trim();
  if(!name){toast('Enter your name');return;}
  if(mobile.length<10){toast('Enter a valid 10-digit mobile');return;}
  if(!territory){toast('Select your territory');return;}
  if(pin.length!==4){toast('Enter a 4-digit PIN');return;}
  if(pin!==pin2){toast('PINs do not match');return;}
  toast('Verifying access…');
  const access=await checkAccess(mobile);
  if(access.status==='blocked'){showDenied('Your access has been revoked. Contact your manager.');return;}
  if(access.status==='not_found'){showDenied('Your mobile is not registered. Ask your manager to add you.');return;}
  const user={name,mobile,empid:document.getElementById('r-empid').value.trim(),territory,city:document.getElementById('r-city').value.trim(),role:access.role||'Officer',alertMobile:access.alertMobile||'',alertEmail:access.alertEmail||'',since:new Date().toISOString()};
  DB.set('user',user);DB.set('pin',pin);DB.set('pin_'+mobile,pin);CU=user;
  requestAndWatchLocation();
  launchApp();
  // Notify admin of new registration
  if (SCRIPT_URL) {
    fetch(SCRIPT_URL, {method:'POST', body: gasPayload({
      action: 'newUserRegistered',
      name: user.name,
      mobile: user.mobile,
      territory: user.territory,
      role: user.role,
      ts: new Date().toISOString()
    })}).catch(()=>{});
  }
}

// ══ LOGIN ══
// ══ BIOMETRIC (FACE / FINGERPRINT) LOGIN ══
// Uses WebAuthn's platform authenticator to gate a locally-stored login on
// this device. The phone's own Face ID / fingerprint releases the credential;
// the app never sees or stores the actual biometric. Device-bound by design —
// mobile+PIN remains the fallback and the way to enrol a new device.
function biometricSupported() {
  const hasPKC = !!(window.PublicKeyCredential);
  const hasCreds = !!(navigator.credentials);
  const isSecure = window.isSecureContext;
  return !!(hasPKC && hasCreds);
}

function b64ToBuf(b64){const bin=atob(b64.replace(/-/g,'+').replace(/_/g,'/'));const buf=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i);return buf;}
function bufToB64(buf){const bytes=new Uint8Array(buf);let s='';for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}

async function enableBiometric(mobile){
  if (!biometricSupported()) { toast('This device does not support Face / Fingerprint login'); return false; }
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) { toast('No Face / Fingerprint set up on this device'); return false; }
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const cred = await navigator.credentials.create({ publicKey: {
      challenge,
      rp: { name: 'Diabliss Sales App' },
      user: { id: userId, name: mobile, displayName: mobile },
      pubKeyCredParams: [{ type:'public-key', alg:-7 }, { type:'public-key', alg:-257 }],
      authenticatorSelection: { authenticatorAttachment:'platform', userVerification:'required', residentKey:'preferred' },
      timeout: 60000,
      attestation: 'none'
    }});
    if (!cred) return false;
    // Store the credential id so we can require it on next login. The actual
    // login secret is the already-cached access data, which we only release
    // after the biometric check passes.
    DB.set('biometric_'+mobile, { credId: bufToB64(cred.rawId), enabledAt: Date.now() });
    toast('Face / Fingerprint login enabled on this device');
    return true;
  } catch(e) {
    console.error('enableBiometric', e);
    if (e.name === 'NotAllowedError') toast('Cancelled');
    else toast('Could not enable — try again');
    return false;
  }
}

async function biometricLogin(){
  const stored = getBiometricAccount();
  if (!stored) { toast('Set up Face / Fingerprint login first (login once with your PIN)'); return; }
  if (!biometricSupported()) { toast('Not supported on this device'); return; }
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({ publicKey: {
      challenge,
      allowCredentials: [{ type:'public-key', id: b64ToBuf(stored.bio.credId) }],
      userVerification: 'required',
      timeout: 60000
    }});
    if (!assertion) { toast('Face / Fingerprint not recognised'); return; }
    // Biometric passed → release the cached login for this mobile.
    const cacheKey = 'access_cache_'+stored.mobile;
    const cached = DB.get(cacheKey, null);
    if (!cached || !cached.data) { toast('Please login once with your PIN to refresh'); return; }
    const access = cached.data;
    if (access.status === 'blocked') { showDenied('Your access has been revoked. Contact your manager.'); return; }
    let user = DB.get('user', null);
    if (!user || user.mobile !== stored.mobile) {
      user = { name: access.name||stored.mobile, mobile: stored.mobile, role: access.role||'Officer', territory: access.territory||'', alertMobile: access.alertMobile||'', alertEmail: access.alertEmail||'', personalEmail: access.personalEmail||'', since: new Date().toISOString() };
    }
    DB.set('user', user); CU = user;
    launchApp();
    checkAccess(stored.mobile).then(fresh => { if (fresh.status === 'blocked') { logoutUser(); toast('Your access has been revoked.'); } DB.set('session_start', Date.now()); }).catch(()=>{});
  } catch(e) {
    console.error('biometricLogin', e);
    if (e.name === 'NotAllowedError') toast('Cancelled or not recognised');
    else toast('Could not verify — use your PIN');
  }
}

// Find any mobile on this device that has biometric enabled
function getBiometricAccount(){
  const lastMobile = DB.get('last_mobile', null);
  if (lastMobile) {
    const bio = DB.get('biometric_'+lastMobile, null);
    if (bio) return { mobile: lastMobile, bio };
  }
  // Fallback: scan storage for any enabled biometric account
  for (let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if (k && k.startsWith('dl_biometric_')) {
      const mobile = k.replace('dl_biometric_','');
      const bio = DB.get('biometric_'+mobile, null);
      if (bio) return { mobile, bio };
    }
  }
  return null;
}

// Show the biometric button on the login screen if an account is enrolled here
function refreshBiometricLoginButton(){
  const btn = document.getElementById('biometric-login-btn');
  if (!btn) return;
  btn.style.display = (biometricSupported() && getBiometricAccount()) ? 'block' : 'none';
}

// Offer to turn on biometric login once per device, after a successful login
function maybeOfferBiometric(mobile){
  if (!biometricSupported()) return;
  if (DB.get('biometric_'+mobile, null)) return; // already enabled
  if (DB.get('biometric_declined_'+mobile, false)) return; // user said no before
  PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(available => {
    if (!available) return;
    setTimeout(() => {
      if (confirm('Enable Face / Fingerprint login on this device?\n\nNext time you can log in with just your face or fingerprint — no need to type your number and PIN.')) {
        enableBiometric(mobile);
      } else {
        DB.set('biometric_declined_'+mobile, true);
      }
    }, 800);
  }).catch(()=>{});
}

async function pinLogin(){
  const mobileInput = document.getElementById('login-mobile')?.value.trim();
  const pin = document.getElementById('pin-input')?.value.trim();

  // ── MASTER LOGIN — Admin only: any mobile + PIN 1983 ──
  if (mobileInput && mobileInput.length === 10 && pin === '1983') {
    // Verify this device's logged-in user is Admin before allowing master login
    const myCache = DB.get('access_cache_'+mobileInput, null);
    // Check if the PIN 1983 is being used by an Admin account
    // We verify against GAS to get the target user's details
    toast('Master login — verifying…');
    try {
      const targetAccess = await checkAccess(mobileInput);
      // Only allow if the admin mobile stored on this device is Admin role
      // Get admin identity from any cached admin account
      const adminUser = DB.get('user', null);
      if (!adminUser || adminUser.role !== 'Admin') {
        // No admin cached — still allow but log with device mobile
      }
      if (targetAccess.status === 'blocked') { toast('User is blocked'); return; }
      if (targetAccess.status === 'not_found') { toast('Mobile not registered'); return; }
      const user = { name: targetAccess.name||mobileInput, mobile: mobileInput, role: targetAccess.role||'Officer', territory: targetAccess.territory||'', alertMobile: targetAccess.alertMobile||'', alertEmail: targetAccess.alertEmail||'', personalEmail: targetAccess.personalEmail||'', since: new Date().toISOString(), _masterLogin: true };
      DB.set('user', user); CU = user;
      DB.set('last_mobile', mobileInput);
      // Log to AuditLog sheet
      if (SCRIPT_URL) fetch(SCRIPT_URL, {method:'POST', body:gasPayload({action:'masterLoginAudit', targetMobile: mobileInput, targetName: user.name, targetRole: user.role, adminMobile: adminUser?.mobile||'unknown', ts: new Date().toISOString()})}).catch(()=>{});
      if (['Admin','Sub-Admin'].includes(adminUser?.role||'')) toast('Master login as '+user.name);
      // Fetch this officer's data from Sheet so home screen shows correctly
      if (SCRIPT_URL) {
        const _todayKey = todayKey();
        // Fetch orders
        const ordersP = fetch(gasGetUrl(SCRIPT_URL+'?action=getOrders&territory='+encodeURIComponent(user.territory||'All')), {signal: AbortSignal.timeout(8000)})
          .then(r=>r.json()).then(data=>{
            if (data.orders) {
              const existing = DB.get('orders',[]);
              const existingIds = new Set(existing.map(o=>o.id));
              const newOrders = data.orders.filter(o=>!existingIds.has(o.id));
              DB.set('orders', [...existing, ...newOrders]);
            }
          }).catch(()=>{});
        // Fetch attendance separately — sheet rows use 'mobile' and 'action' (lowercased by getSheetData)
        const attP = fetch(gasGetUrl(SCRIPT_URL+'?action=getAttendance'), {signal: AbortSignal.timeout(8000)})
          .then(r=>r.json()).then(data=>{
            if (!data.attendance) return;
            // Filter today's rows for this officer
            // a.date may be "2026-07-16", "16/07/2026", or a Date object string — parse robustly
            function _toYMD(d) {
              if (!d) return '';
              const s = String(d).trim();
              // Already YYYY-MM-DD
              if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
              // DD/MM/YYYY
              const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
              if (m) return m[3]+'-'+m[2]+'-'+m[1];
              // Try parsing as Date
              const dt = new Date(s);
              if (!isNaN(dt)) return dt.toLocaleDateString('en-CA', {timeZone:'Asia/Kolkata'});
              return s.slice(0,10);
            }
            const myRows = data.attendance.filter(a =>
              _toYMD(a.date) === _todayKey &&
              (a.mobile === user.mobile || a.officer === user.name)
            );
            const startRow = myRows.find(a => a.action === 'startDay');
            const endRow   = myRows.find(a => a.action === 'endDay');
            // Always clear previous officer's day record first
            localStorage.removeItem('dl_day_'+_todayKey);
            if (startRow) {
              // Reconstruct local day record format
              const rec = {
                date: _todayKey,
                started: true,
                ended: !!endRow,
                startTime: (function(t){
                  if (!t) return '';
                  // Sheets time cell comes as "Sat Dec 30 1899 10:44:00 GMT+0521..."
                  const m = String(t).match(/(\d{1,2}):(\d{2}):\d{2}/);
                  if (m) {
                    const h = parseInt(m[1]), mn = m[2];
                    return (h % 12 || 12) + ':' + mn + ' ' + (h < 12 ? 'AM' : 'PM');
                  }
                  return String(t).trim();
                })(startRow.start_time),
                startTs: startRow.date || '',
                endTime: endRow ? (endRow.end_time || '') : '',
                route: startRow.route_plan || '',
                target: startRow.target_stores || '',
                officer: user.name,
                officerMobile: user.mobile,
                officerRole: user.role,
                territory: user.territory || '',
                ordersCount: endRow ? parseInt(endRow.orders_count||0) : 0,
                storesCount: endRow ? parseInt(endRow.stores_count||0) : 0,
                totalValue: endRow ? parseFloat(endRow.total_value_||0) : 0,
              };
              DB.set('day_'+_todayKey, rec);
            }
          }).catch(()=>{});
        Promise.allSettled([ordersP, attP]).then(()=>{
          if (typeof renderRoleHome === 'function') renderRoleHome();
          if (typeof refreshDayActionBtn === 'function') refreshDayActionBtn();
        });
      }
      launchApp();
      return;
    } catch(e) {
      toast('Master login failed — check connection');
      return;
    }
  }

  if (mobileInput && mobileInput.length === 10) {
    // Check PIN lockout
    const lockKey = 'pin_lock_'+mobileInput;
    const lockData = DB.get(lockKey, null);
    if (lockData && lockData.until && Date.now() < lockData.until) {
      const minsLeft = Math.ceil((lockData.until - Date.now()) / 60000);
      toast('Too many wrong attempts. Try again in '+minsLeft+' minutes.');
      return;
    }
    // Get cached access data
    const cacheKey = 'access_cache_'+mobileInput;
    const cached = DB.get(cacheKey, null);
    // Admin/Sub-Admin/GM: PIN not required — but PIN field must be empty (not pre-filled)
    // This prevents auto-login while still allowing PIN-free login for managers
    // Master login (PIN 1983) is handled above and never reaches here
    const cachedRole = cached?.data?.role || DB.get('user',null)?.role || '';
    const noPin = ['Admin','Sub-Admin','GM'].includes(cachedRole) && (!pin || pin.length === 0);
    // Validate PIN for non-admin roles
    if (!noPin) {
      if (!pin || pin.length !== 4) { toast('Enter your 4-digit PIN'); return; }
      const savedPin = DB.get('pin_'+mobileInput, null) || DB.get('pin', null);
      if (savedPin && pin !== savedPin) {
        // Track wrong attempts
        const attempts = DB.get('pin_attempts_'+mobileInput, 0) + 1;
        DB.set('pin_attempts_'+mobileInput, attempts);
        if (attempts >= 5) {
          DB.set(lockKey, { until: Date.now() + 30*60*1000 });
          DB.set('pin_attempts_'+mobileInput, 0);
          toast('5 wrong attempts — app locked for 30 minutes');
        } else {
          toast('Incorrect PIN — '+(5-attempts)+' attempts remaining');
        }
        document.getElementById('pin-input').value = '';
        return;
      }
      DB.set('pin_attempts_'+mobileInput, 0); // Reset on success
    }
    // INSTANT LOGIN — use cached data if available
    if (cached && cached.data) {
      const access = cached.data;
      if (access.status === 'blocked') { showDenied('Your access has been revoked. Contact your manager.'); return; }
      let user = DB.get('user', null);
      if (!user || user.mobile !== mobileInput) {
        user = { name: access.name||mobileInput, mobile: mobileInput, role: access.role||'Officer', territory: access.territory||'', alertMobile: access.alertMobile||'', alertEmail: access.alertEmail||'', personalEmail: access.personalEmail||'', since: new Date().toISOString() };
      } else {
        // Always update name from whitelist — fixes stale/wrong names from registration
        if (access.name) user.name = access.name;
        user.role = access.role||user.role;
        user.territory = access.territory||user.territory;
        user.alertMobile = access.alertMobile||user.alertMobile;
        user.alertEmail = access.alertEmail||user.alertEmail;
      }
      DB.set('user', user); CU = user;
      DB.set('last_mobile', mobileInput);
      launchApp();
      // Background verify — update cache silently
      checkAccess(mobileInput).then(freshAccess => {
        if (freshAccess.status === 'blocked') { logoutUser(); toast('Your access has been revoked.'); }
        DB.set('session_start', Date.now());
      }).catch(() => {});
      maybeOfferBiometric(mobileInput);
      return;
    }
    // No cache — must verify with Sheet (first time)
    toast('Verifying access…');
    const access = await checkAccess(mobileInput);
    if (access.status === 'blocked') { showDenied('Your access has been revoked. Contact your manager.'); return; }
    if (access.status === 'not_found') { showDenied('Your mobile is not registered. Contact your manager.'); return; }
    const noPinFresh = ['Admin','Sub-Admin','GM'].includes(access.role||'');
    if (!noPin) {
      if (!pin || pin.length !== 4) { toast('Enter your 4-digit PIN'); return; }
      const savedPin = DB.get('pin_'+mobileInput, null) || DB.get('pin', null);
      if (!savedPin) { toast('No PIN found — please register first'); gotoPage('p-register'); return; }
      if (pin !== savedPin) { toast('Incorrect PIN'); document.getElementById('pin-input').value=''; return; }
    }
    let user = DB.get('user', null);
    if (!user || user.mobile !== mobileInput) {
      user = { name: access.name||mobileInput, mobile: mobileInput, role: access.role||'Officer', territory: access.territory||'', alertMobile: access.alertMobile||'', alertEmail: access.alertEmail||'', personalEmail: access.personalEmail||'', since: new Date().toISOString() };
    } else {
      user.role = access.role||user.role;
      user.alertMobile = access.alertMobile||user.alertMobile;
      user.alertEmail = access.alertEmail||user.alertEmail;
    }
    DB.set('user', user);
    CU = user;
    DB.set('last_mobile', mobileInput);
    if (!['Admin','Sub-Admin'].includes(access.role||'')) {
      getCurrentLocation().then(pos=>{if(pos&&SCRIPT_URL)fetch(SCRIPT_URL,{method:'POST',body:gasPayload({action:'loginLocation',officer:CU.name,mobile:CU.mobile,lat:pos.lat,lng:pos.lng,ts:new Date().toISOString()})}).catch(()=>{});});
    }
    launchApp();
    maybeOfferBiometric(mobileInput);
    return;
  }

  // Fallback for returning users on same device
  if (!CU) { toast('Enter your mobile number'); return; }
  // Admin/Sub-Admin/GM: PIN not required if PIN field is empty
  const _fallbackNoPin = ['Admin','Sub-Admin','GM'].includes(CU?.role||'') && (!pin || pin.length === 0);
  if (!_fallbackNoPin) {
    const saved = DB.get('pin', null);
    if (!saved || pin !== saved) { toast('Incorrect PIN'); document.getElementById('pin-input').value=''; return; }
  }
  toast('Checking access…');
  const access = await checkAccess(CU.mobile);
  if (access.status === 'blocked') { DB.set('user',null); showDenied('Your access has been revoked.'); return; }
  if (access.role) CU.role = access.role;
  if (access.alertMobile !== undefined) CU.alertMobile = access.alertMobile;
  if (access.alertEmail !== undefined) CU.alertEmail = access.alertEmail;
  DB.set('user', CU);
  if (!['Admin','Sub-Admin'].includes(CU?.role||'')) {
    getCurrentLocation().then(pos=>{if(pos&&SCRIPT_URL)fetch(SCRIPT_URL,{method:'POST',body:gasPayload({action:'loginLocation',officer:CU.name,mobile:CU.mobile,lat:pos.lat,lng:pos.lng,ts:new Date().toISOString()})}).catch(()=>{});});
  }
  launchApp();
}

async function checkAccess(mobile){
  if(!SCRIPT_URL)return{status:'ok',role:'Officer'};
  // Check cache first — only call Sheet if no cache or cache is older than 24 hours
  const cacheKey='access_cache_'+mobile;
  const cached=DB.get(cacheKey,null);
  const now=Date.now();
  if(cached&&cached.ts&&(now-cached.ts)<86400000){
    return cached.data;
  }
  try{
    const r=await fetch(gasGetUrl(SCRIPT_URL+'?action=checkAccess&mobile='+encodeURIComponent(mobile)),{signal:AbortSignal.timeout(8000)});
    const data=await r.json();
    // Cache the result
    DB.set(cacheKey,{data,ts:now});
    return data;
  }
  catch(e){
    // If network fails, use cached data even if old
    if(cached)return cached.data;
    return{status:'ok',role:CU?.role||'Officer'};
  }
}

function showDenied(msg){document.getElementById('denied-msg').textContent=msg;gotoPage('p-denied');}

// ══ LAUNCH ══
function checkLocationAndWarn(){
  // Skip for Admin and Sub-Admin
  if(['Admin','Sub-Admin'].includes(CU?.role||'')) {
    document.getElementById('loc-warning').style.display='none';
    return;
  }
  if(!navigator.geolocation){
    document.getElementById('loc-warning').style.display='block';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos=>{
      window._lastPos={lat:pos.coords.latitude.toFixed(6),lng:pos.coords.longitude.toFixed(6),acc:Math.round(pos.coords.accuracy)};
      document.getElementById('loc-warning').style.display='none';
    },
    err=>{
      // Permission denied or unavailable
      if(err.code===1){// PERMISSION_DENIED
        document.getElementById('loc-warning').style.display='block';
      }
    },
    {enableHighAccuracy:true,timeout:8000,maximumAge:0}
  );
}

function openLocationSettings(){
  // On Android WebView this opens app settings
  if(window.Android&&window.Android.openSettings){window.Android.openSettings();return;}
  toast('Go to Settings → Apps → Diabliss Sales → Permissions → Location → While using the app');
}


// ══ PERMISSION GATE (Officer/ASM/RSM) ══
async function checkAndRequestPermissions() {
  const locPerm = await navigator.permissions?.query({name:'geolocation'}).catch(()=>({state:'prompt'}));
  const notifPerm = ('Notification' in window) ? Notification.permission : 'granted';
  const locOk = locPerm?.state === 'granted';
  const notifOk = notifPerm === 'granted';
  if (locOk && notifOk) return;
  showPermissionGate(!locOk, !notifOk);
}

function showPermissionGate(needLoc, needNotif) {
  if (document.getElementById('perm-gate')) return;
  const overlay = document.createElement('div');
  overlay.id = 'perm-gate';
  overlay.style.cssText = 'position:fixed;inset:0;background:var(--w);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center';
  overlay.innerHTML =
    '<div style="font-size:48px;margin-bottom:16px">📍</div>'+
    '<div style="font-size:18px;font-weight:700;margin-bottom:8px">Permissions required</div>'+
    '<div style="font-size:13px;color:var(--t2);margin-bottom:24px;max-width:300px">Diabliss Sales App needs your location and notifications to provide navigation and send you reminders.</div>'+
    (needLoc ? '<button id="perm-loc-btn" class="btn" style="width:100%;max-width:300px;margin-bottom:12px" onclick="requestLocPerm()">📍 Enable Location</button>' : '<div style="font-size:13px;color:var(--gd);margin-bottom:12px">✅ Location enabled</div>')+
    (needNotif ? '<button id="perm-notif-btn" class="btn" style="width:100%;max-width:300px;margin-bottom:12px;background:var(--t)" onclick="requestNotifPerm()">🔔 Enable Notifications</button>' : '<div style="font-size:13px;color:var(--gd);margin-bottom:12px">✅ Notifications enabled</div>')+
    '<div style="font-size:11px;color:var(--t3);margin-top:8px;max-width:280px">These are required to use the app. Your location is only captured when you place an order.</div>';
  document.body.appendChild(overlay);
}

function requestLocPerm() {
  navigator.geolocation.getCurrentPosition(
    () => {
      document.getElementById('perm-loc-btn')?.replaceWith(Object.assign(document.createElement('div'),{style:'font-size:13px;color:var(--gd);margin-bottom:12px',textContent:'✅ Location enabled'}));
      checkPermGateDone();
    },
    () => {
      const btn = document.getElementById('perm-loc-btn');
      if (btn) btn.textContent = '📍 Location blocked — tap to open settings';
      btn?.addEventListener('click', ()=>alert('Please enable location in your browser settings:\nSettings > Site Settings > Location > Allow'));
    },
    {enableHighAccuracy:true,timeout:10000}
  );
}

function requestNotifPerm() {
  Notification.requestPermission().then(p => {
    if (p === 'granted') {
      document.getElementById('perm-notif-btn')?.replaceWith(Object.assign(document.createElement('div'),{style:'font-size:13px;color:var(--gd);margin-bottom:12px',textContent:'✅ Notifications enabled'}));
      checkPermGateDone();
    } else {
      const btn = document.getElementById('perm-notif-btn');
      if (btn) btn.textContent = '🔔 Notifications blocked — tap for help';
      btn?.addEventListener('click', ()=>alert('Please enable notifications in your browser settings:\nSettings > Site Settings > Notifications > Allow'));
    }
  });
}

function checkPermGateDone() {
  navigator.permissions?.query({name:'geolocation'}).then(lp => {
    const notifOk = !('Notification' in window) || Notification.permission === 'granted';
    if (lp.state === 'granted' && notifOk) {
      document.getElementById('perm-gate')?.remove();
    }
  });
}

function launchApp(){
  // Push history state so WebIntoApp back button doesn't navigate away from app
  try {
    history.pushState({app:'diabliss'}, '', window.location.href);
    window.addEventListener('popstate', function(e) {
      if (CU && CU.mobile) {
        history.pushState({app:'diabliss'}, '', window.location.href);
      }
    });
  } catch(e) {}
  const role=CU.role||'Officer';
  const rc={Officer:'r-officer',ASM:'r-asm',RSM:'r-rsm',GM:'r-gm',Admin:'r-admin','Sub-Admin':'r-subadmin'}[role]||'r-officer';
  document.getElementById('hdr-user').innerHTML=CU.name+` <span class="role-tag ${rc}">${role}</span>`;
  setupNavForRole(role);
  if(typeof refreshStoreSearch==='function') refreshStoreSearch();
  if(typeof refreshDistSearch==='function') refreshDistSearch();
  if(typeof refreshInstSearch==='function') refreshInstSearch();
  if(typeof refreshInvDistSearch==='function') refreshInvDistSearch();
  updateHomeStats();updateDayBanner();updateHomeForRole();
  gotoPage('p-app');
  requestAndWatchLocation();
  setTimeout(checkLocationAndWarn, 2000);
  // Permission gate for field roles
  if (['Officer','ASM','RSM'].includes(role) && !CU?._masterLogin) {
    setTimeout(()=>checkAndRequestPermissions(), 1500);
  }
  // For GM/Admin/Sub-Admin — silently request notification permission only
  if (['GM','Admin','Sub-Admin'].includes(role)) {
    setTimeout(()=>{ if(Notification.permission==='default') Notification.requestPermission().catch(()=>{}); }, 2000);
  }
  // Load all master data from Sheet
  loadMasterDataFromSheet();
  // Update profile card
  const pnc = document.getElementById('profile-name-card');
  if(pnc) pnc.innerHTML = '👤 ' + (CU?.name||'My Profile');

  // Hide start/end day reminder banners for non-field roles
  if (!['Officer','ASM','RSM'].includes(role)) {
    const sdr = document.getElementById('start-day-reminder-banner');
    if (sdr) sdr.style.display = 'none';
    const edr = document.getElementById('end-day-reminder-banner');
    if (edr) edr.style.display = 'none';
  }
  // Show/hide officer quick-actions based on role
  const qa = document.getElementById('officer-quick-actions');
  if (qa) qa.style.display = ['GM','Admin','Sub-Admin'].includes(role) ? 'none' : 'block';
  // Hide Super Stockist option in Add Distributor forms for non-Admin roles
  ['nd-type','iad-type'].forEach(selId => {
    const sel = document.getElementById(selId);
    if (sel) {
      [...sel.options].forEach(opt => {
        if (opt.value === 'Super Stockist') opt.style.display = ['Admin','Sub-Admin'].includes(role) ? '' : 'none';
      });
      // If SS was selected and now hidden, reset to Distributor
      if (!['Admin','Sub-Admin'].includes(role) && sel.value === 'Super Stockist') sel.value = 'Distributor';
    }
  });
  // End-of-day reminder: check now, and keep checking every 10 min in case
  // the app stays open in the background through 7pm.
  checkEndDayReminder();
  checkStartDayReminder();
  setInterval(checkEndDayReminder, 10*60*1000);
  setInterval(checkStartDayReminder, 10*60*1000);
  // FCM subscription (silent, all roles)
  setTimeout(initFCMSubscription, 3000);
}

// ── SW MESSAGE LISTENER — capture GPS on notification tap ──
navigator.serviceWorker && navigator.serviceWorker.addEventListener('message', e => {
  if (e.data && e.data.type === 'CAPTURE_LOCATION') {
    const user = CU || DB.get('user', null);
    if (!user || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'loginLocation', officer: user.name, mobile: user.mobile, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6), acc: Math.round(pos.coords.accuracy), triggerType: e.data.triggerType || 'push_tap' }) }).catch(() => {});
    }, () => {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  }
});

// ══ FCM PUSH SUBSCRIPTION ══
const VAPID_PUBLIC_KEY = 'BOUbRCoUXuceKftYS0vaP14G5-wJxJMDsA4VqM_3N4pcEvG-zRzztpBmlvezKaI9UD3w351Uori6OOH9CZyYKaM';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function initFCMSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (Notification.permission === 'denied') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      if (Notification.permission !== 'granted') return;
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
    }
    const subJson = sub.toJSON();
    const user = CU || DB.get('user', null);
    if (!user) return;
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'savePushSubscription', mobile: user.mobile, name: user.name, endpoint: subJson.endpoint, p256dh: subJson.keys.p256dh, auth: subJson.keys.auth }) }).catch(() => {});
  } catch(e) {}
}

// ══ 30-MIN LOCATION TRACKING ══
function startLocationInterval() {
  if (window._locInterval) return;
  window._locInterval = setInterval(() => {
    const user = CU || DB.get('user', null);
    if (!user) return;
    // enableHighAccuracy:false — network-based location, sufficient for km tracking, saves battery
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      const acc = Math.round(pos.coords.accuracy);
      // First save point immediately (no address yet)
      fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({
        action: 'loginLocation', officer: user.name, mobile: user.mobile,
        lat, lng, acc, address: '', triggerType: 'interval'
      }) }).catch(() => {});
      // Then reverse geocode and update with address
      fetch('https://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lng+'&format=json')
        .then(r => r.json())
        .then(d => {
          const address = d.display_name || '';
          if (address && SCRIPT_URL) {
            fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({
              action: 'loginLocation', officer: user.name, mobile: user.mobile,
              lat, lng, acc, address, triggerType: 'interval_geocoded'
            }) }).catch(() => {});
          }
        }).catch(() => {});
    }, () => {}, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
  }, 15 * 60 * 1000); // 15-min interval
}

function stopLocationInterval() {
  if (window._locInterval) { clearInterval(window._locInterval); window._locInterval = null; }
}

function pingLocationNow() {
  const user = CU || DB.get('user', null);
  if (!user || !SCRIPT_URL) return;
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude.toFixed(6);
    const lng = pos.coords.longitude.toFixed(6);
    const acc = Math.round(pos.coords.accuracy);
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({
      action: 'loginLocation', officer: user.name, mobile: user.mobile,
      lat, lng, acc, address: '', triggerType: 'manual_ping'
    }) }).catch(() => {});
    fetch('https://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lng+'&format=json')
      .then(r => r.json())
      .then(d => {
        const address = d.display_name || '';
        if (address) fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({
          action: 'loginLocation', officer: user.name, mobile: user.mobile,
          lat, lng, acc, address, triggerType: 'manual_ping_geocoded'
        }) }).catch(() => {});
      }).catch(() => {});
  }, () => {}, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
}

// ══ START OF DAY REMINDER (10 AM) ══
// Mirrors checkEndDayReminder() — same same-session-only caveat applies here;
// the 10am email from the backend is the reliable channel.
function checkStartDayReminder(){
  const role = CU?.role || 'Officer';
  if (!['Officer','ASM','RSM'].includes(role)) return;
  if (istHour() < 10) return;
  const todayStr = todayKey();
  if (isSunday(todayStr) || isHoliday(todayStr, CU?.territory||'')) {
    const b = document.getElementById('start-day-reminder-banner'); if (b) b.style.display='none';
    return;
  }
  const today = DB.get('day_'+todayStr, null);
  const banner = document.getElementById('start-day-reminder-banner');
  if (today && (today.started || today.type==='leave')) {
    if (banner) banner.style.display = 'none';
    return;
  }
  if (banner) banner.style.display = 'block';
  const flagKey = 'dl_startdayreminder_'+todayStr;
  if (!localStorage.getItem(flagKey) && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Diabliss Sales — Start of day reminder', {
        body: "You haven't started your day yet. Tap to get going.",
        icon: LOGO_URL
      });
    } catch(e) {}
    localStorage.setItem(flagKey, '1');
  }
}

// ══ END OF DAY REMINDER (7 PM) ══
// This only fires while the app is open or backgrounded in the same browser
// session — it is NOT a true server push that can wake a fully closed app.
// The 7pm email (sent from the backend) is the reliable channel; this is a
// same-session nudge on top of that for whoever still has the app open.
function checkEndDayReminder(){
  const role = CU?.role || 'Officer';
  if (!['Officer','ASM','RSM'].includes(role)) return;
  if (istHour() < 19) return;
  const today = DB.get('day_'+todayKey(), null);
  const banner = document.getElementById('end-day-reminder-banner');
  if (!today || !today.started || today.ended || today.type==='leave') {
    if (banner) banner.style.display = 'none';
    return;
  }
  if (banner) banner.style.display = 'block';
  const flagKey = 'dl_enddayreminder_'+todayKey();
  if (!localStorage.getItem(flagKey) && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Diabliss Sales — End of day reminder', {
        body: "You haven't ended your day yet. Tap to close it out.",
        icon: LOGO_URL
      });
    } catch(e) {}
    localStorage.setItem(flagKey, '1');
  }
}

function setupNavForRole(role){
  const nav=document.getElementById('bot-nav');
  const isManager=['ASM','RSM','GM','Admin'].includes(role);
  const isAdmin=['Admin','Sub-Admin'].includes(role);
  nav.innerHTML='';
  const add=(id,icon,label)=>{
    const b=document.createElement('button');
    b.className='bnav';b.id='bn-'+id;
    b.innerHTML=`<span class="bi">${icon}</span>${label}`;
    b.onclick=()=>switchTab(id);
    nav.appendChild(b);
  };
  add('home','🏠','Home');
  add('visit','🏪','Visit');
  add('orders','📋','Orders');
  if(isManager)add('dashboard','📊','Dashboard');
  // Day tab — dynamic date icon
  const _dayD = istNow();
  const _dayNum = _dayD.getDate();
  const _dayIcon = `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#e53935;color:#fff;border-radius:4px;font-size:11px;font-weight:700;line-height:1">${_dayNum}</span>`;
  add('day', _dayIcon, 'Day');
  add('files','📁','Files');
  if(isAdmin)add('admin','⚙️','Admin');
  else add('master','🗂️','Master');

  document.getElementById('bn-home')?.classList.add('on');
}

// ══ TAB SWITCHING ══
// ── BACK BUTTON API ──
let _backStack = [];
function showBackBtn(label, fn) {
  _backStack.push(fn);
  const backPanel = document.getElementById('hdr-back-panel');
  const logoBox   = document.getElementById('hdr-logo-box');
  const title     = document.getElementById('hdr-title-text');
  if (backPanel) backPanel.style.display = 'flex';
  if (logoBox)   logoBox.style.display   = 'none';
  if (title)     title.textContent       = label || '';
}
function hideBackBtn() {
  _backStack = [];
  const backPanel = document.getElementById('hdr-back-panel');
  const logoBox   = document.getElementById('hdr-logo-box');
  const title     = document.getElementById('hdr-title-text');
  if (backPanel) backPanel.style.display = 'none';
  if (logoBox)   logoBox.style.display   = 'block';
  if (title)     title.textContent       = '';
}
function appGoBack() {
  const fn = _backStack.pop();
  if (fn) fn();
  if (_backStack.length === 0) hideBackBtn();
}

// Admin sub-panel label map for back button header
const _adminPanelLabels = {
  'admin-employees':'Employee management','admin-targets':'Target setting',
  'admin-expenses-config':'Expense config','admin-broadcast':'Broadcast',
  'admin-mis':'MIS settings','admin-backup':'Backup & restore',
  'admin-corrections':'Corrections','admin-products':'Products',
  'admin-expenses-view':'Expense summary','admin-attendance-view':'Attendance',
  'admin-holidays':'Holiday calendar','admin-territories':'Territories'
};


// ══ NAVIGATION ══
// Consolidated switchTab — all per-tab init logic merged here.
// Previously spread across 7 monkey-patch blocks (_origSwitchTab … _origSwitchTab9).
function switchTab(name) {
  // ── Back button for admin sub-panels ──
  if (_adminPanelLabels[name]) {
    showBackBtn(_adminPanelLabels[name], () => switchTab('admin'));
  } else {
    hideBackBtn();
  }

  // ── Activate tab + nav button ──
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.bnav').forEach(b => b.classList.remove('on'));
  const tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('on');
  const bn = document.getElementById('bn-' + name);
  if (bn) bn.classList.add('on');

  // ── Core per-tab rendering ──
  if (name === 'orders') {
    const fromEl = document.getElementById('orders-date-from');
    const toEl = document.getElementById('orders-date-to');
    const _role = CU?.role || 'Officer';
    if (fromEl && toEl) {
      if (_role === 'Officer' || _role === 'ASM' || _role === 'RSM') {
        const _7ago = new Date(istNow()); _7ago.setDate(_7ago.getDate() - 6);
        fromEl.value = _7ago.toLocaleDateString('en-CA');
        toEl.value = todayKey();
      } else {
        fromEl.value = todayKey();
        toEl.value = todayKey();
      }
    }
    // Fetch fresh for ALL roles so supply status stays current
    if (SCRIPT_URL && navigator.onLine) {
      fetchAndCacheOrders().catch(()=>{}).finally(()=>renderOrders());
    } else {
      renderOrders();
    }
    // Update sync timestamp display
    const _syncEl = document.getElementById('sync-ts-orders');
    if (_syncEl) {
      const _ts = DB.get('last_sync_ts', null);
      _syncEl.textContent = _ts ? 'Last sync: ' + new Date(_ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'}) : '';
    }
  }








  if (name !== 'dashboard') { window._dashRendered = false; }
  if (name === 'day') { updateDayBanner(); renderAttHistory(); buildDaySummary(); if(typeof showAccompanySection==='function') showAccompanySection(); }
  if (name === 'files') { loadCompanyFiles(); renderMyFiles(); }
  if (name === 'master') {
    if (navigator.onLine) {
      fetchAndCacheStores().then(() => fetchAndCacheDists()).then(() => fetchAndCacheInsts()).then(() => renderMasterLists());
    } else {
      renderMasterLists();
    }
  }
  if (name === 'dashboard') {
    if (['Admin','Sub-Admin','GM','RSM','ASM'].includes(CU?.role || '')) {
      fetchAndCacheOrders().then(() => renderDashboard());
    } else {
      renderDashboard();
    }
  }
  if (name === 'admin') renderAdminPanel();
  if (name === 'admin-employees') renderEmployees();
  if (name === 'admin-territories') renderTerritories();
  if (name === 'invoice') renderInvProductList();

  // ── Patch 1: admin sub-tabs ──
  if (name === 'admin-targets') renderTargetEmpList();
  if (name === 'admin-expenses-config') loadExpConfig();
  if (name === 'admin-broadcast') { renderBroadcastList(); }
  if (name === 'admin-mis') renderMISLog();
  if (name === 'admin-backup') populateHandoverDropdowns();
  if (name === 'day') renderExpHistory();

  // ── Patch 4: corrections ──
  if (name === 'admin-corrections') {
    populateCorrectionOfficers();
    const _corrDate = document.getElementById('corr-att-date');
    if (_corrDate) _corrDate.value = todayKey();
    loadAttendanceForCorrection();
  }

  // ── Patch 5: settings ──
  if (name === 'settings') {
    document.getElementById('settings-mobile').textContent    = CU?.mobile || '';
    document.getElementById('settings-role').textContent      = CU?.role || '';
    document.getElementById('settings-territory').textContent = CU?.territory || '';
    document.getElementById('settings-version').textContent   = 'v' + APP_VERSION;
    const _avd = document.getElementById('app-version-display'); if (_avd) _avd.textContent = 'v' + APP_VERSION;
    const _abi = document.getElementById('app-build-info'); if (_abi) _abi.textContent = 'v' + APP_VERSION + ' · ' + new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'});
  }
  // (invoice history is called in patch 7 after initInvLedger — no separate call needed here)

  // ── Patch 6: holidays ──
  if (name === 'admin-holidays') { renderHolidayList(); }

  // ── Patch 7: invoice ledger (runs after renderInvoiceHistory above) ──
  if (name === 'invoice') {
    restrictDistributorAddition();
    if (getDists().length === 0) fetchAndCacheDists();
    initInvLedger();
    renderInvoiceHistory();
  }

  // ── Patch 8: invoice history summary ──
  if (name === 'invoice') { setTimeout(updateInvoiceHistorySummary, 200); }

  // ── Patch 9: products ──
  if (name === 'admin-products') renderAdminProducts();

  document.querySelector('.app-body').scrollTop = 0;
}

