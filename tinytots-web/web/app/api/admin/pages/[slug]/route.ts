import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { sanitizeRichTextHtml } from "@/lib/sanitize";

function sanitizeContent(html: string): string {
  return sanitizeRichTextHtml(html);
}

// GET /api/admin/pages/[slug] — fetch one page for editing
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> } | { params: { slug: string } }
) {
  const denied = await requireAdmin(req, "canManagePages");
  if (denied) return denied;

  const params = await (context.params as any);
  const { data: page, error } = await supabaseAdmin
    .from("site_pages")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  return NextResponse.json({ page });
}

// PATCH /api/admin/pages/[slug] — update title/content. Pages are a fixed
// set (seeded by migration), so this only ever updates an existing row —
// no create/delete, deliberately, to keep footer links always valid.
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> } | { params: { slug: string } }
) {
  const denied = await requireAdmin(req, "canManagePages");
  if (denied) return denied;

  try {
    const params = await (context.params as any);
    const body = await req.json();
    const { title, content } = body;

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = sanitizeContent(content);

    const { data: page, error } = await supabaseAdmin
      .from("site_pages")
      .update(updates)
      .eq("slug", params.slug)
      .select()
      .single();

    if (error) return apiErrorResponse(error, 500, "admin/pages/[slug]");
    return NextResponse.json({ page });
  } catch (err: any) {
    return apiErrorResponse(err, 500, "admin/pages/[slug]");
  }
}
