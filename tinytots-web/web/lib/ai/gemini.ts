/**
 * Minimal server-side Google Gemini client — plain HTTPS, no provider SDK.
 *
 * Used by two Batch-I features, each with its OWN key so usage can be tracked
 * and rotated independently:
 *   - GEMINI_PRODUCT_DESCRIPTION_API_KEY  (admin product copy)
 *   - GEMINI_PRODUCT_FINDER_API_KEY       (customer shopping-intent parsing)
 *
 * Keys are read from process.env at call time and NEVER returned to the
 * client. Upstream error bodies are logged server-side only; callers get a
 * generic reason string.
 */

const DEFAULT_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
const ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 15_000;

export type GeminiOk = { ok: true; text: string };
export type GeminiErr = { ok: false; reason: "not_configured" | "timeout" | "upstream" | "empty" | "blocked" };
export type GeminiResult = GeminiOk | GeminiErr;

type GenerateArgs = {
  apiKey: string | undefined;
  systemInstruction: string;
  userText: string;
  /** "application/json" to force structured output. */
  responseMimeType?: "text/plain" | "application/json";
  temperature?: number;
  maxOutputTokens?: number;
};

export async function geminiGenerate(args: GenerateArgs): Promise<GeminiResult> {
  const key = args.apiKey?.trim();
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
          systemInstruction: { parts: [{ text: args.systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: args.userText }] }],
          generationConfig: {
            temperature: args.temperature ?? 0.4,
            maxOutputTokens: args.maxOutputTokens ?? 512,
            ...(args.responseMimeType ? { responseMimeType: args.responseMimeType } : {}),
          },
          safetySettings: [],
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[gemini] upstream ${res.status}: ${body.slice(0, 500)}`);
      return { ok: false, reason: "upstream" };
    }

    type GeminiPart = { text?: unknown };
    type GeminiCandidate = { finishReason?: string; content?: { parts?: GeminiPart[] } };
    const json = (await res.json()) as { candidates?: GeminiCandidate[] };
    const candidate = json?.candidates?.[0];
    if (candidate?.finishReason === "SAFETY" || candidate?.finishReason === "BLOCKLIST") {
      return { ok: false, reason: "blocked" };
    }
    const text: string = (candidate?.content?.parts ?? [])
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .join("")
      .trim();

    if (!text) return { ok: false, reason: "empty" };
    return { ok: true, text };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return { ok: false, reason: "timeout" };
    console.error("[gemini] request failed", err);
    return { ok: false, reason: "upstream" };
  } finally {
    clearTimeout(timer);
  }
}

/** Parse a JSON object out of a model response, tolerating ```json fences. */
export function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        const parsed = JSON.parse(cleaned.slice(first, last + 1));
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}
