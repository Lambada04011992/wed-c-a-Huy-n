/**
 * BRIDGE SPELLING – XÂY CẦU GHÉP TỪ (GLOBAL SUCCESS 5)
 * Inspired by the interactive Bridge Spelling game video:
 * - Top card: illustration + speaker button + Lesson 1 & 2 filter
 * - Middle: canyon cliff with cartoon car (left), rainbow finish arch (right), bridge plank slots
 * - Bottom: columnar letter/chunk tiles directly below each bridge slot
 * - "Test Bridge" animation: sequential xylophone plank light-up, car drives across into rainbow arch!
 */
(function (global) {
  "use strict";

  // Lesson 1 & Lesson 2 split metadata for Units 1-20 (matches Global Success 5 structure)
  const LESSON_SPLIT_COUNTS = {
    1: 3, 2: 4, 3: 6, 4: 5, 5: 6, 6: 4, 7: 4, 8: 4, 9: 6, 10: 3,
    11: 4, 12: 4, 13: 4, 14: 6, 15: 4, 16: 6, 17: 5, 18: 4, 19: 6, 20: 3
  };

  const PHONICS_SOUNDS = {
    a: "a", b: "buh", c: "kuh", d: "duh", e: "eh", f: "fuh", g: "guh",
    h: "huh", i: "ih", j: "juh", k: "kuh", l: "luh", m: "muh", n: "nuh",
    o: "oh", p: "puh", q: "kwuh", r: "ruh", s: "sss", t: "tuh", u: "uh",
    v: "vuh", w: "wuh", x: "ks", y: "yuh", z: "zzz"
  };

  const DISTRACTOR_LETTERS = "aeioulmnrstpbcdfgh";

  let runtime = {
    lessonFilter: "all", // 'all' | '1' | '2'
    showHint: false,
    questions: [],
    qIdx: 0,
    slots: [],     // array of selected tile strings or null
    columns: [],   // array of arrays of candidate tile strings per slot
    wrongMask: [], // boolean per slot after failed Test Bridge
    testing: false,
    carDriveState: "idle", // 'idle' | 'success' | 'wobble'
    activeGlowIdx: -1,
    totalScore: 0,
    totalFlowers: 0,
    audioCtx: null,
    timers: []
  };

  function getBridge() {
    return global.PlaylandBridge || {};
  }

  function isSoundOn() {
    const st = getBridge().getState?.() || global.state;
    return st ? !!st.soundOn : true;
  }

  function getAudioCtx() {
    if (!runtime.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      runtime.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (runtime.audioCtx && runtime.audioCtx.state === "suspended") {
      runtime.audioCtx.resume().catch(() => {});
    }
    return runtime.audioCtx;
  }

  function clearTimers() {
    runtime.timers.forEach(t => clearTimeout(t));
    runtime.timers = [];
  }

  function tone(freq, dur, type = "sine", delay = 0, vol = 0.12) {
    if (!isSoundOn()) return;
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + dur + 0.02);
  }

  function playPlankSnapSFX() {
    tone(420, 0.08, "triangle", 0, 0.13);
    tone(660, 0.07, "sine", 0.03, 0.09);
  }

  function playXylophoneStep(idx) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
    tone(scale[idx % scale.length], 0.18, "sine", 0, 0.16);
    tone(scale[idx % scale.length] * 2, 0.12, "triangle", 0.01, 0.05);
  }

  function playCarRevSFX() {
    if (!isSoundOn()) return;
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.8);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.07, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.88);
  }

  function playWobbleFailSFX() {
    tone(260, 0.14, "sawtooth", 0, 0.08);
    tone(175, 0.24, "triangle", 0.12, 0.13);
  }

  function playVictoryFanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.24, "triangle", i * 0.07, 0.14));
  }

  function speakText(text, rate = 0.85) {
    if (!text) return;
    const b = getBridge();
    if (typeof b.speakEnglish === "function") {
      b.speakEnglish(text, rate);
      return;
    }
    if (!isSoundOn() || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = rate;
    window.speechSynthesis.speak(u);
  }

  function speakTileToken(tok) {
    const clean = tok.trim().toLowerCase();
    if (clean.length === 1 && PHONICS_SOUNDS[clean]) {
      speakText(PHONICS_SOUNDS[clean], 0.92);
    } else {
      speakText(tok, 0.88);
    }
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Break any Lesson 1 / Lesson 2 vocabulary item into 3-6 bridge plank tokens:
   * - Single words <= 6 letters (e.g. "dolphin" -> 7? <= 6 -> 1 letter/plank; "city", "flat", "pink", "fox")
   * - Multi-word phrases or long words -> clean syllable / word chunks (3-5 planks)
   */
  function tokenizeWordForBridge(wordRaw) {
    const clean = String(wordRaw || "").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1 && clean.length <= 6) {
      return clean.split("");
    }
    if (parts.length >= 3 && parts.length <= 6) {
      return parts;
    }
    if (parts.length === 2) {
      const out = [];
      parts.forEach(w => {
        if (w.length <= 4) out.push(w);
        else {
          const mid = Math.ceil(w.length / 2);
          out.push(w.slice(0, mid), w.slice(mid));
        }
      });
      return out.slice(0, 6);
    }
    // Single long word (7+ chars): split into 3-5 smooth readable chunks of 2-3 letters
    const targetChunks = clean.length <= 8 ? 3 : clean.length <= 12 ? 4 : 5;
    const step = Math.ceil(clean.length / targetChunks);
    const chunks = [];
    for (let i = 0; i < clean.length; i += step) {
      chunks.push(clean.slice(i, i + step));
    }
    return chunks;
  }

  function buildDistractorsForToken(correctTok, allTokensPool) {
    const set = new Set([correctTok]);
    const isSingleChar = correctTok.length === 1;
    const isLower = correctTok === correctTok.toLowerCase();

    if (isSingleChar) {
      const vowels = ["a", "e", "i", "o", "u"];
      const candidates = vowels.includes(correctTok.toLowerCase())
        ? vowels
        : DISTRACTOR_LETTERS.split("");
      const pool = shuffle(candidates);
      for (const ch of pool) {
        if (set.size >= 3) break;
        const val = isLower ? ch : ch.toUpperCase();
        if (val !== correctTok) set.add(val);
      }
    } else {
      // Pick plausible nearby chunks or tweak a vowel in the chunk
      const shuffledPool = shuffle(allTokensPool);
      for (const p of shuffledPool) {
        if (set.size >= 3) break;
        if (p && p !== correctTok && Math.abs(p.length - correctTok.length) <= 3) {
          set.add(p);
        }
      }
      // Guarantee at least 2 options by tweaking one vowel if needed
      let guard = 0;
      while (set.size < 2 && guard < 10) {
        guard++;
        const swapped = correctTok.replace(/[aeiou]/i, m => {
          const alts = { a: "e", e: "i", i: "a", o: "u", u: "o" };
          return alts[m.toLowerCase()] || "a";
        });
        if (swapped !== correctTok) set.add(swapped);
        else set.add(correctTok + "s");
      }
    }
    return shuffle(Array.from(set));
  }

  function prepareQuestions(lessonSet) {
    const unitId = lessonSet?.unitId || getBridge().getState?.()?.ui?.unitId || 1;
    const splitAt = LESSON_SPLIT_COUNTS[unitId] || Math.ceil((lessonSet?.items?.length || 6) / 2);

    const tagged = (lessonSet?.items || []).map((item, idx) => ({
      ...item,
      lesson: item.lesson || (idx < splitAt ? 1 : 2)
    }));

    let filtered = tagged;
    if (runtime.lessonFilter === "1") {
      const f = tagged.filter(x => x.lesson === 1);
      if (f.length > 0) filtered = f;
    } else if (runtime.lessonFilter === "2") {
      const f = tagged.filter(x => x.lesson === 2);
      if (f.length > 0) filtered = f;
    }

    const chosen = shuffle(filtered).slice(0, Math.min(6, filtered.length));
    const allChunks = [];
    const prepped = chosen.map(item => {
      const tokens = tokenizeWordForBridge(item.en);
      tokens.forEach(t => allChunks.push(t));
      return { item, tokens };
    });

    return prepped.map(q => ({
      ...q,
      columns: q.tokens.map(tok => buildDistractorsForToken(tok, allChunks))
    }));
  }

  function loadQuestion(idx) {
    clearTimers();
    runtime.qIdx = idx;
    const q = runtime.questions[idx];
    if (!q) return;
    runtime.slots = new Array(q.tokens.length).fill(null);
    runtime.wrongMask = new Array(q.tokens.length).fill(false);
    runtime.columns = q.columns.map(c => c.slice());
    runtime.testing = false;
    runtime.carDriveState = "idle";
    runtime.activeGlowIdx = -1;
  }

  function injectStyles() {
    if (document.getElementById("bridge-spelling-styles")) return;
    const style = document.createElement("style");
    style.id = "bridge-spelling-styles";
    style.textContent = `
      .bs-world {
        position: relative;
        border-radius: 28px;
        overflow: hidden;
        border: 4px solid #ffffff;
        box-shadow: 0 14px 32px rgba(30, 58, 138, 0.22);
        background: linear-gradient(180deg, #60c5ff 0%, #a5e8ff 56%, #e0f7ff 100%);
        padding: 14px 16px 18px;
      }
      .bs-hud {
        position: relative;
        z-index: 4;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 10px;
      }
      .bs-top-card {
        position: relative;
        z-index: 4;
        max-width: 340px;
        margin: 0 auto 10px;
        padding: 10px 18px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.96);
        border: 3.5px solid #ffffff;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
      }
      .bs-pic-box {
        width: 72px;
        height: 72px;
        border-radius: 20px;
        background: linear-gradient(135deg, #eff6ff, #fdf2f8);
        border: 2.5px solid #dbeafe;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 46px;
        flex-shrink: 0;
      }
      .bs-spk-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(180deg, #60a5fa, #2563eb);
        border: 3px solid #ffffff;
        border-bottom: 4px solid #1d4ed8;
        color: #ffffff;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 6px 14px rgba(37, 99, 235, 0.3);
        transition: transform 0.15s ease;
      }
      .bs-spk-btn:hover { transform: scale(1.08); }

      /* Canyon Stage matching video */
      .bs-canyon {
        position: relative;
        min-height: 186px;
        margin: 6px -16px 0;
        padding: 20px 12px 0;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
      }
      .bs-rainbow {
        position: absolute;
        right: 12px;
        top: -8px;
        width: 190px;
        height: 110px;
        pointer-events: none;
        z-index: 1;
      }
      .bs-cloud {
        position: absolute;
        font-size: 36px;
        opacity: 0.9;
        pointer-events: none;
      }
      .bs-river {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 52px;
        background: linear-gradient(180deg, #38bdf8, #0284c7);
        z-index: 1;
      }
      .bs-cliff {
        position: relative;
        z-index: 2;
        width: 118px;
        height: 92px;
        background: linear-gradient(180deg, #a16207 0%, #854d0e 100%);
        border-top: 16px solid #4ade80;
        box-shadow: inset 0 6px 0 rgba(255,255,255,0.28);
        flex-shrink: 0;
      }
      .bs-cliff.left { border-radius: 0 18px 0 0; margin-left: -12px; padding-left: 12px; }
      .bs-cliff.right { border-radius: 18px 0 0 0; margin-right: -12px; padding-right: 12px; }

      .bs-car-wrap {
        position: absolute;
        left: 16px;
        bottom: 84px;
        z-index: 6;
        width: 98px;
        height: 56px;
        pointer-events: none;
        transition: left 1.15s cubic-bezier(0.32, 0.92, 0.45, 1), transform 0.28s ease;
      }
      .bs-car-wrap.is-driving {
        left: calc(100% - 116px);
      }
      .bs-car-wrap.is-wobble {
        left: 24%;
        animation: bsCarWobble 0.55s ease;
      }
      @keyframes bsCarWobble {
        0%, 100% { transform: rotate(0deg); }
        30% { transform: translateY(-6px) rotate(-9deg); }
        65% { transform: translateY(4px) rotate(7deg); }
      }

      .bs-goal-arch {
        position: absolute;
        right: 14px;
        bottom: 86px;
        z-index: 3;
        pointer-events: none;
      }

      /* Bridge Planks Row spanning canyon */
      .bs-bridge-row {
        position: relative;
        z-index: 5;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 8px;
        margin-bottom: 72px;
      }
      .bs-plank-slot {
        flex: 1;
        max-width: 112px;
        min-width: 52px;
        height: 56px;
        border-radius: 14px;
        border: 3px dashed rgba(255, 255, 255, 0.85);
        background: rgba(255, 255, 255, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 900;
        color: #1e293b;
        cursor: pointer;
        transition: transform 0.16s ease, background 0.18s ease, border-color 0.18s ease;
      }
      .bs-plank-slot.is-filled {
        border-style: solid;
        border-color: #ffffff;
        background: linear-gradient(180deg, #fde68a 0%, #f59e0b 100%);
        border-bottom: 5px solid #b45309;
        color: #451a03;
        box-shadow: 0 6px 14px rgba(15, 23, 42, 0.22);
      }
      .bs-plank-slot.is-glow-green {
        background: linear-gradient(180deg, #86efac 0%, #22c55e 100%);
        border-bottom-color: #15803d;
        color: #ffffff;
        transform: translateY(-4px) scale(1.06);
      }
      .bs-plank-slot.is-wrong-plank {
        background: linear-gradient(180deg, #fecdd3 0%, #fb7185 100%);
        border-bottom-color: #be123c;
        color: #ffffff;
        animation: bsShake 0.42s ease;
      }
      @keyframes bsShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-6px); }
        50% { transform: translateX(6px); }
        75% { transform: translateX(-4px); }
      }

      /* Columnar Tile Choices below bridge */
      .bs-columns-area {
        position: relative;
        z-index: 5;
        background: linear-gradient(180deg, #9a6324 0%, #784715 100%);
        margin: 0 -16px -18px;
        padding: 14px 16px 18px;
        border-top: 5px solid #4ade80;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .bs-cols-grid {
        flex: 1;
        display: flex;
        justify-content: center;
        gap: 8px;
        padding: 0 92px;
      }
      .bs-col-stack {
        flex: 1;
        max-width: 112px;
        min-width: 52px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
      }
      .bs-tile-btn {
        min-height: 48px;
        padding: 6px 6px;
        border-radius: 14px;
        background: linear-gradient(180deg, #fffbeb 0%, #fde68a 100%);
        border: 2.5px solid #ffffff;
        border-bottom: 5px solid #d97706;
        color: #451a03;
        font-size: 19px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
        transition: transform 0.14s ease, opacity 0.14s ease;
      }
      .bs-tile-btn.is-chunk { font-size: 13.5px; }
      .bs-tile-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.04); }
      .bs-tile-btn.is-picked {
        opacity: 0.35;
        transform: scale(0.92);
      }

      .bs-test-wrap {
        position: absolute;
        right: 16px;
        bottom: 18px;
      }

      @media (max-width: 720px) {
        .bs-cliff { width: 70px; height: 76px; }
        .bs-car-wrap { width: 74px; height: 42px; bottom: 68px; left: 8px; }
        .bs-car-wrap.is-driving { left: calc(100% - 82px); }
        .bs-goal-arch { right: 4px; bottom: 70px; transform: scale(0.75); transform-origin: bottom right; }
        .bs-bridge-row { margin-bottom: 58px; gap: 5px; padding: 0 4px; }
        .bs-plank-slot { height: 46px; font-size: 16px; min-width: 40px; }
        .bs-cols-grid { padding: 0; gap: 5px; }
        .bs-col-stack { min-width: 40px; }
        .bs-columns-area { flex-direction: column; align-items: stretch; }
        .bs-test-wrap { position: static; display: flex; justify-content: center; margin-top: 8px; }
      }
    `;
    document.head.appendChild(style);
  }

  function renderCarSvg() {
    return `
      <svg viewBox="0 0 110 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
        <!-- Roof & Body -->
        <path d="M22 30 C26 12, 44 8, 64 10 C78 12, 86 24, 92 28 L100 32 C104 34, 104 46, 98 48 L14 48 C8 48, 8 34, 14 32 Z" fill="#38bdf8" stroke="#ffffff" stroke-width="3"/>
        <path d="M12 37 L101 37 L101 46 L12 46 Z" fill="#ef4444" opacity="0.9"/>
        <!-- Windshield -->
        <path d="M32 28 C35 16, 48 14, 62 15 C70 16, 76 23, 79 28 Z" fill="#e0f2fe" stroke="#ffffff" stroke-width="2"/>
        <!-- Cute Eyes on windshield -->
        <circle cx="50" cy="22" r="3" fill="#1e293b"/>
        <circle cx="63" cy="22" r="3" fill="#1e293b"/>
        <circle cx="49" cy="21" r="1" fill="#ffffff"/>
        <circle cx="62" cy="21" r="1" fill="#ffffff"/>
        <!-- Wheels -->
        <circle cx="30" cy="49" r="10.5" fill="#1e293b" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="30" cy="49" r="4.5" fill="#cbd5e1"/>
        <circle cx="80" cy="49" r="10.5" fill="#1e293b" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="80" cy="49" r="4.5" fill="#cbd5e1"/>
      </svg>
    `;
  }

  function renderGoalArchSvg() {
    return `
      <svg width="78" height="72" viewBox="0 0 88 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="22" width="10" height="58" rx="4" fill="#f97316" stroke="#fff" stroke-width="2"/>
        <rect x="70" y="22" width="10" height="58" rx="4" fill="#f97316" stroke="#fff" stroke-width="2"/>
        <path d="M10 26 A34 22 0 0 1 78 26" stroke="#1e293b" stroke-width="10" stroke-linecap="round" fill="none"/>
        <path d="M10 26 A34 22 0 0 1 78 26" stroke="#ffffff" stroke-width="6" stroke-dasharray="6 6" stroke-linecap="round" fill="none"/>
        <text x="44" y="20" text-anchor="middle" font-size="18">🏁</text>
      </svg>
    `;
  }

  function renderGame(container, lessonSet) {
    injectStyles();
    cleanup();

    runtime.questions = prepareQuestions(lessonSet);
    runtime.totalScore = 0;
    runtime.totalFlowers = 0;
    if (runtime.questions.length > 0) loadQuestion(0);

    function draw() {
      const q = runtime.questions[runtime.qIdx];
      if (!q) return;
      const item = q.item;
      const unitId = lessonSet?.unitId || getBridge().getState?.()?.ui?.unitId || 1;
      const allFilled = runtime.slots.every(s => s !== null);
      const isLongToken = q.tokens.some(t => t.length > 2);

      container.innerHTML = `
        <div class="bs-world">
          <div class="bs-cloud" style="left:6%; top:46px;">☁️</div>
          <div class="bs-cloud" style="left:26%; top:24px; font-size:28px;">☁️</div>

          <div class="bs-hud">
            <div class="btn-group">
              <span class="mini-pill" style="background:#fff; color:#1e3a8a;">🌉 Từ ${runtime.qIdx + 1}/${runtime.questions.length}</span>
              <span class="mini-pill" style="background:#fef9c3; color:#854d0e;">📘 Unit ${unitId} • Lesson ${item.lesson || 1}</span>
              <span class="mini-pill" style="background:#dcfce7; color:#166534;">🌸 +${runtime.totalFlowers}</span>
            </div>
            <div class="btn-group">
              <button type="button" class="btn-3d ${runtime.lessonFilter === "all" ? "btn-pink" : "btn-soft-sky"}" data-bslesson="all" style="min-height:40px; padding:6px 11px; font-size:12.5px;">L1 + L2</button>
              <button type="button" class="btn-3d ${runtime.lessonFilter === "1" ? "btn-pink" : "btn-soft-sky"}" data-bslesson="1" style="min-height:40px; padding:6px 11px; font-size:12.5px;">Lesson 1</button>
              <button type="button" class="btn-3d ${runtime.lessonFilter === "2" ? "btn-pink" : "btn-soft-sky"}" data-bslesson="2" style="min-height:40px; padding:6px 11px; font-size:12.5px;">Lesson 2</button>
              <button type="button" class="btn-3d ${runtime.showHint ? "btn-yellow" : "btn-soft-mint"}" id="bs-hint-btn" style="min-height:40px; padding:6px 11px; font-size:12.5px;">💡 Nghĩa</button>
            </div>
          </div>

          <!-- Top Picture & Speaker Card (like video top-center) -->
          <div class="bs-top-card">
            <div class="bs-pic-box">
              ${item.imageDataUrl ? `<img src="${item.imageDataUrl}" alt="${item.en}" style="width:60px; height:60px; object-fit:contain; border-radius:12px;" />` : (item.icon || "📘")}
            </div>
            <div style="text-align:left; min-width:0;">
              <div style="font-size:12px; font-weight:900; color:#2563eb; text-transform:uppercase;">Nghe &amp; xây cầu ghép từ</div>
              <div style="font-size:16px; font-weight:900; color:#1e293b;">${runtime.showHint ? item.vi : "Chạm loa 🔊 để nghe từ!"}</div>
              ${runtime.showHint && item.ipa ? `<div style="font-size:12px; font-weight:700; color:#64748b;">${item.ipa}</div>` : ""}
            </div>
            <button type="button" class="bs-spk-btn" id="bs-main-spk" title="Nghe từ vựng">🔊</button>
          </div>

          <!-- Canyon, Rainbow, Car, Bridge Planks & Goal Arch -->
          <div class="bs-canyon">
            <svg class="bs-rainbow" viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 108 A78 78 0 0 1 178 108" stroke="#f87171" stroke-width="9" stroke-linecap="round" opacity="0.8"/>
              <path d="M31 108 A69 69 0 0 1 169 108" stroke="#facc15" stroke-width="9" stroke-linecap="round" opacity="0.8"/>
              <path d="M40 108 A60 60 0 0 1 160 108" stroke="#4ade80" stroke-width="9" stroke-linecap="round" opacity="0.8"/>
              <path d="M49 108 A51 51 0 0 1 151 108" stroke="#60a5fa" stroke-width="9" stroke-linecap="round" opacity="0.8"/>
            </svg>
            <div class="bs-river"></div>
            <div class="bs-cliff left"></div>

            <div class="bs-car-wrap ${runtime.carDriveState === "success" ? "is-driving" : runtime.carDriveState === "wobble" ? "is-wobble" : ""}">
              ${renderCarSvg()}
            </div>

            <div class="bs-bridge-row">
              ${runtime.slots.map((val, sIdx) => {
                const isGlow = runtime.activeGlowIdx >= sIdx && runtime.carDriveState === "success";
                const isBad = runtime.wrongMask[sIdx];
                return `
                  <button type="button"
                    class="bs-plank-slot ${val !== null ? "is-filled" : ""} ${isGlow ? "is-glow-green" : ""} ${isBad ? "is-wrong-plank" : ""}"
                    data-slot-idx="${sIdx}"
                    style="${isLongToken ? "font-size:14px; padding:0 6px;" : ""}"
                    title="${val !== null ? "Chạm để gỡ miếng gỗ" : "Ô cầu trống"}">
                    ${val !== null ? val : ""}
                  </button>
                `;
              }).join("")}
            </div>

            <div class="bs-cliff right"></div>
            <div class="bs-goal-arch">${renderGoalArchSvg()}</div>
          </div>

          <!-- Columns of choice planks + Test Bridge button -->
          <div class="bs-columns-area">
            <div class="bs-cols-grid">
              ${runtime.columns.map((colChoices, colIdx) => `
                <div class="bs-col-stack">
                  ${colChoices.map(tok => {
                    const isUsed = runtime.slots[colIdx] === tok;
                    return `
                      <button type="button"
                        class="bs-tile-btn ${isLongToken ? "is-chunk" : ""} ${isUsed ? "is-picked" : ""}"
                        data-pick-col="${colIdx}"
                        data-pick-tok="${tok.replace(/"/g, "&quot;")}"
                        ${runtime.testing ? "disabled" : ""}>
                        ${tok}
                      </button>
                    `;
                  }).join("")}
                </div>
              `).join("")}
            </div>

            <div class="bs-test-wrap">
              <button type="button" class="btn-3d btn-mint" id="bs-test-btn" ${(!allFilled || runtime.testing) ? "disabled" : ""} style="min-height:54px; padding:10px 18px; font-size:15.5px;">
                🌉 Test Bridge ▶
              </button>
            </div>
          </div>

          <div class="feedback-banner" id="bs-fb" style="margin-top:12px;"></div>
        </div>
      `;

      // Bind HUD controls
      container.querySelectorAll("[data-bslesson]").forEach(btn => {
        btn.addEventListener("click", () => {
          runtime.lessonFilter = btn.dataset.bslesson;
          runtime.questions = prepareQuestions(lessonSet);
          if (runtime.questions.length > 0) loadQuestion(0);
          draw();
        });
      });

      document.getElementById("bs-hint-btn")?.addEventListener("click", () => {
        runtime.showHint = !runtime.showHint;
        draw();
      });

      document.getElementById("bs-main-spk")?.addEventListener("click", () => {
        playPlankSnapSFX();
        speakText(item.en, 0.85);
        global.MunCompanion?.resetIdleTimer?.();
      });

      // Tap a column plank -> snap into that bridge column slot + pronounce sound
      container.querySelectorAll("[data-pick-col]").forEach(btn => {
        btn.addEventListener("click", () => {
          if (runtime.testing) return;
          const colIdx = Number(btn.dataset.pickCol);
          const tok = btn.dataset.pickTok;
          runtime.slots[colIdx] = tok;
          runtime.wrongMask[colIdx] = false;
          playPlankSnapSFX();
          speakTileToken(tok);
          global.MunCompanion?.resetIdleTimer?.();
          draw();
        });
      });

      // Tap a filled bridge slot -> clear it to swap
      container.querySelectorAll("[data-slot-idx]").forEach(btn => {
        btn.addEventListener("click", () => {
          if (runtime.testing) return;
          const idx = Number(btn.dataset.slotIdx);
          if (runtime.slots[idx] !== null) {
            runtime.slots[idx] = null;
            runtime.wrongMask[idx] = false;
            tone(320, 0.06, "sine", 0, 0.08);
            draw();
          }
        });
      });

      // Test Bridge!
      document.getElementById("bs-test-btn")?.addEventListener("click", () => {
        if (runtime.testing || !runtime.slots.every(s => s !== null)) return;
        runtime.testing = true;
        const qCur = runtime.questions[runtime.qIdx];
        const mismatches = qCur.tokens.map((expected, idx) => runtime.slots[idx] !== expected);
        const allOk = mismatches.every(m => !m);
        const b = getBridge();

        if (allOk) {
          runtime.carDriveState = "success";
          runtime.totalScore++;
          runtime.totalFlowers += 3;
          playCarRevSFX();

          // Sequential xylophone light-up of each plank like the video!
          qCur.tokens.forEach((_, idx) => {
            const t = setTimeout(() => {
              runtime.activeGlowIdx = idx;
              playXylophoneStep(idx);
              draw();
            }, idx * 180);
            runtime.timers.push(t);
          });

          const finishDelay = qCur.tokens.length * 180 + 550;
          const tEnd = setTimeout(() => {
            playVictoryFanfare();
            speakText(item.en, 0.85);
            b.addFlower?.(3);
            b.launchConfetti?.(24);
            global.MunCompanion?.onCorrect?.(`Xe qua cầu an toàn! Từ đúng là "${item.en}" (${item.vi}) (+3 🌸)! 🚗🌈`);

            const tNext = setTimeout(() => {
              if (runtime.qIdx + 1 >= runtime.questions.length) {
                b.renderPlayCompleted?.(
                  container,
                  "Kỹ Sư Xây Cầu Nhí Siêu Đỉnh!",
                  `Bé đã lái xe vượt cầu ${runtime.totalScore}/${runtime.questions.length} từ vựng Lesson 1 & 2!`,
                  runtime.totalFlowers
                );
              } else {
                loadQuestion(runtime.qIdx + 1);
                draw();
                speakText(runtime.questions[runtime.qIdx].item.en, 0.85);
              }
            }, 1350);
            runtime.timers.push(tNext);
          }, finishDelay);
          runtime.timers.push(tEnd);
        } else {
          runtime.carDriveState = "wobble";
          runtime.wrongMask = mismatches;
          playWobbleFailSFX();
          b.recordMistake?.(unitId, item);
          b.renderMistakesSection?.();
          b.renderHeader?.();
          global.MunCompanion?.onWrong?.(`Ôi, cầu hơi rung ở ô màu đỏ rồi! Hãy đổi lại thẻ gỗ cho đúng từ "${item.en}" nhé! 🥺`);
          draw();

          const fb = document.getElementById("bs-fb");
          if (fb) {
            fb.className = "feedback-banner show err";
            fb.textContent = "🌉 Cây cầu bị lung lay ở ô màu đỏ! Bấm loa 🔊 nghe lại và chọn thẻ gỗ đúng thay thế nhé!";
          }

          const tReset = setTimeout(() => {
            runtime.carDriveState = "idle";
            runtime.testing = false;
            draw();
          }, 850);
          runtime.timers.push(tReset);
        }
      });
    }

    draw();
    if (runtime.questions[0]) {
      const tSpeak = setTimeout(() => speakText(runtime.questions[0].item.en, 0.85), 250);
      runtime.timers.push(tSpeak);
    }
  }

  function cleanup() {
    clearTimers();
  }

  global.BridgeSpellingModule = {
    renderGame,
    cleanup
  };
})(window);
