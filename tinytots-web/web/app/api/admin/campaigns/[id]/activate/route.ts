import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// POST /api/admin/campaigns/[id]/activate — makes this campaign the one
// live on /signage. Only one campaign is ever active: every other row gets
// deactivated first, then this one is flipped on, in the same request.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;

  const { error: deactivateError } = await supabaseAdmin.from("campaigns").update({ is_active: false }).neq("id", id);
  if (deactivateError) return NextResponse.json({ error: deactivateError.message }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}