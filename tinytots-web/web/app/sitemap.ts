import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { absoluteUrl } from "@/lib/site-url";

// The catalog is small (dozens of products) and stock/publish state changes
// through the admin panel, so the sitemap is generated per request rather
// than cached. A sitemap index would be premature at this scale — revisit
// past ~10k URLs.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static, indexable routes. No `lastModified` — there is no genuine
  // per-route change timestamp, and emitting `new Date()` on every request
  // falsely tells crawlers the whole site changed each time it is fetched.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/collections"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/sale"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/our-story"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/help"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/shipping-returns"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/size-guide"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/privacy-policy"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const [{ data: products }, { data: categories }, { data: help }, { data: posts }] =
    await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id, category, updated_at")
        .eq("is_active", true)
        .order("id", { ascending: true }),
      supabaseAdmin
        .from("categories")
        .select("slug, name")
        .eq("is_active", true)
        .order("slug", { ascending: true }),
      supabaseAdmin
        .from("help_articles")
        .select("slug, updated_at, published_at")
        .eq("is_published", true),
      supabaseAdmin
        .from("blog_posts")
        .select("slug, published_at")
        .eq("is_published", true),
    ]);

  const activeProducts = products || [];

  const productRoutes: MetadataRoute.Sitemap = activeProducts.map((p) => ({
    url: absoluteUrl(`/products/${p.id}`),
    ...(p.updated_at ? { lastModified: new Date(p.updated_at) } : {}),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Only collections that actually contain at least one active product are
  // indexable (SEO-07); empty categories still render but are noindex and
  // excluded here.
  const nonEmptyCategoryNames = new Set(
    activeProducts.map((p) => p.category).filter(Boolean)
  );
  const collectionRoutes: MetadataRoute.Sitemap = (categories || [])
    .filter((c) => c.slug && nonEmptyCategoryNames.has(c.name))
    .map((c) => ({
      url: absoluteUrl(`/collections/${c.slug}`),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  const helpRoutes: MetadataRoute.Sitemap = (help || []).map((a) => ({
    url: absoluteUrl(`/help/${a.slug}`),
    ...(a.updated_at
      ? { lastModified: new Date(a.updated_at) }
      : a.published_at
        ? { lastModified: new Date(a.published_at) }
        : {}),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const blogRoutes: MetadataRoute.Sitemap = (posts || []).map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    ...(p.published_at ? { lastModified: new Date(p.published_at) } : {}),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...collectionRoutes, ...productRoutes, ...helpRoutes, ...blogRoutes];
}
