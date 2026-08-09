import { NextRequest, NextResponse } from "next/server";
import { verifyMetaAgentAuth } from "@/lib/meta-agent/auth";
import { getMetaAgentSupabaseClient } from "@/lib/meta-agent/supabase";

export async function GET(request: NextRequest) {
  const authError = verifyMetaAgentAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("order_id"); // maps to orders.order_number
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");

    if (!orderNumber && !phone && !email) {
      return NextResponse.json(
        { success: false, error: "Provide order_id, phone, or email" },
        { status: 400 }
      );
    }

    const supabase = getMetaAgentSupabaseClient();

    let query = supabase
      .from("orders")
      .select(
        `
        order_number,
        status,
        guest_phone,
        guest_name,
        total,
        created_at,
        updated_at,
        customer:customers ( phone, email, full_name )
      `
      )
      .limit(5)
      .order("created_at", { ascending: false });

    if (orderNumber) {
      query = query.eq("order_number", orderNumber);
    } else if (phone) {
      // Match either a guest order phone or a linked customer's phone
      query = query.or(`guest_phone.eq.${phone}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Order Status API Supabase error:", error.message);
      return NextResponse.json(
        { success: false, error: "Unable to fetch order status" },
        { status: 500 }
      );
    }

    let results = data ?? [];

    // Email filtering happens in JS since it's on the joined customer record
    if (email) {
      results = results.filter(
        (order: any) => order.customer?.email?.toLowerCase() === email.toLowerCase()
      );
    }

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const formatted = results.map((order: any) => ({
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