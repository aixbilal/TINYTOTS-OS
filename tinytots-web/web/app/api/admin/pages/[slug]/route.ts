import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { normalizeQuillHtml } from "@/lib/html-text";
import DOMPurify from "isomorphic-dompurify";

function sanitizeContent(html: string): string {
  return normalizeQuillHtml(
    DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "ul", "ol", "li", "a"],
      ALLOWED_ATTR: ["href", "target", "rel"],
      FORBID_ATTR: ["style", "class", "width", "height"],
    }).replace(/\p{Cf}/gu, "")
  );
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
