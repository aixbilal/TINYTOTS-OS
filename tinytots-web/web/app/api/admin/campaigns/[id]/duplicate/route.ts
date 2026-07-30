import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// POST /api/admin/campaigns/[id]/duplicate — clones every field onto a new
// row named "<original> (Copy)", always inactive so duplicating never
// disrupts what's currently live on the TV.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;

  const { data: original, error: fetchError } = await supabaseAdmin.from("campaigns").select("*").eq("id", id).maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!original) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const { id: _omitId, created_at: _omitCreated, updated_at: _omitUpdated, ...rest } = original;

  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .insert({ ...rest, name: `${original.name} (Copy)`, is_active: false })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}