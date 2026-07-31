import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("variants")
    .select("*, products(name, sku, cost_price, selling_price, is_active)");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 200 });
}