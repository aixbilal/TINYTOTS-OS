/**
 * Shared sliding-window rate limiter backed by Upstash Redis.
 * Survives cold starts and is consistent across serverless instances.
 *
 * Requires env:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

const limiterCache = new Map<string, Ratelimit>();

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    throw new Error(
      "Rate limiting requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN"
    );
  }
  return new Redis({ url, token });
}

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const cacheKey = `${limit}:${windowSec}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: "tinytots-rl",
    analytics: false,
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

/**
 * Same call shape as before; now async (Upstash REST). Callers must await.
 */
export async function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  try {
    const result = await getLimiter(limit, windowMs).limit(key);
    if (result.success) return { ok: true };

    const retryAfterSec = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000)
    );
    return { ok: false, retryAfterSec };
  } catch (err) {
    console.error("[rate-limit] Upstash error — failing closed", err);
    return { ok: false, retryAfterSec: 60 };
  }
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function rateLimitResponse(retryAfterSec: number) {
  return Response.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}
