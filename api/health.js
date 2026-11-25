import { applyCors, GEMINI_MODEL, isAiConfigured } from "./_gemini.js";

export default function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  res.status(200).json({
    ok: true,
    runtime: "vercel",
    aiConfigured: isAiConfigured(),
    model: GEMINI_MODEL
  });
}
