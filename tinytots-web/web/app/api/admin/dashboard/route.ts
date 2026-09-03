import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// No specific permission required — same as the dashboard page itself,
// viewable by any active team member (see admin/layout.tsx's comment on
// unlisted routes). All queries are cheap head-count reads plus one small
// "recent orders" select; no new reporting schema or analytics pipeline.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const [
      { count: activeProducts },
      { count: missingImageProducts },
      { count: orders },
      { count: newOrders },
      { count: processingOrders },
      { count: openComplaints },
      { count: activeCategories },
      { count: blogPosts },
      { count: helpArticles },
      lowStockRes,
      recentRes,
    ] = await Promise.all([
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .or("image_url.is.null,image_url.eq."),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("status", "processing"),
      supabaseAdmin.from("complaints").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabaseAdmin.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabaseAdmin.from("help_articles").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabaseAdmin
        .from("variants")
        .select("product_id, stock, reorder_level, products!inner(is_active)")
        .eq("products.is_active", true),
      supabaseAdmin
        .from("orders")
        .select("order_number, guest_name, status, total, created_at, customers(full_name)")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    // Low-stock = an active product with any variant at/under its reorder
    // level (default 5), mirroring the Products list logic exactly.
    const lowStockProducts = (() => {
      const rows = (lowStockRes.data ?? []) as { product_id: number; stock: number | null; reorder_level: number | null }[];
      const flagged = new Set<number>();
      for (const r of rows) {
        if ((r.stock ?? 0) <= (r.reorder_level ?? 5)) flagged.add(r.product_id);
      }
      return flagged.size;
    })();

    const recentOrders = ((recentRes.data ?? []) as any[]).map((o) => ({
      order_number: o.order_number as string,
      customer: (o.customers?.full_name || o.guest_name || "Guest") as string,
      status: o.status as string,
      total: Number(o.total ?? 0),
      created_at: o.created_at as string,
    }));

    return NextResponse.json({
      counts: {
        activeProducts: activeProducts ?? 0,
        missingImageProducts: missingImageProducts ?? 0,
        orders: orders ?? 0,
        newOrders: newOrders ?? 0,
        processingOrders: processingOrders ?? 0,
        openComplaints: openComplaints ?? 0,
        lowStockProducts,
        activeCategories: activeCategories ?? 0,
        blogPosts: blogPosts ?? 0,
        helpArticles: helpArticles ?? 0,
      },
      recentOrders,
    });
  } catch (err) {
    return apiErrorResponse(err, 500, "admin/dashboard");
  }
}
