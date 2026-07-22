import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// GET — list all products (id, name, category) for use in pickers like the discount tool
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageDiscounts");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name, category")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 200 });
}