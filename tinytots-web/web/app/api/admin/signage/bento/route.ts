import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const BLOCK_KEYS = ["meadow", "boys", "girls", "collections", "accessories"] as const;
type BlockKey = (typeof BLOCK_KEYS)[number];

// GET /api/admin/signage/bento — all banners for all 5 blocks, grouped.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("signage_bento_banners")
    .select("id, block_key, image_url, heading, subtext, link, display_seconds, sort_order, is_active")
    .order("block_key", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const grouped: Record<BlockKey, any[]> = { meadow: [], boys: [], girls: [], collections: [], accessories: [] };
  for (const row of data || []) {
    if (BLOCK_KEYS.includes(row.block_key)) grouped[row.block_key as BlockKey].push(row);
  }
  return NextResponse.json({ bento: grouped });
}

// PATCH /api/admin/signage/bento — replaces all banners for ONE block in
// one go, body: { block_key, banners: [{ image_url, heading, subtext, link,
// display_seconds }] }. Max 5 banners enforced here (and again by the DB
// trigger as a backstop).
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  try {
    const body = await req.json();
    const blockKey = body.block_key;
    if (!BLOCK_KEYS.includes(blockKey)) {
      return NextResponse.json({ error: "Invalid block_key" }, { status: 400 });
    }

    const rawBanners = Array.isArray(body.banners) ? body.banners : [];
    if (rawBanners.length > 5) {
      return NextResponse.json({ error: "Maximum of 5 banners per block" }, { status: 400 });
    }

    const banners = rawBanners
      .filter((b: any) => b.image_url && String(b.image_url).trim())
      .map((b: any, i: number) => ({
        block_key: blockKey,
        image_url: String(b.image_url).trim(),
        heading: String(b.heading || "").trim(),
        subtext: String(b.subtext || "").trim(),
        link: String(b.link || "/products").trim(),
        display_seconds: Math.min(10, Math.max(5, Number(b.display_seconds) || 7)),
        sort_order: i,
        is_active: b.is_active !== false,
      }));

    const { error: deleteError } = await supabaseAdmin.from("signage_bento_banners").delete().eq("block_key", blockKey);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    if (banners.length === 0) {
      return NextResponse.json({ banners: [] });
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("signage_bento_banners")
      .insert(banners)
      .select("id, block_key, image_url, heading, subtext, link, display_seconds, sort_order, is_active");

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json({ banners: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}