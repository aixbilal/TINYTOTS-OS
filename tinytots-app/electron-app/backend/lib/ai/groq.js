/**
 * Minimal server-side Groq client for the Electron POS backend — plain HTTPS
 * against the OpenAI-compatible Chat Completions endpoint. No provider SDK,
 * no retries. Ported from the website's lib/ai/groq.ts (kept deliberately
 * close so prompt/behaviour parity is easy to reason about).
 *
 *   GROQ_API_KEY   server-only, read from process.env at call time, never
 *                  returned to the renderer, never logged.
 *   GROQ_MODEL     optional non-secret model-id override.
 */
import process from "node:process";

export const DEFAULT_GROQ_MODEL =
  process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b";

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 14_000;

/**
 * One Groq call. One attempt — no retry storm. Returns
 *   { ok: true, text }  |  { ok: false, reason, retryAfterSec? }
 * `reason` is one of: not_configured | timeout | rate_limited | unavailable |
 * upstream | empty | blocked_or_invalid
 */
export async function groqGenerate({
  systemInstruction,
  userText,
  temperature = 0.4,
  maxTokens = 512,
  reasoningEffort,
  model,
}) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return { ok: false, reason: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body = {
      model: model?.trim() || DEFAULT_GROQ_MODEL,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userText },
      ],
    };
    if (reasoningEffort) body.reasoning_effort = reasoningEffort;

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      // Status + short, key-free snippet only.
      console.error(`[groq] upstream ${res.status}: ${raw.slice(0, 300)}`);
      if (res.status === 429) {
        const ra = Number(res.headers.get("retry-after"));
        return {
          ok: false,
          reason: "rate_limited",
          ...(Number.isFinite(ra) && ra > 0 ? { retryAfterSec: Math.ceil(ra) } : {}),
        };
      }
      if (res.status >= 500) return { ok: false, reason: "unavailable" };
      return { ok: false, reason: "upstream" };
    }

    const json = await res.json();
    const choice = json?.choices?.[0];
    if (choice?.finish_reason === "content_filter") {
      return { ok: false, reason: "blocked_or_invalid" };
    }
    const text =
      typeof choice?.message?.content === "string" ? choice.message.content.trim() : "";
    if (!text) return { ok: false, reason: "empty" };
    return { ok: true, text };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, reason: "timeout" };
    }
    console.error("[groq] request failed", err);
    return { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}
