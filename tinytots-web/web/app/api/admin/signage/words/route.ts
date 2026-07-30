import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/admin/signage/words — full ordered list (including inactive,
// unlike the public /api/signage endpoint).
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("signage_marquee_words")
    .select("id, word, sort_order, is_active")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ words: data || [] });
}

// PATCH /api/admin/signage/words — replaces the entire word list in one go
// (delete-all-then-insert), body: { words: string[] }. Simplest possible
// admin UX for a short revolving list — no per-row id bookkeeping needed.
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  try {
    const body = await req.json();
    const words: string[] = Array.isArray(body.words)
      ? body.words.map((w: any) => String(w).trim()).filter((w: string) => w.length > 0)
      : [];

    if (words.length === 0) {
      return NextResponse.json({ error: "At least one word is required" }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin.from("signage_marquee_words").delete().gte("id", 0);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    const rows = words.map((word, i) => ({ word, sort_order: i, is_active: true }));
    const { data, error: insertError } = await supabaseAdmin.from("signage_marquee_words").insert(rows).select("id, word, sort_order, is_active");

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json({ words: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}