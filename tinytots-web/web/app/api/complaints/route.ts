import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const VALID_TYPES = ["return", "product_issue", "delivery_issue", "other"];
const MAX_MESSAGE_LEN = 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_id, order_id, reporter_name, reporter_phone, type, message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Please describe your issue." }, { status: 400 });
    }
    if (message.trim().length > MAX_MESSAGE_LEN) {
      return NextResponse.json(
        { error: `Message must be under ${MAX_MESSAGE_LEN} characters.` },
        { status: 400 }
      );
    }
    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid complaint type." }, { status: 400 });
    }
    if (!customer_id && !reporter_phone) {
      return NextResponse.json(
        { error: "Phone number is required for guest complaints." },
        { status: 400 }
      );
    }

    // If an order_id is given, confirm it actually exists (avoid orphaned/fake references)
    if (order_id) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("id", order_id)
        .single();
      if (!order) {
        return NextResponse.json({ error: "Order not found." }, { status: 400 });
      }
    }

    const { data: complaint, error } = await supabaseAdmin
      .from("complaints")
      .insert({
        customer_id: customer_id ?? null,
        order_id: order_id ?? null,
        reporter_name: reporter_name?.trim() || null,
        reporter_phone: reporter_phone?.trim() || null,
        type: type || "other",
        message: message.trim(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ complaint }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit complaint" },
      { status: 400 }
    );
  }
}