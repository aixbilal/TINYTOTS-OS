import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  activeCategoryNames,
  clampPrice,
  cleanText,
  findProducts,
  validateAgeBracket,
  validateGender,
  type FinderFilters,
} from "@/lib/product-finder/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deterministic guided finder — no AI. All input is validated against the real
// catalog vocabulary before any query runs.
export async function POST(request: NextRequest) {
  const limited = await rateLimit(`finder:${clientIp(request)}`, { limit: 30, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const filters: FinderFilters = {};
  const gender = validateGender(body.gender);
  if (gender) filters.gender = gender;
  const ageBracket = validateAgeBracket(body.ageBracket);
  if (ageBracket) filters.ageBracket = ageBracket;

  if (typeof body.category === "string" && body.category.trim()) {
    const allowed = await activeCategoryNames();
    if (allowed.has(body.category.trim())) filters.category = body.category.trim();
  }

  const budget = body.budget as { min?: unknown; max?: unknown } | undefined;
  if (budget && typeof budget === "object") {
    const min = clampPrice(budget.min);
    const max = clampPrice(budget.max);
    if (min != null) filters.minPrice = min;
    if (max != null) filters.maxPrice = max;
    if (filters.minPrice != null && filters.maxPrice != null && filters.minPrice > filters.maxPrice) {
      delete filters.minPrice;
      delete filters.maxPrice;
    }
  }

  const color = cleanText(body.color, 24);
  if (color) filters.color = color;
  const size = cleanText(body.size, 12);
  if (size) filters.size = size;

  const results = await findProducts(filters);
  return NextResponse.json({ type: "products", filters, results }, { status: 200 });
}
