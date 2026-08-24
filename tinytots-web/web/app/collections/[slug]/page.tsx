import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";
import CollectionPageClient from "./CollectionPageClient";

// Same ISR trade-off as the homepage and PDP: pre-render known category
// slugs at build time, revalidate in the background every 60s.
export const revalidate = 60;

const PRODUCT_SELECT = `
  id, name, category, image_url,
  variants ( id, color, size, price, web_price, stock )
`;

export async function generateStaticParams() {
  const { data } = await supabaseAdmin.from("categories").select("slug").order("slug", { ascending: true });
  return (data || []).filter((c) => c.slug).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: category } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  const title = category?.name || "Shop";
  return { title };
}

async function getCategoryAndProducts(slug: string) {
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) return { category: null, products: [] };

  const { data: products } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .eq("category", category.name)
    .order("created_at", { ascending: false });

  return { category, products: products || [] };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { category, products } = await getCategoryAndProducts(slug);

  return <CollectionPageClient slug={slug} initialCategory={category} initialProducts={products as any} />;
}