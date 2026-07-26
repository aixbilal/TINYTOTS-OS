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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const denied = await requireAdmin(req, "canManageInventory");
  if (denied) return denied;

  try {
    const params = await (context.params as any);
    const body = await req.json();
    const updates: Record<string, any> = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ error: "Category name cannot be empty" }, { status: 400 });
      updates.name = name;
      updates.slug = slugify(name);
    }
    if (body.display_order !== undefined) {
      updates.display_order = Number.isFinite(Number(body.display_order)) ? Number(body.display_order) : 0;
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) {
        return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  const denied = await requireAdmin(req, "canManageInventory");
  if (denied) return denied;

  const params = await (context.params as any);

  // Don't allow deleting a category that's still assigned to products —
  // otherwise those products keep a category string that no longer exists
  // anywhere in the admin dropdown, effectively orphaning them silently.
  const { data: category } = await supabaseAdmin
    .from("categories")
    .select("name")
    .eq("id", params.id)
    .single();

  if (category) {
    const { count } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category", category.name);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${count} product(s) still use this category. Reassign them first.` },
        { status: 400 }
      );
    }
  }

  const { error } = await supabaseAdmin.from("categories").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
