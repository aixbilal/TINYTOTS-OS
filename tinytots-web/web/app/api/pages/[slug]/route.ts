import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/pages/[slug] — public, read-only. Used by About Us, Privacy
// Policy, Terms, Shipping & Returns Policy pages.
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> } | { params: { slug: string } }
) {
  const params = await (context.params as any);

  const { data: page, error } = await supabaseAdmin
    .from("site_pages")
    .select("slug, title, content, updated_at")
    .eq("slug", params.slug)
    .single();

  if (error || !page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({ page });
}
