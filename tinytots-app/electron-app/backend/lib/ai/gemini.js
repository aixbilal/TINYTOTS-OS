/**
 * Minimal server-side Google Gemini client for the Electron POS backend —
 * plain HTTPS, no provider SDK. Ported from the website's lib/ai/gemini.ts.
 *
 *   GEMINI_PRODUCT_DESCRIPTION_API_KEY   passed in by the caller
 *   GEMINI_MODEL                         optional non-secret model override
 *
 * The key is read from process.env by the caller and NEVER returned to the
 * renderer. Upstream error bodies are logged server-side only.
 */
import process from "node:process";

const DEFAULT_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
const ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 15_000;

/**
 * Returns { ok: true, text } | { ok: false, reason }
 * reason: not_configured | timeout | upstream | empty | blocked
 */
export async function geminiGenerate({
  apiKey,
  systemInstruction,
  userText,
  temperature = 0.4,
  maxOutputTokens = 512,
}) {
  const key = apiKey?.trim();
  if (!key) return { ok: false, reason: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `${ENDPOINT_BASE}/${encodeURIComponent(DEFAULT_MODEL)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: userText }] }],
          generationConfig: { temperature, maxOutputTokens },
          safetySettings: [],
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[gemini] upstream ${res.status}: ${body.slice(0, 500)}`);
      return { ok: false, reason: "upstream" };
    }

    const json = await res.json();
    const candidate = json?.candidates?.[0];
    if (candidate?.finishReason === "SAFETY" || candidate?.finishReason === "BLOCKLIST") {
      return { ok: false, reason: "blocked" };
    }
    const text = (candidate?.content?.parts ?? [])
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .join("")
      .trim();
    if (!text) return { ok: false, reason: "empty" };
    return { ok: true, text };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, reason: "timeout" };
    }
    console.error("[gemini] request failed", err);
    return { ok: false, reason: "upstream" };
  } finally {
    clearTimeout(timer);
  }
}
