/**
 * Shared Gemini helper & CORS utilities for Vercel Serverless Functions.
 * Reads GEMINI_API_KEY strictly from server environment variables.
 */

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || "gemini-3.5-flash-lite,gemini-3.1-flash-lite-preview")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function applyCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

export function isAiConfigured() {
  const key = process.env.GEMINI_API_KEY || "";
  return Boolean(key && key !== "your_gemini_api_key_here");
}

export async function generateWithFallback(bodyObj) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!isAiConfigured()) {
    const err = new Error("MISSING_API_KEY");
    err.status = 503;
    throw err;
  }

  const models = [GEMINI_MODEL, ...FALLBACK_MODELS.filter((m) => m !== GEMINI_MODEL)];
  let lastErr = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
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

export function readRequestBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string") return Promise.resolve(JSON.parse(req.body || "{}"));
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export async function callGeminiGameGen({ gameId, gameName, lessonTitle, extractedText, images, questionCount, difficulty }) {
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
  if (!parsed || !Array.isArray(parsed.items)) {
    throw new Error("AI response did not contain valid items array.");
  }
  return parsed;
}

export async function callGeminiMunChat({ message, history, imageDataUrl, studentContext }) {
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
