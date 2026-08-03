import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const EDITABLE_FIELDS = ["icon", "heading", "description", "is_active", "sort_order"] as const;

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

    const { data, error } = await supabaseAdmin.from("trust_items").update(updates).eq("id", id).select("*").single();
    if (error) return apiErrorResponse(error, 500, "admin/trust-items/[id]");
    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  const { error } = await supabaseAdmin.from("trust_items").delete().eq("id", id);
  if (error) return apiErrorResponse(error, 500, "admin/trust-items/[id]");

  const trustItemId = Number(id);
  const { data: campaigns } = await supabaseAdmin
    .from("campaigns")
    .select("id, trust_item_ids")
    .contains("trust_item_ids", [trustItemId]);
  await Promise.all(
    (campaigns || []).map((campaign) =>
      supabaseAdmin
        .from("campaigns")
        .update({
          trust_item_ids: campaign.trust_item_ids.filter((itemId: number) => itemId !== trustItemId),
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id)
    )
  );

  return NextResponse.json({ success: true });
}