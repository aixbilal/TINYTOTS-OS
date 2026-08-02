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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const denied = await requireAdmin(req, "canManageHelp");
  if (denied) return denied;

  const params = await (context.params as any);
  const { data: article, error } = await supabaseAdmin
    .from("help_articles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
  return NextResponse.json({ article });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const denied = await requireAdmin(req, "canManageHelp");
  if (denied) return denied;

  try {
    const params = await (context.params as any);
    const body = await req.json();
    const { title, content, category, display_order, is_published } = body;

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = sanitizeContent(content);
    if (category !== undefined) updates.category = category?.trim() || "general";
    if (display_order !== undefined) {
      updates.display_order = Number.isFinite(Number(display_order)) ? Number(display_order) : 0;
    }
    if (is_published !== undefined) {
      updates.is_published = !!is_published;
      if (is_published) {
        const { data: current } = await supabaseAdmin
          .from("help_articles")
          .select("published_at")
          .eq("id", params.id)
          .single();
        updates.published_at = current?.published_at || new Date().toISOString();
      } else {
        updates.published_at = null;
      }
    }

    const { data: article, error } = await supabaseAdmin
      .from("help_articles")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ article });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const denied = await requireAdmin(req, "canManageHelp");
  if (denied) return denied;

  const params = await (context.params as any);
  const { error } = await supabaseAdmin.from("help_articles").delete().eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}