/**
 * Minimal server-side Groq client — plain HTTPS against the OpenAI-compatible
 * Chat Completions endpoint. No provider SDK, no retries.
 *
 * Groq is the PRIMARY free-tier AI provider for the two Batch-I commerce
 * features (customer shopping-intent parsing, admin product copy). Gemini is a
 * limited fallback (see lib/ai/gemini.ts). Local deterministic parsing runs
 * before either — no LLM ever supplies catalog/customer truth.
 *
 *   GROQ_API_KEY   server-only, read from process.env at call time, never
 *                  returned to the client, never logged.
 *   GROQ_MODEL     optional non-secret model-id override.
 *
 * Selected production model (bake-off 2026-09-03): openai/gpt-oss-20b — a
 * Groq *production* (non-preview) model with JSON-Schema structured outputs and
 * solid Roman-Urdu + English extraction. qwen/qwen3.8-27b parsed comparably but
 * is PREVIEW and showed more age hallucination, so it was not selected.
 */

export const DEFAULT_GROQ_MODEL =
  process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b";

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 14_000;

export type GroqReason =
  | "not_configured"
  | "timeout"
  | "rate_limited"
  | "unavailable"
  | "upstream"
  | "empty"
  | "blocked_or_invalid";

export type GroqOk = { ok: true; text: string };
export type GroqErr = { ok: false; reason: GroqReason; retryAfterSec?: number };
export type GroqResult = GroqOk | GroqErr;

/** A JSON Schema object for Groq strict Structured Outputs. */
export type GroqJsonSchema = {
  name: string;
  schema: Record<string, unknown>;
};

type GroqArgs = {
  systemInstruction: string;
  userText: string;
  /** When set, the model is constrained to this schema (strict mode). */
  jsonSchema?: GroqJsonSchema;
  temperature?: number;
  maxTokens?: number;
  /**
   * gpt-oss models reason before answering; "low" keeps deterministic
   * extraction fast and inside the token budget. Ignored by models that
   * don't support it.
   */
  reasoningEffort?: "low" | "medium" | "high";
  /** Non-secret override; defaults to DEFAULT_GROQ_MODEL. */
  model?: string;
};

/**
 * One Groq call. One attempt — no retry storm. Callers get a generic reason;
 * upstream bodies are logged server-side only (never the key/Authorization).
 */
export async function groqGenerate(args: GroqArgs): Promise<GroqResult> {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return { ok: false, reason: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body: Record<string, unknown> = {
      model: args.model?.trim() || DEFAULT_GROQ_MODEL,
      temperature: args.temperature ?? 0.4,
      max_tokens: args.maxTokens ?? 512,
      messages: [
        { role: "system", content: args.systemInstruction },
        { role: "user", content: args.userText },
      ],
    };
    if (args.reasoningEffort) body.reasoning_effort = args.reasoningEffort;
    if (args.jsonSchema) {
      body.response_format = {
        type: "json_schema",
        json_schema: { name: args.jsonSchema.name, strict: true, schema: args.jsonSchema.schema },
      };
    }

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      // Log status + a short, key-free snippet only.
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
      // 400s from strict Structured Outputs ("Failed to generate/validate JSON")
      // are a model limitation for this query, not a server fault.
      if (res.status === 400 && /json/i.test(raw)) return { ok: false, reason: "blocked_or_invalid" };
      return { ok: false, reason: "upstream" };
    }

    type Choice = { message?: { content?: unknown }; finish_reason?: string };
    const json = (await res.json()) as { choices?: Choice[] };
    const choice = json?.choices?.[0];
    if (choice?.finish_reason === "content_filter") return { ok: false, reason: "blocked_or_invalid" };

    const text = typeof choice?.message?.content === "string" ? choice.message.content.trim() : "";
    if (!text) return { ok: false, reason: "empty" };
    return { ok: true, text };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return { ok: false, reason: "timeout" };
    console.error("[groq] request failed", err);
    return { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}
