import { supabase } from "@/lib/supabase";
import AddToCart from "@/components/AddToCart";
import ProductGallery from "@/components/ProductGallery";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";

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
  const { data, error } = await supabase
    .from("product_images")
    .select("id, storage_path, is_primary, sort_order")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return data.map((img) => ({
    id: img.id,
    is_primary: img.is_primary,
    url: supabase.storage.from("product-images").getPublicUrl(img.storage_path).data.publicUrl,
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
      ? [{ id: 0, url: product.image_url, is_primary: true }]
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
        <div className="min-w-0">
          <ProductGallery images={galleryImages} productName={product.name} />
        </div>

        <div className="min-w-0">
          <h1 className="font-display-md text-display-md text-on-surface break-words">{product.name}</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {product.brand} {product.category ? `· ${product.category}` : ""}
          </p>
          {product.description && (
            <div
              className="font-body-md text-body-md text-on-surface-variant mt-4 prose prose-sm max-w-none break-words [overflow-wrap:anywhere]"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
            />
          )}

          <AddToCart
            productId={product.id}
            productName={product.name}
            variants={product.variants}
          />
        </div>
      </div>
    </main>
  );
}