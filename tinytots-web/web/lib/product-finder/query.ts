import { supabaseAnon as supabase } from "@/lib/supabase-anon";
import { AGE_BRACKETS, FINDER_GENDERS, PRICE_CEILING, type AgeBracket, type FinderGender } from "@/lib/product-finder/config";

// Validated, structured finder input. Every field is optional; anything unknown
// is dropped by the validators before it gets here.
export type FinderFilters = {
  gender?: FinderGender;
  ageBracket?: AgeBracket;
  category?: string; // must be an exact active categories.name
  minPrice?: number;
  maxPrice?: number;
  color?: string; // free text, matched case-insensitively as a substring
  size?: string;
  /** Soft text signal (e.g. an occasion) — not a real product field. */
  keywords?: string[];
};

export type FinderResult = {
  id: number;
  name: string;
  category: string | null;
  gender: string | null;
  image_url: string | null;
  web_price: number | null;
  colors: string[];
  sizes: string[];
  url: string;
};

const MAX_RESULTS = 6;

export function validateGender(v: unknown): FinderGender | undefined {
  return typeof v === "string" && (FINDER_GENDERS as readonly string[]).includes(v.toLowerCase())
    ? (v.toLowerCase() as FinderGender)
    : undefined;
}

export function validateAgeBracket(v: unknown): AgeBracket | undefined {
  return typeof v === "string" && (AGE_BRACKETS as readonly string[]).includes(v)
    ? (v as AgeBracket)
    : undefined;
}

export function clampPrice(v: unknown): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.min(Math.round(n), PRICE_CEILING);
}

export function cleanText(v: unknown, max = 40): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().replace(/[%_,\\]/g, " ").replace(/\s+/g, " ").slice(0, max);
  return t.length >= 2 ? t : undefined;
}

/** Fetch active categories.name set so a supplied category can be validated. */
export async function activeCategoryNames(): Promise<Set<string>> {
  const { data } = await supabase.from("categories").select("name, is_active").eq("is_active", true);
  return new Set((data || []).map((c: { name: string }) => c.name));
}

/**
 * Deterministic catalog query. Real, active, in-stock products only. Price
 * filtering is on the authoritative web_price. Occasion / keyword hints are
 * applied as a soft in-memory name+description contains, never as a DB filter.
 */
export async function findProducts(filters: FinderFilters): Promise<FinderResult[]> {
  let query = supabase
    .from("products")
    .select(
      `id, name, category, gender, age_bracket, image_url, description,
       variants ( color, size, stock, web_price )`
    )
    .eq("is_active", true);

  if (filters.gender) {
    // Unisex products are relevant to a boy or girl search too.
    query = filters.gender === "unisex"
      ? query.eq("gender", "unisex")
      : query.in("gender", [filters.gender, "unisex"]);
  }
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.ageBracket) {
    // Exact bracket, or products with no bracket set (they may still fit).
    query = query.or(`age_bracket.eq.${filters.ageBracket},age_bracket.is.null`);
  }

  const { data, error } = await query.limit(120);
  if (error || !data) return [];

  const min = filters.minPrice ?? 0;
  const max = filters.maxPrice ?? Number.POSITIVE_INFINITY;
  const colorNeedle = filters.color?.toLowerCase();
  const sizeNeedle = filters.size?.toLowerCase();
  const keywords = (filters.keywords || []).map((k) => k.toLowerCase()).filter(Boolean);

  const scored: { r: FinderResult; score: number }[] = [];

  type VariantRow = { color: string | null; size: string | null; stock: number | null; web_price: number | null };
  type ProductRow = {
    id: number;
    name: string;
    category: string | null;
    gender: string | null;
    age_bracket: string | null;
    image_url: string | null;
    description: string | null;
    variants: VariantRow[] | null;
  };

  for (const p of data as ProductRow[]) {
    const variants: VariantRow[] = Array.isArray(p.variants) ? p.variants : [];
    const eligible = variants.filter((v) => {
      if (!v || (v.stock ?? 0) <= 0) return false;
      const price = v.web_price;
      if (price == null || price < min || price > max) return false;
      if (colorNeedle && !String(v.color || "").toLowerCase().includes(colorNeedle)) return false;
      if (sizeNeedle && !String(v.size || "").toLowerCase().includes(sizeNeedle)) return false;
      return true;
    });
    if (eligible.length === 0) continue;

    const prices = eligible.map((v) => Number(v.web_price)).filter((n) => Number.isFinite(n));
    const lowest = prices.length ? Math.min(...prices) : null;

    let score = 0;
    if (keywords.length) {
      const hay = `${p.name || ""} ${p.description || ""}`.toLowerCase();
      score = keywords.reduce((acc, k) => acc + (hay.includes(k) ? 1 : 0), 0);
    }

    scored.push({
      score,
      r: {
        id: p.id,
        name: p.name,
        category: p.category,
        gender: p.gender,
        image_url: p.image_url ?? null,
        web_price: lowest,
        colors: Array.from(
          new Set(eligible.map((v) => v.color).filter((c): c is string => Boolean(c)))
        ).slice(0, 6),
        sizes: Array.from(
          new Set(eligible.map((v) => v.size).filter((s): s is string => Boolean(s)))
        ).slice(0, 8),
        url: `/products/${p.id}`,
      },
    });
  }

  scored.sort((a, b) => b.score - a.score || (a.r.web_price ?? 1e12) - (b.r.web_price ?? 1e12));
  return scored.slice(0, MAX_RESULTS).map((s) => s.r);
}
