// ── GitHub Models API ──
const API_URL = "https://models.inference.ai.azure.com/chat/completions";

// ── Normalize old lowercase model IDs → correct casing ──
const MODEL_ID_FIX = {
  "meta-llama-3.3-70b-instruct":        "Meta-Llama-3.3-70B-Instruct",
  "meta-llama-3.1-70b-instruct":        "Meta-Llama-3.1-70B-Instruct",
  "meta-llama-3.1-8b-instruct":         "Meta-Llama-3.1-8B-Instruct",
  "meta-llama-3.2-11b-vision-instruct": "Meta-Llama-3.2-11B-Vision-Instruct",
  "meta-llama-3.2-3b-instruct":         "Meta-Llama-3.2-3B-Instruct",
  "meta-llama-3.2-1b-instruct":         "Meta-Llama-3.2-1B-Instruct",
  "mistral-large-2411":                 "Mistral-large",
  "mistral-small-2503":                 "Mistral-small",
  "ministral-3b":                       "Ministral-3B",
  "phi-4":                              "Phi-4",
  "phi-4-mini-instruct":                "Phi-4-mini",
  "phi-3.5-mini-instruct":              "Phi-3.5-mini-instruct",
  "phi-3.5-moe-instruct":               "Phi-3.5-MoE-instruct",
  "phi-3-medium-128k-instruct":         "Phi-3-medium-128k-instruct",
  "phi-3-mini-128k-instruct":           "Phi-3-mini-128k-instruct",
  "phi-3-small-128k-instruct":          "Phi-3-small-128k-instruct",
};
function fixModelId(id) { return MODEL_ID_FIX[id] || id; }

const DEFAULT_SYSTEM_PROMPT =
  "You are CLAW, an expert autonomous coding agent. Think step-by-step. " +
  "Write clean, production-ready code with clear explanations. " +
  "Always wrap code in markdown fences with the language specified. " +
  "Be precise and concise.";

// ── All available GitHub Models (free) ──
const MODELS = [
  // Meta Llama
  { id: "Meta-Llama-3.3-70B-Instruct",        name: "Llama 3.3 70B",        provider: "Meta",      badge: "TOP",   badgeClass: "badge-top"   },
  { id: "Meta-Llama-3.1-70B-Instruct",        name: "Llama 3.1 70B",        provider: "Meta",      badge: "FAST",  badgeClass: "badge-fast"  },
  { id: "Meta-Llama-3.1-8B-Instruct",         name: "Llama 3.1 8B",         provider: "Meta",      badge: "LITE",  badgeClass: "badge-mini"  },
  { id: "Meta-Llama-3.2-11B-Vision-Instruct", name: "Llama 3.2 11B Vision", provider: "Meta",      badge: "VIS",   badgeClass: "badge-code"  },
  { id: "Meta-Llama-3.2-3B-Instruct",         name: "Llama 3.2 3B",         provider: "Meta",      badge: "MINI",  badgeClass: "badge-mini"  },
  { id: "Meta-Llama-3.2-1B-Instruct",         name: "Llama 3.2 1B",         provider: "Meta",      badge: "TINY",  badgeClass: "badge-mini"  },
  // Mistral
  { id: "Mistral-large",                      name: "Mistral Large",         provider: "Mistral",   badge: "CODE",  badgeClass: "badge-code"  },
  { id: "Mistral-small",                      name: "Mistral Small",         provider: "Mistral",   badge: "FAST",  badgeClass: "badge-fast"  },
  { id: "Ministral-3B",                       name: "Ministral 3B",          provider: "Mistral",   badge: "TINY",  badgeClass: "badge-mini"  },
  // Microsoft Phi
  { id: "Phi-4",                              name: "Phi-4",                 provider: "Microsoft", badge: "SMART", badgeClass: "badge-smart" },
  { id: "Phi-4-mini",                         name: "Phi-4 Mini",            provider: "Microsoft", badge: "FAST",  badgeClass: "badge-fast"  },
  { id: "Phi-3.5-mini-instruct",              name: "Phi-3.5 Mini",          provider: "Microsoft", badge: "MINI",  badgeClass: "badge-mini"  },
  { id: "Phi-3.5-MoE-instruct",              name: "Phi-3.5 MoE",           provider: "Microsoft", badge: "MoE",   badgeClass: "badge-top"   },
  { id: "Phi-3-medium-128k-instruct",         name: "Phi-3 Medium 128K",     provider: "Microsoft", badge: "128K",  badgeClass: "badge-code"  },
  { id: "Phi-3-mini-128k-instruct",           name: "Phi-3 Mini 128K",       provider: "Microsoft", badge: "128K",  badgeClass: "badge-mini"  },
  { id: "Phi-3-small-128k-instruct",          name: "Phi-3 Small 128K",      provider: "Microsoft", badge: "128K",  badgeClass: "badge-mini"  },
  // OpenAI (rate-limited free)
  { id: "gpt-4o-mini",                        name: "GPT-4o Mini",           provider: "OpenAI",    badge: "FREE",  badgeClass: "badge-code"  },
  { id: "gpt-4o",                             name: "GPT-4o",                provider: "OpenAI",    badge: "LIMIT", badgeClass: "badge-smart" },
  { id: "o1-mini",                            name: "o1 Mini",               provider: "OpenAI",    badge: "THINK", badgeClass: "badge-smart" },
  // Cohere
  { id: "cohere-command-r-plus-08-2024",      name: "Command R+",            provider: "Cohere",    badge: "RAG",   badgeClass: "badge-code"  },
  { id: "cohere-command-r-08-2024",           name: "Command R",             provider: "Cohere",    badge: "FAST",  badgeClass: "badge-fast"  },
  // AI21
  { id: "ai21-jamba-1.5-large",               name: "Jamba 1.5 Large",       provider: "AI21",      badge: "LONG",  badgeClass: "badge-code"  },
  { id: "ai21-jamba-1.5-mini",                name: "Jamba 1.5 Mini",        provider: "AI21",      badge: "FAST",  badgeClass: "badge-fast"  },
];

// ── State ──
let currentModelId = MODELS[0].id;
let conversations  = [];
let activeConvId   = null;
let isStreaming    = false;

// ── DOM ──
const messagesEl    = document.getElementById("messages");
const inputEl       = document.getElementById("user-input");
const sendBtn       = document.getElementById("send-btn");
const emptyState    = document.getElementById("empty-state");
const modelListEl   = document.getElementById("model-list");
const historyListEl = document.getElementById("history-list");
const topbarModel   = document.getElementById("topbar-model");
const statusEl      = document.getElementById("status-indicator");
const statusLabel   = statusEl.querySelector(".status-label");
const settingsModal = document.getElementById("settings-modal");
const tokenInput    = document.getElementById("token-input");
const sysPromptInput= document.getElementById("system-prompt-input");
const sidebar       = document.getElementById("sidebar");

// ── Token helpers ──
function getToken()  { return localStorage.getItem("gh_token") || ""; }
function setToken(t) { localStorage.setItem("gh_token", t.trim()); }
function getSysPrompt() {
  return localStorage.getItem("sys_prompt") || DEFAULT_SYSTEM_PROMPT;
}
function setSysPrompt(p) { localStorage.setItem("sys_prompt", p); }

// ── Status ──
function setStatus(state, label) {
  statusEl.className = `status-indicator ${state}`;
  statusLabel.textContent = label;
}

// ── Build model sidebar ──
function buildModelList() {
  modelListEl.innerHTML = "";
  let lastProvider = "";

  MODELS.forEach(m => {
    if (m.provider !== lastProvider) {
      const providerLabel = document.createElement("div");
      providerLabel.className = "section-label";
      providerLabel.style.cssText = "font-size:9px;padding:10px 4px 4px;color:var(--text-muted)";
      providerLabel.textContent = m.provider.toUpperCase();
      modelListEl.appendChild(providerLabel);
      lastProvider = m.provider;
    }

    const el = document.createElement("div");
    el.className = `model-item${m.id === currentModelId ? " active" : ""}`;
    el.dataset.id = m.id;
    el.innerHTML = `
      <span class="model-name">${m.name}</span>
      <span class="model-badge ${m.badgeClass}">${m.badge}</span>
    `;
    el.addEventListener("click", () => selectModel(m.id));
    modelListEl.appendChild(el);
  });
}

function selectModel(id) {
  currentModelId = id;
  const m = MODELS.find(x => x.id === id);
  topbarModel.textContent = m ? m.name : id;
  document.querySelectorAll(".model-item").forEach(el => {
    el.classList.toggle("active", el.dataset.id === id);
  });
  if (activeConvId) {
    const conv = conversations.find(c => c.id === activeConvId);
    if (conv) conv.model = id;
    saveConversations();
  }
}

// ── Conversations ──
function loadConversations() {
  try {
    conversations = JSON.parse(localStorage.getItem("conversations") || "[]");
  } catch { conversations = []; }
}

function saveConversations() {
  localStorage.setItem("conversations", JSON.stringify(conversations));
}

function newConversation() {
  const conv = {
    id: Date.now().toString(),
    title: "New Chat",
    model: currentModelId,
    messages: [],
    createdAt: Date.now(),
  };
  conversations.unshift(conv);
  saveConversations();
  activeConvId = conv.id;
  renderHistory();
  clearMessagesUI();
  setStatus(getToken() ? "ready" : "no-token", getToken() ? "ready" : "no token");
  return conv;
}

function loadConversation(id) {
  const conv = conversations.find(c => c.id === id);
  if (!conv) return;
  activeConvId = id;
  selectModel(fixModelId(conv.model) || MODELS[0].id);
  renderHistory();
  clearMessagesUI();
  conv.messages.forEach(msg => {
    if (msg.role !== "system") renderMessage(msg.role, msg.content, false);
  });
}

function deleteConversation(id) {
  conversations = conversations.filter(c => c.id !== id);
  saveConversations();
  if (activeConvId === id) {
    if (conversations.length) loadConversation(conversations[0].id);
    else newConversation();
  }
  renderHistory();
}

function getActiveConv() {
  return conversations.find(c => c.id === activeConvId);
}

function renderHistory() {
  historyListEl.innerHTML = "";
  if (!conversations.length) {
    historyListEl.innerHTML = '<div class="history-empty">No chats yet</div>';
    return;
  }
  conversations.forEach(conv => {
    const el = document.createElement("div");
    el.className = `history-item${conv.id === activeConvId ? " active" : ""}`;
    el.innerHTML = `
      <span class="history-title">${escHtml(conv.title)}</span>
      <button class="history-delete" data-id="${conv.id}" title="Delete">✕</button>
    `;
    el.addEventListener("click", (e) => {
      if (e.target.classList.contains("history-delete")) return;
      loadConversation(conv.id);
    });
    el.querySelector(".history-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteConversation(conv.id);
    });
    historyListEl.appendChild(el);
  });
}

// ── UI helpers ──
function clearMessagesUI() {
  messagesEl.innerHTML = "";
  const es = document.getElementById("empty-state");
  if (es) messagesEl.appendChild(es);
  if (emptyState) emptyState.style.display = "flex";
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function scrollBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function hideEmpty() {
  if (emptyState) emptyState.style.display = "none";
}

// ── Render a message bubble ──
function renderMessage(role, content, streaming = false) {
  hideEmpty();
  const wrap = document.createElement("div");
  wrap.className = `message ${role}`;

  const inner = document.createElement("div");
  inner.className = "message-inner";

  const avatar = document.createElement("div");
  avatar.className = `avatar ${role === "user" ? "user-av" : "ai-av"}`;
  avatar.textContent = role === "user" ? "U" : "⚡";

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";

  const roleLabel = document.createElement("div");
  roleLabel.className = "message-role";
  roleLabel.textContent = role === "user" ? "you" : "claw agent";

  const body = document.createElement("div");
  body.className = "message-body";

  if (streaming) {
    const dots = document.createElement("div");
    dots.className = "thinking-dots";
    dots.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(dots);
  } else {
    renderMarkdown(body, content);
  }

  contentDiv.appendChild(roleLabel);
  contentDiv.appendChild(body);
  inner.appendChild(avatar);
  inner.appendChild(contentDiv);
  wrap.appendChild(inner);
  messagesEl.appendChild(wrap);
  scrollBottom();
  return { wrap, body };
}

// ── Markdown renderer ──
function renderMarkdown(container, text) {
  if (typeof marked === "undefined") {
    container.textContent = text;
    return;
  }

  marked.setOptions({ breaks: true, gfm: true });
  container.innerHTML = marked.parse(text);

  // Wrap pre/code blocks with header + copy button
  container.querySelectorAll("pre").forEach(pre => {
    const code = pre.querySelector("code");
    if (!code) return;

    const lang = (code.className.match(/language-(\w+)/) || [])[1] || "code";

    const wrapper = document.createElement("div");
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const header = document.createElement("div");
    header.className = "code-header";
    header.innerHTML = `
      <span class="code-lang">${lang}</span>
      <button class="code-copy-btn">Copy</button>
    `;
    pre.insertBefore(header, pre.firstChild);

    header.querySelector(".code-copy-btn").addEventListener("click", function() {
      navigator.clipboard.writeText(code.textContent).then(() => {
        this.textContent = "Copied!";
        this.classList.add("copied");
        setTimeout(() => { this.textContent = "Copy"; this.classList.remove("copied"); }, 2000);
      });
    });

    if (typeof hljs !== "undefined") {
      hljs.highlightElement(code);
    }
  });
}

// ── Stream from GitHub Models API ──
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || isStreaming) return;

  const token = getToken();
  if (!token) {
    openSettings();
    return;
  }

  // Ensure active conversation
  if (!activeConvId) newConversation();
  const conv = getActiveConv();

  // Add user message to conv history
  conv.messages.push({ role: "user", content: text });

  // Auto-title from first message
  if (conv.messages.filter(m => m.role === "user").length === 1) {
    conv.title = text.slice(0, 40) + (text.length > 40 ? "…" : "");
    renderHistory();
  }

  saveConversations();

  inputEl.value = "";
  resizeTextarea();
  updateCharCount();

  isStreaming = true;
  sendBtn.disabled = true;
  setStatus("loading", "generating…");

  renderMessage("user", text);
  const { body: aiBody } = renderMessage("ai", "", true);

  // Build messages array for API
  const apiMessages = [
    { role: "system", content: getSysPrompt() },
    ...conv.messages.map(m => ({ role: m.role, content: m.content })),
  ];

  let fullResponse = "";
  let hasCursor = false;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: currentModelId,
        messages: apiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // Clear thinking dots, show cursor
    aiBody.innerHTML = '<span class="stream-cursor"></span>';
    hasCursor = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;
        try {
          const json = JSON.parse(raw);
          const delta = json.choices?.[0]?.delta?.content || "";
          if (delta) {
            fullResponse += delta;
            // Re-render markdown live but keep cursor
            renderMarkdown(aiBody, fullResponse);
            const cursor = document.createElement("span");
            cursor.className = "stream-cursor";
            aiBody.appendChild(cursor);
            scrollBottom();
          }
        } catch {}
      }
    }

    // Final render without cursor
    renderMarkdown(aiBody, fullResponse || "(empty response)");
    scrollBottom();

    // Store AI response
    conv.messages.push({ role: "assistant", content: fullResponse });
    saveConversations();
    setStatus("ready", "ready");

  } catch (err) {
    aiBody.innerHTML = "";
    renderMarkdown(aiBody, `**Error:** ${escHtml(err.message)}\n\nCheck your GitHub token in Settings.`);
    setStatus("error", "error");
    // Remove the failed assistant message placeholder
    conv.messages.pop();
  } finally {
    isStreaming = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

// ── Textarea auto-resize ──
function resizeTextarea() {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + "px";
}

function updateCharCount() {
  const len = inputEl.value.length;
  const el = document.getElementById("char-count");
  if (el) el.textContent = len > 0 ? `${len}` : "";
}

// ── Settings modal ──
function openSettings() {
  tokenInput.value = getToken();
  sysPromptInput.value = getSysPrompt();
  settingsModal.classList.remove("hidden");
}

function closeSettings() {
  settingsModal.classList.add("hidden");
}

// ── No-token banner ──
function checkTokenBanner() {
  const existing = document.getElementById("no-token-banner");
  if (getToken()) {
    if (existing) existing.remove();
    setStatus("ready", "ready");
    return;
  }
  setStatus("no-token", "no token");
  if (!existing) {
    const banner = document.createElement("div");
    banner.id = "no-token-banner";
    banner.className = "no-token-banner";
    banner.innerHTML = `
      ⚠ No GitHub token set — add one to start chatting.
      <button onclick="openSettings()">Add Token</button>
    `;
    const inputArea = document.getElementById("input-area");
    inputArea.insertBefore(banner, inputArea.firstChild);
  }
}

// ── Suggestion chips ──
function insertSuggestion(text) {
  inputEl.value = text;
  resizeTextarea();
  updateCharCount();
  inputEl.focus();
}

// ── Event listeners ──
sendBtn.addEventListener("click", sendMessage);

inputEl.addEventListener("keydown", e => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    sendMessage();
  }
});

inputEl.addEventListener("input", () => {
  resizeTextarea();
  updateCharCount();
});

document.getElementById("new-chat-btn").addEventListener("click", () => {
  newConversation();
});

document.getElementById("settings-btn").addEventListener("click", openSettings);
document.getElementById("close-settings").addEventListener("click", closeSettings);
document.getElementById("modal-overlay").addEventListener("click", closeSettings);

document.getElementById("toggle-token").addEventListener("click", () => {
  tokenInput.type = tokenInput.type === "password" ? "text" : "password";
});

document.getElementById("save-settings").addEventListener("click", () => {
  setToken(tokenInput.value);
  setSysPrompt(sysPromptInput.value || DEFAULT_SYSTEM_PROMPT);
  closeSettings();
  checkTokenBanner();
});

document.getElementById("clear-history-btn").addEventListener("click", () => {
  if (!confirm("Delete ALL conversations? This cannot be undone.")) return;
  conversations = [];
  saveConversations();
  newConversation();
  closeSettings();
});

document.getElementById("sidebar-toggle").addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});

// ── Init ──
(function init() {
  // Auto-save token from URL: ?token=ghp_xxx  (one-time setup)
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get("token");
  if (urlToken && urlToken.startsWith("ghp_")) {
    setToken(urlToken);
    // Remove token from URL so it's not visible in address bar
    window.history.replaceState({}, "", window.location.pathname);
  }

  loadConversations();
  buildModelList();

  const m = MODELS[0];
  topbarModel.textContent = m.name;

  if (conversations.length) {
    loadConversation(conversations[0].id);
  } else {
    newConversation();
  }

  checkTokenBanner();
  inputEl.focus();
})();
