import { supabase } from "@/lib/supabase";
import ProductDetailInteractive from "@/components/ProductDetailInteractive";
import ProductCarouselTabs from "@/components/ProductCarouselTabs";
import { getRelatedProductsForPdp } from "@/lib/related-products";
import { getShopMoreCategories } from "@/lib/shop-more-categories";
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
      id, name, sku, description, brand, category, image_url, related_product_ids,
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
  const [relatedProducts, shopMoreCategories] = product
    ? await Promise.all([
        getRelatedProductsForPdp(
          product.id,
          product.category,
          product.related_product_ids as number[] | null
        ),
        getShopMoreCategories(product.category, 4),
      ])
    : [[], []];

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

      {relatedProducts.length > 0 && (
        <section className="mt-stack-lg">
          <ProductCarouselTabs
            layout="scroll"
            tabs={[{ key: "related", label: "You May Also Like", products: relatedProducts as any }]}
          />
        </section>
      )}

      {shopMoreCategories.length > 0 && (
        <section className="mt-stack-lg">
          <h2 className="font-headline-lg text-on-surface mb-stack-md">Shop More</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-bento-gap">
            {shopMoreCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collections/${cat.slug}`}
                className="relative aspect-[4/5] md:aspect-square rounded-[16px] overflow-hidden border border-outline-variant/30 group cursor-pointer min-h-[140px]"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center w-full h-full transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${cat.image_url}')` }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <h3 className="font-headline-md text-headline-md text-white mb-1">{cat.name}</h3>
                  <span className="text-white flex items-center font-body-sm text-body-sm group-hover:underline">
                    Shop Now <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
