import { supabaseAnon as supabase } from "@/lib/supabase-anon";

const RELATED_LIMIT = 6;

type RawProduct = {
  id: number;
  name: string;
  image_url: string | null;
  product_images?: { storage_path: string; is_primary: boolean; sort_order: number }[];
  variants?: { price: number; web_price: number | null; stock: number }[];
};

function hasStock(p: RawProduct) {
  return (p.variants || []).some((v) => (v.stock || 0) > 0);
}

function mapProduct(p: RawProduct) {
  const gallery = (p.product_images || [])
    .filter((img) => !img.is_primary)
    .sort((a, b) => a.sort_order - b.sort_order);
  const secondary = gallery[0]
    ? supabase.storage.from("product-images").getPublicUrl(gallery[0].storage_path).data.publicUrl
    : null;
  const { product_images, ...rest } = p;
  return { ...rest, secondary_image_url: secondary };
}

const PRODUCT_SELECT = `
  id, name, image_url,
  product_images ( storage_path, is_primary, sort_order ),
  variants ( price, web_price, stock )
`;

async function fetchByIds(ids: number[], excludeId: number) {
  const clean = ids.map(Number).filter((id) => Number.isFinite(id) && id !== excludeId);
  if (clean.length === 0) return [];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", clean)
    .eq("is_active", true);

  if (error || !data) return [];

  const byId = new Map((data as RawProduct[]).map((p) => [p.id, p]));
  return clean
    .map((id) => byId.get(id))
    .filter((p): p is RawProduct => !!p && hasStock(p))
    .slice(0, RELATED_LIMIT)
    .map(mapProduct);
}

async function fetchSameCategory(category: string | null, excludeId: number) {
  if (!category) return [];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("category", category)
    .eq("is_active", true)
    .neq("id", excludeId)
    .limit(24);

  if (error || !data) return [];

  return (data as RawProduct[])
    .filter(hasStock)
    .slice(0, RELATED_LIMIT)
    .map(mapProduct);
}

/**
 * Fallback chain:
 * 1) product.related_product_ids (if set and yields in-stock items)
 * 2) category.related_product_ids for this product's category (if set)
 * 3) automatic same-category active products
 */
export async function getRelatedProductsForPdp(
  productId: number | string,
  category: string | null,
  productRelatedIds: number[] | null | undefined
) {
  const excludeId = Number(productId);

  if (Array.isArray(productRelatedIds) && productRelatedIds.length > 0) {
    const manual = await fetchByIds(productRelatedIds, excludeId);
    if (manual.length > 0) return manual;
  }

  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("related_product_ids")
      .eq("name", category)
      .maybeSingle();

    const catIds = (cat?.related_product_ids as number[] | null) || [];
    if (catIds.length > 0) {
      const fromCat = await fetchByIds(catIds, excludeId);
      if (fromCat.length > 0) return fromCat;
    }
  }

  return fetchSameCategory(category, excludeId);
}
