import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

/** POST { order: number[] } — set rotation_order for the live queue. */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  let body: { order?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const order = Array.isArray(body.order)
    ? body.order.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0)
    : [];

  if (!order.length) {
    return NextResponse.json({ error: "order must be a non-empty array of campaign ids" }, { status: 400 });
  }

  const now = new Date().toISOString();
  await Promise.all(
    order.map((id, index) =>
      supabaseAdmin
        .from("campaigns")
        .update({ rotation_order: index, updated_at: now })
        .eq("id", id)
        .eq("is_active", true)
    )
  );

  return NextResponse.json({ success: true });
}
