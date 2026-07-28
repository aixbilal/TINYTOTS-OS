import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const SELECTION_TYPE_FIELDS = ["trending_selection_type", "meadow_selection_type", "boys_selection_type", "girls_selection_type"];
const CATEGORY_FIELDS = ["trending_category", "meadow_category", "boys_category", "girls_category"];
const PRODUCT_ID_FIELDS = ["trending_product_ids", "meadow_product_ids", "boys_product_ids", "girls_product_ids"];

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const [{ data: content, error }, { data: products }, { data: categories }] = await Promise.all([
    supabaseAdmin.from("homepage_content").select("*").eq("id", 1).single(),
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

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  try {
    const body = await req.json();
    const textFields = [
      "hero_image_url",
      "hero_image_url_mobile",
      "hero_headline",
      "hero_subtext",
      "hero_button_text",
      "hero_button_link",
      "trending_heading",
      "meadow_image_url",
      "meadow_badge_text",
      "meadow_heading",
      "meadow_button_text",
      "meadow_link",
      "boys_image_url",
      "boys_link",
      "girls_image_url",
      "girls_link",
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of textFields) {
      if (body[field] !== undefined) updates[field] = String(body[field]).trim();
    }
    for (const field of SELECTION_TYPE_FIELDS) {
      if (body[field] === "products" || body[field] === "category") updates[field] = body[field];
    }
    for (const field of CATEGORY_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field] ? String(body[field]).trim() : null;
    }
    for (const field of PRODUCT_ID_FIELDS) {
      if (Array.isArray(body[field])) updates[field] = body[field].map((id: any) => Number(id));
    }

    const { data, error } = await supabaseAdmin
      .from("homepage_content")
      .update(updates)
      .eq("id", 1)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ content: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update homepage content" }, { status: 500 });
  }
}
