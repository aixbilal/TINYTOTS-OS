import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";
import { supabaseAdmin } from "@/lib/supabase-admin";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

/**
 * Precache the actual product/collection/blog routes at build/warm time
 * (Goal B), instead of relying on the old client-side WARM_CACHE
 * message-passing (lib/cache-warmer.ts) that only warmed whatever the
 * visitor happened to trigger, with no retry if the tab closed mid-warm.
 * Capped at 200 products, matching the same limit used in
 * generateStaticParams (app/products/[id]/page.tsx), so this stays fast
 * and doesn't try to precache the entire catalog on every deploy.
 */
async function getPrecacheRouteEntries() {
  const [{ data: products }, { data: categories }, { data: posts }] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseAdmin.from("categories").select("slug"),
    supabaseAdmin.from("blog_posts").select("slug").eq("is_published", true),
  ]);

  const entries: { url: string; revision: string }[] = [];
  (products || []).forEach((p) => entries.push({ url: `/products/${p.id}`, revision }));
  (categories || [])
    .filter((c) => c.slug)
    .forEach((c) => entries.push({ url: `/collections/${c.slug}`, revision }));
  (posts || []).forEach((p) => entries.push({ url: `/blog/${p.slug}`, revision }));

  return entries;
}

const routeEntries = await getPrecacheRouteEntries();

// NOTE: this destructuring export must stay exactly this shape — a single
// `export const { ... } = createSerwistRoute(...)` statement. Next.js's
// route-segment-config parser statically scans for this literal pattern to
// pick up `dynamic`/`dynamicParams`; splitting it into a separate
// `export { dynamic, ... }` breaks that static analysis and fails the build.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "app/sw.ts",
    // Precache offline shells, top-level pages, and every known
    // product/collection/blog route so the whole storefront is browsable
    // offline right after first install — not just whatever the visitor
    // happened to click on.
    additionalPrecacheEntries: [
      { url: "/offline", revision },
      { url: "/~offline", revision },
      { url: "/", revision },
      { url: "/products", revision },
      { url: "/blog", revision },
      ...routeEntries,
    ],
    // Strip live commerce/auth URLs from the precache manifest.
    manifestTransforms: [
      async (entries) => ({
        manifest: entries.filter((entry) => {
          const url = entry.url.split("?")[0];
          return !/\/(cart|checkout|login|signup|account|admin|forgot-password|reset-password|track-order|order-confirmation)(\/|$)/.test(
            url
          ) && !url.startsWith("/api/");
        }),
        warnings: [],
      }),
    ],
    // Native esbuild is preferred on Windows per @serwist/turbopack defaults.
    useNativeEsbuild: true,
  });