import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("products")
    .select(`
      id, name, sku, description, brand, category, image_url, gender, age_bracket, is_active,
      variants ( id, color, size, price, stock, reorder_level, web_price_locked, web_round_to )
    `)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json({ data }, { status: 200 });
}