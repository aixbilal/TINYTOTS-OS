import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/admin/signage — content (row1/row2 marquee source) + product and
// category lists, in one call, same shape as /api/admin/homepage.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const [{ data: content, error }, { data: products }, { data: categories }] = await Promise.all([
    supabaseAdmin.from("signage_content").select("*").eq("id", 1).maybeSingle(),
    supabaseAdmin
      .from("products")
      .select("id, name, image_url, category")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabaseAdmin.from("categories").select("name, slug").order("display_order", { ascending: true }).order("name", { ascending: true }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content, products: products || [], categories: categories || [] });
}

const SELECTION_TYPE_FIELDS = ["row1_selection_type", "row2_selection_type"] as const;
const CATEGORY_FIELDS = ["row1_category", "row2_category", "collections_category", "accessories_category"] as const;
const PRODUCT_ID_FIELDS = ["row1_product_ids", "row2_product_ids"] as const;

// PATCH /api/admin/signage — updates which products/category feed each
// marquee row (and the two small extra category fields, kept for future use).
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  try {
    const body = await req.json();
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    for (const field of SELECTION_TYPE_FIELDS) {
      if (body[field] === "products" || body[field] === "category") updates[field] = body[field];
    }
    for (const field of CATEGORY_FIELDS) {
      if (field in body) updates[field] = body[field] ? String(body[field]).trim() : null;
    }
    for (const field of PRODUCT_ID_FIELDS) {
      if (Array.isArray(body[field])) {
        updates[field] = body[field].map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id));
      }
    }

    const { data, error } = await supabaseAdmin
      .from("signage_content")
      .update(updates)
      .eq("id", 1)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ content: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}