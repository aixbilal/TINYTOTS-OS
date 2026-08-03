import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/admin/trust-items — every trust item (active or not), so the
// admin can toggle visibility on the pre-seeded suggestions without them
// disappearing from the list.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin.from("trust_items").select("*").order("sort_order", { ascending: true });
  if (error) return apiErrorResponse(error, 500, "admin/trust-items");
  return NextResponse.json({ items: data || [] });
}

// POST /api/admin/trust-items — create a new trust item, appended to the end.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  try {
    const body = await req.json();
    const { count } = await supabaseAdmin.from("trust_items").select("id", { count: "exact", head: true });

    const { data, error } = await supabaseAdmin
      .from("trust_items")
      .insert({
        icon: body.icon || "verified",
        heading: body.heading || "",
        description: body.description || "",
        sort_order: count ?? 0,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) return apiErrorResponse(error, 500, "admin/trust-items");
    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}