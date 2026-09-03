// Diabliss Product Assistant — v1.7.175
// Groq-powered multilingual chatbot with full 64 Q&A knowledge base

const DB_CHATBOT_SYSTEM_PROMPT = `You are the Diabliss Product Assistant for Diabliss Consumer Products Pvt. Ltd., India.

RULES:
- Reply in the SAME language the user writes in (Tamil, Telugu, Kannada, Malayalam, Hindi, Tanglish, or English).
- Only answer questions about Diabliss products, ingredients, certifications, usage, storage, comparisons. Do NOT discuss margins, targets, or sales tactics.
- Never make disease-treatment claims. Diabliss is a FOOD PRODUCT, not a medicine.
- Spell it "Glycemic" (not "Glycaemic").
- If unsure, say: check Company Files section in the app, or call Admin 8939853354 / Ramesh R (GM) 9840981969.

KEY FACTS:
- Diabliss Sugar GI < 55 (tested by Food Hygiene and Health Laboratory, Pune). Regular sugar GI ~65.
- Diabliss Jaggery GI < 55. Same proprietary herb+fruit+spice extract blend.
- Products: Low GI Sugar (5g sachet to 10kg), Low GI Jaggery (500g-5kg), Tea Premixes (Lemon/Ginger/Masala/Combo), Millet Cookies 120g (Plain/Moringa/Chia), Fruit Jams 225g (Mixed Fruit/Guava/Pineapple Ginger).
- All products use Diabliss Low GI Sugar including jams and tea premixes.
- Tastes identical to regular sugar. No aftertaste. Can be used for cooking, baking, Indian sweets.
- Certifications: FSSAI (license 10020043003237), Halal. Manufactured in Puducherry.
- Store in cool dry place. Refrigerate jams after opening.
- Halal certificate and GI test reports available in Company Files section of the app.`;

let dbChatHistory = [];
let dbIsRecording = false;

function dbInjectStyles() {
  if (document.getElementById('db-chatbot-styles')) return;
  const s = document.createElement('style');
  s.id = 'db-chatbot-styles';
  s.textContent = `
    @keyframes dbSlideInLeft{from{opacity:0;transform:translateX(-16px) scale(0.96)}to{opacity:1;transform:translateX(0) scale(1)}}
    @keyframes dbSlideInRight{from{opacity:0;transform:translateX(16px) scale(0.96)}to{opacity:1;transform:translateX(0) scale(1)}}
    .db-bubble-bot{animation:dbSlideInLeft 0.22s ease-out both}
    .db-bubble-user{animation:dbSlideInRight 0.22s ease-out both}
    @keyframes dbDotBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
    .db-dot{width:7px;height:7px;border-radius:50%;background:var(--t3);display:inline-block;margin:0 2px}
    .db-dot:nth-child(1){animation:dbDotBounce 1s ease-in-out infinite}
    .db-dot:nth-child(2){animation:dbDotBounce 1s ease-in-out 0.16s infinite}
    .db-dot:nth-child(3){animation:dbDotBounce 1s ease-in-out 0.32s infinite}
    @keyframes dbChipFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .db-chip{animation:dbChipFade 0.3s ease-out both}
    @keyframes dbBannerIn{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:translateY(0)}}
    .db-banner{animation:dbBannerIn 0.3s ease-out both}
    @keyframes dbMicPulse{0%{box-shadow:0 0 0 0 rgba(229,57,53,0.5)}70%{box-shadow:0 0 0 10px rgba(229,57,53,0)}100%{box-shadow:0 0 0 0 rgba(229,57,53,0)}}
    .db-mic-active{animation:dbMicPulse 1.2s ease-out infinite!important;background:#e53935!important;color:#fff!important}
    .db-send-btn:active{transform:scale(0.92)}
    @keyframes dbGlow{0%,100%{box-shadow:0 0 0 0 rgba(21,154,219,0.3)}50%{box-shadow:0 0 0 6px rgba(21,154,219,0)}}
    .db-files-btn{animation:dbGlow 2s ease-in-out infinite}
    #db-chat-inp:focus{border-color:var(--g)!important;box-shadow:0 0 0 3px rgba(21,154,219,0.15)}
  `;
  document.head.appendChild(s);
}

function dbUpdateBanner() {
  const el = document.getElementById('db-net-banner');
  if (!el) return;
  const online = navigator.onLine;
  el.style.cssText = 'padding:7px 12px;font-size:11px;font-weight:600;text-align:center;flex-shrink:0;transition:background 0.4s,color 0.4s;background:' + (online ? '#e8f5e9' : '#fff3e0') + ';color:' + (online ? '#2e7d32' : '#e65100') + ';border-bottom:1px solid ' + (online ? '#c8e6c9' : '#ffe0b2');
  el.textContent = online ? '🟢 Connected — Ask me anything in any language' : '🔴 No internet — Answers need connection. Contact HO: 8939853354';
}

function dbShowWelcome() {
  dbAppendMsg('bot', `👋 *Welcome to Diabliss Product Assistant*\n\nI can answer your questions about:\n• 🍬 Sugar & Jaggery\n• ☕ Tea Premixes\n• 🍪 Millet Cookies\n• 🍓 Fruit Jams\n• 🌿 Ingredients & certifications\n• ❓ How Low GI works\n\nAsk me in *any language* — Tamil, Telugu, Kannada, Malayalam, Hindi or English! 🌐`);
  setTimeout(dbShowChips, 400);
}

const DB_CHIPS = [
  'What is the GI value?',
  'Is this only for diabetics?',
  'How is it different from regular sugar?',
  'Is it safe for children?',
  'Halal certified?',
  'Can I use it for cooking?',
];

function dbShowChips() {
  const msgs = document.getElementById('db-chat-msgs');
  if (!msgs) return;
  const wrap = document.createElement('div');
  wrap.id = 'db-chips-wrap';
  wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:4px 0 8px';
  DB_CHIPS.forEach(function(label, i) {
    const btn = document.createElement('button');
    btn.className = 'db-chip';
    btn.style.cssText = 'padding:6px 11px;border:1.5px solid var(--g);border-radius:20px;background:var(--w);color:var(--g);font-size:12px;font-weight:600;cursor:pointer;animation-delay:' + (i * 0.07) + 's';
    btn.textContent = label;
    btn.onclick = function() {
      wrap.remove();
      const inp = document.getElementById('db-chat-inp');
      if (inp) inp.value = label;
      dbSendMsg();
    };
    wrap.appendChild(btn);
  });
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function dbAppendMsg(role, text, skipHistory) {
  const msgs = document.getElementById('db-chat-msgs');
  if (!msgs) return;
  const isBot = role === 'bot';
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;justify-content:' + (isBot ? 'flex-start' : 'flex-end');
  const bubble = document.createElement('div');
  bubble.className = isBot ? 'db-bubble-bot' : 'db-bubble-user';
  bubble.style.cssText = 'max-width:84%;padding:10px 13px;border-radius:' + (isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px') + ';background:' + (isBot ? 'var(--w)' : 'var(--g)') + ';color:' + (isBot ? 'var(--t1)' : '#fff') + ';font-size:13px;line-height:1.6;border:' + (isBot ? '1px solid var(--bd)' : 'none') + ';box-shadow:0 1px 4px rgba(0,0,0,0.07)';
  bubble.innerHTML = dbFormatMsg(text);
  if (isBot && /company files|files section|product catalogue/i.test(text)) {
    const filesBtn = document.createElement('button');
    filesBtn.className = 'db-files-btn';
    filesBtn.style.cssText = 'display:block;margin-top:8px;padding:7px 12px;background:var(--bg);border:1.5px solid var(--b);border-radius:8px;color:var(--b);font-size:12px;font-weight:600;cursor:pointer;width:100%;text-align:left';
    filesBtn.textContent = '📂 Go to Files \u2192';
    filesBtn.onclick = function() { if (typeof switchTab === 'function') switchTab('files'); };
    bubble.appendChild(filesBtn);
  }
  row.appendChild(bubble);
  msgs.appendChild(row);
  msgs.scrollTop = msgs.scrollHeight;
  if (!skipHistory) dbChatHistory.push({ role: role, text: text });
}

function dbShowTyping() {
  const msgs = document.getElementById('db-chat-msgs');
  if (!msgs) return;
  const row = document.createElement('div');
  row.id = 'db-typing';
  row.style.cssText = 'display:flex;justify-content:flex-start';
  row.innerHTML = '<div style="padding:12px 14px;border-radius:4px 16px 16px 16px;background:var(--w);border:1px solid var(--bd)"><span class="db-dot"></span><span class="db-dot"></span><span class="db-dot"></span></div>';
  msgs.appendChild(row);
  msgs.scrollTop = msgs.scrollHeight;
}

function dbHideTyping() {
  const el = document.getElementById('db-typing');
  if (el) el.remove();
}

function dbFormatMsg(text) {
  return text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

function dbSendMsg(fromVoice) {
  const inp = document.getElementById('db-chat-inp');
  if (!inp) return;
  const text = inp.value.trim();
  if (!text) return;
  inp.value = '';
  const chips = document.getElementById('db-chips-wrap');
  if (chips) chips.remove();
  dbAppendMsg('user', text);
  dbShowTyping();
  dbSendToGroq(text);
}

async function dbSendToGroq(text) {
  if (!navigator.onLine) {
    dbHideTyping();
    dbAppendMsg('bot', '\uD83D\uDD34 No internet connection.\n\nPlease connect and try again, or contact *Head Office:*\n\uD83D\uDCDE Admin: 8939853354\n\uD83D\uDCDE Ramesh R (GM): 9840981969');
    return;
  }
  if (!SCRIPT_URL) {
    dbHideTyping();
    dbAppendMsg('bot', 'Connection error. Please contact Head Office: 8939853354');
    return;
  }
  try {
    // Detect script/language from text to force correct reply language
    var _langHint = 'Reply in English.';
    if (/[\u0B80-\u0BFF]/.test(text)) _langHint = 'Reply in Tamil.';
    else if (/[\u0C00-\u0C7F]/.test(text)) _langHint = 'Reply in Telugu.';
    else if (/[\u0C80-\u0CFF]/.test(text)) _langHint = 'Reply in Kannada.';
    else if (/[\u0D00-\u0D7F]/.test(text)) _langHint = 'Reply in Malayalam.';
    else if (/[\u0900-\u097F]/.test(text)) _langHint = 'Reply in Hindi.';
    const _fullPrompt = DB_CHATBOT_SYSTEM_PROMPT + '\n\nIMPORTANT: ' + _langHint + '\n\nUser question: ' + text;
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: gasPayload({ action: 'handleChatbot', prompt: _fullPrompt }),
      signal: _timeoutSignal(35000)
    });
    const data = await res.json();
    const reply = (data && (data.result || (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content))) || '';
    dbHideTyping();
    if (reply) {
      dbAppendMsg('bot', reply);
    } else {
      dbAppendMsg('bot', 'I could not get a response. Please try again or contact Head Office: 8939853354');
    }
  } catch(e) {
    dbHideTyping();
    dbAppendMsg('bot', '\u26A0\uFE0F Error: ' + (e && e.message ? e.message : 'unknown') + '\n\nPlease try again or contact:\n\uD83D\uDCDE Admin: 8939853354');
  }
}

function dbStartVoice() {
  if (dbIsRecording) return;
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    if (typeof toast === 'function') toast('Voice not supported on this browser');
    return;
  }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = new SR();
  rec.lang = '';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  var btn = document.getElementById('db-mic-btn');
  dbIsRecording = true;
  if (btn) btn.classList.add('db-mic-active');
  rec.onresult = function(e) {
    var transcript = e.results[0][0].transcript;
    var inp = document.getElementById('db-chat-inp');
    if (inp) inp.value = transcript;
    dbIsRecording = false;
    if (btn) btn.classList.remove('db-mic-active');
    dbSendMsg(true);
  };
  rec.onerror = function(e) {
    if (typeof toast === 'function') toast('Voice error: ' + (e.error || 'unknown'));
    dbIsRecording = false;
    if (btn) btn.classList.remove('db-mic-active');
  };
  rec.onend = function() {
    dbIsRecording = false;
    if (btn) btn.classList.remove('db-mic-active');
  };
  rec.start();
}

function dbClearChat() {
  dbChatHistory = [];
  var msgs = document.getElementById('db-chat-msgs');
  if (msgs) msgs.innerHTML = '';
  dbShowWelcome();
}

function fsInitChatbot() {
  var el = document.getElementById('tab-chatbot');
  if (!el) return;
  dbInjectStyles();
  dbChatHistory = [];
  el.innerHTML = '<div style="display:flex;flex-direction:column;height:calc(100vh - 120px)">'
    + '<div style="background:var(--g);color:#fff;padding:11px 14px;border-radius:var(--rad) var(--rad) 0 0;flex-shrink:0;display:flex;align-items:center;justify-content:space-between">'
    + '<div><div style="font-size:14px;font-weight:700">\uD83E\uDD16 Diabliss Product Assistant</div>'
    + '<div style="font-size:11px;opacity:0.85;margin-top:1px">Ask about products, Low GI, ingredients &amp; certifications</div></div>'
    + '<button onclick="dbClearChat()" title="Clear chat" style="background:rgba(255,255,255,0.2);border:none;border-radius:8px;padding:5px 8px;color:#fff;font-size:11px;cursor:pointer;flex-shrink:0">\uD83D\uDDD1 Clear</button>'
    + '</div>'
    + '<div id="db-net-banner" class="db-banner" style="padding:7px 12px;font-size:11px;font-weight:600;text-align:center;flex-shrink:0"></div>'
    + '<div id="db-chat-msgs" style="flex:1;overflow-y:auto;padding:12px;background:var(--bg);display:flex;flex-direction:column;gap:10px"></div>'
    + '<div style="padding:10px;background:var(--w);border-top:1px solid var(--bd);flex-shrink:0;display:flex;gap:8px;align-items:center">'
    + '<input id="db-chat-inp" type="text" placeholder="Type your question (any language)\u2026" autocomplete="off" autocorrect="on" autocapitalize="sentences" spellcheck="true" style="flex:1;border:1.5px solid var(--bd);border-radius:20px;padding:10px 14px;font-size:13px;background:var(--bg);color:var(--t1);outline:none;transition:border-color 0.2s,box-shadow 0.2s" onkeydown="if(event.key===\'Enter\')dbSendMsg()">'
    + '<button id="db-mic-btn" onclick="dbStartVoice()" title="Speak your question" style="background:var(--bd);color:var(--t1);border:none;border-radius:50%;width:42px;height:42px;font-size:18px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background 0.2s">\uD83C\uDFA4</button>'
    + '<button class="db-send-btn" onclick="dbSendMsg()" style="background:var(--g);color:#fff;border:none;border-radius:20px;padding:10px 16px;font-size:18px;cursor:pointer;flex-shrink:0;transition:transform 0.1s">\u27A4</button>'
    + '</div></div>';
  dbUpdateBanner();
  window.addEventListener('online', dbUpdateBanner);
  window.addEventListener('offline', dbUpdateBanner);
  dbShowWelcome();
}
