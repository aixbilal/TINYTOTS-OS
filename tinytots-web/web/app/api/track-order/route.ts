import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// GET /api/track-order?order_number=ORD-123&phone=03001234567
// Guests have no auth session, so we verify identity by matching
// order_number + phone together, rather than relying on RLS/auth.uid().
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("order_number");
  const phone = searchParams.get("phone");

  if (!orderNumber || !phone) {
    return NextResponse.json(
      { error: "order_number and phone are required" },
      { status: 400 }
    );
  }

  // This endpoint is unauthenticated and returns order details on a
  // (order_number + phone) match. Rate limit both by caller IP (general
  // scraping) and by order_number (brute-forcing one order's phone).
  const ipLimited = await rateLimit(`track-order-ip:${clientIp(request)}`, {
    limit: 15,
    windowMs: 60_000,
  });
  if (!ipLimited.ok) return rateLimitResponse(ipLimited.retryAfterSec);

  const orderLimited = await rateLimit(`track-order-num:${orderNumber}`, {
    limit: 8,
    windowMs: 10 * 60_000,
  });
  if (!orderLimited.ok) return rateLimitResponse(orderLimited.retryAfterSec);

  const phoneDigits = phone.replace(/[\s-]/g, "");

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      order_number,
      status,
      guest_phone,
      payment_method,
      cod_token_amount,
      cod_token_paid,
      total,
      created_at,
      customers ( phone ),
      order_items (
        id,
        quantity,
        unit_price,
        line_total,
        variants (
          size,
          color,
          products ( name )
        )
      )
    `
    )
    .eq("order_number", orderNumber)
    .single();

  // Same response whether the order number doesn't exist or the phone doesn't
  // match, so this endpoint can't be used to probe which order numbers are real.
  if (error || !order) {
    return NextResponse.json(
      { error: "Order not found. Please check your order number and phone." },
      { status: 404 }
    );
  }

  // Verify identity: match phone against the guest phone or the linked
  // customer's phone. `guest_phone` / `customers.phone` are used here only
  // for verification and are NOT included in the response.
  const linkedCustomer = order.customers as unknown as { phone: string | null } | null;
  const registeredPhone = order.guest_phone ?? linkedCustomer?.phone;
  if (!registeredPhone || registeredPhone.replace(/[\s-]/g, "") !== phoneDigits) {
    return NextResponse.json(
      { error: "Order not found. Please check your order number and phone." },
      { status: 404 }
    );
  }

  type TrackOrderItem = {
    id: number;
    quantity: number;
    unit_price: number;
    line_total: number;
    variants: {
      size: string | null;
      color: string | null;
      products: { name: string } | null;
    } | null;
  };

  // Minimal payload — only what the Track Order UI renders. No address, no
  // phone/email, no internal financial breakdown.
  const safe = {
    order_number: order.order_number,
    status: order.status,
    created_at: order.created_at,
    total: order.total,
    payment_method: order.payment_method,
    cod_token_amount: order.cod_token_amount,
    cod_token_paid: order.cod_token_paid,
    order_items: ((order.order_items ?? []) as unknown as TrackOrderItem[]).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
      variants: item.variants
        ? {
            size: item.variants.size,
            color: item.variants.color,
            products: item.variants.products
              ? { name: item.variants.products.name }
              : null,
          }
        : null,
    })),
  };

  return NextResponse.json({ data: safe }, { status: 200 });
}
