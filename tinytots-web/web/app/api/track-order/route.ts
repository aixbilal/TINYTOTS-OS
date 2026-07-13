import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

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

  const phoneDigits = phone.replace(/[\s-]/g, "");

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      guest_name,
      guest_phone,
      shipping_address,
      shipping_city,
      payment_method,
      cod_tier,
      cod_token_amount,
      cod_token_paid,
      subtotal,
      delivery_fee,
      discount_total,
      total,
      created_at,
      updated_at,
      customer_id,
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

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Match phone against either the guest phone or the linked customer's phone
  const registeredPhone = order.guest_phone ?? (order.customers as any)?.phone;
  if (!registeredPhone || registeredPhone.replace(/[\s-]/g, "") !== phoneDigits) {
    return NextResponse.json(
      { error: "Order not found. Please check your order number and phone." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: order }, { status: 200 });
}