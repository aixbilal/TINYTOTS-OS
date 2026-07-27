import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const [{ data: content, error }, { data: products }] = await Promise.all([
    supabaseAdmin.from("homepage_content").select("*").eq("id", 1).single(),
    supabaseAdmin
      .from("products")
      .select("id, name, image_url")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content, products: products || [] });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  try {
    const body = await req.json();
    const allowedFields = [
      "hero_image_url",
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
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = String(body[field]).trim();
    }
    if (Array.isArray(body.trending_product_ids)) {
      updates.trending_product_ids = body.trending_product_ids.map((id: any) => Number(id));
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