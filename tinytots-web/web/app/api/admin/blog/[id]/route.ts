import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { isBlogCategory, slugifyBlog } from "@/lib/blog-categories";
import { sanitizeRichTextHtml } from "@/lib/sanitize";

function sanitizeContent(html: string): string {
  return sanitizeRichTextHtml(html, { allowImages: true });
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
    const { title, content, author, featured_image_url, is_published, slug: rawSlug, category, is_featured, is_popular } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = sanitizeContent(content);
    if (author !== undefined) updates.author = author?.trim() || null;
    if (featured_image_url !== undefined) updates.featured_image_url = featured_image_url || null;
    if (category !== undefined) {
      if (category === null || category === "") {
        updates.category = null;
      } else if (!isBlogCategory(category)) {
        return NextResponse.json({ error: "Invalid blog category" }, { status: 400 });
      } else {
        updates.category = category;
      }
    }
    if (rawSlug !== undefined) {
      const slug = slugifyBlog(String(rawSlug || ""));
      if (!slug) {
        return NextResponse.json({ error: "A valid slug is required" }, { status: 400 });
      }
      const { data: existing } = await supabaseAdmin
        .from("blog_posts")
        .select("id")
        .eq("slug", slug)
        .neq("id", params.id)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ error: `Slug "${slug}" is already in use` }, { status: 409 });
      }
      updates.slug = slug;
    }
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
    if (is_featured !== undefined) updates.is_featured = !!is_featured;
    if (is_popular !== undefined) updates.is_popular = !!is_popular;

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return apiErrorResponse(error, 500, "admin/blog/[id]");
    return NextResponse.json({ post });
  } catch (err: any) {
    return apiErrorResponse(err, 500, "admin/blog/[id]");
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

  if (error) return apiErrorResponse(error, 500, "admin/blog/[id]");
  return NextResponse.json({ success: true });
}
