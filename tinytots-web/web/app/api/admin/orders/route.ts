import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const VALID_STATUS = new Set(["new", "processing", "shipped", "delivered", "cancelled"]);
const PAGE_SIZE_MAX = 50;
const PAGE_SIZE_DEFAULT = 25;

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageOrders");
  if (denied) return denied;

  const sp = request.nextUrl.searchParams;

  const statusRaw = (sp.get("status") || "all").toLowerCase();
  const status = statusRaw === "all" || VALID_STATUS.has(statusRaw) ? statusRaw : "all";

  // Whitelist search input to [A-Za-z0-9 space hyphen] before it ever reaches a
  // PostgREST filter string — no %, _, comma, parens, quotes or operator
  // fragments can survive, so the `.or()` below cannot be broken out of (SEC-04).
  const searchSafe = (sp.get("search") || "")
    .replace(/[^A-Za-z0-9\s-]/g, "")
    .trim()
    .slice(0, 60);

  const pageRaw = parseInt(sp.get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, 100000) : 1;
  const sizeRaw = parseInt(sp.get("pageSize") || String(PAGE_SIZE_DEFAULT), 10);
  const pageSize = Number.isFinite(sizeRaw) && sizeRaw > 0 ? Math.min(sizeRaw, PAGE_SIZE_MAX) : PAGE_SIZE_DEFAULT;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, customer_id, guest_name, guest_phone, shipping_city, status, payment_method, cod_tier, cod_token_amount, cod_token_paid, total, created_at, customers(full_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") query = query.eq("status", status);
  if (searchSafe) {
    query = query.or(
      `order_number.ilike.%${searchSafe}%,guest_name.ilike.%${searchSafe}%,shipping_city.ilike.%${searchSafe}%`
    );
  }

  const { data, error, count } = await query;
  if (error) return apiErrorResponse(error, 500, "admin/orders");

  const rows = (data ?? []).map((o: any) => ({
    ...o,
    customer_name: o.customers?.full_name || o.guest_name || "Guest",
  }));

  return NextResponse.json(
    { data: rows, page, pageSize, total: count ?? rows.length },
    { status: 200 }
  );
}
