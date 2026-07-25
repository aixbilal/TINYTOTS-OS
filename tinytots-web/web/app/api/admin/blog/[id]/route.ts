import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import DOMPurify from "isomorphic-dompurify";

function sanitizeContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "ul", "ol", "li", "a", "img"],
    ALLOWED_ATTR: ["href", "src", "alt", "target", "rel"],
    FORBID_ATTR: ["style", "class", "width", "height"],
  }).replace(/\p{Cf}/gu, "");
}
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const denied = await requireAdmin(req, "canManageBlog");
  if (denied) return denied;

  const params = await (context.params as any);
  const { data: post, error } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const denied = await requireAdmin(req, "canManageBlog");
  if (denied) return denied;

  try {
    const params = await (context.params as any);
    const body = await req.json();
    const { title, content, author, featured_image_url, is_published } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = sanitizeContent(content);
    if (author !== undefined) updates.author = author?.trim() || null;
    if (featured_image_url !== undefined) updates.featured_image_url = featured_image_url || null;
    if (is_published !== undefined) {
      updates.is_published = !!is_published;
      if (is_published) {
        const { data: current } = await supabaseAdmin
          .from("blog_posts")
          .select("published_at")
          .eq("id", params.id)
          .single();
        updates.published_at = current?.published_at || new Date().toISOString();
      } else {
        updates.published_at = null;
      }
    }

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const denied = await requireAdmin(req, "canManageBlog");
  if (denied) return denied;

  const params = await (context.params as any);
  const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}