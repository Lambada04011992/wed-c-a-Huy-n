/**
 * Secure AI Proxy & Static Server for Kawaii English 5 Playland + Mun AI Companion
 * Zero external npm dependencies (uses built-in Node.js >= 18 modules).
 * Keeps GEMINI_API_KEY strictly on the server (never exposed to frontend).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env manually if present
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const PORT = Number(process.env.PORT || 3001);
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || "gemini-3.5-flash-lite,gemini-3.1-flash-lite-preview")
  .split(",").map(s => s.trim()).filter(Boolean);

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function readBody(req, maxBytes = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Payload too large (max 12MB)"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function generateWithFallback(bodyObj) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
    const err = new Error("MISSING_API_KEY");
    err.status = 503;
    throw err;
  }

  const models = [GEMINI_MODEL, ...FALLBACK_MODELS.filter(m => m !== GEMINI_MODEL)];
  let lastErr = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyObj)
    });
    if (resp.ok) {
      const json = await resp.json();
      return { model, json };
    }
    const errText = await resp.text();
    lastErr = new Error(`Gemini (${model}) ${resp.status}: ${errText.slice(0, 260)}`);
    if (![404, 429, 500, 503].includes(resp.status)) break;
  }
  throw lastErr || new Error("Gemini request failed");
}

async function callGeminiGameGen({ gameId, gameName, lessonTitle, extractedText, images, questionCount, difficulty }) {
  const isPhonicsRacing = gameId === "phonics-racing";
  const prompt = `
Bạn là chuyên gia thiết kế nội dung giáo dục tiếng Anh tiểu học (lớp 1-5).
Hãy phân tích tài liệu giáo viên cung cấp dưới đây và tạo bộ dữ liệu trò chơi cho game "${gameName}" (id: ${gameId}).

QUY TẮC BẮT BUỘC:
1. CHỈ sử dụng từ vựng, mẫu câu, kiến thức CÓ THẬT trong tài liệu được cung cấp. KHÔNG tự ý bịa thêm kiến thức ngoài tài liệu.
2. Ngôn ngữ rõ ràng, phù hợp học sinh tiểu học, độ khó: ${difficulty || "medium"}.
3. Tạo tối đa ${Number(questionCount) || 8} mục (ít hơn nếu tài liệu ngắn hơn).
${isPhonicsRacing ? "4. ĐẶC BIỆT CHO PHONICS RACING: chỉ chọn các từ tiếng Anh có độ dài 2 đến 8 chữ cái (A-Z), viết hoa trong trường 'word', tách từng chữ cái (hoặc âm ghép SH/CH/TH/OO/EE) vào mảng 'letters', và ghi âm phonics tương ứng vào mảng 'phonics'." : ""}
5. Trả về DUY NHẤT JSON hợp lệ theo cấu trúc:
{
  "lessonName": "Tên chủ đề ngắn gọn trích từ tài liệu",
  "summary": "Tóm tắt ngắn trọng tâm bài học bằng tiếng Việt",
  "items": [
    {
      "en": "từ hoặc cụm từ tiếng Anh trong tài liệu",
      "word": "TỪ VIẾT HOA 2-8 CHỮ CÁI (nếu là Phonics Racing)",
      "letters": ["C","A","T"],
      "phonics": ["kuh","a","tuh"],
      "ipa": "/phiên âm IPA nếu xác định được hoặc chuỗi rỗng/",
      "vi": "nghĩa tiếng Việt chính xác theo tài liệu",
      "ex": "câu ví dụ tiếng Anh trích hoặc bám sát tài liệu",
      "icon": "1 emoji phù hợp",
      "question": "câu hỏi trắc nghiệm ngắn (nếu phù hợp)",
      "options": ["đáp án đúng", "gợi ý nhiễu 1", "gợi ý nhiễu 2", "gợi ý nhiễu 3"]
    }
  ]
}

Tên bài học giáo viên gợi ý: ${lessonTitle || "(chưa đặt tên)"}
Nội dung tài liệu trích xuất:
"""
${(extractedText || "").slice(0, 24000)}
"""
`.trim();

  const parts = [{ text: prompt }];
  if (Array.isArray(images)) {
    for (const img of images.slice(0, 3)) {
      if (img && typeof img.dataUrl === "string") {
        const match = img.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i);
        if (match) parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
      }
    }
  }

  const { json } = await generateWithFallback({
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.25, responseMimeType: "application/json" }
  });
  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const parsed = JSON.parse(rawText);
  if (!parsed || !Array.isArray(parsed.items)) throw new Error("AI response did not contain valid items array.");
  return parsed;
}

async function callGeminiMunChat({ message, history, imageDataUrl, studentContext }) {
  const sysText = `
Bạn tên là **Mun**, chú gà con áo vàng siêu dễ thương, là gia sư AI đồng hành học tiếng Anh dành cho học sinh tiểu học (lớp 1 đến lớp 5, đặc biệt bộ sách Global Success).
Thông tin bạn nhỏ hiện tại: ${studentContext || "Học sinh tiểu học"}.

PHONG CÁCH TRẢ LỜI:
1. Xưng hô thân thiện ("Mun" - "bạn nhỏ" hoặc tên bé), giọng điệu vui tươi, khích lệ, gần gũi như người bạn lớn.
2. Kiến thức tiếng Anh (từ vựng, ngữ pháp, phát âm, dịch câu, giải bài tập) phải CHÍNH XÁC 100%, giải thích từng bước thật dễ hiểu với ví dụ sinh động.
3. Trả lời ngắn gọn, trình bày rõ ràng bằng gạch đầu dòng/emoji vừa phải, không dài dòng khó đọc.
4. Nếu học sinh gửi ảnh bài tập, hãy đọc kỹ đề bài trong ảnh, hướng dẫn cách làm từng câu và giải thích vì sao chọn đáp án đó.
5. Cuối câu trả lời, thêm đúng 1 thẻ cảm xúc ẩn dạng [[MOOD:happy]] hoặc [[MOOD:normal]] hoặc [[MOOD:sad]] hoặc [[MOOD:suspicious]] phù hợp ngữ cảnh (mặc định happy khi khen/giải xong, normal khi giảng bài).
`.trim();

  const contents = [];
  if (Array.isArray(history)) {
    for (const turn of history.slice(-10)) {
      if (turn && (turn.role === "user" || turn.role === "model") && turn.text) {
        contents.push({ role: turn.role, parts: [{ text: String(turn.text).slice(0, 2000) }] });
      }
    }
  }

  const userParts = [{ text: String(message || "Chào Mun!").slice(0, 4000) }];
  if (typeof imageDataUrl === "string") {
    const m = imageDataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i);
    if (m) userParts.push({ inline_data: { mime_type: m[1], data: m[2] } });
  }
  contents.push({ role: "user", parts: userParts });

  const { model, json } = await generateWithFallback({
    systemInstruction: { parts: [{ text: sysText }] },
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: 900 }
  });

  let text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "Mun đang suy nghĩ một chút, bạn hỏi lại nhé! 🐥";
  let mood = "happy";
  const moodMatch = text.match(/\[\[MOOD:(normal|happy|sad|suspicious)\]\]/i);
  if (moodMatch) {
    mood = moodMatch[1].toLowerCase();
    text = text.replace(moodMatch[0], "").trim();
  }
  return { reply: text, mood, model };
}

const MIME_MAP = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);

  if (req.method === "GET" && urlPath === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      aiConfigured: Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== "your_gemini_api_key_here"),
      model: GEMINI_MODEL
    });
    return;
  }

  if (req.method === "POST" && urlPath === "/api/generate-game") {
    try {
      const payload = JSON.parse((await readBody(req)) || "{}");
      if (!payload.extractedText && (!payload.images || payload.images.length === 0)) {
        sendJson(res, 400, { error: "Vui lòng tải tài liệu hoặc nhập nội dung bài học trước khi gọi AI." });
        return;
      }
      const result = await callGeminiGameGen(payload);
      sendJson(res, 200, { ok: true, data: result });
    } catch (err) {
      sendJson(res, err.status || 500, {
        error: err.message === "MISSING_API_KEY"
          ? "Chưa cấu hình GEMINI_API_KEY trên server (.env)."
          : (err.message || "Lỗi xử lý AI.")
      });
    }
    return;
  }

  if (req.method === "POST" && urlPath === "/api/chat-mun") {
    try {
      const payload = JSON.parse((await readBody(req)) || "{}");
      const result = await callGeminiMunChat(payload);
      sendJson(res, 200, { ok: true, ...result });
    } catch (err) {
      sendJson(res, err.status || 500, {
        error: err.message === "MISSING_API_KEY"
          ? "Chưa cấu hình GEMINI_API_KEY trên server (.env)."
          : (err.message || "Mun chưa kết nối được với máy chủ AI.")
      });
    }
    return;
  }

  // Static files whitelist inside workspace
  const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const safePath = path.normalize(path.join(__dirname, rel));
  if (safePath.startsWith(__dirname) && fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath).toLowerCase();
    if (MIME_MAP[ext]) {
      res.writeHead(200, { "Content-Type": MIME_MAP[ext] });
      fs.createReadStream(safePath).pipe(res);
      return;
    }
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Kawaii English 5 + Mun AI Proxy listening at http://localhost:${PORT}`);
  console.log(`Primary model: ${GEMINI_MODEL} | API Key configured: ${Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== "your_gemini_api_key_here")}`);
});
