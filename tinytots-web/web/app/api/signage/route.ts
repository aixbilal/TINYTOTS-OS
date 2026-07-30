import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// The TV in the shop leaves this tab open indefinitely, so this must never
// serve a stale cached response — same reasoning as the storefront PDP/grid.
export const dynamic = "force-dynamic";

type Selection = { type: string; category: string | null; productIds: number[] };

async function resolveProducts(sel: Selection, limit: number) {
  let query = supabaseAdmin
    .from("products")
    .select("id, name, image_url, category")
    .eq("is_active", true)
    .not("image_url", "is", null);

  if (sel.type === "products" && sel.productIds.length > 0) {
    query = query.in("id", sel.productIds);
  } else if (sel.type === "category" && sel.category) {
    query = query.eq("category", sel.category);
  }

  query = query.order("created_at", { ascending: false }).limit(limit);
  const { data } = await query;
  return data || [];
}

// Falls back to the newest active products when nothing has been assigned
// yet, so the screen is never blank before an admin configures it.
async function resolveOrFallback(sel: Selection, limit: number, offset = 0) {
  const configured = sel.category || sel.productIds.length > 0;
  if (configured) {
    const rows = await resolveProducts(sel, limit);
    if (rows.length > 0) return rows;
  }
  const { data } = await supabaseAdmin
    .from("products")
    .select("id, name, image_url, category")
    .eq("is_active", true)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return data || [];
}

const BLOCK_KEYS = ["meadow", "boys", "girls", "collections", "accessories"] as const;

export async function GET() {
  const [{ data: signage }, { data: words }, { data: banners }, { data: testimonials }] = await Promise.all([
    supabaseAdmin.from("signage_content").select("*").eq("id", 1).maybeSingle(),
    supabaseAdmin
      .from("signage_marquee_words")
      .select("word")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("signage_bento_banners")
      .select("block_key, image_url, heading, subtext, link, display_seconds")
      .eq("is_active", true)
      .order("block_key", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("testimonials")
      .select("id, customer_name, rating, quote")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  const row1Sel: Selection = {
    type: signage?.row1_selection_type || "category",
    category: signage?.row1_category || null,
    productIds: signage?.row1_product_ids || [],
  };
  const row2Sel: Selection = {
    type: signage?.row2_selection_type || "category",
    category: signage?.row2_category || null,
    productIds: signage?.row2_product_ids || [],
  };

  const [row1Products, row2Products] = await Promise.all([
    resolveOrFallback(row1Sel, 10, 0),
    resolveOrFallback(row2Sel, 10, 10),
  ]);

  const bento: Record<string, any[]> = { meadow: [], boys: [], girls: [], collections: [], accessories: [] };
  for (const b of banners || []) {
    if (BLOCK_KEYS.includes(b.block_key)) bento[b.block_key].push(b);
  }

  return NextResponse.json({
    row1_images: row1Products.map((p) => p.image_url).filter(Boolean),
    row2_images: row2Products.map((p) => p.image_url).filter(Boolean),
    marquee_words: (words || []).map((w) => w.word),
    bento,
    testimonials: (testimonials || []).map((t) => ({
      name: t.customer_name,
      rating: t.rating,
      quote: t.quote,
    })),
  });
}
