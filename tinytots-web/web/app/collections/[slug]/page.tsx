import type { ComponentProps } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";
import { jsonLdScriptString } from "@/lib/json-ld";
import { pageMetadata, breadcrumbJsonLd, NOINDEX_FOLLOW, NOINDEX_NOFOLLOW } from "@/lib/seo";
import CollectionPageClient from "./CollectionPageClient";

// Cloudflare/OpenNext static-assets incremental cache can't honor `revalidate`
// (read-only) — render dynamically so category product lists stay live.
export const dynamic = "force-dynamic";

const PRODUCT_SELECT = `
  id, name, category, image_url,
  variants ( id, color, size, price, web_price, stock )
`;

export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from("categories")
    .select("slug")
    .eq("is_active", true)
    .order("slug", { ascending: true });
  return (data || []).filter((c) => c.slug).map((c) => ({ slug: c.slug }));
}

async function getCategoryAndProducts(slug: string) {
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url")
    .eq("slug", slug)
    .eq("is_active", true)
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { category, products } = await getCategoryAndProducts(slug);

  if (!category) {
    return { title: "Collection not found", robots: NOINDEX_NOFOLLOW };
  }

  const name = String(category.name || "").trim();
  const description =
    (typeof category.description === "string" && category.description.trim()) ||
    `Shop ${name} for kids at TinyTots — soft, durable essentials with free delivery across Pakistan and easy 7-day returns.`;

  return pageMetadata({
    title: name,
    description,
    path: `/collections/${slug}`,
    image: category.image_url || null,
    imageAlt: name,
    // A valid category with no products yet stays reachable but out of the index.
    robots: products.length === 0 ? NOINDEX_FOLLOW : undefined,
  });
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { category, products } = await getCategoryAndProducts(slug);

  // Unknown slug → real 404 (an empty-but-valid category still renders 200).
  if (!category) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScriptString(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Collections", path: "/collections" },
              { name: category.name, path: `/collections/${slug}` },
            ])
          ),
        }}
      />
      <CollectionPageClient
        slug={slug}
        initialCategory={category}
        initialProducts={
          products as unknown as ComponentProps<
            typeof CollectionPageClient
          >["initialProducts"]
        }
      />
    </>
  );
}
