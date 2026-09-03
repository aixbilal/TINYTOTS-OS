/**
 * GLOBAL free-tier budgets for AI providers — separate from the existing
 * per-IP limiters in lib/rate-limit.ts (those stay exactly as they are).
 *
 * Purpose: keep the app comfortably inside Groq's and Gemini's free-plan
 * request/day allowances no matter how many distinct IPs call in. These are
 * APPLICATION guards, deliberately below the providers' real limits, not
 * claims about them.
 *
 * Fail-OPEN on an Upstash error: a Redis outage must not hard-disable AI
 * (the per-IP limiter, which fails closed, still gates abuse; and the whole
 * finder degrades to the guided flow anyway). See BATCH-I.2 §10 / §18.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type BudgetResult = { ok: true } | { ok: false; retryAfterSec: number };

const DAY_SEC = 24 * 60 * 60;

/** Named global budgets. rpm/rpd are counted across ALL callers. */
export const AI_BUDGETS = {
  "groq-finder-rpm": { limit: 20, windowSec: 60 },
  "groq-finder-rpd": { limit: 250, windowSec: DAY_SEC },
  "groq-admin-rpm": { limit: 5, windowSec: 60 },
  "groq-admin-rpd": { limit: 30, windowSec: DAY_SEC },
  "gemini-finder-fallback-rpm": { limit: 2, windowSec: 60 },
  "gemini-finder-fallback-rpd": { limit: 5, windowSec: DAY_SEC },
  "gemini-admin-fallback-rpd": { limit: 10, windowSec: DAY_SEC },
} as const;

export type BudgetName = keyof typeof AI_BUDGETS;

let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  if (!redis) redis = new Redis({ url, token });
  return redis;
}

function getLimiter(name: BudgetName): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;
  const cached = limiters.get(name);
  if (cached) return cached;
  const { limit, windowSec } = AI_BUDGETS[name];
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.fixedWindow(limit, `${windowSec} s`),
    prefix: "tinytots-aibudget",
    analytics: false,
  });
  limiters.set(name, limiter);
  return limiter;
}

/**
 * Consume one unit of a global budget. Returns ok:false with a retry hint when
 * the window is exhausted. Fails OPEN (ok:true) if Upstash is unreachable.
 */
export async function consumeBudget(name: BudgetName): Promise<BudgetResult> {
  try {
    const limiter = getLimiter(name);
    if (!limiter) return { ok: true }; // no Redis configured → don't block
    const res = await limiter.limit(name);
    if (res.success) return { ok: true };
    const retryAfterSec = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  } catch (err) {
    console.error(`[ai-budget] ${name} check failed — allowing (fail-open)`, err);
    return { ok: true };
  }
}
