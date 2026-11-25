/**
 * EASY PEASY DEMO-INSPIRED GAMES PACK (4 Interactive Games)
 * 1. mochi-merge     : Phonics Merge (Ghép âm đầu + vần thành từ hoàn chỉnh)
 * 2. peekaboo-pals   : Peekaboo Pals! (Đoán bóng silhouette Ú Òa)
 * 3. sneaky-spotlight: Sneaky Spotlight (Soi đèn / Mở cửa tìm từ vựng ẩn)
 * 4. shadow-fusion   : Shadow Fusion (Căn chỉnh ghép 2 mảnh khớp bóng để lộ hình)
 */
(function (global) {
  "use strict";

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function speakEn(txt, item) {
    const api = global.PlaylandBridge;
    const st = api?.getState?.() || global.state;
    if (st && !st.soundOn) return;
    if (item && item.audioDataUrl) {
      try { new Audio(item.audioDataUrl).play().catch(() => {}); return; } catch {}
    }
    if (typeof api?.speakEnglish === "function") api.speakEnglish(txt);
    else if (typeof global.speakEnglish === "function") global.speakEnglish(txt);
  }

  function rewardWin(flowers, msg) {
    const api = global.PlaylandBridge;
    api?.addFlower?.(flowers);
    api?.getAudioFX?.()?.correct?.();
    api?.launchConfetti?.(20);
    if (global.MunCompanion) global.MunCompanion.onCorrect(msg);
    const st = api?.getState?.();
    if (st) {
      st.pet.stateExpr = "excited";
      st.pet.mood = Math.min(100, st.pet.mood + 4);
      st.pet.speech = msg || `Giỏi quá! Bé nhận được +${flowers} 🌸!`;
      api?.saveState?.(); api?.renderHeader?.(); api?.renderStreak?.(); api?.renderMochi?.();
    }
  }

  function gentleWrong(item, unitId, msg) {
    const api = global.PlaylandBridge;
    api?.getAudioFX?.()?.wrong?.();
    speakEn(item.en, item);
    if (item && item.en) {
      const recFn = api?.recordMistake || global.recordMistake;
      const renFn = api?.renderMistakesSection || global.renderMistakesSection;
      if (typeof recFn === "function") recFn(unitId || 1, item);
      if (typeof renFn === "function") renFn();
      api?.renderHeader?.();
    }
    if (global.MunCompanion) global.MunCompanion.onWrong(msg);
  }

  // =========================================================================
  // 1. PHONICS MERGE (MOCHI MERGE STYLE)
  // =========================================================================
  const DEFAULT_MERGE_ITEMS = [
    { onset: "c", rime: "at", en: "cat", vi: "con mèo", icon: "🐱" },
    { onset: "d", rime: "og", en: "dog", vi: "con chó", icon: "🐶" },
    { onset: "p", rime: "en", en: "pen", vi: "cây bút mực", icon: "🖊️" },
    { onset: "b", rime: "ag", en: "bag", vi: "cặp sách", icon: "🎒" },
    { onset: "s", rime: "un", en: "sun", vi: "mặt trời", icon: "☀️" },
    { onset: "f", rime: "ish", en: "fish", vi: "con cá", icon: "🐟" },
    { onset: "p", rime: "ig", en: "pig", vi: "con lợn", icon: "🐷" },
    { onset: "b", rime: "ook", en: "book", vi: "quyển sách", icon: "📘" }
  ];

  function splitOnsetRime(word) {
    const clean = String(word || "").toLowerCase().replace(/[^a-z]/g, "");
    if (clean.length < 2) return null;
    const m = clean.match(/^([^aeiouy]{1,2})([aeiouy].*)$/);
    if (m && m[1] && m[2]) return { onset: m[1], rime: m[2] };
    return { onset: clean.slice(0, 1), rime: clean.slice(1) };
  }

  function renderMochiMerge(body, lessonSet, isPreviewDraft = false) {
    let pool = (lessonSet?.items || [])
      .map(it => {
        const sp = splitOnsetRime(it.en || it.word);
        if (!sp || (it.en || "").includes(" ")) return null;
        return { ...it, en: (it.en || it.word).toLowerCase(), onset: sp.onset, rime: sp.rime };
      })
      .filter(Boolean);

    if (pool.length < 3) pool = DEFAULT_MERGE_ITEMS;
    const qs = shuffle(pool).slice(0, Math.min(6, pool.length));
    let qIdx = 0, score = 0, flowers = 0;

    function draw() {
      const target = qs[qIdx];
      const otherRimes = shuffle(DEFAULT_MERGE_ITEMS.map(x => x.rime).concat(pool.map(x => x.rime)))
        .filter((r, i, a) => r !== target.rime && a.indexOf(r) === i).slice(0, 3);
      const rimes = shuffle([target.rime, ...otherRimes]);
      const otherOnsets = shuffle(["b", "c", "d", "f", "h", "m", "p", "s", "t"])
        .filter(o => o !== target.onset).slice(0, 2);
      const onsets = shuffle([target.onset, ...otherOnsets]);

      let pickedOnset = null, pickedRime = null, merged = false;

      function updateView() {
        body.innerHTML = `
          <div style="text-align:center; max-width:580px; margin:0 auto;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
              <span class="mini-pill">Từ ${qIdx + 1}/${qs.length}</span>
              <span class="mini-pill" style="background:#dcfce7; color:#14532d;">Đã ghép: ${score}</span>
            </div>

            <div style="background:#fff; padding:18px; border-radius:26px; border:3px solid #fecce5; margin-bottom:14px;">
              <div style="font-size:56px;">${target.icon || "🌸"}</div>
              <div style="font-size:20px; font-weight:900; margin:4px 0;">${target.vi}</div>
              <button class="btn-3d btn-sky" id="mm-spk">🔊 Nghe từ mẫu</button>

              <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin-top:14px;">
                <div style="min-width:74px; height:60px; border-radius:18px; background:${pickedOnset ? "#ffe27a" : "#f8f7ff"}; border:3px solid #fff; box-shadow:0 4px 10px rgba(0,0,0,0.08); display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:900;">
                  ${pickedOnset || "?"}
                </div>
                <span style="font-size:24px; font-weight:900;">+</span>
                <div style="min-width:92px; height:60px; border-radius:18px; background:${pickedRime ? "#a0f3ed" : "#f8f7ff"}; border:3px solid #fff; box-shadow:0 4px 10px rgba(0,0,0,0.08); display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:900;">
                  ${pickedRime || "?"}
                </div>
                <span style="font-size:24px; font-weight:900;">=</span>
                <div style="min-width:118px; height:60px; border-radius:18px; background:${merged ? "#dcfce7" : "#fff0f7"}; border:3px solid #fff; box-shadow:0 4px 10px rgba(0,0,0,0.08); display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:900; color:${merged ? "#15803d" : "#b5246b"};">
                  ${merged ? target.en : "___"}
                </div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:12px;">
              <div style="background:#fffdf2; padding:12px; border-radius:20px; border:2px solid #ffe27a;">
                <div style="font-size:13px; font-weight:900; color:#7a5200; margin-bottom:8px;">1. Chọn Âm Đầu</div>
                <div class="btn-group" style="justify-content:center;">
                  ${onsets.map(o => `<button class="btn-3d ${pickedOnset === o ? "btn-yellow" : ""}" data-mmo="${o}" ${merged ? "disabled" : ""}>${o}</button>`).join("")}
                </div>
              </div>
              <div style="background:#e8fff9; padding:12px; border-radius:20px; border:2px solid #5ce1c6;">
                <div style="font-size:13px; font-weight:900; color:#0d6e5a; margin-bottom:8px;">2. Chọn Vần Ghép</div>
                <div class="btn-group" style="justify-content:center;">
                  ${rimes.map(r => `<button class="btn-3d ${pickedRime === r ? "btn-mint" : ""}" data-mmr="${r}" ${merged ? "disabled" : ""}>-${r}</button>`).join("")}
                </div>
              </div>
            </div>

            <div class="feedback-banner" id="mm-fb"></div>
            <div id="mm-next-wrap" style="margin-top:12px; display:${merged ? "block" : "none"};">
              <button class="btn-3d btn-pink" id="mm-next">${qIdx + 1 >= qs.length ? "🏆 Hoàn thành!" : "Từ tiếp theo ➡️"}</button>
            </div>
          </div>
        `;

        document.getElementById("mm-spk").addEventListener("click", () => speakEn(target.en, target));

        function tryCheck() {
          if (!pickedOnset || !pickedRime) return;
          if (pickedOnset + pickedRime === target.en) {
            merged = true; score++; flowers += 2;
            speakEn(target.en, target);
            if (!isPreviewDraft) rewardWin(2, `Ghép chuẩn "${target.onset} + ${target.rime} = ${target.en}"! (+2 🌸)`);
            updateView();
            const fb = document.getElementById("mm-fb");
            fb.className = "feedback-banner show ok";
            fb.textContent = `✅ Tuyệt vời! ${target.onset} + ${target.rime} = ${target.en} (${target.vi}) (+2 🌸)`;
          } else {
            if (!isPreviewDraft) gentleWrong(target, lessonSet?.unitId || 1, `Gần đúng rồi! Từ "${target.vi}" ghép từ "${target.onset} + ${target.rime}" nhé!`);
            pickedOnset = null; pickedRime = null;
            updateView();
            const fb = document.getElementById("mm-fb");
            fb.className = "feedback-banner show err";
            fb.textContent = `💛 Chưa khớp rồi! Hãy nghe lại từ và thử ghép lại nha!`;
          }
        }

        body.querySelectorAll("[data-mmo]").forEach(b => b.addEventListener("click", () => {
          pickedOnset = b.dataset.mmo; speakEn(pickedOnset); updateView(); tryCheck();
        }));
        body.querySelectorAll("[data-mmr]").forEach(b => b.addEventListener("click", () => {
          pickedRime = b.dataset.mmr; speakEn(pickedRime); updateView(); tryCheck();
        }));
        document.getElementById("mm-next")?.addEventListener("click", () => {
          if (qIdx + 1 >= qs.length) global.PlaylandBridge?.renderPlayCompleted?.(body, "Bậc thầy Mochi Merge!", `Ghép đúng ${score}/${qs.length} từ Phonics`, flowers);
          else { qIdx++; draw(); }
        });
      }
      setTimeout(() => speakEn(target.en, target), 180);
      updateView();
    }
    draw();
  }

  // =========================================================================
  // 2. PEEKABOO PALS! (SILHOUETTE SHADOW GUESSING)
  // =========================================================================
  function renderPeekabooPals(body, lessonSet, isPreviewDraft = false) {
    const pool = (lessonSet?.items || []);
    const qs = shuffle(pool).slice(0, Math.min(6, pool.length));
    const allPool = [...pool, ...(typeof global.UNITS !== "undefined" ? global.UNITS.flatMap(u => u.words) : [])];
    let qIdx = 0, score = 0, flowers = 0;

    function draw() {
      const q = qs[qIdx];
      const dist = shuffle(allPool.filter(x => x.en !== q.en)).filter((x, i, a) => a.findIndex(y => y.en === x.en) === i).slice(0, 3);
      const opts = shuffle([q, ...dist]);
      let revealed = false;

      body.innerHTML = `
        <div style="text-align:center; max-width:560px; margin:0 auto;">
          <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <span class="mini-pill">Lượt ${qIdx + 1}/${qs.length}</span>
            <span class="mini-pill" style="background:#dcfce7; color:#14532d;">Đoán trúng: ${score}</span>
          </div>

          <div style="background:linear-gradient(180deg, #e8fff9, #fff7d6); padding:22px; border-radius:28px; border:4px solid #fff; box-shadow:0 10px 24px rgba(0,0,0,0.08); margin-bottom:16px;">
            <div style="font-size:14px; font-weight:900; color:#0d6e5a; margin-bottom:8px;">
              ${revealed ? "🎉 PEEKABOO! Ú OÀ!" : "👀 Ai đang trốn sau chiếc bóng này thế nhỉ?"}
            </div>
            <div style="font-size:84px; line-height:1.1; transition:filter 0.4s ease, transform 0.35s ease; filter:${revealed ? "none" : "brightness(0) drop-shadow(0 6px 10px rgba(45,43,85,0.25))"}; transform:${revealed ? "scale(1.1)" : "scale(1)"};">
              ${q.imageDataUrl ? `<img src="${q.imageDataUrl}" style="height:100px; border-radius:16px; filter:${revealed ? "none" : "brightness(0)"};" />` : (q.icon || "🐾")}
            </div>
            <div style="font-size:15px; font-weight:800; color:#575685; margin-top:8px;">Gợi ý nghĩa: <strong>${q.vi}</strong></div>
            <button class="btn-3d btn-sky" id="pk-spk" style="margin-top:8px;">🔊 Nghe gợi ý tiếng Anh</button>
          </div>

          <div class="choices-grid">
            ${opts.map((o, i) => `<button class="btn-3d choice-btn" data-pko="${i}" ${revealed ? "disabled" : ""}><span>🐾</span><span>${o.en}</span></button>`).join("")}
          </div>
          <div class="feedback-banner" id="pk-fb"></div>
          <div id="pk-next-wrap" style="margin-top:14px; display:${revealed ? "block" : "none"};">
            <button class="btn-3d btn-pink" id="pk-next">${qIdx + 1 >= qs.length ? "🏆 Hoàn thành!" : "Tiếp theo ➡️"}</button>
          </div>
        </div>
      `;

      document.getElementById("pk-spk").addEventListener("click", () => speakEn(q.en, q));
      body.querySelectorAll("[data-pko]").forEach(btn => btn.addEventListener("click", () => {
        if (revealed) return;
        const picked = opts[Number(btn.dataset.pko)];
        if (picked.en === q.en) {
          revealed = true; score++; flowers += 2;
          speakEn(q.en, q);
          if (!isPreviewDraft) rewardWin(2, `Peekaboo! Chính là "${q.en}" (+2 🌸)!`);
          draw();
          const fb = document.getElementById("pk-fb");
          fb.className = "feedback-banner show ok";
          fb.textContent = `🎉 Peekaboo! Đúng là "${q.en}" (${q.vi}) (+2 🌸)!`;
        } else {
          btn.classList.add("wrong", "shake"); btn.disabled = true;
          if (!isPreviewDraft) gentleWrong(q, lessonSet?.unitId || 1);
          const fb = document.getElementById("pk-fb");
          fb.className = "feedback-banner show err";
          fb.textContent = `💛 Chưa phải bạn này rồi, bé bấm nghe gợi ý thử lại nha!`;
        }
      }));
      document.getElementById("pk-next")?.addEventListener("click", () => {
        if (qIdx + 1 >= qs.length) global.PlaylandBridge?.renderPlayCompleted?.(body, "Ú Òa Peekaboo Pals!", `Tìm ra ${score}/${qs.length} người bạn bí ẩn`, flowers);
        else { qIdx++; draw(); }
      });
    }
    draw();
  }

  // =========================================================================
  // 3. SNEAKY SPOTLIGHT (DOORS REVEAL)
  // =========================================================================
  function renderSneakySpotlight(body, lessonSet, isPreviewDraft = false) {
    const pool = (lessonSet?.items || []);
    const rounds = Math.min(4, pool.length);
    const targets = shuffle(pool).slice(0, rounds);
    const allPool = [...pool, ...(typeof global.UNITS !== "undefined" ? global.UNITS.flatMap(u => u.words) : [])];
    let rIdx = 0, score = 0, flowers = 0;

    function drawRound() {
      const target = targets[rIdx];
      const others = shuffle(allPool.filter(x => x.en !== target.en)).filter((x, i, a) => a.findIndex(y => y.en === x.en) === i).slice(0, 3);
      const doors = shuffle([target, ...others]);
      const opened = [false, false, false, false];
      let found = false;

      function updateView() {
        body.innerHTML = `
          <div style="text-align:center; max-width:600px; margin:0 auto;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
              <span class="mini-pill">Vòng ${rIdx + 1}/${rounds}</span>
              <span class="mini-pill" style="background:#dcfce7; color:#14532d;">Tìm thấy: ${score}</span>
            </div>

            <div style="background:#fff; padding:14px; border-radius:22px; border:2.5px solid #fecce5; margin-bottom:14px;">
              <div style="font-size:14px; font-weight:800; color:var(--ink-sub);">🔦 Mở cửa tìm xem <strong>"${target.en}" (${target.vi})</strong> đang trốn ở đâu!</div>
              <button class="btn-3d btn-sky" id="sn-spk" style="margin-top:8px;">🔊 Nghe lại từ cần tìm</button>
            </div>

            <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:14px;">
              ${doors.map((d, i) => {
                const isOpen = opened[i];
                const isTarget = d.en === target.en;
                return `
                  <button class="btn-3d ${isOpen ? (isTarget ? "btn-mint" : "btn-danger-soft") : "btn-lavender"}" data-door="${i}" style="min-height:112px; flex-direction:column; font-size:16px;" ${isOpen || found ? "disabled" : ""}>
                    ${isOpen
                      ? `${d.imageDataUrl ? `<img src="${d.imageDataUrl}" alt="${d.en}" style="height:54px; border-radius:10px; background:#fff; padding:2px;" />` : `<span style="font-size:40px;">${d.icon || "📘"}</span>`}<span>${d.en} (${d.vi})</span>`
                      : `<span style="font-size:36px;">🚪</span><span>Cửa số ${i + 1}</span>`
                    }
                  </button>
                `;
              }).join("")}
            </div>
            <div class="feedback-banner" id="sn-fb"></div>
            <div id="sn-next-wrap" style="margin-top:14px; display:${found ? "block" : "none"};">
              <button class="btn-3d btn-pink" id="sn-next">${rIdx + 1 >= rounds ? "🏆 Hoàn thành!" : "Vòng tiếp theo ➡️"}</button>
            </div>
          </div>
        `;

        document.getElementById("sn-spk").addEventListener("click", () => speakEn(target.en, target));
        body.querySelectorAll("[data-door]").forEach(btn => btn.addEventListener("click", () => {
          const i = Number(btn.dataset.door);
          opened[i] = true;
          if (doors[i].en === target.en) {
            found = true; score++; flowers += 2;
            speakEn(target.en, target);
            if (!isPreviewDraft) rewardWin(2, `Tìm thấy "${target.en}" sau cửa số ${i + 1} rồi! (+2 🌸)`);
            updateView();
            const fb = document.getElementById("sn-fb");
            fb.className = "feedback-banner show ok";
            fb.textContent = `🎉 Tuyệt vời! "${target.en}" trốn ngay sau cửa số ${i + 1} (+2 🌸)!`;
          } else {
            if (!isPreviewDraft) global.PlaylandBridge?.getAudioFX?.()?.wrong?.();
            updateView();
            const fb = document.getElementById("sn-fb");
            fb.className = "feedback-banner show err";
            fb.textContent = `🚪 Cửa số ${i + 1} là "${doors[i].en}" rồi, thử mở cửa khác nhé!`;
          }
        }));
        document.getElementById("sn-next")?.addEventListener("click", () => {
          if (rIdx + 1 >= rounds) global.PlaylandBridge?.renderPlayCompleted?.(body, "Thám tử Sneaky Spotlight!", `Bé đã tìm đủ ${score}/${rounds} cánh cửa bí mật`, flowers);
          else { rIdx++; drawRound(); }
        });
      }
      setTimeout(() => speakEn(target.en, target), 180);
      updateView();
    }
    drawRound();
  }

  // =========================================================================
  // 4. SHADOW FUSION (ALIGN 2 HALVES TO REVEAL THE WORD)
  // =========================================================================
  function renderShadowFusion(body, lessonSet, isPreviewDraft = false) {
    const pool = (lessonSet?.items || []);
    const qs = shuffle(pool).slice(0, Math.min(5, pool.length));
    let qIdx = 0, flowers = 0;

    function draw() {
      const q = qs[qIdx];
      let offset = 36 - Math.floor(Math.random() * 20); // start misaligned
      if (Math.random() < 0.5) offset = -offset;
      let solved = false;

      function updateView() {
        const aligned = Math.abs(offset) <= 4;
        body.innerHTML = `
          <div style="text-align:center; max-width:560px; margin:0 auto;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
              <span class="mini-pill">Hình ${qIdx + 1}/${qs.length}</span>
              <span class="mini-pill" style="background:#fff0f7; color:#b5246b;">Kéo thanh trượt để ghép 2 mảnh khớp nhau!</span>
            </div>

            <div style="position:relative; height:176px; border-radius:26px; background:linear-gradient(135deg,#ebf8ff,#fff0f7); border:4px solid #fff; display:flex; align-items:center; justify-content:center; overflow:hidden; margin-bottom:14px;">
              <!-- Left half -->
              <div style="position:absolute; width:130px; height:130px; clip-path:inset(0 50% 0 0); transform:translateX(${-offset}px); transition:transform 0.1s ease; display:flex; align-items:center; justify-content:center;">
                ${q.imageDataUrl
                  ? `<img src="${q.imageDataUrl}" alt="${q.en}" style="width:116px; height:116px; object-fit:contain; border-radius:16px;" />`
                  : `<span style="font-size:96px; filter:${solved ? "none" : "drop-shadow(0 4px 10px rgba(45,43,85,0.25))"};">${q.icon || "🌸"}</span>`}
              </div>
              <!-- Right half -->
              <div style="position:absolute; width:130px; height:130px; clip-path:inset(0 0 0 50%); transform:translateX(${offset}px); transition:transform 0.1s ease; display:flex; align-items:center; justify-content:center;">
                ${q.imageDataUrl
                  ? `<img src="${q.imageDataUrl}" alt="${q.en}" style="width:116px; height:116px; object-fit:contain; border-radius:16px;" />`
                  : `<span style="font-size:96px; filter:${solved ? "none" : "drop-shadow(0 4px 10px rgba(45,43,85,0.25))"};">${q.icon || "🌸"}</span>`}
              </div>
            </div>

            ${solved ? `
              <div style="padding:14px; border-radius:22px; background:#dcfce7; border:2px solid #86efac; margin-bottom:12px;">
                <div style="font-size:24px; font-weight:900; color:#14532d;">${q.en} — ${q.vi}</div>
                <div style="font-size:14px; font-weight:700; color:#166534;">${q.ipa || ""}</div>
              </div>
              <div class="btn-group" style="justify-content:center;">
                <button class="btn-3d btn-sky" id="sf-spk">🔊 Nghe lại</button>
                <button class="btn-3d btn-pink" id="sf-next">${qIdx + 1 >= qs.length ? "🏆 Hoàn thành!" : "Hình tiếp theo ➡️"}</button>
              </div>
            ` : `
              <div style="background:#fff; padding:16px; border-radius:22px; border:2px solid #e6e4fb;">
                <input type="range" id="sf-slider" min="-55" max="55" value="${offset}" style="width:100%; accent-color:#ff79b9; height:32px; cursor:pointer;" />
                <div class="btn-group" style="justify-content:center; margin-top:10px;">
                  <button class="btn-3d" id="sf-left">⬅️ Xích vào</button>
                  <button class="btn-3d btn-mint" id="sf-snap" ${aligned ? "" : "disabled"}>✨ Khớp Hình (+3 🌸)</button>
                  <button class="btn-3d" id="sf-right">➡️ Xích ra</button>
                </div>
              </div>
            `}
          </div>
        `;

        if (!solved) {
          const slider = document.getElementById("sf-slider");
          slider.addEventListener("input", (e) => { offset = Number(e.target.value); updateView(); });
          document.getElementById("sf-left").addEventListener("click", () => { offset = offset > 0 ? Math.max(0, offset - 6) : Math.min(0, offset + 6); updateView(); });
          document.getElementById("sf-right").addEventListener("click", () => { offset = offset >= 0 ? Math.min(55, offset + 6) : Math.max(-55, offset - 6); updateView(); });
          document.getElementById("sf-snap").addEventListener("click", () => {
            offset = 0; solved = true; flowers += 3;
            speakEn(q.en, q);
            if (!isPreviewDraft) rewardWin(3, `Khớp hoàn hảo hình "${q.en}" (+3 🌸)!`);
            updateView();
          });
        } else {
          document.getElementById("sf-spk")?.addEventListener("click", () => speakEn(q.en, q));
          document.getElementById("sf-next")?.addEventListener("click", () => {
            if (qIdx + 1 >= qs.length) global.PlaylandBridge?.renderPlayCompleted?.(body, "Chuyên gia Shadow Fusion!", `Bé đã ghép khít toàn bộ ${qs.length} bức hình`, flowers);
            else { qIdx++; draw(); }
          });
        }
      }
      updateView();
    }
    draw();
  }

  global.DemoGamesPack = {
    renderGame(id, body, set, isPreviewDraft) {
      if (id === "mochi-merge") return renderMochiMerge(body, set, isPreviewDraft);
      if (id === "peekaboo-pals") return renderPeekabooPals(body, set, isPreviewDraft);
      if (id === "sneaky-spotlight") return renderSneakySpotlight(body, set, isPreviewDraft);
      if (id === "shadow-fusion") return renderShadowFusion(body, set, isPreviewDraft);
    }
  };
})(window);
