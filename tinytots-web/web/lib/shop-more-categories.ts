import { supabase } from "@/lib/supabase";

export type ShopMoreCategory = {
  name: string;
  slug: string;
  image_url: string | null;
};

/**
 * Top categories by active product count, excluding the current product's
 * category. Tile image = first in-stock product's primary/gallery image
 * (falls back to products.image_url).
 */
export async function getShopMoreCategories(
  excludeCategory: string | null | undefined,
  limit = 4
): Promise<ShopMoreCategory[]> {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("name, slug"),
    supabase
      .from("products")
      .select(
        `
        id, category, image_url,
        variants ( stock ),
        product_images ( storage_path, is_primary, sort_order )
      `
      )
      .eq("is_active", true),
  ]);

  if (!categories?.length || !products?.length) return [];

  const exclude = (excludeCategory || "").trim().toLowerCase();

  type Prod = {
    id: number;
    category: string | null;
    image_url: string | null;
    variants?: { stock: number }[];
    product_images?: { storage_path: string; is_primary: boolean; sort_order: number }[];
  };

  const byCategory = new Map<string, Prod[]>();
  for (const p of products as Prod[]) {
    if (!p.category) continue;
    if (p.category.trim().toLowerCase() === exclude) continue;
    const list = byCategory.get(p.category) || [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  const ranked = [...byCategory.entries()]
    .map(([name, list]) => ({ name, count: list.length, products: list }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);

  const slugByName = new Map(categories.map((c) => [c.name, c.slug]));

  return ranked
    .map(({ name, products: list }) => {
      const slug = slugByName.get(name);
      if (!slug) return null;

      const withStock = list.filter((p) => (p.variants || []).some((v) => (v.stock || 0) > 0));
      const candidates = withStock.length > 0 ? withStock : list;

      let image_url: string | null = null;
      for (const p of candidates) {
        const primary = (p.product_images || [])
          .filter((img) => img.is_primary)
          .sort((a, b) => a.sort_order - b.sort_order)[0];
        const anyImg = (p.product_images || []).sort((a, b) => a.sort_order - b.sort_order)[0];
        const path = primary?.storage_path || anyImg?.storage_path;
        if (path) {
          image_url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
          break;
        }
        if (p.image_url) {
          image_url = p.image_url;
          break;
        }
      }

      return { name, slug, image_url };
    })
    .filter((t): t is ShopMoreCategory => !!t);
}
