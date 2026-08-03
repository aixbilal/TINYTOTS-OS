import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { normalizeSignageProductBadge } from "@/lib/signage-campaign";
import { normalizeQuillHtml } from "@/lib/html-text";

// GET /api/products/[id]
// Returns one product with all its variants.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      sku,
      description,
      brand,
      category,
      image_url,
      gender,
      age_bracket,
      variants (
        id,
        color,
        size,
        price,
        stock
      )
    `
    )
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data: product }, { status: 200 });
}

// PUT /api/products/[id] — update product core fields (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { id } = await params;
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    const scalarKeys = [
      "name",
      "sku",
      "description",
      "brand",
      "category",
      "image_url",
      "gender",
      "age_bracket",
      "is_active",
    ] as const;
    for (const key of scalarKeys) {
      if (key in body) updates[key] = body[key];
    }
    if ("name" in updates) {
      const name = typeof updates.name === "string" ? updates.name.trim() : "";
      if (!name) {
        return NextResponse.json({ error: "Name is required." }, { status: 400 });
      }
      updates.name = name;
    }
    if ("sku" in updates) {
      const sku = typeof updates.sku === "string" ? updates.sku.trim() : "";
      if (!sku) {
        return NextResponse.json({ error: "SKU is required." }, { status: 400 });
      }
      updates.sku = sku;
    }
    if ("category" in updates) {
      const category = typeof updates.category === "string" ? updates.category.trim() : "";
      if (!category) {
        return NextResponse.json({ error: "Please select a category." }, { status: 400 });
      }
      const { data: categoryRow } = await supabaseAdmin
        .from("categories")
        .select("name")
        .eq("name", category)
        .maybeSingle();
      if (!categoryRow) {
        return NextResponse.json(
          { error: "Invalid category. Choose a category from the list." },
          { status: 400 }
        );
      }
      updates.category = category;
    }
    if (typeof updates.description === "string" && updates.description !== "") {
      updates.description = normalizeQuillHtml(updates.description);
    }
    if (Array.isArray(body.related_product_ids)) {
      updates.related_product_ids = body.related_product_ids
        .map((id: unknown) => Number(id))
        .filter((id: number) => Number.isFinite(id) && id > 0);
    }

    if ("signage_badge" in body) {
      if (body.signage_badge === null || body.signage_badge === "") {
        updates.signage_badge = null;
      } else {
        const normalizedBadge = normalizeSignageProductBadge(body.signage_badge);
        if (!normalizedBadge) {
          return NextResponse.json({ error: "signage_badge must be a non-empty string" }, { status: 400 });
        }
        updates.signage_badge = normalizedBadge;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

// DELETE /api/products/[id] — soft delete (sets is_active = false, keeps order history intact)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("products")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}