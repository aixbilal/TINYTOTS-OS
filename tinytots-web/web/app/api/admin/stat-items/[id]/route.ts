import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const EDITABLE_FIELDS = ["icon", "value", "label", "is_active", "sort_order"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) updates[field] = body[field];
    }

    const { data, error } = await supabaseAdmin
      .from("stat_items")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  const { error } = await supabaseAdmin.from("stat_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const statItemId = Number(id);
  const { data: campaigns } = await supabaseAdmin
    .from("campaigns")
    .select("id, stat_item_ids")
    .contains("stat_item_ids", [statItemId]);
  await Promise.all(
    (campaigns || []).map((campaign) =>
      supabaseAdmin
        .from("campaigns")
        .update({
          stat_item_ids: (campaign.stat_item_ids || []).filter((itemId: number) => itemId !== statItemId),
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id)
    )
  );

  return NextResponse.json({ success: true });
}
