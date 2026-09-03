import { supabaseAnon as supabase } from "@/lib/supabase-anon";

/**
 * Storefront product-list fetch shared by the server-rendered /products page
 * and the /api/products route so both return the identical shape. Public
 * fields only — never cost_price / internal pricing, and is_active only
 * (matches the Batch A security boundary).
 */

const PRODUCT_SELECT = `
  id,
  name,
  sku,
  description,
  brand,
  category,
  gender,
  image_url,
  created_at,
  product_images ( storage_path, is_primary, sort_order ),
  variants ( id, color, color_hex, size, price, web_price, web_base_price, web_discount_percent, stock )
`;

export type StorefrontVariant = {
  id: number;
  color: string | null;
  color_hex: string | null;
  size: string | null;
  price: number;
  web_price: number | null;
  web_base_price: number | null;
  web_discount_percent: number | null;
  stock: number;
};

export type StorefrontProduct = {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  brand: string | null;
  category: string | null;
  gender: string | null;
  image_url: string | null;
  secondary_image_url: string | null;
  created_at: string;
  variants: StorefrontVariant[];
};

type Gender = "boy" | "girl" | "unisex";

export function normalizeGender(value: string | null | undefined): Gender | null {
  const g = (value || "").trim().toLowerCase();
  return g === "boy" || g === "girl" || g === "unisex" ? g : null;
}

function withSecondaryImage(rows: Record<string, unknown>[]): StorefrontProduct[] {
  return (rows || []).map((p) => {
    const images = (p.product_images as Record<string, unknown>[] | null) || [];
    const gallery = images
      .filter((img) => !img.is_primary)
      .sort(
        (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
      );
    const secondary = gallery[0]
      ? supabase.storage
          .from("product-images")
          .getPublicUrl(String(gallery[0].storage_path)).data.publicUrl
      : null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { product_images, ...rest } = p;
    return { ...(rest as unknown as StorefrontProduct), secondary_image_url: secondary };
  });
}

export async function getStorefrontProducts(opts: {
  ids?: number[] | null;
  gender?: string | null;
} = {}): Promise<StorefrontProduct[]> {
  const ids = (opts.ids || []).filter((n) => Number.isFinite(n));
  const gender = normalizeGender(opts.gender);

  let query = supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true);

  if (ids.length > 0) {
    query = query.in("id", ids);
  } else {
    query = query.order("created_at", { ascending: false });
  }
  if (gender) {
    query = query.eq("gender", gender);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const products = withSecondaryImage(data as Record<string, unknown>[]);

  // Preserve the caller-supplied order when filtering by explicit ids.
  if (ids.length > 0) {
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as StorefrontProduct[];
  }
  return products;
}
