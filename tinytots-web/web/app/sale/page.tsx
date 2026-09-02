import type { Metadata } from "next";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";
import ProductCarouselTabs from "@/components/ProductCarouselTabs";

// ISR: sale composition changes when discounts start/end, not on every request.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sale",
  description: "Shop current markdowns on TinyTots kids clothing.",
};

const PRODUCT_SELECT = `
  id,
  name,
  sku,
  brand,
  image_url,
  product_images ( storage_path, is_primary, sort_order ),
  variants (
    id,
    color,
    color_hex,
    price,
    web_price,
    stock
  )
`;

function withSecondaryImage(products: any[]) {
  return (products || []).map((p) => {
    const gallery = (p.product_images || [])
      .filter((img: any) => !img.is_primary)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);
    const secondary = gallery[0]
      ? supabase.storage.from("product-images").getPublicUrl(gallery[0].storage_path).data.publicUrl
      : null;
    const { product_images, ...rest } = p;
    return { ...rest, secondary_image_url: secondary };
  });
}

/**
 * Reads the existing `discounts` table (pre-existing schema, not added by
 * this redesign) for currently-active discounts and collects their
 * product_ids. Read-only - no schema change, no pricing/checkout logic
 * touched. "Currently active" = is_active true, started, and not yet ended.
 */
async function getSaleProductIds(): Promise<number[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("discounts")
    .select("product_ids, starts_at, ends_at, is_active")
    .eq("is_active", true)
    .lte("starts_at", nowIso)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`);

  if (error || !data) return [];

  const ids = new Set<number>();
  for (const row of data) {
    for (const id of row.product_ids || []) ids.add(Number(id));
  }
  return Array.from(ids);
}

async function getSaleProducts() {
  const ids = await getSaleProductIds();
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return withSecondaryImage(data);
}

export default async function SalePage() {
  const products = await getSaleProducts();

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <div className="text-center mb-stack-lg">
        <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-3 block">
          Limited Time
        </span>
        <h1 className="font-display-md text-[32px] md:text-[44px] text-text-primary tracking-tight">Sale</h1>
        <p className="font-body-md text-body-md text-text-secondary mt-3 max-w-md mx-auto">
          Current markdowns across TinyTots - while stocks last.
        </p>
      </div>

      {products.length > 0 ? (
        <ProductCarouselTabs
          hideHeading
          tabs={[{ key: "sale", label: "Sale", products: products as any }]}
        />
      ) : (
        <p className="text-center font-body-md text-body-md text-text-secondary py-12">
          No items on sale right now - check back soon.
        </p>
      )}
    </div>
  );
}
