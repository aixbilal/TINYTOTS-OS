import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const EDITABLE_FIELDS = [
  "name",
  "is_active",
  "scheduled_at",
  "collection_label",
  "heading",
  "subtitle",
  "description",
  "cta_text",
  "cta_url",
  "cta_visible",
  "hero_mode",
  "hero_banner_image",
  "hero_product_image",
  "hero_badge",
  "lifestyle_image",
  "feature_list",
  "statistics",
  "featured_heading",
  "featured_description",
  "featured_button_text",
  "featured_selection_type",
  "featured_category",
  "featured_product_ids",
  "marquee_speed_seconds",
  "marquee_direction",
  "trust_item_ids",
  "testimonial_ids",
] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  const { data, error } = await supabaseAdmin.from("campaigns").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  return NextResponse.json({ campaign: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  try {
    const body = await req.json();
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of EDITABLE_FIELDS) {
      if (field in body) updates[field] = body[field];
    }

    const { data, error } = await supabaseAdmin
      .from("campaigns")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;

  // Guard against deleting the only live campaign and leaving the TV blank.
  const { data: target } = await supabaseAdmin.from("campaigns").select("is_active").eq("id", id).maybeSingle();
  if (target?.is_active) {
    return NextResponse.json(
      { error: "Can't delete the active campaign — activate a different one first." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}