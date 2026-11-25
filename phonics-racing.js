/**
 * PHONICS RACING – ĐUA XE THU THẬP CHỮ CÁI
 * Independent Game Component + Phonics Lesson Set Manager + Teacher Editor
 * Integrates safely with Kawaii English 5 Playland (index.html) without modifying existing games or Mochi Pet.
 */
(function (global) {
  "use strict";

  const PR_STORAGE_KEY = "ta5_phonics_racing_sets_v1";

  // Verified synthetic phonics spoken cues for TTS fallback (when teacher hasn't uploaded custom MP3/WAV)
  const PHONICS_CUE_MAP = {
    A: "a", B: "buh", C: "kuh", D: "duh", E: "eh", F: "fuh", G: "guh", H: "huh",
    I: "ih", J: "juh", K: "kuh", L: "luh", M: "mmm", N: "nnn", O: "ah", P: "puh",
    Q: "kwuh", R: "rrr", S: "sss", T: "tuh", U: "uh", V: "vvv", W: "wuh", X: "ks",
    Y: "yuh", Z: "zzz",
    SH: "shh", CH: "chuh", TH: "thh", PH: "fuh", CK: "kuh", OO: "oo", EE: "ee", AI: "ay"
  };

  const COMMON_DIGRAPHS = ["SH", "CH", "TH", "PH", "CK", "OO", "EE"];

  function splitWordToTokens(word, digraphMode = "letters") {
    const clean = String(word || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8);
    if (!clean) return [];
    if (digraphMode !== "digraphs") return clean.split("");
    const tokens = [];
    for (let i = 0; i < clean.length; i++) {
      const pair = clean.slice(i, i + 2);
      if (pair.length === 2 && COMMON_DIGRAPHS.includes(pair)) {
        tokens.push(pair);
        i++;
      } else {
        tokens.push(clean[i]);
      }
    }
    return tokens;
  }

  function defaultPhonicsForTokens(tokens) {
    return tokens.map(t => PHONICS_CUE_MAP[t] || t.toLowerCase());
  }

  function makeWordItem(word, vi, icon, topic, difficulty = "easy", digraphMode = "letters") {
    const clean = String(word || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8);
    const tokens = splitWordToTokens(clean, digraphMode);
    return {
      word: clean,
      en: clean.toLowerCase(),
      vi: vi || clean,
      icon: icon || "🌟",
      topic: topic || "General",
      difficulty,
      digraphMode,
      letters: tokens,
      phonics: defaultPhonicsForTokens(tokens),
      imageDataUrl: "",
      wordAudioUrl: "",
      letterAudioMap: {}
    };
  }

  function buildDefaultPhonicsSets() {
    return {
      pr_animals: {
        id: "pr_animals",
        builtin: true,
        name: "Unit 1 – Animals",
        difficulty: "easy",
        wordsPerRound: 5,
        items: [
          makeWordItem("CAT", "con mèo", "🐱", "Animals", "easy"),
          makeWordItem("DOG", "con chó", "🐶", "Animals", "easy"),
          makeWordItem("PIG", "con lợn", "🐷", "Animals", "easy"),
          makeWordItem("HEN", "gà mái", "🐔", "Animals", "easy"),
          makeWordItem("FISH", "con cá", "🐟", "Animals", "easy", "digraphs")
        ]
      },
      pr_school: {
        id: "pr_school",
        builtin: true,
        name: "Unit 2 – School Things",
        difficulty: "easy",
        wordsPerRound: 5,
        items: [
          makeWordItem("PEN", "cây bút mực", "🖊️", "School Things", "easy"),
          makeWordItem("BAG", "cặp sách", "🎒", "School Things", "easy"),
          makeWordItem("BOOK", "quyển sách", "📘", "School Things", "easy"),
          makeWordItem("RULER", "cái thước kẻ", "📏", "School Things", "medium"),
          makeWordItem("PENCIL", "bút chì", "✏️", "School Things", "medium")
        ]
      },
      pr_colors: {
        id: "pr_colors",
        builtin: true,
        name: "Unit 3 – Colors",
        difficulty: "easy",
        wordsPerRound: 4,
        items: [
          makeWordItem("RED", "màu đỏ", "❤️", "Colors", "easy"),
          makeWordItem("BLUE", "màu xanh dương", "💙", "Colors", "easy"),
          makeWordItem("PINK", "màu hồng", "🩷", "Colors", "easy"),
          makeWordItem("GREEN", "màu xanh lá", "💚", "Colors", "medium")
        ]
      },
      pr_nature: {
        id: "pr_nature",
        builtin: true,
        name: "Unit 4 – Nature",
        difficulty: "easy",
        wordsPerRound: 4,
        items: [
          makeWordItem("SUN", "mặt trời", "☀️", "Nature", "easy"),
          makeWordItem("TREE", "cái cây", "🌳", "Nature", "easy"),
          makeWordItem("MOON", "mặt trăng", "🌙", "Nature", "easy"),
          makeWordItem("STAR", "ngôi sao", "⭐", "Nature", "easy")
        ]
      }
    };
  }

  function loadPhonicsStore() {
    const defaults = buildDefaultPhonicsSets();
    try {
      const raw = localStorage.getItem(PR_STORAGE_KEY);
      if (!raw) return { sets: defaults, selectedSetId: "pr_animals" };
      const parsed = JSON.parse(raw);
      return {
        sets: { ...defaults, ...(parsed.sets || {}) },
        selectedSetId: parsed.selectedSetId && (defaults[parsed.selectedSetId] || parsed.sets?.[parsed.selectedSetId])
          ? parsed.selectedSetId
          : "pr_animals"
      };
    } catch {
      return { sets: defaults, selectedSetId: "pr_animals" };
    }
  }

  let prStore = loadPhonicsStore();
  function savePrStore() {
    try { localStorage.setItem(PR_STORAGE_KEY, JSON.stringify(prStore)); } catch {}
  }

  function getActivePhonicsSet() {
    return prStore.sets[prStore.selectedSetId] || Object.values(prStore.sets)[0];
  }

  function convertGenericSetToPhonics(genericSet) {
    if (!genericSet || !Array.isArray(genericSet.items)) return getActivePhonicsSet();
    const valid = genericSet.items
      .map(it => {
        const clean = String(it.en || it.word || "").toUpperCase().replace(/[^A-Z]/g, "");
        if (clean.length < 2 || clean.length > 8) return null;
        const item = makeWordItem(clean, it.vi || clean, it.icon || "🌟", genericSet.name || "Lesson", genericSet.difficulty || "medium");
        if (it.imageDataUrl) item.imageDataUrl = it.imageDataUrl;
        if (it.audioDataUrl) item.wordAudioUrl = it.audioDataUrl;
        return item;
      })
      .filter(Boolean);
    if (valid.length === 0) return getActivePhonicsSet();
    return {
      id: genericSet.id,
      name: genericSet.name,
      difficulty: genericSet.difficulty || "medium",
      wordsPerRound: Math.min(6, valid.length),
      items: valid
    };
  }

  // =========================================================================
  // AUDIO HELPERS (Car purr + Phonics phoneme + Word pronunciation)
  // =========================================================================
  const RacingAudio = (() => {
    let ctx = null;
    let engineOsc = null;
    let engineGain = null;

    function isSoundOn() {
      const st = global.PlaylandBridge?.getState?.() || global.state;
      return st ? !!st.soundOn : true;
    }

    function ensureCtx() {
      if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      return ctx;
    }

    return {
      startEngine() {
        if (!isSoundOn() || engineOsc) return;
        const c = ensureCtx(); if (!c) return;
        try {
          engineOsc = c.createOscillator();
          engineGain = c.createGain();
          engineOsc.type = "triangle";
          engineOsc.frequency.setValueAtTime(92, c.currentTime);
          engineGain.gain.setValueAtTime(0.001, c.currentTime);
          engineGain.gain.exponentialRampToValueAtTime(0.028, c.currentTime + 0.08);
          engineOsc.connect(engineGain);
          engineGain.connect(c.destination);
          engineOsc.start();
        } catch {}
      },
      stopEngine() {
        if (!engineOsc || !ctx) return;
        try {
          engineGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
          engineOsc.stop(ctx.currentTime + 0.1);
        } catch {}
        engineOsc = null;
        engineGain = null;
      },
      collectPop(stepIdx) {
        if (!isSoundOn()) return;
        const c = ensureCtx(); if (!c) return;
        const base = 480 + stepIdx * 55;
        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 1.35, now + 0.12);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        osc.connect(gain); gain.connect(c.destination);
        osc.start(now); osc.stop(now + 0.2);
      },
      bump() {
        if (!isSoundOn()) return;
        const c = ensureCtx(); if (!c) return;
        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        osc.connect(gain); gain.connect(c.destination);
        osc.start(now); osc.stop(now + 0.18);
      },
      speakPhonics(token, idx, wordItem, audioMode = "phonics") {
        if (!isSoundOn()) return;
        const customUrl = wordItem?.letterAudioMap?.[token] || wordItem?.letterAudioMap?.[String(idx)];
        if (customUrl) {
          try { new Audio(customUrl).play().catch(() => {}); return; } catch {}
        }
        const cue = audioMode === "letters"
          ? token.toLowerCase()
          : (wordItem?.phonics?.[idx] || PHONICS_CUE_MAP[token] || token.toLowerCase());
        if ("speechSynthesis" in window) {
          try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(cue);
            u.lang = "en-US";
            u.rate = 0.85;
            u.pitch = 1.08;
            u.volume = 0.9;
            window.speechSynthesis.speak(u);
          } catch {}
        }
      },
      speakWord(wordItem) {
        if (!isSoundOn()) return;
        if (wordItem?.wordAudioUrl) {
          try { new Audio(wordItem.wordAudioUrl).play().catch(() => {}); return; } catch {}
        }
        const spk = global.PlaylandBridge?.speakEnglish || global.speakEnglish;
        if (typeof spk === "function") {
          spk(wordItem.word.toLowerCase());
        }
      }
    };
  })();

  // =========================================================================
  // SPLINE TRACK MATH (Smooth Purple Winding Track across Kawaii Garden)
  // =========================================================================
  function sampleSpline(waypoints, samples = 240) {
    const pts = [];
    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1);
      const scaled = t * (waypoints.length - 1);
      const idx = Math.min(waypoints.length - 2, Math.floor(scaled));
      const localT = scaled - idx;
      const p0 = waypoints[Math.max(0, idx - 1)];
      const p1 = waypoints[idx];
      const p2 = waypoints[idx + 1];
      const p3 = waypoints[Math.min(waypoints.length - 1, idx + 2)];
      // Catmull-Rom spline
      const t2 = localT * localT;
      const t3 = t2 * localT;
      const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * localT + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * localT + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      pts.push({ x, y });
    }
    return pts;
  }

  function buildTrackLayout(wordIdx) {
    const variant = wordIdx % 3;
    const waypoints = variant === 0
      ? [{ x: 82, y: 270 }, { x: 220, y: 155 }, { x: 370, y: 315 }, { x: 540, y: 165 }, { x: 685, y: 295 }, { x: 792, y: 225 }]
      : variant === 1
      ? [{ x: 82, y: 210 }, { x: 235, y: 325 }, { x: 400, y: 150 }, { x: 565, y: 310 }, { x: 700, y: 175 }, { x: 792, y: 235 }]
      : [{ x: 82, y: 315 }, { x: 240, y: 190 }, { x: 430, y: 290 }, { x: 610, y: 155 }, { x: 792, y: 245 }];

    const spline = sampleSpline(waypoints, 240);
    const obstacles = [
      { x: 150, y: 74, r: 28, kind: "tree" },
      { x: 445, y: 78, r: 26, kind: "bush" },
      { x: 720, y: 76, r: 28, kind: "tree" },
      { x: 160, y: 408, r: 25, kind: "bush" },
      { x: 500, y: 406, r: 27, kind: "tree" }
    ];
    return { spline, obstacles };
  }

  // =========================================================================
  // GAME RUNNER: PHONICS RACING (PLAY SCREEN)
  // =========================================================================
  let activeRaceCleanup = null;

  function cleanupActiveRace() {
    RacingAudio.stopEngine();
    if (activeRaceCleanup) {
      activeRaceCleanup();
      activeRaceCleanup = null;
    }
  }

  function renderPhonicsRacing(body, lessonSet, isPreviewDraft = false) {
    cleanupActiveRace();

    // Ensure valid phonics items (convert if user picked a Global Success generic unit)
    const normalizedSet = (lessonSet && lessonSet.items && lessonSet.items[0] && lessonSet.items[0].word)
      ? lessonSet
      : convertGenericSetToPhonics(lessonSet);

    const limit = Math.max(1, Math.min(normalizedSet.items.length, Number(normalizedSet.wordsPerRound || normalizedSet.questionCount) || normalizedSet.items.length));
    const wordQueue = normalizedSet.items.slice(0, limit);

    let wordIdx = 0;
    let totalFlowersEarned = 0;
    let audioMode = "phonics"; // "phonics" | "letters"
    let autoCruise = false;
    let rafId = null;

    function startWord() {
      if (rafId) cancelAnimationFrame(rafId);
      RacingAudio.stopEngine();

      const item = wordQueue[wordIdx];
      const tokens = item.letters && item.letters.length ? item.letters : splitWordToTokens(item.word, item.digraphMode);
      const { spline, obstacles } = buildTrackLayout(wordIdx);

      // Place target letters sequentially along the purple winding road
      const letterNodes = tokens.map((tok, i) => {
        const frac = 0.17 + ((i + 0.5) / (tokens.length + 0.5)) * 0.66;
        const p = spline[Math.min(spline.length - 1, Math.floor(frac * (spline.length - 1)))];
        return {
          idx: i,
          token: tok,
          x: p.x,
          y: p.y,
          collected: false,
          isTarget: true
        };
      });

      // Place 2 friendly distractor tiles slightly off the road in the grass (like in the sample video!)
      const usedLetters = new Set(tokens);
      const distractorChoices = ["R", "E", "M", "S", "T", "L", "B", "P"].filter(ch => !usedLetters.has(ch));
      const distractorSpots = [
        { x: 310, y: 112 },
        { x: 645, y: 372 }
      ];
      const distractorNodes = distractorSpots.map((sp, i) => ({
        idx: 100 + i,
        token: distractorChoices[i] || "Z",
        x: sp.x,
        y: sp.y,
        collected: false,
        isTarget: false,
        wobble: 0
      }));

      const finishPt = spline[spline.length - 1];
      const startPt = spline[0];
      const initAngle = Math.atan2(spline[3].y - startPt.y, spline[3].x - startPt.x);

      const game = {
        car: { x: startPt.x, y: startPt.y, angle: initAngle, speed: 0, wheelPhase: 0 },
        collectedCount: 0,
        wordCompleted: false,
        finishedFlagReached: false,
        rewarded: false,
        splineIndex: 0,
        particles: [],
        trail: [],
        pointerTarget: null,
        pointerDown: false,
        keys: {},
        dpad: { up: false, down: false, left: false, right: false },
        hintText: "Lái xe dọc đường màu tím để thu thập từng chữ cái nhé! 🚗💜",
        lastBumpAt: 0
      };

      const slotColors = ["#38bdf8", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#06b6d4", "#f43f5e", "#6366f1"];

      body.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <!-- TOP WORD BOARD (Inspired directly by the video's glossy blue bar) -->
          <div style="
            background: linear-gradient(135deg, #2d9cff 0%, #5cb8ff 100%);
            border: 4px solid #ffffff;
            border-radius: 26px;
            padding: 12px 16px;
            box-shadow: 0 10px 24px rgba(37, 150, 255, 0.24);
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          ">
            <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
              <div style="
                width:76px; height:68px; border-radius:20px;
                background:#ffffff; border:3px solid #dbeafe;
                display:flex; align-items:center; justify-content:center;
                box-shadow:0 4px 10px rgba(15,23,42,0.12);
              ">
                ${item.imageDataUrl
                  ? `<img src="${item.imageDataUrl}" alt="${item.word}" style="width:66px; height:58px; object-fit:contain; border-radius:14px;" />`
                  : `<span style="font-size:46px; line-height:1;">${item.icon || "🌟"}</span>`}
              </div>

              <div>
                <div style="font-size:12.5px; font-weight:900; color:#e0f2fe; margin-bottom:5px;">
                  Từ ${wordIdx + 1}/${wordQueue.length} • ${item.vi}
                </div>
                <div id="pr-word-slots" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
                  ${tokens.map((tok, i) => `
                    <div id="pr-slot-${i}" style="
                      min-width:48px; height:50px; padding:0 10px;
                      border-radius:15px;
                      background: rgba(255,255,255,0.28);
                      border: 3px solid rgba(255,255,255,0.75);
                      display:flex; align-items:center; justify-content:center;
                      font-size:24px; font-weight:900; color:#ffffff;
                      transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
                    ">_</div>
                  `).join("")}
                </div>
              </div>
            </div>

            <div class="btn-group">
              <button class="btn-3d btn-yellow" id="pr-btn-listen-word">🔊 Nghe từ</button>
              <button class="btn-3d btn-soft-pink" id="pr-btn-audio-mode">
                ${audioMode === "phonics" ? "🎵 Âm Phonics" : "🔤 Tên Chữ"}
              </button>
            </div>
          </div>

          <!-- GARDEN & PURPLE WINDING TRACK CANVAS -->
          <div style="position:relative; border-radius:28px; overflow:hidden; border:4px solid #ffffff; box-shadow:0 12px 28px rgba(45,43,85,0.16); background:#61d038;">
            <canvas id="pr-canvas" width="880" height="460" style="display:block; width:100%; height:auto; touch-action:none; cursor:pointer;"></canvas>

            <!-- Completion / Next Word Overlay inside canvas container -->
            <div id="pr-finish-overlay" style="
              display:none; position:absolute; inset:0;
              background:rgba(45,43,85,0.34); backdrop-filter:blur(4px);
              align-items:center; justify-content:center; padding:16px;
            ">
              <div style="
                background:rgba(255,255,255,0.96); border:4px solid #ffffff;
                border-radius:28px; padding:22px 26px; text-align:center;
                max-width:420px; box-shadow:0 20px 44px rgba(45,43,85,0.25);
              ">
                <div style="font-size:48px; margin-bottom:4px;">🏁🎉🌸</div>
                <h3 style="font-size:24px; font-weight:900; color:#2d2b55;" id="pr-win-title">${item.word}!</h3>
                <p style="font-size:15px; font-weight:800; color:#575685; margin:6px 0 14px;" id="pr-win-desc">
                  Bé đã thu thập đủ chữ và về đích! (+2 🌸)
                </p>
                <div class="btn-group" style="justify-content:center;">
                  <button class="btn-3d btn-mint" id="pr-btn-next-word" style="font-size:16px; padding:10px 22px;">
                    ${wordIdx + 1 >= wordQueue.length ? "🏆 Hoàn thành lượt chơi!" : "NEXT WORD ➡️"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- HINT & EASY TOUCH/MOBILE CONTROLS -->
          <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; background:#fff; padding:12px 16px; border-radius:22px; border:2.5px solid #e6e4fb;">
            <div id="pr-hint-bar" style="font-size:14.5px; font-weight:800; color:#2d2b55; flex:1; min-width:220px;">
              ${game.hintText}
            </div>
            <div class="btn-group" style="justify-content:center;">
              <button class="btn-3d btn-soft-sky" data-dpad="left" aria-label="Rẽ trái">⬅️</button>
              <button class="btn-3d btn-soft-sky" data-dpad="up" aria-label="Đi lên">⬆️</button>
              <button class="btn-3d btn-soft-sky" data-dpad="down" aria-label="Đi xuống">⬇️</button>
              <button class="btn-3d btn-soft-sky" data-dpad="right" aria-label="Rẽ phải">➡️</button>
              <button class="btn-3d ${autoCruise ? "btn-pink" : "btn-lavender"}" id="pr-btn-auto">
                ${autoCruise ? "⏸️ Dừng tự lái" : "🚗 Tự lái đường tím"}
              </button>
            </div>
          </div>
        </div>
      `;

      const canvas = document.getElementById("pr-canvas");
      const ctx = canvas.getContext("2d");

      function updateWordBoardSlot(idx, token) {
        const el = document.getElementById(`pr-slot-${idx}`);
        if (!el) return;
        el.textContent = token.toLowerCase();
        el.style.background = slotColors[idx % slotColors.length];
        el.style.borderColor = "#ffffff";
        el.style.transform = "scale(1.14)";
        setTimeout(() => { if (el) el.style.transform = "scale(1)"; }, 220);
      }

      function highlightWordComplete() {
        tokens.forEach((_, i) => {
          const el = document.getElementById(`pr-slot-${i}`);
          if (el) el.style.boxShadow = "0 0 16px rgba(255, 226, 122, 0.95)";
        });
      }

      function spawnBurst(x, y, color) {
        for (let k = 0; k < 14; k++) {
          const a = (Math.PI * 2 * k) / 14;
          game.particles.push({
            x, y,
            vx: Math.cos(a) * (1.8 + Math.random() * 2.5),
            vy: Math.sin(a) * (1.8 + Math.random() * 2.5),
            life: 1,
            color: color || "#ffe27a",
            r: 4 + Math.random() * 4
          });
        }
      }

      function canvasCoords(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: ((clientX - rect.left) / rect.width) * canvas.width,
          y: ((clientY - rect.top) / rect.height) * canvas.height
        };
      }

      function onPointerDown(e) {
        if (game.finishedFlagReached) return;
        game.pointerDown = true;
        game.pointerTarget = canvasCoords(e.clientX, e.clientY);
        game.trail.push({ ...game.pointerTarget, life: 1 });
      }
      function onPointerMove(e) {
        if (!game.pointerDown || game.finishedFlagReached) return;
        game.pointerTarget = canvasCoords(e.clientX, e.clientY);
        game.trail.push({ ...game.pointerTarget, life: 1 });
        if (game.trail.length > 22) game.trail.shift();
      }
      function onPointerUp() {
        game.pointerDown = false;
      }

      function onKeyDown(e) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
        }
        game.keys[e.key.toLowerCase()] = true;
        game.pointerTarget = null;
      }
      function onKeyUp(e) {
        game.keys[e.key.toLowerCase()] = false;
      }

      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);

      body.querySelectorAll("[data-dpad]").forEach(btn => {
        const dir = btn.dataset.dpad;
        const setDir = (val) => { game.dpad[dir] = val; game.pointerTarget = null; };
        btn.addEventListener("pointerdown", () => setDir(true));
        btn.addEventListener("pointerup", () => setDir(false));
        btn.addEventListener("pointerleave", () => setDir(false));
      });

      document.getElementById("pr-btn-listen-word").addEventListener("click", () => {
        RacingAudio.speakWord(item);
      });

      document.getElementById("pr-btn-audio-mode").addEventListener("click", () => {
        audioMode = audioMode === "phonics" ? "letters" : "phonics";
        document.getElementById("pr-btn-audio-mode").textContent = audioMode === "phonics" ? "🎵 Âm Phonics" : "🔤 Tên Chữ";
      });

      document.getElementById("pr-btn-auto").addEventListener("click", () => {
        autoCruise = !autoCruise;
        const btn = document.getElementById("pr-btn-auto");
        btn.textContent = autoCruise ? "⏸️ Dừng tự lái" : "🚗 Tự lái đường tím";
        btn.className = `btn-3d ${autoCruise ? "btn-pink" : "btn-lavender"}`;
      });

      document.getElementById("pr-btn-next-word").addEventListener("click", () => {
        if (wordIdx + 1 >= wordQueue.length) {
          const doneFn = global.PlaylandBridge?.renderPlayCompleted || global.renderPlayCompleted;
          if (typeof doneFn === "function") {
            cleanupActiveRace();
            doneFn(
              body,
              "Về Đích Phonics Racing!",
              `Bé đã hoàn thành toàn bộ ${wordQueue.length} từ vựng`,
              totalFlowersEarned
            );
          }
        } else {
          wordIdx++;
          startWord();
        }
      });

      function stepPhysics() {
        if (game.finishedFlagReached) {
          RacingAudio.stopEngine();
          return;
        }

        let vx = 0, vy = 0;
        const speed = 3.4;

        // 1. Keyboard / D-pad input
        if (game.keys["arrowleft"] || game.keys["a"] || game.dpad.left) vx -= 1;
        if (game.keys["arrowright"] || game.keys["d"] || game.dpad.right) vx += 1;
        if (game.keys["arrowup"] || game.keys["w"] || game.dpad.up) vy -= 1;
        if (game.keys["arrowdown"] || game.keys["s"] || game.dpad.down) vy += 1;

        if (vx !== 0 || vy !== 0) {
          const len = Math.hypot(vx, vy);
          vx = (vx / len) * speed;
          vy = (vy / len) * speed;
        } else if (game.pointerTarget) {
          // 2. Pointer / Stylus / Touch drag steering (like sample video!)
          const dx = game.pointerTarget.x - game.car.x;
          const dy = game.pointerTarget.y - game.car.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 8) {
            const s = Math.min(speed + 0.6, dist * 0.18);
            vx = (dx / dist) * s;
            vy = (dy / dist) * s;
          } else {
            game.pointerTarget = null;
          }
        } else if (autoCruise) {
          // 3. Assisted spline cruise along purple road
          const targetPt = spline[Math.min(spline.length - 1, game.splineIndex + 4)];
          const dx = targetPt.x - game.car.x;
          const dy = targetPt.y - game.car.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 14 && game.splineIndex < spline.length - 1) {
            game.splineIndex = Math.min(spline.length - 1, game.splineIndex + 4);
          } else if (dist > 1) {
            vx = (dx / dist) * (speed * 0.85);
            vy = (dy / dist) * (speed * 0.85);
          }
        }

        const moving = Math.hypot(vx, vy) > 0.25;
        if (moving) {
          RacingAudio.startEngine();
          game.car.wheelPhase += 0.35;
          const nextX = Math.max(46, Math.min(834, game.car.x + vx));
          const nextY = Math.max(52, Math.min(412, game.car.y + vy));

          // Obstacle collision check (trees/bushes)
          let blocked = false;
          for (const ob of obstacles) {
            if (Math.hypot(nextX - ob.x, nextY - ob.y) < ob.r + 18) {
              blocked = true;
              break;
            }
          }
          if (!blocked) {
            game.car.x = nextX;
            game.car.y = nextY;
          }
          const targetAngle = Math.atan2(vy, vx);
          let diff = targetAngle - game.car.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          game.car.angle += diff * 0.25;

          if (Math.random() < 0.35) {
            game.particles.push({
              x: game.car.x - Math.cos(game.car.angle) * 22,
              y: game.car.y - Math.sin(game.car.angle) * 22,
              vx: (Math.random() - 0.5) * 0.6,
              vy: (Math.random() - 0.5) * 0.6,
              life: 0.7,
              color: "rgba(255,255,255,0.7)",
              r: 4
            });
          }
        } else {
          RacingAudio.stopEngine();
        }

        // Check letter collection
        const nextExpected = letterNodes[game.collectedCount];
        if (nextExpected && !nextExpected.collected) {
          if (Math.hypot(game.car.x - nextExpected.x, game.car.y - nextExpected.y) < 38) {
            nextExpected.collected = true;
            const collectedIdx = game.collectedCount;
            game.collectedCount++;
            spawnBurst(nextExpected.x, nextExpected.y, slotColors[collectedIdx % slotColors.length]);
            RacingAudio.collectPop(collectedIdx);
            RacingAudio.speakPhonics(nextExpected.token, collectedIdx, item, audioMode);
            updateWordBoardSlot(collectedIdx, nextExpected.token);
            if (global.MunCompanion) global.MunCompanion.onCorrect(`Giỏi quá! Thu thập được chữ "${nextExpected.token.toLowerCase()}" rồi! 🐥✨`);

            if (game.collectedCount >= tokens.length) {
              game.wordCompleted = true;
              highlightWordComplete();
              setTimeout(() => RacingAudio.speakWord(item), 380);
              game.hintText = `✨ Tuyệt vời! Đã ghép xong "${item.word}"! Hãy lái xe tới lá cờ đích 🏁!`;
              const hb = document.getElementById("pr-hint-bar");
              if (hb) hb.textContent = game.hintText;
            } else {
              const rem = letterNodes[game.collectedCount].token;
              game.hintText = `Giỏi lắm! Chữ tiếp theo cần thu thập là "${rem.toLowerCase()}"! 🚗`;
              const hb = document.getElementById("pr-hint-bar");
              if (hb) hb.textContent = game.hintText;
            }
          }
        }

        // Check distractor or out-of-order tiles (gentle guidance, never locks game)
        const nowTs = performance.now();
        for (const dNode of distractorNodes) {
          if (dNode.wobble > 0) dNode.wobble -= 0.06;
          if (Math.hypot(game.car.x - dNode.x, game.car.y - dNode.y) < 34 && nowTs - game.lastBumpAt > 900) {
            game.lastBumpAt = nowTs;
            dNode.wobble = 1;
            RacingAudio.bump();
            if (global.MunCompanion) global.MunCompanion.onWrong(`Hic, chữ "${dNode.token.toLowerCase()}" chưa đúng đâu! Mình chạy đường tím tiếp nhé! 🥺`);
            const hb = document.getElementById("pr-hint-bar");
            if (hb) hb.textContent = `💛 Chữ "${dNode.token.toLowerCase()}" không thuộc từ "${item.word}", mình chạy tiếp đường tím nhé!`;
          }
        }

        // Check Finish Flag collision
        if (Math.hypot(game.car.x - finishPt.x, game.car.y - finishPt.y) < 42) {
          if (game.wordCompleted) {
            game.finishedFlagReached = true;
            RacingAudio.stopEngine();
            spawnBurst(finishPt.x, finishPt.y, "#ffe27a");

            // Award Bông hoa 🌸 ONLY ONCE per completed word!
            if (!game.rewarded) {
              game.rewarded = true;
              const api = global.PlaylandBridge;
              const addFl = api?.addFlower || global.addFlower;
              if (!isPreviewDraft && typeof addFl === "function") {
                totalFlowersEarned += 2;
                addFl(2);
                const st = api?.getState?.() || global.state;
                if (st) {
                  st.pet.stateExpr = "excited";
                  st.pet.mood = Math.min(100, st.pet.mood + 4);
                  st.pet.speech = `Giỏi quá! Bé ghép xong từ ${item.word} và về đích rồi! +2 🌸`;
                  (api?.saveState || global.saveState)?.();
                  (api?.renderHeader || global.renderHeader)?.();
                  (api?.renderStreak || global.renderStreak)?.();
                  (api?.renderMochi || global.renderMochi)?.();
                }
              }
              const fx = api?.getAudioFX?.() || global.AudioFX;
              if (fx) fx.celebrate();
              (api?.launchConfetti || global.launchConfetti)?.(32);
              if (global.MunCompanion) global.MunCompanion.onCorrect(`Tuyệt vời! Bé ghép xong "${item.word}" và về đích rồi! 🎉🐥`);
              setTimeout(() => RacingAudio.speakWord(item), 250);
            }

            const overlay = document.getElementById("pr-finish-overlay");
            if (overlay) overlay.style.display = "flex";
          } else if (nowTs - game.lastBumpAt > 1000) {
            game.lastBumpAt = nowTs;
            RacingAudio.bump();
            if (global.MunCompanion) global.MunCompanion.onWrong("Khoan đã! Bé nhớ thu thập đủ chữ cái trước khi về đích nhé! 🏁🥺");
            // Nudge slightly left so student isn't stuck on flag
            game.car.x -= 24;
            game.pointerTarget = null;
            const hb = document.getElementById("pr-hint-bar");
            if (hb) hb.textContent = `🏁 Khoan đã! Bé cần thu thập đủ ${tokens.length} chữ cái trước khi về đích nhé!`;
          }
        }

        // Update particles & draw trail
        game.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.03; });
        game.particles = game.particles.filter(p => p.life > 0);
        game.trail.forEach(t => { t.life -= 0.04; });
        game.trail = game.trail.filter(t => t.life > 0);
      }

      function drawScene() {
        const w = canvas.width, h = canvas.height;
        // 1. Lush Green Garden Meadow
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#75e34b");
        grad.addColorStop(1, "#4ec22a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Decorative garden fence & grass dots
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        for (let gx = 40; gx < w; gx += 65) {
          for (let gy = 50; gy < h; gy += 65) {
            ctx.beginPath(); ctx.arc(gx + (gy % 130 ? 12 : 0), gy, 3, 0, Math.PI * 2); ctx.fill();
          }
        }
        // Wooden garden border posts top & bottom
        ctx.fillStyle = "#ffe8a3";
        ctx.strokeStyle = "#d99b0b";
        ctx.lineWidth = 2;
        for (let fx = 16; fx < w; fx += 44) {
          ctx.beginPath(); ctx.roundRect(fx, 8, 18, 22, 6); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.roundRect(fx, h - 30, 18, 22, 6); ctx.fill(); ctx.stroke();
        }

        // Little flowers on grass
        const flowers = [{x:90,y:105,c:"#ff89bf"},{x:280,y:378,c:"#ffe27a"},{x:430,y:190,c:"#ffffff"},{x:630,y:108,c:"#ff89bf"},{x:760,y:370,c:"#ffe27a"}];
        flowers.forEach(fl => {
          ctx.fillStyle = fl.c;
          for (let k = 0; k < 5; k++) {
            const a = (k * Math.PI * 2) / 5;
            ctx.beginPath(); ctx.arc(fl.x + Math.cos(a) * 6, fl.y + Math.sin(a) * 6, 4.5, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath(); ctx.arc(fl.x, fl.y, 4, 0, Math.PI * 2); ctx.fill();
        });

        // 2. Purple Winding Track
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Outer road rim
        ctx.beginPath();
        spline.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = "#5b3fd4";
        ctx.lineWidth = 74;
        ctx.stroke();

        // Main vibrant purple track
        ctx.beginPath();
        spline.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = "#8569ff";
        ctx.lineWidth = 60;
        ctx.stroke();

        // Soft center dashes
        ctx.save();
        ctx.setLineDash([16, 16]);
        ctx.beginPath();
        spline.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();

        // Start Circle
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(spline[0].x, spline[0].y, 24, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#5b3fd4";
        ctx.font = "900 11px Nunito, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("START", spline[0].x, spline[0].y + 4);

        // 3. Checkered Finish Flag
        const fx = finishPt.x, fy = finishPt.y;
        ctx.save();
        ctx.translate(fx - 20, fy - 20);
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#2d2b55";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(-2, -2, 44, 44, 10); ctx.fill(); ctx.stroke();
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? "#1e293b" : "#ffffff";
            ctx.fillRect(c * 10, r * 10, 10, 10);
          }
        }
        ctx.restore();

        // 4. Cute Garden Obstacles (Trees & Bushes)
        obstacles.forEach(ob => {
          ctx.fillStyle = "rgba(0,0,0,0.12)";
          ctx.beginPath(); ctx.ellipse(ob.x, ob.y + ob.r * 0.75, ob.r * 0.9, 8, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = ob.kind === "tree" ? "#2fb344" : "#37c956";
          ctx.beginPath(); ctx.arc(ob.x, ob.y, ob.r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#76ed7e";
          ctx.beginPath(); ctx.arc(ob.x - 6, ob.y - 6, ob.r * 0.45, 0, Math.PI * 2); ctx.fill();
        });

        // 5. Pointer guide trail (when dragging like in video)
        if (game.trail.length > 1) {
          ctx.save();
          ctx.beginPath();
          game.trail.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
          ctx.strokeStyle = "rgba(255, 226, 122, 0.75)";
          ctx.lineWidth = 6;
          ctx.stroke();
          ctx.restore();
        }

        // 6. Letter Tiles (Targets + Distractors)
        const nextIdx = game.collectedCount;
        [...distractorNodes, ...letterNodes].forEach(node => {
          if (node.collected) return;
          const isNext = node.isTarget && node.idx === nextIdx;
          const wobX = node.wobble ? Math.sin(node.wobble * 18) * 5 : 0;

          ctx.save();
          ctx.translate(node.x + wobX, node.y);
          if (isNext) {
            const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.06;
            ctx.scale(pulse, pulse);
            ctx.shadowColor = "rgba(255, 226, 122, 0.95)";
            ctx.shadowBlur = 16;
          } else {
            ctx.shadowColor = "rgba(45, 43, 85, 0.22)";
            ctx.shadowBlur = 8;
          }

          // Rounded white tile card (matching the video!)
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = isNext ? "#ffe27a" : "#e2e8f0";
          ctx.lineWidth = isNext ? 4 : 3;
          ctx.beginPath(); ctx.roundRect(-24, -24, 48, 48, 14); ctx.fill(); ctx.stroke();

          ctx.shadowBlur = 0;
          ctx.fillStyle = node.isTarget ? slotColors[node.idx % slotColors.length] : "#f43f5e";
          ctx.font = `900 ${node.token.length > 1 ? 20 : 27}px Nunito, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.token.toLowerCase(), 0, 2);
          ctx.restore();
        });

        // 7. Particles
        game.particles.forEach(p => {
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        // 8. Cute Top-Down Cartoon Car
        ctx.save();
        ctx.translate(game.car.x, game.car.y);
        ctx.rotate(game.car.angle);

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath(); ctx.roundRect(-24, -15, 50, 34, 12); ctx.fill();

        // 4 Wheels (gentle wiggle)
        const wheelOffset = Math.sin(game.car.wheelPhase) * 1.5;
        ctx.fillStyle = "#1e293b";
        [[-16, -20], [10, -20], [-16, 14], [10, 14]].forEach(([wx, wy]) => {
          ctx.beginPath(); ctx.roundRect(wx + wheelOffset * 0.4, wy, 13, 6, 3); ctx.fill();
        });

        // Car Body (bright blue/purple kawaii racer)
        ctx.fillStyle = "#38bdf8";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(-24, -16, 48, 32, 13); ctx.fill(); ctx.stroke();

        // Roof / Windshield
        ctx.fillStyle = "#e0f2fe";
        ctx.beginPath(); ctx.roundRect(-9, -11, 20, 22, 7); ctx.fill();
        ctx.fillStyle = "#7c5dfa";
        ctx.beginPath(); ctx.roundRect(-14, -9, 10, 18, 4); ctx.fill();

        // Cute headlights
        ctx.fillStyle = "#ffe27a";
        ctx.beginPath(); ctx.arc(21, -9, 3.5, 0, Math.PI * 2); ctx.arc(21, 9, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      function loop() {
        stepPhysics();
        drawScene();
        rafId = requestAnimationFrame(loop);
      }

      activeRaceCleanup = () => {
        if (rafId) cancelAnimationFrame(rafId);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
      };

      loop();
    }

    startWord();
  }

  // =========================================================================
  // DEDICATED PHONICS RACING TEACHER EDITOR (Sections VI & VII)
  // =========================================================================
  let prEditorState = {
    draftSet: null,
    previousSnapshot: null,
    extractedText: "",
    uploadedImages: []
  };

  function openPhonicsEditor() {
    const current = getActivePhonicsSet();
    prEditorState = {
      draftSet: JSON.parse(JSON.stringify(current)),
      previousSnapshot: JSON.parse(JSON.stringify(current)),
      extractedText: "",
      uploadedImages: []
    };
    const backdrop = document.getElementById("editor-backdrop");
    backdrop.classList.remove("hidden");
    renderPhonicsEditorShell();
    const healthFn = global.PlaylandBridge?.checkAiServerHealth || global.checkAiServerHealth;
    if (typeof healthFn === "function") healthFn();
  }

  function renderPhonicsEditorShell() {
    const modal = document.getElementById("editor-modal");
    const allSets = Object.values(prStore.sets);

    modal.innerHTML = `
      <div class="play-topbar">
        <div>
          <div style="font-size:18px; font-weight:900;">✏️ EDIT GAME • 🏎️ Phonics Racing</div>
          <div style="font-size:12.5px; font-weight:800; color:var(--ink-sub);" id="ed-ai-badge">⏳ Đang kiểm tra AI Server...</div>
        </div>
        <div class="btn-group">
          <select class="kawaii-select" id="pr-ed-switch" style="min-height:48px; width:auto; max-width:240px;">
            ${allSets.map(s => `<option value="${s.id}" ${s.id === prEditorState.draftSet.id ? "selected" : ""}>📚 ${s.name}</option>`).join("")}
          </select>
          <button class="btn-3d btn-soft-mint" id="pr-ed-new">➕ Bộ mới</button>
          <button class="btn-3d btn-soft-sky" id="pr-ed-copy">📋 Sao chép</button>
          <button class="btn-3d btn-danger-soft" id="pr-ed-del">🗑️ Xoá</button>
        </div>
      </div>

      <div class="editor-body" id="pr-ed-body"></div>

      <div class="editor-footer">
        <div class="btn-group">
          <button class="btn-3d btn-lavender" id="pr-ed-ai">✨ AI Tạo Nội Dung</button>
          <button class="btn-3d btn-soft-sky" id="pr-ed-preview">👁 Preview</button>
          <button class="btn-3d btn-yellow" id="pr-ed-test">🎮 Test Game</button>
        </div>
        <div class="btn-group">
          <button class="btn-3d" id="pr-ed-restore">↩️ Restore</button>
          <button class="btn-3d btn-danger-soft" id="pr-ed-cancel">❌ Cancel</button>
          <button class="btn-3d btn-mint" id="pr-ed-save">💾 Save</button>
        </div>
      </div>
    `;

    document.getElementById("pr-ed-switch").addEventListener("change", (e) => {
      const s = prStore.sets[e.target.value];
      if (!s) return;
      prEditorState.draftSet = JSON.parse(JSON.stringify(s));
      prEditorState.previousSnapshot = JSON.parse(JSON.stringify(s));
      renderPhonicsEditorShell();
    });

    document.getElementById("pr-ed-new").addEventListener("click", () => {
      prEditorState.previousSnapshot = JSON.parse(JSON.stringify(prEditorState.draftSet));
      prEditorState.draftSet = {
        id: `pr_custom_${Date.now()}`,
        builtin: false,
        name: "Unit Mới – Phonics",
        difficulty: "easy",
        wordsPerRound: 5,
        items: [makeWordItem("CAT", "con mèo", "🐱", "New Unit", "easy")]
      };
      renderPhonicsEditorBody();
    });

    document.getElementById("pr-ed-copy").addEventListener("click", () => {
      prEditorState.previousSnapshot = JSON.parse(JSON.stringify(prEditorState.draftSet));
      const clone = JSON.parse(JSON.stringify(prEditorState.draftSet));
      clone.id = `pr_copy_${Date.now()}`;
      clone.builtin = false;
      clone.name = `${clone.name} (Bản sao)`;
      prEditorState.draftSet = clone;
      renderPhonicsEditorBody();
    });

    document.getElementById("pr-ed-del").addEventListener("click", () => {
      const id = prEditorState.draftSet.id;
      if (prStore.sets[id]?.builtin) {
        document.getElementById("pr-ed-status").textContent = "ℹ️ Bộ mẫu mặc định được bảo vệ; hãy dùng 📋 Sao chép hoặc ➕ Bộ mới để tuỳ biến.";
        return;
      }
      delete prStore.sets[id];
      if (prStore.selectedSetId === id) prStore.selectedSetId = "pr_animals";
      savePrStore();
      openPhonicsEditor();
    });

    document.getElementById("pr-ed-ai").addEventListener("click", runPhonicsAiGenerate);
    document.getElementById("pr-ed-preview").addEventListener("click", () => {
      const d = prEditorState.draftSet;
      const html = d.items.map((it, i) => `
        <div style="padding:8px 10px; border-bottom:1px solid #ecebfa;">
          <strong>${i + 1}. ${it.icon || "🌟"} ${it.word}</strong> (${it.letters.join(" - ")}) — ${it.vi}
          <div style="font-size:12px; color:#575685;">Phonics: ${it.phonics.join(" · ")} | Chủ đề: ${it.topic || ""}</div>
        </div>
      `).join("");
      const infoFn = global.PlaylandBridge?.showSimpleInfoModal || global.showSimpleInfoModal;
      infoFn(`👁 Preview: ${d.name} (${d.items.length} từ)`, html || "Chưa có từ nào.", true);
    });

    document.getElementById("pr-ed-test").addEventListener("click", () => {
      const playFn = global.PlaylandBridge?.openGamePlayer || global.openGamePlayer;
      playFn("phonics-racing", JSON.parse(JSON.stringify(prEditorState.draftSet)), false, true);
    });

    document.getElementById("pr-ed-restore").addEventListener("click", () => {
      if (!prEditorState.previousSnapshot) return;
      prEditorState.draftSet = JSON.parse(JSON.stringify(prEditorState.previousSnapshot));
      document.getElementById("pr-ed-status").textContent = "↩️ Đã khôi phục nội dung trước đó.";
      renderPhonicsEditorBody();
    });

    document.getElementById("pr-ed-cancel").addEventListener("click", () => {
      document.getElementById("editor-backdrop").classList.add("hidden");
    });

    document.getElementById("pr-ed-save").addEventListener("click", () => {
      const d = prEditorState.draftSet;
      d.items = d.items.filter(it => it.word && it.word.length >= 2 && it.word.length <= 8);
      if (d.items.length === 0) {
        document.getElementById("pr-ed-status").textContent = "⚠️ Cần ít nhất 1 từ tiếng Anh dài 2–8 chữ cái trước khi lưu!";
        return;
      }
      prStore.sets[d.id] = JSON.parse(JSON.stringify(d));
      prStore.selectedSetId = d.id;
      const api = global.PlaylandBridge;
      const ls = api?.getLessonStore?.() || global.lessonStore;
      if (ls) {
        ls.selectedByGame["phonics-racing"] = d.id;
        (api?.saveLessonStore || global.saveLessonStore)?.();
      }
      savePrStore();
      const fx = api?.getAudioFX?.() || global.AudioFX;
      if (fx) fx.celebrate();
      document.getElementById("editor-backdrop").classList.add("hidden");
      (api?.renderGameLibrary || global.renderGameLibrary)?.();
    });

    renderPhonicsEditorBody();
  }

  async function handlePhonicsFiles(fileList) {
    const statusEl = document.getElementById("pr-ed-status");
    const files = Array.from(fileList || []);
    if (!files.length) return;
    statusEl.textContent = "⏳ Đang đọc tài liệu...";

    for (const f of files) {
      const ext = f.name.split(".").pop().toLowerCase();
      try {
        if (ext === "txt" || ext === "csv" || ext === "md") {
          const txt = await f.text();
          prEditorState.extractedText += (prEditorState.extractedText ? "\n\n" : "") + `[${f.name}]\n` + txt;
        } else if (ext === "docx" && typeof (global.PlaylandBridge?.extractDocxText || global.extractDocxText) === "function") {
          const fn = global.PlaylandBridge?.extractDocxText || global.extractDocxText;
          const txt = await fn(await f.arrayBuffer());
          prEditorState.extractedText += (prEditorState.extractedText ? "\n\n" : "") + `[${f.name}]\n` + txt;
        } else if (ext === "pdf" && typeof (global.PlaylandBridge?.extractPdfText || global.extractPdfText) === "function") {
          const fn = global.PlaylandBridge?.extractPdfText || global.extractPdfText;
          const txt = await fn(await f.arrayBuffer());
          prEditorState.extractedText += (prEditorState.extractedText ? "\n\n" : "") + `[${f.name}]\n` + txt;
        } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
          const dataUrl = await new Promise((res, rej) => {
            const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f);
          });
          prEditorState.uploadedImages.push({ name: f.name, dataUrl });
        } else {
          statusEl.textContent = `⚠️ Định dạng .${ext} chưa hỗ trợ ở mục tài liệu (hỗ trợ PDF, DOCX, TXT, JPG/PNG).`;
        }
      } catch (err) {
        statusEl.textContent = `⚠️ Lỗi đọc ${f.name}: ${err.message}`;
      }
    }
    renderPhonicsEditorBody();
  }

  async function runPhonicsAiGenerate() {
    const statusEl = document.getElementById("pr-ed-status");
    if (!prEditorState.extractedText.trim() && prEditorState.uploadedImages.length === 0) {
      statusEl.textContent = "⚠️ Vui lòng tải tài liệu (PDF/DOCX/TXT/JPG/PNG) hoặc nhập văn bản bài học trước!";
      return;
    }
    const cfgFn = global.PlaylandBridge?.getAiConfig || global.getAiConfig;
    const defaultEp = (location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/i.test(location.hostname))
      ? "http://localhost:3001/api/generate-game"
      : "/api/generate-game";
    const cfg = typeof cfgFn === "function" ? cfgFn() : { endpoint: defaultEp };
    statusEl.textContent = "🤖 Đang gửi tài liệu tới AI Server để phân tích từ vựng & phonics...";

    try {
      const resp = await fetch(cfg.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: "phonics-racing",
          gameName: "Phonics Racing – Đua Xe Thu Thập Chữ Cái",
          lessonTitle: prEditorState.draftSet.name,
          extractedText: prEditorState.extractedText,
          images: prEditorState.uploadedImages,
          questionCount: prEditorState.draftSet.wordsPerRound || 5,
          difficulty: prEditorState.draftSet.difficulty
        })
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.error || `HTTP ${resp.status}`);

      prEditorState.previousSnapshot = JSON.parse(JSON.stringify(prEditorState.draftSet));
      const data = json.data;
      if (data.lessonName) prEditorState.draftSet.name = data.lessonName;
      const newItems = (data.items || []).map((it, idx) => {
        const clean = String(it.en || it.word || "").toUpperCase().replace(/[^A-Z]/g, "");
        if (clean.length < 2 || clean.length > 8) return null;
        const item = makeWordItem(clean, it.vi || clean, it.icon || "🌟", data.lessonName || "Lesson", prEditorState.draftSet.difficulty);
        if (Array.isArray(it.letters) && it.letters.length) item.letters = it.letters.map(x => String(x).toUpperCase());
        if (Array.isArray(it.phonics) && it.phonics.length) item.phonics = it.phonics;
        if (prEditorState.uploadedImages[idx]?.dataUrl) item.imageDataUrl = prEditorState.uploadedImages[idx].dataUrl;
        return item;
      }).filter(Boolean);

      if (newItems.length === 0) throw new Error("Không tìm thấy từ tiếng Anh 2–8 chữ cái hợp lệ trong tài liệu.");
      prEditorState.draftSet.items = newItems;
      statusEl.textContent = `✅ AI đã trích xuất ${newItems.length} từ Phonics từ tài liệu! Hãy kiểm tra và bấm 💾 Save.`;
      renderPhonicsEditorBody();
    } catch (err) {
      statusEl.textContent = `⚠️ Không thể gọi AI thật: ${err.message}. (Chưa có backend/API key — không dùng AI giả lập).`;
    }
  }

  function extractPhonicsWordsOffline() {
    const statusEl = document.getElementById("pr-ed-status");
    const txt = prEditorState.extractedText.trim();
    if (!txt) { statusEl.textContent = "⚠️ Chưa có văn bản để tách từ."; return; }
    prEditorState.previousSnapshot = JSON.parse(JSON.stringify(prEditorState.draftSet));
    const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith("["));
    const items = [];
    for (const line of lines) {
      const m = line.match(/^([A-Za-z]{2,8})\s*(?:[-–:=|])\s*(.+)$/);
      if (m) items.push(makeWordItem(m[1], m[2].trim(), "🌟", prEditorState.draftSet.name, prEditorState.draftSet.difficulty));
    }
    if (items.length === 0) {
      // Fallback: extract unique 2-8 letter English words directly
      const words = Array.from(new Set((txt.match(/\b[A-Za-z]{2,8}\b/g) || []).map(w => w.toUpperCase()))).slice(0, 8);
      words.forEach(w => items.push(makeWordItem(w, w.toLowerCase(), "🌟", prEditorState.draftSet.name, prEditorState.draftSet.difficulty)));
    }
    if (items.length === 0) { statusEl.textContent = "ℹ️ Không tìm thấy từ 2–8 chữ cái hợp lệ."; return; }
    prEditorState.draftSet.items = items;
    statusEl.textContent = `📋 Đã tách ${items.length} từ trực tiếp từ văn bản (không dùng AI). Hãy bổ sung nghĩa/ảnh nếu cần rồi bấm 💾 Save!`;
    renderPhonicsEditorBody();
  }

  function renderPhonicsEditorBody() {
    const body = document.getElementById("pr-ed-body");
    if (!body) return;
    const d = prEditorState.draftSet;

    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <h3 style="font-size:17px; font-weight:900;">📄 1 &amp; 2. Tải Tài Liệu &amp; AI Tạo Nội Dung</h3>
        <div class="dropzone" id="pr-ed-drop">
          <div style="font-size:36px;">📂</div>
          <div style="font-weight:900;">Kéo thả hoặc bấm để tải tài liệu bài học</div>
          <div style="font-size:12.5px; font-weight:700; color:var(--ink-sub); margin-top:4px;">Hỗ trợ PDF, DOCX, TXT, JPG, PNG</div>
          <input type="file" id="pr-ed-file" accept=".pdf,.docx,.txt,.csv,.jpg,.jpeg,.png,.webp" multiple hidden />
        </div>

        <div class="btn-group">
          <button class="btn-3d btn-lavender" style="flex:1;" id="pr-ed-ai-main">✨ AI TẠO GAME TỪ TÀI LIỆU</button>
          <button class="btn-3d btn-soft-mint" id="pr-ed-offline-parse">📋 Tách từ 2–8 chữ</button>
        </div>

        <div id="pr-ed-status" style="font-size:13.5px; font-weight:800; color:#b5246b; min-height:20px;"></div>

        <div>
          <label class="form-label">Văn bản trích xuất (hoặc nhập dạng 'CAT - con mèo'):</label>
          <textarea id="pr-ed-ta" class="kawaii-input" style="min-height:150px; font-size:13.5px;">${prEditorState.extractedText}</textarea>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px;">
        <h3 style="font-size:17px; font-weight:900;">🛠️ 3. Danh Sách Từ Vựng &amp; Phonics</h3>
        <div class="editor-item-grid">
          <div>
            <label class="form-label">Tên bộ bài học</label>
            <input class="kawaii-input" id="pr-ed-name" value="${d.name}" />
          </div>
          <div>
            <label class="form-label">Số từ mỗi lượt chơi</label>
            <input class="kawaii-input" type="number" min="1" max="20" id="pr-ed-count" value="${d.wordsPerRound || d.items.length}" />
          </div>
          <div>
            <label class="form-label">Độ khó mặc định</label>
            <select class="kawaii-select" id="pr-ed-diff">
              <option value="easy" ${d.difficulty === "easy" ? "selected" : ""}>Dễ (2–4 chữ)</option>
              <option value="medium" ${d.difficulty === "medium" ? "selected" : ""}>Trung bình (4–6 chữ)</option>
              <option value="hard" ${d.difficulty === "hard" ? "selected" : ""}>Nâng cao (6–8 chữ)</option>
            </select>
          </div>
          <div style="display:flex; align-items:flex-end;">
            <button class="btn-3d btn-soft-mint" style="width:100%;" id="pr-ed-add">➕ Thêm từ mới</button>
          </div>
        </div>

        <div style="max-height:390px; overflow-y:auto; padding-right:4px;">
          ${d.items.map((it, i) => `
            <div class="editor-item-card">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px;">
                <strong>#${i + 1} • ${it.letters.join(" + ")} (${it.letters.length} ô)</strong>
                <div class="btn-group">
                  <button class="btn-3d" style="min-height:40px; padding:4px 10px;" data-pup="${i}" ${i === 0 ? "disabled" : ""}>⬆️</button>
                  <button class="btn-3d" style="min-height:40px; padding:4px 10px;" data-pdown="${i}" ${i === d.items.length - 1 ? "disabled" : ""}>⬇️</button>
                  <button class="btn-3d btn-soft-sky" style="min-height:40px; padding:4px 10px;" data-plisten="${i}">🔊</button>
                  <button class="btn-3d btn-danger-soft" style="min-height:40px; padding:4px 10px;" data-pdel="${i}">🗑️</button>
                </div>
              </div>
              <div class="editor-item-grid">
                <input class="kawaii-input" data-pf="word" data-pi="${i}" maxlength="8" placeholder="Từ 2–8 chữ (vd: CAT)" value="${it.word}" />
                <input class="kawaii-input" data-pf="vi" data-pi="${i}" placeholder="Nghĩa tiếng Việt" value="${it.vi}" />
                <input class="kawaii-input" data-pf="icon" data-pi="${i}" placeholder="Emoji" value="${it.icon || "🌟"}" />
                <select class="kawaii-select" data-pdig="${i}">
                  <option value="letters" ${it.digraphMode !== "digraphs" ? "selected" : ""}>Thu thập từng chữ</option>
                  <option value="digraphs" ${it.digraphMode === "digraphs" ? "selected" : ""}>Nhóm âm ghép (SH/CH/TH)</option>
                </select>
              </div>
              <input class="kawaii-input" style="margin-top:8px;" data-pphon="${i}" placeholder="Âm phonics (ngăn cách bằng dấu phẩy)" value="${(it.phonics || []).join(", ")}" />
              <div class="btn-group" style="margin-top:8px;">
                <label class="btn-3d btn-soft-sky" style="min-height:40px; padding:4px 12px; font-size:13px;">
                  🖼️ Ảnh (JPG/PNG) <input type="file" accept="image/*" data-pimg="${i}" hidden />
                </label>
                <label class="btn-3d btn-soft-pink" style="min-height:40px; padding:4px 12px; font-size:13px;">
                  🎵 Audio từ (MP3/WAV) <input type="file" accept="audio/*" data-paud="${i}" hidden />
                </label>
                ${it.imageDataUrl ? `<span class="mini-pill">✅ Có ảnh</span>` : ""}
                ${it.wordAudioUrl ? `<span class="mini-pill">✅ Có audio</span>` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    const dz = document.getElementById("pr-ed-drop"), fi = document.getElementById("pr-ed-file");
    dz.addEventListener("click", () => fi.click());
    dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("dragover"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
    dz.addEventListener("drop", e => { e.preventDefault(); dz.classList.remove("dragover"); handlePhonicsFiles(e.dataTransfer.files); });
    fi.addEventListener("change", e => handlePhonicsFiles(e.target.files));

    document.getElementById("pr-ed-ai-main").addEventListener("click", runPhonicsAiGenerate);
    document.getElementById("pr-ed-offline-parse").addEventListener("click", extractPhonicsWordsOffline);
    document.getElementById("pr-ed-ta").addEventListener("input", e => { prEditorState.extractedText = e.target.value; });
    document.getElementById("pr-ed-name").addEventListener("input", e => { d.name = e.target.value; });
    document.getElementById("pr-ed-count").addEventListener("input", e => { d.wordsPerRound = Number(e.target.value) || 5; });
    document.getElementById("pr-ed-diff").addEventListener("change", e => { d.difficulty = e.target.value; });

    document.getElementById("pr-ed-add").addEventListener("click", () => {
      prEditorState.previousSnapshot = JSON.parse(JSON.stringify(d));
      d.items.push(makeWordItem("STAR", "ngôi sao", "⭐", d.name, d.difficulty));
      renderPhonicsEditorBody();
    });

    body.querySelectorAll("[data-pf]").forEach(inp => inp.addEventListener("input", () => {
      const idx = Number(inp.dataset.pi);
      const field = inp.dataset.pf;
      if (field === "word") {
        const clean = inp.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8);
        d.items[idx].word = clean;
        d.items[idx].en = clean.toLowerCase();
        d.items[idx].letters = splitWordToTokens(clean, d.items[idx].digraphMode);
        d.items[idx].phonics = defaultPhonicsForTokens(d.items[idx].letters);
      } else {
        d.items[idx][field] = inp.value;
      }
    }));

    body.querySelectorAll("[data-pf='word']").forEach(inp => inp.addEventListener("blur", () => renderPhonicsEditorBody()));

    body.querySelectorAll("[data-pdig]").forEach(sel => sel.addEventListener("change", () => {
      const idx = Number(sel.dataset.pdig);
      d.items[idx].digraphMode = sel.value;
      d.items[idx].letters = splitWordToTokens(d.items[idx].word, sel.value);
      d.items[idx].phonics = defaultPhonicsForTokens(d.items[idx].letters);
      renderPhonicsEditorBody();
    }));

    body.querySelectorAll("[data-pphon]").forEach(inp => inp.addEventListener("input", () => {
      const idx = Number(inp.dataset.pphon);
      d.items[idx].phonics = inp.value.split(",").map(s => s.trim()).filter(Boolean);
    }));

    body.querySelectorAll("[data-pup]").forEach(btn => btn.addEventListener("click", () => {
      const i = Number(btn.dataset.pup);
      if (i > 0) { [d.items[i - 1], d.items[i]] = [d.items[i], d.items[i - 1]]; renderPhonicsEditorBody(); }
    }));
    body.querySelectorAll("[data-pdown]").forEach(btn => btn.addEventListener("click", () => {
      const i = Number(btn.dataset.pdown);
      if (i < d.items.length - 1) { [d.items[i], d.items[i + 1]] = [d.items[i + 1], d.items[i]]; renderPhonicsEditorBody(); }
    }));
    body.querySelectorAll("[data-pdel]").forEach(btn => btn.addEventListener("click", () => {
      prEditorState.previousSnapshot = JSON.parse(JSON.stringify(d));
      d.items.splice(Number(btn.dataset.pdel), 1);
      renderPhonicsEditorBody();
    }));
    body.querySelectorAll("[data-plisten]").forEach(btn => btn.addEventListener("click", () => {
      RacingAudio.speakWord(d.items[Number(btn.dataset.plisten)]);
    }));

    body.querySelectorAll("[data-pimg]").forEach(inp => inp.addEventListener("change", e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader(); r.onload = () => { d.items[Number(inp.dataset.pimg)].imageDataUrl = r.result; renderPhonicsEditorBody(); }; r.readAsDataURL(f);
    }));
    body.querySelectorAll("[data-paud]").forEach(inp => inp.addEventListener("change", e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader(); r.onload = () => { d.items[Number(inp.dataset.paud)].wordAudioUrl = r.result; renderPhonicsEditorBody(); }; r.readAsDataURL(f);
    }));
  }

  global.PhonicsRacingModule = {
    getSets() { return Object.values(prStore.sets); },
    getActiveSet() { return getActivePhonicsSet(); },
    selectSet(id) {
      if (prStore.sets[id]) {
        prStore.selectedSetId = id;
        savePrStore();
      }
    },
    renderGame: renderPhonicsRacing,
    cleanup: cleanupActiveRace,
    openEditor: openPhonicsEditor
  };
})(window);
