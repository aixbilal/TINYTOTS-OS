import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  try {
    const body = await req.json();
    const order: number[] = Array.isArray(body.order) ? body.order : [];
    if (!order.length) return NextResponse.json({ error: "order must be a non-empty array" }, { status: 400 });

    await Promise.all(
      order.map((id, i) => supabaseAdmin.from("feature_items").update({ sort_order: i }).eq("id", id))
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
