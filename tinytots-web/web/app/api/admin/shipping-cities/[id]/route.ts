import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const params = await (context.params as any);
  const { error } = await supabaseAdmin.from("shipping_cities").delete().eq("id", params.id);

  if (error) return apiErrorResponse(error, 500, "admin/shipping-cities/[id]");
  return NextResponse.json({ success: true });
}
