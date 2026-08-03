import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { isBlogCategory, slugifyBlog } from "@/lib/blog-categories";
import { sanitizeRichTextHtml } from "@/lib/sanitize";

function sanitizeContent(html: string): string {
  return sanitizeRichTextHtml(html, { allowImages: true });
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageBlog");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return apiErrorResponse(error, 500, "admin/blog");
  return NextResponse.json({ posts: data });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageBlog");
  if (denied) return denied;

  try {
    const body = await req.json();
    const { title, content, author, featured_image_url, is_published, slug: rawSlug, category } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    if (category != null && category !== "" && !isBlogCategory(category)) {
      return NextResponse.json({ error: "Invalid blog category" }, { status: 400 });
    }

    const cleanContent = sanitizeContent(content);
    let slug = slugifyBlog(typeof rawSlug === "string" && rawSlug.trim() ? rawSlug : title);
    if (!slug) {
      return NextResponse.json({ error: "A valid slug is required" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: `Slug "${slug}" is already in use` }, { status: 409 });
    }

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .insert({
        title: title.trim(),
        slug,
        content: cleanContent,
        author: author?.trim() || null,
        featured_image_url: featured_image_url || null,
        category: category && isBlogCategory(category) ? category : null,
        is_published: !!is_published,
        published_at: is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) return apiErrorResponse(error, 500, "admin/blog");
    return NextResponse.json({ post }, { status: 201 });
  } catch (err: any) {
    return apiErrorResponse(err, 500, "admin/blog");
  }
}
