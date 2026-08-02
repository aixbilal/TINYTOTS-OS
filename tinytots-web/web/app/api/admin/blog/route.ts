import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { normalizeQuillHtml } from "@/lib/html-text";
import DOMPurify from "isomorphic-dompurify";

// The single, guaranteed gate every blog post's HTML passes through before
// touching the database.
function sanitizeContent(html: string): string {
  return normalizeQuillHtml(
    DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "ul", "ol", "li", "a", "img"],
      ALLOWED_ATTR: ["href", "src", "alt", "target", "rel"],
      FORBID_ATTR: ["style", "class", "width", "height"],
    }).replace(/\p{Cf}/gu, "")
  );
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageBlog");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageBlog");
  if (denied) return denied;

  try {
    const body = await req.json();
    const { title, content, author, featured_image_url, is_published } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const cleanContent = sanitizeContent(content);
    let slug = slugify(title);

    const { data: existing } = await supabaseAdmin
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) slug = `${slug}-${Date.now()}`;

    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .insert({
        title: title.trim(),
        slug,
        content: cleanContent,
        author: author?.trim() || null,
        featured_image_url: featured_image_url || null,
        is_published: !!is_published,
        published_at: is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create post" }, { status: 500 });
  }
}