import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const BUCKET = "product-images";
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB, matches bucket config
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function publicUrlFor(storagePath: string) {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// Keeps products.image_url pointing at whichever image is currently primary
// for this product. Called after every insert/delete/set-primary so existing
// code that reads products.image_url directly (storefront PDP, POS
// ProductCard, admin list view) always stays correct without changes there.
async function syncPrimaryImageUrl(productId: string) {
  const { data: primary } = await supabaseAdmin
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId)
    .eq("is_primary", true)
    .maybeSingle();

  const imageUrl = primary ? publicUrlFor(primary.storage_path) : null;

  const { error } = await supabaseAdmin
    .from("products")
    .update({ image_url: imageUrl })
    .eq("id", productId);

  if (error) {
    // This was previously swallowed silently, which is exactly why the
    // image_url mismatch was invisible. Now it'll show in the server
    // terminal (npm run dev) if it happens again.
    console.error(`syncPrimaryImageUrl FAILED for product ${productId}:`, error);
  } else {
    console.log(`syncPrimaryImageUrl OK for product ${productId}: image_url = ${imageUrl}`);
  }
}

// GET /api/admin/products/[id]/images — list all images for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("product_images")
    .select("id, storage_path, is_primary, sort_order, created_at")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withUrls = await Promise.all(
    (data || []).map(async (img) => {
      const { data: links } = await supabaseAdmin
        .from("product_image_variants")
        .select("variant_id")
        .eq("image_id", img.id);
      return {
        ...img,
        url: publicUrlFor(img.storage_path),
        variant_ids: (links || []).map((l) => l.variant_id),
      };
    })
  );

  return NextResponse.json({ data: withUrls }, { status: 200 });
}

// POST /api/admin/products/[id]/images — upload a new image
// Expects multipart/form-data with a "file" field, and optional "is_primary" ("true"/"false")
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { id: productId } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const makePrimary = formData.get("is_primary") === "true";
    // Optional: comma-separated variant ids this image applies to (e.g. all
    // "Sea Green" variants regardless of size). Omit/empty = applies to the
    // whole product (shown for every variant), matching pre-existing images.
    const variantIdsRaw = formData.get("variant_ids") as string | null;
    const variantIds = variantIdsRaw
      ? variantIdsRaw.split(",").map((v) => v.trim()).filter(Boolean)
      : [];

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, or WebP images are allowed" },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    // Verify the product actually exists before writing anything
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const storagePath = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // If this is the first image for the product, or the caller asked for it,
    // make it primary. Unset any existing primary first (DB has a unique
    // index enforcing only one primary per product).
    const { count: existingCount } = await supabaseAdmin
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    const shouldBePrimary = makePrimary || !existingCount;

    if (shouldBePrimary) {
      await supabaseAdmin
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId)
        .eq("is_primary", true);
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("product_images")
      .insert([
        {
          product_id: productId,
          storage_path: storagePath,
          is_primary: shouldBePrimary,
          sort_order: existingCount ?? 0,
        },
      ])
      .select()
      .single();

    if (insertError) {
      // Roll back the uploaded file so we don't leave orphaned storage objects
      await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (shouldBePrimary) {
      await syncPrimaryImageUrl(productId);
    }

    if (variantIds.length > 0) {
      await supabaseAdmin.from("product_image_variants").insert(
        variantIds.map((variantId) => ({ image_id: inserted.id, variant_id: variantId }))
      );
    }

    return NextResponse.json(
      { success: true, data: { ...inserted, url: publicUrlFor(storagePath), variant_ids: variantIds } },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/products/[id]/images crashed:", err);
    return NextResponse.json({ error: err?.message || "Unexpected server error" }, { status: 500 });
  }
}

// PATCH /api/admin/products/[id]/images — set primary image, or reorder
// Body: { image_id, action: "set_primary" } OR { order: [image_id, image_id, ...] }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { id: productId } = await params;

  try {
    const body = await request.json();

    if (body.action === "set_primary" && body.image_id) {
      await supabaseAdmin
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId)
        .eq("is_primary", true);

      const { error } = await supabaseAdmin
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", body.image_id)
        .eq("product_id", productId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await syncPrimaryImageUrl(productId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (Array.isArray(body.order)) {
      // body.order is an array of image ids in the desired display order
      for (let i = 0; i < body.order.length; i++) {
        await supabaseAdmin
          .from("product_images")
          .update({ sort_order: i })
          .eq("id", body.order[i])
          .eq("product_id", productId);
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Provide either { action: 'set_primary', image_id } or { order: [...] }" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/admin/products/[id]/images?image_id=123
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { id: productId } = await params;
  const imageId = request.nextUrl.searchParams.get("image_id");

  if (!imageId) {
    return NextResponse.json({ error: "image_id query param is required" }, { status: 400 });
  }

  const { data: image, error: fetchError } = await supabaseAdmin
    .from("product_images")
    .select("id, storage_path, is_primary")
    .eq("id", imageId)
    .eq("product_id", productId)
    .single();

  if (fetchError || !image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const { error: deleteRowError } = await supabaseAdmin
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (deleteRowError) {
    return NextResponse.json({ error: deleteRowError.message }, { status: 500 });
  }

  // Best-effort storage cleanup — the DB row is already gone either way
  await supabaseAdmin.storage.from(BUCKET).remove([image.storage_path]);

  if (image.is_primary) {
    // Promote the next image (lowest sort_order) to primary, if any remain
    const { data: nextImage } = await supabaseAdmin
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextImage) {
      await supabaseAdmin
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", nextImage.id);
    }

    await syncPrimaryImageUrl(productId);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}