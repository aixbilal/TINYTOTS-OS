import { supabase } from "@/lib/supabase";
import ProductDetailInteractive from "@/components/ProductDetailInteractive";
import Link from "next/link";

// Without this, Next.js caches the Supabase data fetch indefinitely, so
// admin changes (new photos, price/stock updates) never show up on the live
// storefront until a full rebuild. Product pages change often enough
// (inventory, pricing, images) that always-fresh is the right tradeoff here.
export const dynamic = "force-dynamic";

async function getProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, name, sku, description, brand, category, image_url,
      variants ( id, color, size, price, web_price, web_base_price, web_discount_percent, stock )
    `
    )
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data;
}

async function getProductImages(id: string) {
  // Embeds product_image_variants so we know which variant(s) each photo
  // belongs to. An image with no linked variants applies to the whole
  // product (pre-existing photos uploaded before this feature existed
  // keep working exactly as before).
  const { data, error } = await supabase
    .from("product_images")
    .select("id, storage_path, is_primary, sort_order, product_image_variants ( variant_id )")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return data.map((img) => ({
    id: img.id,
    is_primary: img.is_primary,
    url: supabase.storage.from("product-images").getPublicUrl(img.storage_path).data.publicUrl,
    variant_ids: (img.product_image_variants || []).map((l: any) => l.variant_id),
  }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, images] = await Promise.all([getProduct(id), getProductImages(id)]);

  if (!product) {
    return (
      <main className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <p className="text-on-surface-variant">Product not found.</p>
        <Link href="/products" className="text-primary hover:underline">
          ← Back to shop
        </Link>
      </main>
    );
  }

  // Fallback for products created before the multi-image gallery existed:
  // if there are no product_images rows but products.image_url is set
  // (legacy path), show that single image instead of "No image".
  const galleryImages =
    images.length > 0
      ? images
      : product.image_url
      ? [{ id: 0, url: product.image_url, is_primary: true, variant_ids: [] }]
      : [];

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <nav className="text-body-sm font-body-sm text-on-surface-variant mb-stack-sm flex items-center gap-2">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <Link href="/products" className="hover:text-primary transition-colors">Shop All</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-[minmax(0,420px)_1fr] gap-gutter">
        <ProductDetailInteractive
          productId={product.id}
          productName={product.name}
          brand={product.brand}
          category={product.category}
          description={product.description}
          variants={product.variants}
          images={galleryImages}
        />
      </div>
    </main>
  );
}