/**
 * MUN AI COMPANION & ENGLISH TUTOR MODULE
 * - 4 live emotional states: normal, happy, sad, suspicious (idle wait)
 * - Custom Web Audio API emotion sound effects
 * - Interactive Bilingual Elementary English Chat Tutor powered by Gemini 3 Flash
 * - Keeps Mèo Mochi & Bông hoa 🌸 100% intact
 */
(function (global) {
  "use strict";

  const MUN_ASSETS = {
    normal: "assets/mun/mun-normal.jpg",
    happy: "assets/mun/mun-happy.jpg",
    sad: "assets/mun/mun-sad.jpg",
    suspicious: "assets/mun/mun-suspicious.jpg"
  };

  const MUN_MOOD_META = {
    normal: { label: "Bình thường 😊", cls: "mun-mood-normal", color: "#38bdf8" },
    happy: { label: "Vui sướng 🎉", cls: "mun-mood-happy", color: "#10b981" },
    sad: { label: "Hơi buồn 🥺", cls: "mun-mood-sad", color: "#fb7185" },
    suspicious: { label: "Nghi ngờ 🤨", cls: "mun-mood-suspicious", color: "#f59e0b" }
  };

  const IDLE_WAIT_MS = 15000; // 15s waiting -> Mun turns suspicious!
  const SESSION_KEY_STORE = "mun_session_api_key_tmp";

  let munState = {
    mood: "normal",
    bubble: "Chào bạn nhỏ! Mun là trợ lý AI nè. Cần giải thích từ vựng hay bài tập tiếng Anh cứ hỏi Mun nhé! 🐥✨",
    chatOpen: false,
    pendingImage: "",
    busy: false,
    activeModel: "gemini-3-flash-preview",
    history: [
      {
        role: "model",
        mood: "happy",
        text: "Xin chào bạn nhỏ! Mình là **Mun** 🐥 — bạn đồng hành học tiếng Anh siêu vui đây! Bạn có thắc mắc gì về từ vựng, ngữ pháp, phát âm hay bài tập tiếng Anh lớp 1–5 thì nhắn cho Mun (hoặc gửi ảnh bài tập) nha! ✨"
      }
    ]
  };

  let idleTimer = null;
  let revertTimer = null;

  // =========================================================================
  // WEB AUDIO API EMOTION SOUND EFFECTS
  // =========================================================================
  const MunSFX = (() => {
    let ctx = null;
    function isSoundOn() {
      const st = global.PlaylandBridge?.getState?.() || global.state;
      return st ? !!st.soundOn : true;
    }
    function getCtx() {
      if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      return ctx;
    }
    function tone(freqStart, freqEnd, dur, type = "sine", delay = 0, vol = 0.12) {
      if (!isSoundOn()) return;
      const c = getCtx(); if (!c) return;
      const now = c.currentTime + delay;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now);
      if (freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, now + dur);
      }
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(vol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(now); osc.stop(now + dur + 0.03);
    }

    return {
      happy() {
        // Joyful little chick double-chirp + sparkle
        tone(784, 1046, 0.11, "triangle", 0, 0.13);
        tone(988, 1318, 0.14, "triangle", 0.10, 0.14);
        tone(1568, 1568, 0.18, "sine", 0.21, 0.09);
      },
      sad() {
        // Gentle empathetic descending sigh (never harsh)
        tone(420, 310, 0.22, "sine", 0, 0.11);
        tone(310, 230, 0.28, "sine", 0.18, 0.09);
      },
      suspicious() {
        // Playful rising "hmm?!" inflection
        tone(340, 510, 0.19, "triangle", 0, 0.11);
        tone(480, 560, 0.12, "sine", 0.18, 0.08);
      },
      chatPop() {
        tone(640, 860, 0.09, "sine", 0, 0.08);
      }
    };
  })();

  // =========================================================================
  // EMOTION ENGINE & IDLE TIMER
  // =========================================================================
  function setMood(mood, customMsg, playSfx = true, autoRevertMs = 4800) {
    if (!MUN_ASSETS[mood]) mood = "normal";
    munState.mood = mood;

    const defaultMsgs = {
      normal: "Mun đang lắng nghe và cổ vũ bạn nè! Cứ tự tin lên nha! 🐥💛",
      happy: "Tuyệt cú mèo! Bạn giỏi quá đi, Mun nhảy múa ăn mừng luôn! 🎉✨",
      sad: "Hic... đừng buồn nha! Sai một xíu thôi, mình xem lại rồi làm tiếp nhé! 🥺💛",
      suspicious: "Ơ kìa... sao suy nghĩ lâu thế nhỉ? Bạn có cần Mun gợi ý không đó? 🤨🐥"
    };
    if (customMsg) munState.bubble = customMsg;
    else if (mood !== "normal" || !munState.bubble) munState.bubble = defaultMsgs[mood];

    if (playSfx) {
      if (mood === "happy") MunSFX.happy();
      else if (mood === "sad") MunSFX.sad();
      else if (mood === "suspicious") MunSFX.suspicious();
    }

    clearTimeout(revertTimer);
    if (mood !== "normal" && autoRevertMs > 0) {
      revertTimer = setTimeout(() => {
        munState.mood = "normal";
        renderMunWidgets();
      }, autoRevertMs);
    }
    renderMunWidgets();
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    if (munState.mood === "suspicious") {
      munState.mood = "normal";
      munState.bubble = "A, bạn quay lại rồi! Mình học tiếp thôi nào! 🐥✨";
      renderMunWidgets();
    }
    idleTimer = setTimeout(() => {
      // Only trigger suspicious wait if logged in and not currently waiting on an AI response
      const st = global.PlaylandBridge?.getState?.() || global.state;
      if (st && st.loggedIn && !munState.busy && !munState.chatOpen) {
        setMood("suspicious", "Chờ lâu quá trời rồi nè... Bạn nhỏ đang suy nghĩ câu trả lời hay cần Mun giúp gì không? 🤨🐥", true, 0);
      }
    }, IDLE_WAIT_MS);
  }

  // =========================================================================
  // UI RENDERING (Sidebar Card + In-Game Live Dock + Chat Modal)
  // =========================================================================
  function injectMunStyles() {
    if (document.getElementById("mun-ai-styles")) return;
    const style = document.createElement("style");
    style.id = "mun-ai-styles";
    style.textContent = `
      .mun-card {
        background: linear-gradient(155deg, rgba(255, 253, 236, 0.96), rgba(255, 240, 249, 0.92));
      }
      .mun-stage {
        position: relative;
        margin: 10px 0 12px;
        padding: 14px 12px;
        border-radius: 24px;
        background: linear-gradient(180deg, #fffdf0 0%, #ebf8ff 100%);
        border: 2.5px solid #ffffff;
        text-align: center;
      }
      .mun-avatar-frame {
        width: 118px;
        height: 118px;
        margin: 0 auto;
        border-radius: 28px;
        overflow: hidden;
        border: 4px solid #ffffff;
        box-shadow: 0 10px 24px rgba(217, 155, 11, 0.22);
        background: #f5ecd8;
        cursor: pointer;
        transition: transform 0.22s ease;
      }
      .mun-avatar-frame img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 42%;
        display: block;
      }
      .mun-mood-normal { animation: munBreathe 3.2s ease-in-out infinite; }
      .mun-mood-happy { animation: munHop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 2; box-shadow: 0 0 0 4px #86efac, 0 12px 28px rgba(16, 185, 129, 0.28); }
      .mun-mood-sad { animation: munDroop 0.8s ease forwards; box-shadow: 0 0 0 4px #fecdd3; }
      .mun-mood-suspicious { animation: munPeek 1.1s ease-in-out infinite alternate; box-shadow: 0 0 0 4px #fde68a; }

      @keyframes munBreathe { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-4px) scale(1.02); } }
      @keyframes munHop { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-13px) scale(1.06); } }
      @keyframes munDroop { 0% { transform: translateY(0); } 50% { transform: translateY(5px) rotate(-3deg); } 100% { transform: translateY(2px) rotate(0deg); } }
      @keyframes munPeek { 0% { transform: rotate(-4deg) scale(1); } 100% { transform: rotate(4deg) scale(1.03); } }

      .mun-bubble {
        position: relative;
        background: #ffffff;
        border: 2px solid #ffe27a;
        border-radius: 18px;
        padding: 10px 12px;
        font-size: 13.5px;
        font-weight: 800;
        color: #2d2b55;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(217, 155, 11, 0.12);
      }

      /* Compact Dock inside Play Overlay */
      .play-mun-dock {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 12px;
        border-radius: 20px;
        background: #fffdf0;
        border: 2px solid #ffe27a;
        cursor: pointer;
        max-width: min(340px, 100%);
      }
      .play-mun-thumb {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        overflow: hidden;
        border: 2px solid #ffffff;
        flex-shrink: 0;
      }
      .play-mun-thumb img { width: 100%; height: 100%; object-fit: cover; object-position: center 42%; display: block; }

      /* Chat Modal */
      .mun-chat-modal {
        width: 100%;
        max-width: 680px;
        height: min(86vh, 720px);
        display: flex;
        flex-direction: column;
        background: #fffcff;
        border: 5px solid #ffffff;
        border-radius: 32px;
        box-shadow: 0 24px 60px rgba(45, 43, 85, 0.32);
        overflow: hidden;
      }
      .mun-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: linear-gradient(180deg, #fffdf5 0%, #f5f9ff 100%);
      }
      .mun-msg {
        max-width: 85%;
        padding: 12px 15px;
        border-radius: 20px;
        font-size: 14.5px;
        font-weight: 700;
        line-height: 1.5;
        word-wrap: break-word;
      }
      .mun-msg.model {
        align-self: flex-start;
        background: #ffffff;
        border: 2px solid #ffe27a;
        color: #2d2b55;
        border-bottom-left-radius: 6px;
      }
      .mun-msg.user {
        align-self: flex-end;
        background: linear-gradient(135deg, #ff89bf, #ffa4d0);
        color: #ffffff;
        border-bottom-right-radius: 6px;
      }
      .mun-chat-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px 16px;
        background: #fff9ee;
        border-top: 2px solid #ffffff;
      }
      .mun-chip-btn {
        min-height: 38px;
        padding: 6px 12px;
        border-radius: 14px;
        background: #ffffff;
        border: 2px solid #ffe27a;
        font-family: inherit;
        font-size: 12.5px;
        font-weight: 800;
        color: #7a5200;
        cursor: pointer;
      }
      .mun-chat-input-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 12px 16px;
        background: #fff4fa;
        border-top: 2px solid #ffffff;
        align-items: center;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSidebarCard() {
    const side = document.getElementById("sec-pet");
    if (!side) return null;
    let card = document.getElementById("mun-sidebar-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "mun-sidebar-card";
      card.className = "candy-card side-card mun-card";
      // Insert cleanly right above Mèo Mochi without modifying Mochi!
      side.insertBefore(card, side.firstChild);
    }
    return card;
  }

  function ensurePlayDock() {
    const playTopbar = document.querySelector("#play-modal .play-topbar");
    if (!playTopbar) return null;
    let dock = document.getElementById("play-mun-dock");
    if (!dock) {
      dock = document.createElement("div");
      dock.id = "play-mun-dock";
      dock.className = "play-mun-dock";
      dock.title = "Nhấn để trò chuyện với Mun!";
      dock.addEventListener("click", () => openMunChat());
      playTopbar.appendChild(dock);
    }
    return dock;
  }

  function renderMunWidgets() {
    const meta = MUN_MOOD_META[munState.mood] || MUN_MOOD_META.normal;
    const imgSrc = MUN_ASSETS[munState.mood] || MUN_ASSETS.normal;

    const card = ensureSidebarCard();
    if (card) {
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <h2 class="section-title">🐥 Bạn Đồng Hành AI Mun</h2>
          <span class="mini-pill" style="background:#fffdf0; border-color:${meta.color};">${meta.label}</span>
        </div>
        <div class="mun-stage">
          <div class="mun-bubble">${munState.bubble}</div>
          <div class="mun-avatar-frame ${meta.cls}" id="mun-side-avatar" title="Nhấn để Mun cổ vũ hoặc chat!">
            <img src="${imgSrc}" alt="Trợ lý AI Mun (${meta.label})" />
          </div>
          <div style="font-size:11.5px; font-weight:800; color:#7b7aa8; margin-top:8px;">
            Cảm xúc phản hồi: Bình thường • Vui • Buồn • Nghi ngờ
          </div>
        </div>
        <div class="btn-group" style="justify-content:center;">
          <button class="btn-3d btn-yellow" style="flex:1;" id="btn-open-mun-chat">💬 Chat &amp; Hỏi bài Mun</button>
        </div>
      `;
      document.getElementById("mun-side-avatar").addEventListener("click", () => {
        resetIdleTimer();
        MunSFX.chatPop();
        openMunChat();
      });
      document.getElementById("btn-open-mun-chat").addEventListener("click", () => {
        resetIdleTimer();
        MunSFX.chatPop();
        openMunChat();
      });
    }

    const dock = ensurePlayDock();
    if (dock) {
      dock.innerHTML = `
        <div class="play-mun-thumb ${meta.cls}">
          <img src="${imgSrc}" alt="Mun ${meta.label}" />
        </div>
        <div style="min-width:0;">
          <div style="font-size:12px; font-weight:900; color:#7a5200;">🐥 Mun • ${meta.label}</div>
          <div style="font-size:11.5px; font-weight:700; color:#2d2b55; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:210px;">
            ${munState.bubble}
          </div>
        </div>
      `;
    }

    const chatAv = document.getElementById("mun-chat-avatar");
    if (chatAv) {
      chatAv.className = `play-mun-thumb ${meta.cls}`;
      chatAv.innerHTML = `<img src="${imgSrc}" alt="Mun" />`;
    }
    const chatMoodLbl = document.getElementById("mun-chat-mood");
    if (chatMoodLbl) chatMoodLbl.textContent = `${meta.label} • Model: ${munState.activeModel}`;
  }

  // =========================================================================
  // CHAT WITH MUN (REAL GEMINI API VIA PROXY OR SESSION KEY)
  // =========================================================================
  function formatMunMarkdown(txt) {
    const esc = String(txt || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return esc
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  }

  function ensureChatModal() {
    let bd = document.getElementById("mun-chat-backdrop");
    if (!bd) {
      bd = document.createElement("div");
      bd.id = "mun-chat-backdrop";
      bd.className = "overlay-backdrop hidden";
      bd.style.zIndex = "82";
      bd.innerHTML = `<div class="mun-chat-modal" id="mun-chat-modal"></div>`;
      document.body.appendChild(bd);
    }
    return bd;
  }

  function openMunChat() {
    munState.chatOpen = true;
    resetIdleTimer();
    const bd = ensureChatModal();
    bd.classList.remove("hidden");
    renderChatModal();
  }

  function closeMunChat() {
    munState.chatOpen = false;
    const bd = document.getElementById("mun-chat-backdrop");
    if (bd) bd.classList.add("hidden");
    resetIdleTimer();
  }

  function renderChatModal() {
    const modal = document.getElementById("mun-chat-modal");
    if (!modal) return;
    const meta = MUN_MOOD_META[munState.mood] || MUN_MOOD_META.normal;
    const imgSrc = MUN_ASSETS[munState.mood] || MUN_ASSETS.normal;

    modal.innerHTML = `
      <div class="play-topbar" style="background:linear-gradient(90deg, #fff5bc, #ffeaf5, #e8fff9);">
        <div style="display:flex; align-items:center; gap:12px;">
          <div id="mun-chat-avatar" class="play-mun-thumb ${meta.cls}" style="width:52px; height:52px;">
            <img src="${imgSrc}" alt="Mun" />
          </div>
          <div>
            <div style="font-size:17px; font-weight:900;">🐥 Chat cùng Gia sư AI Mun</div>
            <div id="mun-chat-mood" style="font-size:12px; font-weight:800; color:var(--ink-sub);">${meta.label} • Model: ${munState.activeModel}</div>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn-3d btn-soft-sky" id="mun-chat-clear" title="Cuộc trò chuyện mới">🧹 Mới</button>
          <button class="btn-3d btn-danger-soft" id="mun-chat-close">✖️ Đóng</button>
        </div>
      </div>

      <div class="mun-chat-messages" id="mun-chat-messages">
        ${munState.history.map((m, idx) => `
          <div class="mun-msg ${m.role}">
            ${m.imageDataUrl ? `<img src="${m.imageDataUrl}" alt="Ảnh bài tập" style="max-width:180px; border-radius:12px; display:block; margin-bottom:6px;" />` : ""}
            <div>${formatMunMarkdown(m.text)}</div>
            ${m.role === "model" ? `
              <div style="margin-top:6px;">
                <button class="mun-chip-btn" data-mun-say="${idx}">🔊 Nghe Mun đọc</button>
              </div>
            ` : ""}
          </div>
        `).join("")}
        ${munState.busy ? `<div class="mun-msg model">🐥 Mun đang suy nghĩ câu trả lời thật hay cho bạn nè... ⏳</div>` : ""}
      </div>

      <div class="mun-chat-chips">
        <button class="mun-chip-btn" data-mun-q="Giải thích thì hiện tại đơn thật dễ nhớ cho học sinh lớp 5 nhé Mun!">✨ Thì hiện tại đơn</button>
        <button class="mun-chip-btn" data-mun-q="Phân biệt cách dùng 'a' và 'an' kèm ví dụ vui!">🍎 Phân biệt a / an</button>
        <button class="mun-chip-btn" data-mun-q="Đặt 3 câu tiếng Anh mẫu với từ 'friendly' và dịch nghĩa giúp con!">💬 Đặt câu ví dụ</button>
        <button class="mun-chip-btn" data-mun-q="Hãy đố con 1 câu hỏi tiếng Anh lớp 5 thật vui!">🎯 Đố vui lớp 5</button>
      </div>

      <div id="mun-img-preview-bar" style="display:${munState.pendingImage ? "flex" : "none"}; align-items:center; gap:10px; padding:8px 16px; background:#fff;">
        <img src="${munState.pendingImage}" style="height:44px; border-radius:10px; border:2px solid #ffe27a;" />
        <span style="font-size:12.5px; font-weight:800;">Đã đính kèm ảnh bài tập</span>
        <button class="mun-chip-btn" id="mun-rm-img">❌ Bỏ ảnh</button>
      </div>

      <form class="mun-chat-input-bar" id="mun-chat-form">
        <label class="btn-3d btn-soft-sky" style="min-height:48px; padding:8px 12px;" title="Tải ảnh bài tập tiếng Anh">
          📷 Ảnh
          <input type="file" id="mun-img-input" accept="image/*" hidden />
        </label>
        <input type="text" class="kawaii-input" id="mun-chat-input" style="flex:1; min-width:160px;" placeholder="Hỏi Mun bất kỳ từ vựng, ngữ pháp hay bài tập tiếng Anh..." autocomplete="off" ${munState.busy ? "disabled" : ""} />
        <button type="submit" class="btn-3d btn-pink" id="mun-chat-send" ${munState.busy ? "disabled" : ""}>Gửi 🚀</button>
      </form>
    `;

    const msgBox = document.getElementById("mun-chat-messages");
    msgBox.scrollTop = msgBox.scrollHeight;

    document.getElementById("mun-chat-close").addEventListener("click", closeMunChat);
    document.getElementById("mun-chat-clear").addEventListener("click", () => {
      munState.history = [munState.history[0]];
      munState.pendingImage = "";
      renderChatModal();
    });

    modal.querySelectorAll("[data-mun-q]").forEach(btn => btn.addEventListener("click", () => {
      sendMunMessage(btn.dataset.munQ);
    }));

    modal.querySelectorAll("[data-mun-say]").forEach(btn => btn.addEventListener("click", () => {
      const m = munState.history[Number(btn.dataset.munSay)];
      if (!m) return;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(m.text.replace(/[*#`]/g, ""));
        u.lang = "vi-VN";
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
      }
    }));

    const imgInp = document.getElementById("mun-img-input");
    imgInp.addEventListener("change", (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { munState.pendingImage = r.result; renderChatModal(); };
      r.readAsDataURL(f);
    });
    document.getElementById("mun-rm-img")?.addEventListener("click", () => {
      munState.pendingImage = ""; renderChatModal();
    });

    document.getElementById("mun-chat-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const val = document.getElementById("mun-chat-input").value.trim();
      if (!val && !munState.pendingImage) return;
      sendMunMessage(val || "Mun hãy giải thích bài tập trong ảnh này giúp con nhé!");
    });
  }

  async function callDirectWithSessionKey(sessionKey, payload) {
    const models = ["gemini-3-flash-preview", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite-preview"];
    const sysText = "Bạn tên là Mun, chú gà con áo vàng là gia sư AI tiếng Anh tiểu học (lớp 1-5). Trả lời tiếng Việt sinh động, dễ thương, chuẩn xác từng bước kèm ví dụ tiếng Anh. Cuối câu trả lời gắn đúng 1 thẻ [[MOOD:happy]] hoặc [[MOOD:normal]] hoặc [[MOOD:sad]] hoặc [[MOOD:suspicious]].";
    const contents = (payload.history || []).slice(-8).map(t => ({ role: t.role, parts: [{ text: t.text }] }));
    const parts = [{ text: payload.message }];
    if (payload.imageDataUrl) {
      const m = payload.imageDataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i);
      if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
    }
    contents.push({ role: "user", parts });

    for (const model of models) {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(sessionKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: sysText }] }, contents, generationConfig: { temperature: 0.6, maxOutputTokens: 900 } })
      });
      if (resp.ok) {
        const json = await resp.json();
        let text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        let mood = "happy";
        const mm = text.match(/\[\[MOOD:(normal|happy|sad|suspicious)\]\]/i);
        if (mm) { mood = mm[1].toLowerCase(); text = text.replace(mm[0], "").trim(); }
        return { reply: text, mood, model };
      }
    }
    throw new Error("Không gọi được Gemini với key phiên hiện tại.");
  }

  async function sendMunMessage(userText) {
    if (munState.busy) return;
    resetIdleTimer();
    const img = munState.pendingImage;
    munState.pendingImage = "";
    munState.history.push({ role: "user", text: userText, imageDataUrl: img || undefined });
    munState.busy = true;
    renderChatModal();

    const st = global.PlaylandBridge?.getState?.() || global.state;
    const studentCtx = st?.student?.name ? `${st.student.name}, Lớp ${st.student.className || "5"}, Trường ${st.student.school || ""}` : "Học sinh tiểu học";

    const cfgFn = global.PlaylandBridge?.getAiConfig || global.getAiConfig;
    const isLocalHost = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
    const defaultGen = isLocalHost ? "http://localhost:3001/api/generate-game" : "/api/generate-game";
    const genEndpoint = typeof cfgFn === "function" ? cfgFn().endpoint : defaultGen;
    const chatEndpoint = genEndpoint.replace(/\/api\/generate-game.*$/, "/api/chat-mun");

    const payload = {
      message: userText,
      history: munState.history.slice(0, -1).map(h => ({ role: h.role, text: h.text })),
      imageDataUrl: img || undefined,
      studentContext: studentCtx
    };

    try {
      let result;
      try {
        const resp = await fetch(chatEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();
        if (!resp.ok || !json.ok) throw new Error(json.error || `HTTP ${resp.status}`);
        result = json;
      } catch (proxyErr) {
        // Optional fallback ONLY if user entered a session key when running offline via file:// without Node proxy
        const sKey = sessionStorage.getItem(SESSION_KEY_STORE) || "";
        if (!sKey) throw proxyErr;
        result = await callDirectWithSessionKey(sKey, payload);
      }

      munState.activeModel = result.model || munState.activeModel;
      munState.history.push({ role: "model", text: result.reply, mood: result.mood || "happy" });
      munState.busy = false;
      setMood(result.mood || "happy", "Mun đã trả lời rồi nè! Xem ở khung chat nhé! 🐥✨", true, 5000);
      renderChatModal();
    } catch (err) {
      munState.busy = false;
      setMood("sad", "Ôi, Mun chưa kết nối được với máy chủ AI rồi... 🥺", true, 5000);
      munState.history.push({
        role: "model",
        mood: "sad",
        text: isLocalHost
          ? `Hic, Mun chưa kết nối được với AI Proxy (**${chatEndpoint}**).\n\n` +
            `• **Cách 1 (Khuyên dùng - Bảo mật):** Chạy \`node ai-proxy-server.mjs\` rồi mở \`http://localhost:3001\`.\n` +
            `• **Cách 2 (Test nhanh trên file://):** Bấm nút bên dưới để nhập tạm API key cho phiên trình duyệt hiện tại.`
          : `Hic, Mun chưa kết nối được với AI Backend trên Vercel (**${chatEndpoint}**).\n\n` +
            `• **Cách 1 (Khuyên dùng cho Vercel):** Thêm biến môi trường \`GEMINI_API_KEY\` trong Vercel Settings -> Environment Variables và kiểm tra thư mục \`api/\` đã được deploy.\n` +
            `• **Cách 2 (Dùng thử ngay):** Dán Google API Key vào ô bên dưới cho phiên hiện tại.`
      });
      renderChatModal();

      // Append a quick session-key button inside the chat message box (zero key stored in source!)
      const msgBox = document.getElementById("mun-chat-messages");
      if (msgBox) {
        const helper = document.createElement("div");
        helper.style.cssText = "display:flex; gap:8px; flex-wrap:wrap; align-items:center; padding:8px; background:#fff; border-radius:14px; border:2px solid #fecce5;";
        helper.innerHTML = `
          <input type="password" id="mun-skey-inp" class="kawaii-input" style="flex:1; min-width:160px; min-height:42px;" placeholder="Dán Google API Key cho phiên này..." />
          <button type="button" class="btn-3d btn-mint" id="mun-skey-save" style="min-height:42px;">🔑 Kết nối ngay</button>
        `;
        msgBox.appendChild(helper);
        msgBox.scrollTop = msgBox.scrollHeight;
        document.getElementById("mun-skey-save").addEventListener("click", () => {
          const val = document.getElementById("mun-skey-inp").value.trim();
          if (val) {
            sessionStorage.setItem(SESSION_KEY_STORE, val);
            MunSFX.happy();
            munState.history.push({ role: "model", mood: "happy", text: "Tuyệt vời! Mun đã kết nối sẵn sàng cho phiên này rồi, bạn hỏi lại Mun nhé! 🐥✨" });
            setMood("happy", "Mun sẵn sàng rồi nè! ✨", false);
            renderChatModal();
          }
        });
      }
    }
  }

  // =========================================================================
  // HOOK INTO GLOBAL INTERACTION & GAME EVENTS
  // =========================================================================
  function initMun() {
    injectMunStyles();
    renderMunWidgets();
    resetIdleTimer();

    ["pointerdown", "keydown", "touchstart"].forEach(evt => {
      window.addEventListener(evt, () => resetIdleTimer(), { passive: true });
    });
  }

  global.MunCompanion = {
    init: initMun,
    setMood,
    resetIdleTimer,
    openChat: openMunChat,
    onCorrect(msg) {
      resetIdleTimer();
      setMood("happy", msg || "Hoan hô! Đúng rồi nè, Mun nhảy ăn mừng cùng bạn! 🎉🐥", true, 4500);
    },
    onWrong(msg) {
      resetIdleTimer();
      setMood("sad", msg || "Hic... sai một xíu thôi không sao đâu, mình thử lại nhé! 🥺💛", true, 4500);
    },
    onWaitTooLong() {
      setMood("suspicious", "Ơ kìa... sao im ắng lâu thế nhỉ? Nhấn vào Mun nếu cần giúp nha! 🤨🐥", true, 0);
    }
  };
})(window);
