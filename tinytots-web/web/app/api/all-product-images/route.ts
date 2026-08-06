import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Returns a flat list of every image URL used by active products —
 * both the main product-listing image (products.image_url) and every
 * gallery image (product_images.storage_path) — so the offline cache
 * warmer can fetch and store them all while the customer is still on
 * the homepage, instead of waiting for them to click into each product.
 *
 * Read-only, public data (same info already visible on the storefront),
 * so no auth check needed — matches the public SELECT RLS policy
 * already in place on `products` and `product_images`.
 */
export async function GET() {
    const supabase = supabaseAdmin;

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, image_url")
    .eq("is_active", true);

  if (productsError) {
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }

  const { data: galleryImages, error: imagesError } = await supabase
    .from("product_images")
    .select("product_id, storage_path");

  if (imagesError) {
    return NextResponse.json(
      { error: "Failed to load product images" },
      { status: 500 }
    );
  }

  const SUPABASE_STORAGE_BASE =
    process.env.NEXT_PUBLIC_SUPABASE_URL +
    "/storage/v1/object/public/product-images/";

  const urls = new Set<string>();

  // Main listing image — already a full URL in the products table
  for (const p of products ?? []) {
    if (p.image_url) urls.add(p.image_url);
  }

  // Gallery images — stored as a relative path, needs the storage
  // base prepended to become a real fetchable URL
  for (const img of galleryImages ?? []) {
    if (img.storage_path) {
      urls.add(SUPABASE_STORAGE_BASE + img.storage_path);
    }
  }

  return NextResponse.json({ urls: Array.from(urls) });
}