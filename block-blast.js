/**
 * BLOCK BLAST TIẾNG ANH (8x8 Kawaii Pastel Puzzle + Vocabulary Unlock Loop)
 * - 8x8 pastel board + 3-block tray (starts locked, re-locks after all 3 blocks placed)
 * - Vocabulary quiz unlock with automatic Web Speech API (en-US, rate 0.85)
 * - Wrong answers automatically saved to Kho Lỗi Sai
 * - Pointer Events drag & drop with touch-action: none and translate(-50%, -115%) finger-offset ghost
 * - Green valid / Red invalid live grid highlights
 * - Row/Column clearing with sound, score, Bông hoa 🌸 & Mèo Mochi + Mun AI reactions
 * - Automatic Unavailable (No valid moves) detection & end-of-round reward summary
 */
(function (global) {
  "use strict";

  const GRID_SIZE = 8;

  const BLOCK_COLORS = [
    { bg: "linear-gradient(145deg, #ffb4dc, #ff79b9)", border: "#e04890" },
    { bg: "linear-gradient(145deg, #9ce3ff, #4fc3f7)", border: "#0b88c9" },
    { bg: "linear-gradient(145deg, #8df5df, #38d3b5)", border: "#15a689" },
    { bg: "linear-gradient(145deg, #fff1a6, #ffd54f)", border: "#d99b0b" },
    { bg: "linear-gradient(145deg, #c9ccff, #9498f2)", border: "#666ad1" },
    { bg: "linear-gradient(145deg, #ffc8aa, #ff9966)", border: "#d96532" }
  ];

  // Diverse Block Blast polyomino shapes
  const SHAPES = [
    [[1]],
    [[1, 1]],
    [[1], [1]],
    [[1, 1, 1]],
    [[1], [1], [1]],
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
    [[1, 0], [1, 1]],
    [[0, 1], [1, 1]],
    [[1, 1], [1, 0]],
    [[1, 0], [1, 0], [1, 1]],
    [[0, 1], [0, 1], [1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]]
  ];

  let activeCleanup = null;

  function cleanup() {
    if (activeCleanup) {
      activeCleanup();
      activeCleanup = null;
    }
  }

  function injectStyles() {
    if (document.getElementById("bb-styles")) return;
    const style = document.createElement("style");
    style.id = "bb-styles";
    style.textContent = `
      .bb-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        user-select: none;
      }
      .bb-hud {
        width: 100%;
        max-width: 520px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 22px;
        background: #ffffff;
        border: 3px solid #f2efff;
        box-shadow: 0 6px 16px rgba(108, 107, 168, 0.1);
      }
      .bb-stat-chip {
        padding: 5px 12px;
        border-radius: 14px;
        font-size: 14px;
        font-weight: 900;
        background: #faf9ff;
        border: 2px solid #e6e4fb;
        color: #2d2b55;
      }
      .bb-board-shell {
        position: relative;
        width: 100%;
        max-width: 416px;
        padding: 10px;
        border-radius: 26px;
        background: linear-gradient(145deg, #ffeaf5, #e8fff9, #fff7d6);
        border: 4px solid #ffffff;
        box-shadow: 0 14px 30px rgba(108, 107, 168, 0.18);
      }
      .bb-grid {
        display: grid;
        grid-template-columns: repeat(8, minmax(0, 1fr));
        gap: 4px;
        width: 100%;
        aspect-ratio: 1 / 1;
        touch-action: none;
      }
      .bb-cell {
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.85);
        border: 1.5px solid rgba(203, 213, 225, 0.55);
        transition: transform 0.14s ease, background 0.12s ease, box-shadow 0.12s ease;
      }
      .bb-cell.alt { background: rgba(248, 250, 255, 0.92); }
      .bb-cell.filled {
        box-shadow: inset 0 -3px 0 rgba(0,0,0,0.12), inset 0 2px 0 rgba(255,255,255,0.65);
      }
      .bb-cell.clearing {
        transform: scale(1.14);
        filter: brightness(1.3);
      }
      .bb-cell.preview-ok {
        background: rgba(34, 197, 94, 0.45) !important;
        border: 2px solid #16a34a !important;
        box-shadow: inset 0 0 8px rgba(34, 197, 94, 0.35);
      }
      .bb-cell.preview-bad {
        background: rgba(244, 63, 94, 0.42) !important;
        border: 2px solid #e11d48 !important;
      }

      /* 3-Block Tray */
      .bb-tray-shell {
        position: relative;
        width: 100%;
        max-width: 520px;
        min-height: 124px;
        padding: 12px;
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.9);
        border: 3px solid #ffffff;
        box-shadow: 0 10px 24px rgba(108, 107, 168, 0.12);
        touch-action: none;
      }
      .bb-tray-slots {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        min-height: 98px;
        align-items: center;
      }
      .bb-slot {
        min-height: 98px;
        border-radius: 18px;
        background: #faf9ff;
        border: 2px dashed #dcdaf7;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
        touch-action: none;
      }
      .bb-piece {
        display: grid;
        gap: 2.5px;
        cursor: grab;
        touch-action: none;
        padding: 4px;
        transition: transform 0.15s ease, opacity 0.15s ease;
      }
      .bb-piece:active { cursor: grabbing; }
      .bb-piece.dragging-src { opacity: 0.22; transform: scale(0.92); }
      .bb-mini-cell {
        width: 18px;
        height: 18px;
        border-radius: 5px;
      }
      .bb-mini-cell.empty { background: transparent; border: none; }

      /* Lock Overlay over the 3-block tray */
      .bb-lock-overlay {
        position: absolute;
        inset: 0;
        border-radius: 24px;
        background: rgba(255, 244, 250, 0.86);
        backdrop-filter: blur(4px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        text-align: center;
        z-index: 4;
      }

      /* Floating Drag Clone shifted above finger: translate(-50%, -115%) */
      .bb-drag-ghost {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 120;
        pointer-events: none;
        transform: translate(-50%, -115%);
        display: grid;
        filter: drop-shadow(0 14px 20px rgba(45, 43, 85, 0.28));
      }
      .bb-ghost-cell {
        border-radius: 8px;
        box-shadow: inset 0 -3px 0 rgba(0,0,0,0.14), inset 0 2px 0 rgba(255,255,255,0.65);
      }

      /* Vocabulary Unlock Quiz Overlay & Unavailable Summary */
      .bb-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 110;
        background: rgba(45, 43, 85, 0.48);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .bb-quiz-card {
        width: 100%;
        max-width: 500px;
        background: linear-gradient(160deg, #fffafd, #f2ffff, #fffef2);
        border: 4px solid #ffffff;
        border-radius: 30px;
        padding: 22px 20px;
        box-shadow: 0 24px 60px rgba(45, 43, 85, 0.28);
        text-align: center;
      }
      .bb-quiz-choices {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 14px;
      }
      @media (max-width: 520px) {
        .bb-quiz-choices { grid-template-columns: 1fr; }
        .bb-mini-cell { width: 15px; height: 15px; }
      }
    `;
    document.head.appendChild(style);
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function randomPiece() {
    const matrix = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
    return { matrix, color };
  }

  function canPlace(board, matrix, startR, startC) {
    for (let dr = 0; dr < matrix.length; dr++) {
      for (let dc = 0; dc < matrix[dr].length; dc++) {
        if (!matrix[dr][dc]) continue;
        const r = startR + dr;
        const c = startC + dc;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
        if (board[r][c] !== null) return false;
      }
    }
    return true;
  }

  function hasAnyValidMove(board, tray) {
    const remaining = tray.filter(Boolean);
    if (remaining.length === 0) return true;
    for (const piece of remaining) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (canPlace(board, piece.matrix, r, c)) return true;
        }
      }
    }
    return false;
  }

  function speakWordEn085(item) {
    const api = global.PlaylandBridge;
    const st = api?.getState?.() || global.state;
    if (st && !st.soundOn) return;
    if (item && item.audioDataUrl) {
      try { new Audio(item.audioDataUrl).play().catch(() => {}); return; } catch {}
    }
    if ("speechSynthesis" in window && item?.en) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(item.en);
        u.lang = "en-US";
        u.rate = 0.85;
        u.pitch = 1.05;
        window.speechSynthesis.speak(u);
      } catch {}
    }
  }

  function renderGame(body, lessonSet, isPreviewDraft = false) {
    cleanup();
    injectStyles();

    const api = global.PlaylandBridge;
    const fallbackWords = (typeof global.UNITS !== "undefined" ? global.UNITS.flatMap(u => u.words) : []);
    const vocabPool = (lessonSet && Array.isArray(lessonSet.items) && lessonSet.items.length > 0)
      ? lessonSet.items
      : fallbackWords;
    const allDistractors = [...vocabPool, ...fallbackWords];

    let board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    let tray = [randomPiece(), randomPiece(), randomPiece()];
    let trayLocked = true;
    let score = 0;
    let linesCleared = 0;
    let wordsUnlocked = 0;
    let sessionFlowers = 0;
    let wordCursor = 0;
    let shuffledWords = shuffle(vocabPool);
    let clearingSet = new Set();
    let dragState = null;
    let gameOver = false;
    let statusBanner = "🔒 Nhấn nút Mở khóa và trả lời đúng 1 từ vựng để nhận 3 khối gạch nhé!";

    function nextVocabQuestion() {
      if (wordCursor >= shuffledWords.length) {
        shuffledWords = shuffle(vocabPool);
        wordCursor = 0;
      }
      const q = shuffledWords[wordCursor++];
      const distractors = shuffle(allDistractors.filter(x => x.en && x.en.toLowerCase() !== q.en.toLowerCase()))
        .filter((x, i, arr) => arr.findIndex(y => y.vi === x.vi) === i)
        .slice(0, 3);
      return { q, options: shuffle([q, ...distractors]) };
    }

    function openUnlockQuiz() {
      if (!trayLocked || gameOver) return;
      const { q, options } = nextVocabQuestion();
      let answered = false;

      const modal = document.createElement("div");
      modal.className = "bb-modal-overlay";
      modal.id = "bb-quiz-overlay";
      modal.innerHTML = `
        <div class="bb-quiz-card" id="bb-quiz-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span class="mini-pill" style="background:#ffeaf5; color:#b5246b;">🔓 Mở khóa 3 khối gạch</span>
            <button type="button" class="btn-3d" id="bb-q-close" style="min-height:40px; padding:4px 12px;">✖️</button>
          </div>
          <div style="font-size:48px; margin:4px 0;">
            ${q.imageDataUrl ? `<img src="${q.imageDataUrl}" alt="${q.en}" style="height:68px; border-radius:14px;" />` : (q.icon || "📘")}
          </div>
          <div style="font-size:28px; font-weight:900; color:#2d2b55;">${q.en}</div>
          <div style="font-size:14px; font-weight:700; color:#575685; margin-bottom:10px;">${q.ipa || ""}</div>
          <button type="button" class="btn-3d btn-sky" id="bb-q-speak">🔊 Nghe lại phát âm</button>

          <div class="bb-quiz-choices" id="bb-q-choices">
            ${options.map((o, idx) => `
              <button type="button" class="btn-3d choice-btn" data-bb-opt="${idx}">
                <span style="font-size:22px;">${o.icon || "🌸"}</span>
                <span>${o.vi}</span>
              </button>
            `).join("")}
          </div>

          <div class="feedback-banner" id="bb-q-fb"></div>
          <div id="bb-q-retry-wrap" style="margin-top:12px; display:none;">
            <button type="button" class="btn-3d btn-pink" id="bb-q-next">Thử từ khác để mở khóa ➡️</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Auto pronounce en-US at rate 0.85
      setTimeout(() => speakWordEn085(q), 140);

      document.getElementById("bb-q-speak").addEventListener("click", () => speakWordEn085(q));
      document.getElementById("bb-q-close").addEventListener("click", () => modal.remove());

      modal.querySelectorAll("[data-bb-opt]").forEach(btn => {
        btn.addEventListener("click", () => {
          if (answered) return;
          answered = true;
          const idx = Number(btn.dataset.bbOpt);
          const picked = options[idx];
          const isRight = picked.en.toLowerCase() === q.en.toLowerCase();
          const fb = document.getElementById("bb-q-fb");

          modal.querySelectorAll("[data-bb-opt]").forEach((b, j) => {
            b.disabled = true;
            if (options[j].en.toLowerCase() === q.en.toLowerCase()) b.classList.add("correct");
            else if (j === idx && !isRight) b.classList.add("wrong");
          });

          if (isRight) {
            wordsUnlocked++;
            trayLocked = false;
            if (!isPreviewDraft && api?.addFlower) {
              sessionFlowers += 1;
              api.addFlower(1);
            }
            api?.getAudioFX?.()?.correct?.();
            api?.launchConfetti?.(16);
            if (global.MunCompanion) global.MunCompanion.onCorrect(`Chính xác! "${q.en}" = ${q.vi}! Đã mở khóa 3 khối gạch! 🧩✨`);
            const st = api?.getState?.();
            if (st) {
              st.pet.stateExpr = "excited";
              st.pet.speech = `Giỏi quá! Bé mở khóa 3 khối gạch Block Blast và nhận +1 🌸!`;
              api?.saveState?.(); api?.renderHeader?.(); api?.renderStreak?.(); api?.renderMochi?.();
            }
            fb.className = "feedback-banner show ok";
            fb.textContent = `✅ Chuẩn xác! "${q.en}" = ${q.vi} (+1 🌸). Đang mở khóa 3 khối gạch...`;
            setTimeout(() => {
              modal.remove();
              statusBanner = "🧩 Kéo thả 3 khối gạch bên dưới vào bàn cờ 8×8!";
              // Check immediately if newly unlocked tray even has any valid move on current board
              if (!hasAnyValidMove(board, tray)) {
                triggerGameOver();
              } else {
                draw();
              }
            }, 650);
          } else {
            document.getElementById("bb-quiz-card").classList.add("shake");
            api?.getAudioFX?.()?.wrong?.();
            speakWordEn085(q);

            // Auto save wrong word into Kho Lỗi Sai!
            if (!isPreviewDraft) {
              const recFn = api?.recordMistake || global.recordMistake;
              const renMistakesFn = api?.renderMistakesSection || global.renderMistakesSection;
              if (typeof recFn === "function") {
                recFn(lessonSet?.unitId || api?.getState?.()?.ui?.unitId || 1, q);
              }
              if (typeof renMistakesFn === "function") renMistakesFn();
              api?.renderHeader?.();
            }
            if (global.MunCompanion) global.MunCompanion.onWrong(`Hic! "${q.en}" nghĩa là "${q.vi}". Mun đã lưu vào Kho Lỗi Sai giúp bạn rồi! 🥺`);
            fb.className = "feedback-banner show err";
            fb.textContent = `💛 Chưa đúng rồi! "${q.en}" nghĩa là "${q.vi}". Đã lưu vào Kho Lỗi Sai để bé ôn lại!`;
            document.getElementById("bb-q-retry-wrap").style.display = "block";
            document.getElementById("bb-q-next").addEventListener("click", () => {
              modal.remove();
              openUnlockQuiz();
            });
          }
        });
      });
    }

    function triggerGameOver() {
      gameOver = true;
      trayLocked = true;
      api?.getAudioFX?.()?.celebrate?.();
      api?.launchConfetti?.(42);
      if (!isPreviewDraft) {
        const st = api?.getState?.();
        if (st) {
          st.stats.roundsDone += 1;
          if (typeof global.checkMilestones === "function") global.checkMilestones();
          api?.saveState?.();
          api?.renderHeader?.();
        }
      }

      const modal = document.createElement("div");
      modal.className = "bb-modal-overlay";
      modal.id = "bb-gameover-overlay";
      modal.innerHTML = `
        <div class="bb-quiz-card">
          <div style="font-size:56px; margin-bottom:6px;">🧩🏆🌸</div>
          <h3 style="font-size:24px; font-weight:900; color:#2d2b55;">Hết Nước Đi! (Tổng Kết)</h3>
          <p style="font-size:14.5px; font-weight:700; color:#575685; margin:8px 0 14px;">
            Không còn ô trống phù hợp cho khối gạch hiện tại trên bàn cờ 8×8. Bé chơi siêu cừ luôn!
          </p>
          <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:18px;">
            <div class="bb-stat-chip">⭐ Điểm: ${score}</div>
            <div class="bb-stat-chip">✨ Xoá hàng/cột: ${linesCleared}</div>
            <div class="bb-stat-chip">📖 Từ đã mở: ${wordsUnlocked}</div>
            <div class="bb-stat-chip" style="background:#fff0f7; color:#a31c5e;">🌸 Thưởng: +${sessionFlowers} Hoa</div>
          </div>
          <div class="btn-group" style="justify-content:center;">
            <button type="button" class="btn-3d btn-pink" id="bb-go-restart">🔄 Chơi ván mới</button>
            <button type="button" class="btn-3d btn-soft-sky" id="bb-go-home">⬅️ Về thư viện</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById("bb-go-restart").addEventListener("click", () => {
        modal.remove();
        renderGame(body, lessonSet, isPreviewDraft);
      });
      document.getElementById("bb-go-home").addEventListener("click", () => {
        modal.remove();
        if (typeof global.closeGamePlayer === "function") global.closeGamePlayer();
      });
    }

    function clearFullLines() {
      const fullRows = [];
      const fullCols = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        if (board[r].every(cell => cell !== null)) fullRows.push(r);
      }
      for (let c = 0; c < GRID_SIZE; c++) {
        let allFilled = true;
        for (let r = 0; r < GRID_SIZE; r++) {
          if (board[r][c] === null) { allFilled = false; break; }
        }
        if (allFilled) fullCols.push(c);
      }

      const totalLines = fullRows.length + fullCols.length;
      if (totalLines === 0) return false;

      clearingSet = new Set();
      fullRows.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) clearingSet.add(`${r},${c}`); });
      fullCols.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) clearingSet.add(`${r},${c}`); });

      const bonusScore = totalLines * totalLines * 100;
      const bonusFlowers = totalLines >= 2 ? totalLines + 1 : totalLines;
      score += bonusScore;
      linesCleared += totalLines;

      if (!isPreviewDraft && api?.addFlower) {
        sessionFlowers += bonusFlowers;
        api.addFlower(bonusFlowers);
      }
      api?.getAudioFX?.()?.[totalLines >= 2 ? "celebrate" : "correct"]?.();
      api?.launchConfetti?.(totalLines >= 2 ? 32 : 18);
      if (global.MunCompanion) global.MunCompanion.onCorrect(`Quá đỉnh! Xoá ${totalLines} hàng/cột và nhận +${bonusFlowers} 🌸! 🎉🐥`);
      const st = api?.getState?.();
      if (st) {
        st.pet.stateExpr = "excited";
        st.pet.mood = Math.min(100, st.pet.mood + 5);
        st.pet.speech = `Bùm! Xoá sạch ${totalLines} hàng/cột Block Blast (+${bonusFlowers} 🌸)! 🌸`;
        api?.saveState?.(); api?.renderHeader?.(); api?.renderStreak?.(); api?.renderMochi?.();
      }
      statusBanner = `🎉 Tuyệt vời! Xoá ${totalLines} hàng/cột (+${bonusScore} điểm & +${bonusFlowers} 🌸)!`;

      draw(); // Show highlight flash briefly
      setTimeout(() => {
        fullRows.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) board[r][c] = null; });
        fullCols.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) board[r][c] = null; });
        clearingSet = new Set();
        postMoveCheck();
      }, 220);
      return true;
    }

    function postMoveCheck() {
      if (tray.every(slot => slot === null)) {
        // Used all 3 blocks -> auto refill & re-lock for next vocab question!
        tray = [randomPiece(), randomPiece(), randomPiece()];
        trayLocked = true;
        statusBanner = "🔒 Đã xếp hết 3 khối! Trả lời câu từ vựng tiếp theo để mở khóa khay mới nhé!";
        draw();
      } else if (!hasAnyValidMove(board, tray)) {
        draw();
        setTimeout(() => triggerGameOver(), 320);
      } else {
        draw();
      }
    }

    function placePieceAt(slotIdx, row, col) {
      const piece = tray[slotIdx];
      if (!piece || !canPlace(board, piece.matrix, row, col)) return false;

      let cellsCount = 0;
      for (let dr = 0; dr < piece.matrix.length; dr++) {
        for (let dc = 0; dc < piece.matrix[dr].length; dc++) {
          if (piece.matrix[dr][dc]) {
            board[row + dr][col + dc] = piece.color;
            cellsCount++;
          }
        }
      }
      tray[slotIdx] = null;
      score += cellsCount * 5;
      api?.getAudioFX?.()?.flip?.();

      const cleared = clearFullLines();
      if (!cleared) {
        postMoveCheck();
      }
      return true;
    }

    function updateGridPreview(piece, startR, startC) {
      const gridEl = document.getElementById("bb-grid");
      if (!gridEl) return;
      const cells = gridEl.children;
      for (let i = 0; i < cells.length; i++) {
        cells[i].classList.remove("preview-ok", "preview-bad");
      }
      if (!piece || startR === null || startC === null) return;

      const valid = canPlace(board, piece.matrix, startR, startC);
      const cls = valid ? "preview-ok" : "preview-bad";
      for (let dr = 0; dr < piece.matrix.length; dr++) {
        for (let dc = 0; dc < piece.matrix[dr].length; dc++) {
          if (!piece.matrix[dr][dc]) continue;
          const r = startR + dr;
          const c = startC + dc;
          if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
            const idx = r * GRID_SIZE + c;
            if (cells[idx]) cells[idx].classList.add(cls);
          }
        }
      }
    }

    function computeHoverCell(ghostEl, matrix) {
      const gridEl = document.getElementById("bb-grid");
      if (!gridEl || !ghostEl) return { r: null, c: null };
      const gRect = gridEl.getBoundingClientRect();
      const ghRect = ghostEl.getBoundingClientRect();
      const cellPitch = gRect.width / GRID_SIZE;

      // Center of top-left cell of the floating ghost
      const topLeftCenterX = ghRect.left + cellPitch * 0.5;
      const topLeftCenterY = ghRect.top + cellPitch * 0.5;

      // Check if ghost center overlaps roughly with board bounds
      const cx = (ghRect.left + ghRect.right) / 2;
      const cy = (ghRect.top + ghRect.bottom) / 2;
      if (cx < gRect.left - cellPitch || cx > gRect.right + cellPitch || cy < gRect.top - cellPitch || cy > gRect.bottom + cellPitch) {
        return { r: null, c: null };
      }

      const c = Math.round((topLeftCenterX - gRect.left) / cellPitch - 0.5);
      const r = Math.round((topLeftCenterY - gRect.top) / cellPitch - 0.5);
      // Allow partial out-of-bounds so red highlight shows when dragging near edge
      if (r < -matrix.length || r >= GRID_SIZE + 1 || c < -matrix[0].length || c >= GRID_SIZE + 1) {
        return { r: null, c: null };
      }
      return { r, c };
    }

    function onWindowPointerMove(e) {
      if (!dragState) return;
      e.preventDefault();
      dragState.ghost.style.left = `${e.clientX}px`;
      dragState.ghost.style.top = `${e.clientY}px`;
      const { r, c } = computeHoverCell(dragState.ghost, dragState.piece.matrix);
      dragState.hoverR = r;
      dragState.hoverC = c;
      updateGridPreview(dragState.piece, r, c);
    }

    function endDrag(commitDrop) {
      if (!dragState) return;
      const { slotIdx, piece, ghost, srcEl, hoverR, hoverC } = dragState;
      dragState = null;

      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerCancel);

      if (ghost && ghost.parentNode) ghost.remove();
      if (srcEl) srcEl.classList.remove("dragging-src");
      updateGridPreview(null, null, null);

      if (commitDrop && hoverR !== null && hoverC !== null && canPlace(board, piece.matrix, hoverR, hoverC)) {
        placePieceAt(slotIdx, hoverR, hoverC);
      } else {
        api?.getAudioFX?.()?.click?.();
      }
    }

    function onWindowPointerUp() { endDrag(true); }
    function onWindowPointerCancel() { endDrag(false); }

    function startDrag(e, slotIdx, srcEl) {
      if (trayLocked || gameOver || !tray[slotIdx] || dragState) return;
      e.preventDefault();
      const piece = tray[slotIdx];
      const gridEl = document.getElementById("bb-grid");
      const cellSize = gridEl ? Math.max(28, Math.floor((gridEl.getBoundingClientRect().width - 28) / GRID_SIZE)) : 40;

      const ghost = document.createElement("div");
      ghost.className = "bb-drag-ghost";
      ghost.style.gridTemplateColumns = `repeat(${piece.matrix[0].length}, ${cellSize}px)`;
      ghost.style.gap = "4px";
      ghost.style.left = `${e.clientX}px`;
      ghost.style.top = `${e.clientY}px`;

      piece.matrix.forEach(row => {
        row.forEach(v => {
          const cell = document.createElement("div");
          cell.style.width = `${cellSize}px`;
          cell.style.height = `${cellSize}px`;
          if (v) {
            cell.className = "bb-ghost-cell";
            cell.style.background = piece.color.bg;
            cell.style.border = `2px solid ${piece.color.border}`;
          }
          ghost.appendChild(cell);
        });
      });

      document.body.appendChild(ghost);
      srcEl.classList.add("dragging-src");

      dragState = { slotIdx, piece, ghost, srcEl, hoverR: null, hoverC: null };
      const { r, c } = computeHoverCell(ghost, piece.matrix);
      dragState.hoverR = r;
      dragState.hoverC = c;
      updateGridPreview(piece, r, c);

      window.addEventListener("pointermove", onWindowPointerMove, { passive: false });
      window.addEventListener("pointerup", onWindowPointerUp);
      window.addEventListener("pointercancel", onWindowPointerCancel);
    }

    function draw() {
      body.innerHTML = `
        <div class="bb-wrap">
          <div class="bb-hud">
            <div class="bb-stat-chip">⭐ Điểm: ${score}</div>
            <div class="bb-stat-chip">✨ Đã xoá: ${linesCleared}</div>
            <div class="bb-stat-chip">📖 Từ mở: ${wordsUnlocked}</div>
            <div class="bb-stat-chip" style="background:#fff0f7; color:#a31c5e;">🌸 +${sessionFlowers}</div>
          </div>

          <div style="font-size:13.5px; font-weight:800; color:#2d2b55; text-align:center; padding:6px 14px; border-radius:16px; background:#fff; border:2px solid #e6e4fb;">
            ${statusBanner}
          </div>

          <!-- 8x8 Pastel Board -->
          <div class="bb-board-shell">
            <div class="bb-grid" id="bb-grid">
              ${board.map((row, r) => row.map((cell, c) => {
                const isAlt = (r + c) % 2 === 1;
                const isClear = clearingSet.has(`${r},${c}`);
                const style = cell ? `background:${cell.bg}; border-color:${cell.border};` : "";
                return `<div class="bb-cell ${isAlt ? "alt" : ""} ${cell ? "filled" : ""} ${isClear ? "clearing" : ""}" style="${style}"></div>`;
              }).join("")).join("")}
            </div>
          </div>

          <!-- 3-Block Tray (Starts Locked) -->
          <div class="bb-tray-shell" id="bb-tray-shell">
            <div class="bb-tray-slots">
              ${tray.map((piece, idx) => `
                <div class="bb-slot">
                  ${piece ? `
                    <div class="bb-piece" data-bb-piece="${idx}" style="grid-template-columns:repeat(${piece.matrix[0].length}, auto);">
                      ${piece.matrix.map(r => r.map(v => `
                        <div class="bb-mini-cell ${v ? "" : "empty"}" style="${v ? `background:${piece.color.bg}; border:1.5px solid ${piece.color.border};` : ""}"></div>
                      `).join("")).join("")}
                    </div>
                  ` : `<span style="font-size:12px; font-weight:800; color:#a4a3dc;">Đã đặt ✓</span>`}
                </div>
              `).join("")}
            </div>

            ${trayLocked && !gameOver ? `
              <div class="bb-lock-overlay">
                <div style="font-size:13.5px; font-weight:900; color:#b5246b;">
                  🔒 Khay 3 khối gạch đang khóa
                </div>
                <button type="button" class="btn-3d btn-pink" id="bb-btn-unlock">
                  🔓 Mở khóa bằng Từ vựng Tiếng Anh
                </button>
              </div>
            ` : ""}
          </div>
        </div>
      `;

      const unlockBtn = document.getElementById("bb-btn-unlock");
      if (unlockBtn) {
        unlockBtn.addEventListener("click", () => {
          api?.getAudioFX?.()?.click?.();
          openUnlockQuiz();
        });
      }

      body.querySelectorAll("[data-bb-piece]").forEach(el => {
        el.addEventListener("pointerdown", (e) => {
          startDrag(e, Number(el.dataset.bbPiece), el);
        });
      });
    }

    activeCleanup = () => {
      endDrag(false);
      document.getElementById("bb-quiz-overlay")?.remove();
      document.getElementById("bb-gameover-overlay")?.remove();
    };

    draw();
  }

  global.BlockBlastModule = {
    renderGame,
    cleanup
  };
})(window);
