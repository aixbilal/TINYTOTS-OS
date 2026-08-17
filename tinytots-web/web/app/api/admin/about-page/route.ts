import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const TEXT_FIELDS = [
  "hero_image_url",
  "hero_image_url_mobile",
  "hero_eyebrow",
  "hero_headline",
  "hero_subtext",
  "quote_text",
  "quote_attribution",
  "body_paragraph_1",
  "body_paragraph_2",
  "body_paragraph_3",
  "section2_eyebrow",
  "section2_headline",
  "section2_body",
  "section2_image_url",
  "section2_signature",
  "section4_eyebrow",
  "cta_image_url",
  "cta_heading",
  "cta_button_text",
  "cta_button_link",
];

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManagePages");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin.from("about_page_content").select("*").eq("id", 1).single();
  if (error) return apiErrorResponse(error, 500, "admin/about-page");
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

    if (error) return apiErrorResponse(error, 500, "admin/about-page");
    return NextResponse.json({ content: data });
  } catch (err: any) {
    return apiErrorResponse(err, 500, "admin/about-page");
  }
}
