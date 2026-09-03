import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";
import ProductDetailInteractive from "@/components/ProductDetailInteractive";
import ProductCarouselTabs from "@/components/ProductCarouselTabs";
import { getRelatedProductsForPdp } from "@/lib/related-products";
import { getShopMoreCategories } from "@/lib/shop-more-categories";
import { htmlToPlainText } from "@/lib/html-text";
import { sanitizeContentHtml } from "@/lib/sanitize";
import { jsonLdScriptString } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site-url";
import { pageMetadata, breadcrumbJsonLd, NOINDEX_NOFOLLOW, SITE_NAME, orgId } from "@/lib/seo";
import Link from "next/link";
import InternalTrustStrip from "@/components/InternalTrustStrip";

// Static-generate top product IDs at build time, then ISR-revalidate every
// 60s — same trade-off already used on the homepage (app/page.tsx). Removes
// the live Supabase round-trip on every request without losing freshness
// beyond a 60s window.
export const revalidate = 60;

export async function generateStaticParams() {
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(200); // cap build time; remaining products still render on-demand + cache via revalidate

  return (data || []).map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: product } = await supabase
    .from("products")
    .select("name, description, brand, category, image_url")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) {
    return { title: "Product not found", robots: NOINDEX_NOFOLLOW };
  }

  const name = (product.name || "").trim();
  const fromDescription = htmlToPlainText(product.description || "", 200)
    .replace(/^(ABOUT THE PRODUCT|WHY YOU'LL LOVE IT|QUICK DETAILS|HOW TO STYLE IT)\s*/i, "")
    .slice(0, 155)
    .trim();
  const fallback = [product.brand, product.category, "kids clothing from TinyTots"]
    .filter(Boolean)
    .join(" · ");
  const description = fromDescription || fallback;
  const title = `${name} | TinyTots`;

  let imageUrl = product.image_url || "";
  if (!imageUrl) {
    const { data: primary } = await supabase
      .from("product_images")
      .select("storage_path")
      .eq("product_id", id)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (primary?.storage_path) {
      imageUrl = supabase.storage
        .from("product-images")
        .getPublicUrl(primary.storage_path).data.publicUrl;
    }
  }

  // absolute title: the parent /products layout also sets a title; without
  // absolute, Next can omit the root `%s | TinyTots` template on this segment.
  return pageMetadata({
    absoluteTitle: title,
    description,
    path: `/products/${id}`,
    ogType: "website",
    image: imageUrl || null,
    imageAlt: name,
  });
}

async function getProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, name, sku, description, brand, category, image_url, related_product_ids, created_at,
      variants ( id, color, color_hex, size, price, web_price, web_base_price, web_discount_percent, stock )
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

  // Unknown or inactive product → real 404, never an indexable 200 "not found".
  if (!product) {
    notFound();
  }

  const safeDescription = product.description ? sanitizeContentHtml(product.description) : null;
  const [relatedProducts, shopMoreCategories] = await Promise.all([
    getRelatedProductsForPdp(
      product.id,
      product.category,
      product.related_product_ids as number[] | null
    ),
    getShopMoreCategories(product.category, 4),
  ]);

  // Fallback for products created before the multi-image gallery existed:
  // if there are no product_images rows but products.image_url is set
  // (legacy path), show that single image instead of "No image".
  const galleryImages =
    images.length > 0
      ? images
      : product.image_url
      ? [{ id: 0, url: product.image_url, is_primary: true, variant_ids: [] }]
      : [];

  const pricedVariants = (product.variants || []).filter(
    (v: { price?: number | null; web_price?: number | null; stock?: number | null }) =>
      Number(v.web_price ?? v.price ?? 0) > 0
  );
  const lowPrice = pricedVariants.reduce((min: number, v: { price?: number | null; web_price?: number | null }) => {
    const p = Number(v.web_price ?? v.price ?? 0);
    return min === 0 || p < min ? p : min;
  }, 0);
  const highPrice = pricedVariants.reduce((max: number, v: { price?: number | null; web_price?: number | null }) => {
    const p = Number(v.web_price ?? v.price ?? 0);
    return p > max ? p : max;
  }, 0);
  const inStock = (product.variants || []).some(
    (v: { stock?: number | null }) => Number(v.stock || 0) > 0
  );
  const primaryImage =
    galleryImages.find((img) => img.is_primary)?.url || galleryImages[0]?.url || product.image_url || undefined;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: htmlToPlainText(product.description || "", 300) || product.name,
    image: primaryImage ? [primaryImage] : undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    sku: product.sku || undefined,
    offers: {
      "@type": lowPrice && highPrice && lowPrice !== highPrice ? "AggregateOffer" : "Offer",
      url: absoluteUrl(`/products/${product.id}`),
      priceCurrency: "PKR",
      ...(lowPrice && highPrice && lowPrice !== highPrice
        ? { lowPrice: String(lowPrice), highPrice: String(highPrice), offerCount: pricedVariants.length }
        : { price: String(lowPrice || highPrice || 0) }),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      // The seller is always TinyTots even when `brand` is a third-party label
      // (Mayoral, Levi's, …) — links the offer to the one Organization entity.
      seller: { "@type": "Organization", "@id": orgId(), name: SITE_NAME },
    },
  };

  return (
    <>
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptString(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScriptString(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Shop All", path: "/products" },
              { name: product.name, path: `/products/${product.id}` },
            ])
          ),
        }}
      />
      <nav className="text-body-sm font-body-sm text-text-secondary mb-stack-sm flex items-center gap-2">
        <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <Link href="/products" className="hover:text-brand-primary transition-colors">Shop All</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-text-primary">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-[minmax(0,720px)_1fr] gap-gutter">
      <ProductDetailInteractive
          productId={product.id}
          productName={product.name}
          brand={product.brand}
          category={product.category}
          description={safeDescription}
          variants={product.variants}
          images={galleryImages}
          createdAt={product.created_at}
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
          <h2 className="font-headline-lg text-text-primary mb-stack-md">Shop More</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-bento-gap">
            {shopMoreCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collections/${cat.slug}`}
                className="relative aspect-[4/5] md:aspect-square rounded-[16px] overflow-hidden border border-border-default group cursor-pointer min-h-[140px]"
              >
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-surface-secondary" />
                )}
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
    <InternalTrustStrip />
    </>
  );
}
