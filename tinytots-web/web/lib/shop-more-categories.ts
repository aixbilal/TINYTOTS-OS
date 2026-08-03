import { supabaseAnon as supabase } from "@/lib/supabase-anon";

export type ShopMoreCategory = {
  name: string;
  slug: string;
  image_url: string;
};

/**
 * Top categories by active product count, excluding the current product's
 * category. Deterministic: products ordered by id, candidates sorted by id,
 * categories ranked by count then name. Tiles without a resolvable image are
 * omitted so empty placeholders never render.
 */
export async function getShopMoreCategories(
  excludeCategory: string | null | undefined,
  limit = 4
): Promise<ShopMoreCategory[]> {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("name, slug").order("name", { ascending: true }),
    supabase
      .from("products")
      .select(
        `
        id, category, image_url,
        variants ( stock ),
        product_images ( storage_path, is_primary, sort_order )
      `
      )
      .eq("is_active", true)
      .order("id", { ascending: true }),
  ]);

  if (!categories?.length || !products?.length) return [];

  const exclude = (excludeCategory || "").trim().toLowerCase();
  const slugByName = new Map(
    categories.map((c) => [c.name.trim().toLowerCase(), { name: c.name, slug: c.slug }])
  );

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
    const key = p.category.trim();
    if (!key || key.toLowerCase() === exclude) continue;
    // Only count categories that exist in the categories table.
    if (!slugByName.has(key.toLowerCase())) continue;
    const list = byCategory.get(key) || [];
    list.push(p);
    byCategory.set(key, list);
  }

  const ranked = [...byCategory.entries()]
    .map(([name, list]) => ({
      name,
      count: list.length,
      products: [...list].sort((a, b) => a.id - b.id),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const results: ShopMoreCategory[] = [];
  for (const { name, products: list } of ranked) {
    if (results.length >= limit) break;

    const meta = slugByName.get(name.trim().toLowerCase());
    if (!meta) continue;

    const withStock = list.filter((p) => (p.variants || []).some((v) => (v.stock || 0) > 0));
    const candidates = withStock.length > 0 ? withStock : list;

    let image_url: string | null = null;
    for (const p of candidates) {
      const gallery = [...(p.product_images || [])].sort((a, b) => a.sort_order - b.sort_order);
      const primary = gallery.find((img) => img.is_primary);
      const path = primary?.storage_path || gallery[0]?.storage_path;
      if (path) {
        image_url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
        break;
      }
      if (p.image_url) {
        image_url = p.image_url;
        break;
      }
    }

    // Hide empty/placeholder tiles — only show categories with a real image.
    if (!image_url) continue;

    results.push({ name: meta.name, slug: meta.slug, image_url });
  }

  return results;
}
