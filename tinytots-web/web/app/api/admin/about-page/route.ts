import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const TEXT_FIELDS = [
  "hero_image_url",
  "hero_headline",
  "quote_text",
  "quote_attribution",
  "body_paragraph_1",
  "body_paragraph_2",
  "body_paragraph_3",
  "cta_image_url",
  "cta_heading",
  "cta_button_text",
  "cta_button_link",
];

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManagePages");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin.from("about_page_content").select("*").eq("id", 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: data });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canManagePages");
  if (denied) return denied;

  try {
    const body = await req.json();
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    for (const field of TEXT_FIELDS) {
      if (body[field] !== undefined) updates[field] = String(body[field]);
    }
    if (Array.isArray(body.pillars)) {
      updates.pillars = body.pillars
        .filter((p: any) => p && typeof p === "object")
        .map((p: any) => ({
          icon: String(p.icon || "star").trim(),
          title: String(p.title || "").trim(),
          body: String(p.body || "").trim(),
        }));
    }

    const { data, error } = await supabaseAdmin
      .from("about_page_content")
      .update(updates)
      .eq("id", 1)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ content: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update about page content" }, { status: 500 });
  }
}
