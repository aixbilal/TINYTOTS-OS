import { NextRequest, NextResponse } from "next/server";
import { verifyMetaAgentAuth } from "@/lib/meta-agent/auth";
import { getMetaAgentSupabaseClient } from "@/lib/meta-agent/supabase";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { normalizePakPhone } from "@/lib/validate-phone";

const ORDER_SELECT = `
  order_number,
  status,
  guest_phone,
  guest_name,
  total,
  created_at,
  updated_at,
  customer:customers ( phone, email, full_name )
`;

type OrderStatusRow = {
  order_number: string;
  status: string;
  guest_phone: string | null;
  guest_name: string | null;
  total: number | null;
  created_at: string;
  updated_at: string;
  customer: { phone: string | null; email: string | null; full_name: string | null } | null;
};

export async function GET(request: NextRequest) {
  const authError = verifyMetaAgentAuth(request);
  if (authError) return authError;

  const limited = await rateLimit(`meta-order-status:${clientIp(request)}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("order_id"); // maps to orders.order_number
    const rawPhone = searchParams.get("phone");
    const email = searchParams.get("email");

    if (!orderNumber && !rawPhone && !email) {
      return NextResponse.json(
        { success: false, error: "Provide order_id, phone, or email" },
        { status: 400 }
      );
    }

    const supabase = getMetaAgentSupabaseClient();

    // Collect matching orders through TYPED filters only — never interpolate a
    // caller value into a PostgREST filter-expression string.
    const byNumber = new Map<string, OrderStatusRow>();

    if (orderNumber) {
      if (typeof orderNumber !== "string" || orderNumber.length > 64) {
        return NextResponse.json(
          { success: false, error: "Invalid order_id" },
          { status: 400 }
        );
      }
      const { data, error } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("order_number", orderNumber)
        .limit(5)
        .order("created_at", { ascending: false });
      if (error) throw error;
      for (const o of (data ?? []) as unknown as OrderStatusRow[]) byNumber.set(o.order_number, o);
    } else if (rawPhone) {
      const phone = normalizePakPhone(rawPhone);
      if (!phone) {
        return NextResponse.json(
          { success: false, error: "Enter a valid Pakistani mobile number, e.g. 03001234567." },
          { status: 400 }
        );
      }

      // Guest orders placed with this phone.
      const guestQuery = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("guest_phone", phone)
        .limit(5)
        .order("created_at", { ascending: false });
      if (guestQuery.error) throw guestQuery.error;
      for (const o of (guestQuery.data ?? []) as unknown as OrderStatusRow[]) byNumber.set(o.order_number, o);

      // Orders linked to a customer whose profile phone matches.
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();
      if (customer?.id) {
        const custQuery = await supabase
          .from("orders")
          .select(ORDER_SELECT)
          .eq("customer_id", customer.id)
          .limit(5)
          .order("created_at", { ascending: false });
        if (custQuery.error) throw custQuery.error;
        for (const o of (custQuery.data ?? []) as unknown as OrderStatusRow[]) byNumber.set(o.order_number, o);
      }
    } else if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .ilike("email", normalizedEmail)
        .maybeSingle();
      if (customer?.id) {
        const custQuery = await supabase
          .from("orders")
          .select(ORDER_SELECT)
          .eq("customer_id", customer.id)
          .limit(5)
          .order("created_at", { ascending: false });
        if (custQuery.error) throw custQuery.error;
        for (const o of (custQuery.data ?? []) as unknown as OrderStatusRow[]) byNumber.set(o.order_number, o);
      }
    }

    const results = Array.from(byNumber.values())
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const formatted = results.map((order) => ({
      order_id: order.order_number,
      status: order.status,
      customer_name: order.guest_name ?? order.customer?.full_name ?? null,
      total: order.total,
      placed_at: order.created_at,
      last_updated: order.updated_at,
    }));

    return NextResponse.json({
      success: true,
      order: formatted.length === 1 ? formatted[0] : formatted,
    });
  } catch (err) {
    console.error("Order Status API unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
