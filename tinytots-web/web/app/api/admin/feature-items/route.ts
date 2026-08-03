import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("feature_items")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return apiErrorResponse(error, 500, "admin/feature-items");
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  try {
    const body = await req.json();
    const { count } = await supabaseAdmin.from("feature_items").select("id", { count: "exact", head: true });

    const { data, error } = await supabaseAdmin
      .from("feature_items")
      .insert({
        icon: body.icon || "eco",
        label: body.label || "",
        sort_order: count ?? 0,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) return apiErrorResponse(error, 500, "admin/feature-items");
    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
