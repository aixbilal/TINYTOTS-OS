import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// No specific permission required — same as the dashboard page itself,
// viewable by any active team member (see admin/layout.tsx's comment on
// unlisted routes). Counts are cheap head-count queries only, no new
// reporting schema or analytics pipeline.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const [
      { count: activeProducts },
      { count: missingImageProducts },
      { count: orders },
      { count: activeCategories },
      { count: blogPosts },
      { count: helpArticles },
    ] = await Promise.all([
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .or("image_url.is.null,image_url.eq."),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabaseAdmin.from("help_articles").select("id", { count: "exact", head: true }).eq("is_published", true),
    ]);

    return NextResponse.json({
      counts: {
        activeProducts: activeProducts ?? 0,
        missingImageProducts: missingImageProducts ?? 0,
        orders: orders ?? 0,
        activeCategories: activeCategories ?? 0,
        blogPosts: blogPosts ?? 0,
        helpArticles: helpArticles ?? 0,
      },
    });
  } catch (err) {
    return apiErrorResponse(err, 500, "admin/dashboard");
  }
}
