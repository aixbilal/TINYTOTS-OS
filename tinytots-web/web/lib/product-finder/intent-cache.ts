/**
 * Tiny, best-effort cache for VALIDATED shopping intent, on the Upstash Redis
 * that rate limiting already requires (no new datastore).
 *
 * Key   = sha256(normalised, PII-stripped query)   → never the raw text
 * Value = the validated FinderFilters object        → never a raw model reply
 * TTL   = 12h
 *
 * Only the structured intent is cached. Products, stock and prices are always
 * fetched live and remain authoritative on every search. Any Redis failure is
 * swallowed — the finder must never break because the cache is down.
 */

import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { FinderFilters } from "@/lib/product-finder/query";

const TTL_SECONDS = 12 * 60 * 60;
const PREFIX = "tt-intent:";

let redis: Redis | null = null;
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  if (!redis) redis = new Redis({ url, token });
  return redis;
}

/** Stable key for a query that has already been lower-cased / PII-stripped. */
export function intentCacheKey(normalizedQuery: string): string {
  const hash = createHash("sha256").update(normalizedQuery.trim().toLowerCase()).digest("hex");
  return PREFIX + hash;
}

export async function getCachedIntent(normalizedQuery: string): Promise<FinderFilters | null> {
  try {
    const client = getRedis();
    if (!client) return null;
    const hit = await client.get<FinderFilters>(intentCacheKey(normalizedQuery));
    return hit && typeof hit === "object" ? hit : null;
  } catch (err) {
    console.error("[intent-cache] read failed — ignoring", err);
    return null;
  }
}

export async function setCachedIntent(
  normalizedQuery: string,
  filters: FinderFilters
): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    await client.set(intentCacheKey(normalizedQuery), filters, { ex: TTL_SECONDS });
  } catch (err) {
    console.error("[intent-cache] write failed — ignoring", err);
  }
}
