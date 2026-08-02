import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { normalizeQuillHtml } from "@/lib/html-text";
import { isHelpCategory, normalizeHelpCategory } from "@/lib/help-categories";
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

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageHelp");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("help_articles")
    .select("*")
    .order("category", { ascending: true })
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ articles: data });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageHelp");
  if (denied) return denied;

  try {
    const body = await req.json();
    const { title, content, category, display_order, is_published } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const categoryRaw = category == null ? "" : String(category).trim();
    if (categoryRaw && !isHelpCategory(categoryRaw)) {
      return NextResponse.json(
        { error: "Invalid category. Choose one of the fixed Help Center categories." },
        { status: 400 }
      );
    }

    const cleanContent = sanitizeContent(content);
    let slug = slugify(title);

    const { data: existing } = await supabaseAdmin
      .from("help_articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) slug = `${slug}-${Date.now()}`;

    const { data: article, error } = await supabaseAdmin
      .from("help_articles")
      .insert({
        title: title.trim(),
        slug,
        content: cleanContent,
        category: normalizeHelpCategory(categoryRaw),
        display_order: Number.isFinite(Number(display_order)) ? Number(display_order) : 0,
        is_published: !!is_published,
        published_at: is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ article }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create article" }, { status: 500 });
  }
}