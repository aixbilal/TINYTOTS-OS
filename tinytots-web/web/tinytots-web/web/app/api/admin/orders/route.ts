import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  let query = supabaseAdmin
    .from("orders")
    .select("id, order_number, customer_id, guest_name, guest_phone, shipping_city, status, payment_method, cod_tier, cod_token_amount, cod_token_paid, total, created_at")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 200 });
}