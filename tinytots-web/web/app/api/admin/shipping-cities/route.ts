import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("shipping_cities")
    .select("*")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cities: data });
}

// POST /api/admin/shipping-cities - add a custom city. This is the
// "if a city is missing, the admin can type their own" path — no maps
// lookup, no geocoding, just a plain admin-managed list.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  try {
    const body = await req.json();
    const name = (body.name || "").trim().toLowerCase();

    if (!name) {
      return NextResponse.json({ error: "City name is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("shipping_cities")
      .insert({ name })
      .select()
      .single();

    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) {
        return NextResponse.json({ error: "This city is already in the list" }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ city: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to add city" }, { status: 500 });
  }
}
