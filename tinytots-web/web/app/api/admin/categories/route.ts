import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// GET /api/admin/categories - list all categories (admin view, unfiltered)
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageInventory");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}

// POST /api/admin/categories - create a new category
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageInventory");
  if (denied) return denied;

  try {
    const body = await req.json();
    const name = (body.name || "").trim();
    const display_order = Number.isFinite(Number(body.display_order)) ? Number(body.display_order) : 0;

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert({ name, slug: slugify(name), display_order })
      .select()
      .single();

    if (error) {
      // Unique violation on name → friendlier message than the raw Postgres error
      if (error.message.toLowerCase().includes("duplicate")) {
        return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create category" }, { status: 500 });
  }
}
