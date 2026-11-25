import { applyCors, callGeminiGameGen, readRequestBody } from "./_gemini.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  try {
    const payload = await readRequestBody(req);
    if (!payload?.extractedText && (!payload?.images || payload.images.length === 0)) {
      res.status(400).json({ error: "Vui lòng tải tài liệu hoặc nhập nội dung bài học trước khi gọi AI." });
      return;
    }
    const result = await callGeminiGameGen(payload);
    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message === "MISSING_API_KEY"
        ? "Chưa cấu hình GEMINI_API_KEY trên Vercel Environment Variables."
        : (err.message || "Lỗi xử lý AI.")
    });
  }
}
