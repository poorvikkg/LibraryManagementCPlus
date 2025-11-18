// chatbot.js — interactive behavior for the redesigned UI

const chatWrapper = document.getElementById('chatWrapper');
const messages = document.getElementById('chatMessages');
const input = document.getElementById('userMessage');
const sendBtn = document.getElementById('sendMessage');
const quickReplies = document.getElementById('quickReplies');
const themeToggle = document.getElementById('themeToggle');
const minimizeBtn = document.getElementById('minimizeBtn');
const closeBtn = document.getElementById('closeChat');
const botStatus = document.getElementById('botStatus');
const ding = document.getElementById('dingSound');

// Minimal conversation state (frontend only) — backend will accept messages as before
const conversation = [];
const MAX_HISTORY = 12;

// Suggested quick replies
const suggestions = [
  "I'm anxious",
  "I'm happy",
  "I feel lonely",
  "I can't focus",
  "I need motivation",
  "I feel stressed"
];

function mkTime() {
  const d = new Date();
  return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
}

/* ---------- UI helpers ---------- */
function createMessageBubble(text, who='bot', opts={typing:false}) {
  const el = document.createElement('div');
  el.className = `msg ${who} fade-in`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (opts.typing) {
    const typingWrap = document.createElement('span');
    typingWrap.className = 'typing';
    for (let i=0;i<3;i++){
      const dot = document.createElement('span');
      dot.className = 'dot';
      typingWrap.appendChild(dot);
    }
    bubble.appendChild(typingWrap);
  } else {
    bubble.innerText = text;
  }
  el.appendChild(bubble);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerText = mkTime();
  el.appendChild(meta);

  return el;
}

function playDing() {
  try {
    if (ding && typeof ding.play === 'function') {
      ding.currentTime = 0;
      ding.play().catch(()=>{/* ignore autoplay errors */});
    }
  } catch(e){}
}

/* append a real message */
function appendMessage(text, who='bot') {
  const node = createMessageBubble(text, who, {typing:false});
  messages.appendChild(node);
  messages.scrollTop = messages.scrollHeight;
  if (who === 'bot') playDing();
  return node;
}

/* append typing indicator and return it (so it can be updated) */
function appendTyping() {
  const node = createMessageBubble('...', 'bot', {typing:true});
  messages.appendChild(node);
  messages.scrollTop = messages.scrollHeight;
  return node;
}

function replaceTypingNode(node, reply) {
  if (!node) return appendMessage(reply, 'bot');
  node.querySelector('.bubble').innerText = reply;
  node.className = 'msg bot fade-in';
  node.querySelector('.meta').innerText = mkTime();
  messages.scrollTop = messages.scrollHeight;
  playDing();
}

/* ---------- quick replies ---------- */
function renderQuickReplies() {
  quickReplies.innerHTML = '';
  suggestions.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerText = s;
    btn.addEventListener('click', () => {
      input.value = s;
      input.focus();
      // small delay before sending so user can edit if needed
      setTimeout(()=> sendMessage(), 220);
    });
    quickReplies.appendChild(btn);
  });
}

/* ---------- theme ---------- */
function toggleTheme() {
  const root = document.documentElement;
  const cur = root.getAttribute('data-theme');
  if (cur === 'dark') {
    root.removeAttribute('data-theme');
    themeToggle.innerText = '🌙';
  } else {
    root.setAttribute('data-theme','dark');
    themeToggle.innerText = '☀️';
  }
}

/* ---------- minimize ---------- */
minimizeBtn?.addEventListener('click', () => {
  chatWrapper.classList.toggle('minimized');
  if (chatWrapper.classList.contains('minimized')) {
    minimizeBtn.innerText = '+';
    botStatus.innerText = 'Minimized';
  } else {
    minimizeBtn.innerText = '—';
    botStatus.innerText = 'Online';
  }
});

/* ---------- close ---------- */
closeBtn?.addEventListener('click', () => {
  // friendly close: minimize then hide after small delay
  chatWrapper.classList.add('minimized');
  setTimeout(()=> chatWrapper.style.display = 'none', 240);
});

/* ---------- send / network ---------- */
async function sendMessage(ev) {
  if (ev) ev.preventDefault();
  const text = input.value?.trim();
  if (!text) return;

  // append user message
  appendMessage(text, 'me');
  // push to conversation (frontend) — backend expects { messages: [...] }
  conversation.push({ role: 'user', content: text });
  input.value = '';
  input.focus();

  // show typing
  const typingNode = appendTyping();

  // build trimmed history
  const history = conversation.slice(-MAX_HISTORY);

  try {
    // call backend (same API as before)
    const API_BASE = 'http://localhost:5000';
    const resp = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(()=>({ error: resp.statusText }));
      replaceTypingNode(typingNode, `Error: ${err.error || 'Service unavailable'}`);
      return;
    }

    const data = await resp.json();
    const reply = data.reply || "Sorry — I couldn't respond right now.";
    // update typing -> final
    replaceTypingNode(typingNode, reply);

    // record assistant reply
    conversation.push({ role: 'assistant', content: reply });

  } catch (err) {
    replaceTypingNode(typingNode, 'Network error. Try again later.');
    console.error('chat error', err);
  }
}

/* ---------- keyboard shortcuts ---------- */
document.getElementById('chatForm')?.addEventListener('submit', sendMessage);
input?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') input.value = '';
});

/* ---------- theme toggle ---------- */
themeToggle?.addEventListener('click', toggleTheme);

/* ---------- initial render ---------- */
renderQuickReplies();

/* ---------- accessibility: focus on input ---------- */
window.addEventListener('load', ()=> input?.focus());
