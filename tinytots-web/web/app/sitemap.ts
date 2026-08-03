import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { absoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/products"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/help"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/our-story"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/shipping-returns"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/size-guide"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/privacy-policy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/track-order"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/report-issue"), lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const [{ data: products }, { data: categories }, { data: help }, { data: posts }] =
    await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id, updated_at")
        .eq("is_active", true)
        .order("id", { ascending: true }),
      supabaseAdmin.from("categories").select("slug, created_at").order("slug", { ascending: true }),
      supabaseAdmin
        .from("help_articles")
        .select("slug, updated_at, published_at")
        .eq("is_published", true),
      supabaseAdmin
        .from("blog_posts")
        .select("slug, published_at, created_at")
        .eq("is_published", true),
    ]);

  const productRoutes: MetadataRoute.Sitemap = (products || []).map((p) => ({
    url: absoluteUrl(`/products/${p.id}`),
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const collectionRoutes: MetadataRoute.Sitemap = (categories || [])
    .filter((c) => c.slug)
    .map((c) => ({
      url: absoluteUrl(`/collections/${c.slug}`),
      lastModified: c.created_at ? new Date(c.created_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const helpRoutes: MetadataRoute.Sitemap = (help || []).map((a) => ({
    url: absoluteUrl(`/help/${a.slug}`),
    lastModified: a.updated_at
      ? new Date(a.updated_at)
      : a.published_at
        ? new Date(a.published_at)
        : now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const blogRoutes: MetadataRoute.Sitemap = (posts || []).map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: p.published_at
      ? new Date(p.published_at)
      : p.created_at
        ? new Date(p.created_at)
        : now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...collectionRoutes, ...productRoutes, ...helpRoutes, ...blogRoutes];
}
