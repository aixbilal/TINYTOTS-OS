import type { ComponentProps } from "react";
import type { Metadata } from "next";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";
import { getStorefrontProducts, normalizeGender } from "@/lib/products-list";
import { pageMetadata, NOINDEX_FOLLOW } from "@/lib/seo";
import ProductsBrowser, { DEFAULT_SHOP_CONTENT } from "@/components/products/ProductsBrowser";

// Storefront listing depends on live stock + query params (gender / ids), so
// it is server-rendered per request rather than statically cached. The
// initial grid — product names, prices and /products/<id> links — ships in
// the server HTML for crawlers; the client component then takes over all
// filtering, sorting and pagination.
export const dynamic = "force-dynamic";

const PAGE_DESCRIPTION =
  "Browse every TinyTots piece for babies and kids — soft, durable everyday essentials. Cash on delivery, free shipping across Pakistan and easy 7-day returns.";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  // Any filter/sort/search/ids/page query param → keep it crawlable-through
  // but out of the index, canonical back to the clean /products URL. This
  // prevents accidental indexing of hundreds of near-duplicate facet URLs.
  const hasFacet = ["gender", "ids", "sort", "size", "color", "price", "category", "search", "q", "page"].some(
    (k) => sp[k] != null
  );

  return pageMetadata({
    title: "Shop All",
    description: PAGE_DESCRIPTION,
    path: "/products",
    robots: hasFacet ? NOINDEX_FOLLOW : undefined,
  });
}

async function getShopContent() {
  const { data } = await supabase
    .from("shop_page_content")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return { ...DEFAULT_SHOP_CONTENT, ...(data || {}) };
}

async function getCategories() {
  const { data } = await supabase
    .from("categories")
    .select("name, slug, display_order")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  return (data || []).map((c) => ({ name: c.name as string, slug: c.slug as string }));
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const idsParam = firstParam(sp.ids);
  const genderParam = normalizeGender(firstParam(sp.gender));

  const ids = idsParam
    ? idsParam
        .split(",")
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n))
    : null;

  const [products, categories, shopContent] = await Promise.all([
    getStorefrontProducts({ ids, gender: genderParam }),
    getCategories(),
    getShopContent(),
  ]);

  return (
    <ProductsBrowser
      key={`${genderParam ?? ""}::${idsParam ?? ""}`}
      initialProducts={products as unknown as ComponentProps<typeof ProductsBrowser>["initialProducts"]}
      initialCategories={categories}
      initialShopContent={shopContent as ComponentProps<typeof ProductsBrowser>["initialShopContent"]}
      initialGender={genderParam}
      initialIds={idsParam}
    />
  );
}
