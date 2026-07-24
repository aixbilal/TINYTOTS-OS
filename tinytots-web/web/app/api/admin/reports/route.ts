import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageOrders");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end are required" }, { status: 400 });
  }

  try {
    // ---- Sales overview ----
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, total, subtotal, discount_total, status, created_at, coupon_code, voucher_id")
      .gte("created_at", start)
      .lte("created_at", end);

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const validOrders = (orders || []).filter((o) => o.status !== "cancelled");
    const revenue = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const orderCount = validOrders.length;
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;
    const totalDiscountGiven = validOrders.reduce((sum, o) => sum + Number(o.discount_total || 0), 0);

    // Orders grouped by day, for a simple daily breakdown table
    const byDay: Record<string, { count: number; revenue: number }> = {};
    for (const o of validOrders) {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { count: 0, revenue: 0 };
      byDay[day].count += 1;
      byDay[day].revenue += Number(o.total);
    }
    const dailyBreakdown = Object.entries(byDay)
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // ---- Coupons ----
    const ordersWithCoupon = validOrders.filter((o) => o.coupon_code);
    const couponUsage: Record<string, { uses: number; discountGiven: number }> = {};
    for (const o of ordersWithCoupon) {
      const code = o.coupon_code as string;
      if (!couponUsage[code]) couponUsage[code] = { uses: 0, discountGiven: 0 };
      couponUsage[code].uses += 1;
      couponUsage[code].discountGiven += Number(o.discount_total || 0);
    }
    const couponBreakdown = Object.entries(couponUsage)
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.uses - a.uses);

    // ---- Vouchers ----
    const { data: vouchersInRange } = await supabaseAdmin
      .from("vouchers")
      .select("id, amount, is_used, source, created_at")
      .gte("created_at", start)
      .lte("created_at", end);

    const vouchersIssued = vouchersInRange?.length || 0;
    const vouchersUsed = vouchersInRange?.filter((v) => v.is_used).length || 0;
    const vouchersBySource: Record<string, number> = {};
    for (const v of vouchersInRange || []) {
      vouchersBySource[v.source] = (vouchersBySource[v.source] || 0) + 1;
    }

    const ordersWithVoucher = validOrders.filter((o) => o.voucher_id);
    const voucherRedeemedValue = ordersWithVoucher.length; // count only; amount is on vouchers table

    // ---- Referrals ----
    const { data: referralsInRange } = await supabaseAdmin
      .from("referrals")
      .select("id, reward_triggered, created_at")
      .gte("created_at", start)
      .lte("created_at", end);

    const referralsCreated = referralsInRange?.length || 0;
    const referralsRewarded = referralsInRange?.filter((r) => r.reward_triggered).length || 0;

    // ---- Products: top sellers ----
    const orderIds = validOrders.map((o) => o.id);
    let topProducts: { product_id: number; name: string; quantity: number; revenue: number }[] = [];

    if (orderIds.length > 0) {
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("variant_id, quantity, line_total, variants(product_id, products(name))")
        .in("order_id", orderIds);

      const productAgg: Record<number, { name: string; quantity: number; revenue: number }> = {};
      for (const item of items || []) {
        const variant = item.variants as any;
        const productId = variant?.product_id;
        const name = variant?.products?.name || "Unknown";
        if (!productId) continue;
        if (!productAgg[productId]) productAgg[productId] = { name, quantity: 0, revenue: 0 };
        productAgg[productId].quantity += item.quantity;
        productAgg[productId].revenue += Number(item.line_total);
      }

      topProducts = Object.entries(productAgg)
        .map(([product_id, v]) => ({ product_id: Number(product_id), ...v }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    }

    // ---- Low stock alert (not time-bound, always current) ----
    const { data: lowStockVariants } = await supabaseAdmin
      .from("variants")
      .select("id, sku, stock, reorder_level, products(name)")
      .filter("stock", "lte", "reorder_level")
      .eq("status", "active")
      .order("stock", { ascending: true })
      .limit(15);

    return NextResponse.json({
      sales: {
        revenue,
        orderCount,
        avgOrderValue,
        totalDiscountGiven,
        dailyBreakdown,
      },
      coupons: {
        totalUses: ordersWithCoupon.length,
        totalDiscountGiven: couponBreakdown.reduce((s, c) => s + c.discountGiven, 0),
        breakdown: couponBreakdown,
      },
      vouchers: {
        issued: vouchersIssued,
        used: vouchersUsed,
        redeemedInOrders: voucherRedeemedValue,
        bySource: vouchersBySource,
      },
      referrals: {
        created: referralsCreated,
        rewarded: referralsRewarded,
      },
      products: {
        topSellers: topProducts,
      },
      lowStock: lowStockVariants || [],
    });
  } catch (err: any) {
    console.error("Reports API error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate report" }, { status: 500 });
  }
}