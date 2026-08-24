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
  "subscribe_image_url",
  "subscribe_headline",
  "subscribe_subtext",
];

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageBlog");
  if (denied) return denied;

  const { data: content, error } = await supabaseAdmin.from("blog_page_content").select("*").eq("id", 1).single();

  if (error) return apiErrorResponse(error, 500, "admin/blog-content");
  return NextResponse.json({ content });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageBlog");
  if (denied) return denied;

  try {
    const body = await req.json();
    const updates: Record<string, string> = {};

    for (const field of TEXT_FIELDS) {
      if (typeof body[field] === "string") updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("blog_page_content")
      .update(updates)
      .eq("id", 1)
      .select()
      .single();

    if (error) return apiErrorResponse(error, 500, "admin/blog-content");
    return NextResponse.json({ content: data });
  } catch (error) {
    return apiErrorResponse(error, 500, "admin/blog-content");
  }
}
