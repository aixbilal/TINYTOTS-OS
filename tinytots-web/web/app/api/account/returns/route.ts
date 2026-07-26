import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Agent, setGlobalDispatcher } from "undici";

setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/account/returns — the logged-in customer's own return/complaint
// history. Session-checked here (not requireAdmin) since this is a
// customer-facing route, not an admin one.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);

  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("auth_user_id", userData.user.id)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Customer record not found" }, { status: 404 });
  }

  const { data: complaints, error } = await supabaseAdmin
    .from("complaints")
    .select("id, type, message, status, photo_url, order_item_ids, created_at, order:orders(id, order_number)")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ complaints });
}