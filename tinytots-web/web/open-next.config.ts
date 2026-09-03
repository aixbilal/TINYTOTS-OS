import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * Cloudflare Workers adapter config (compatibility evaluation — Batch J).
 *
 * incrementalCache: static-assets — prerendered pages/route bodies (incl. the
 * SSG /serwist/sw.js) are served straight from the Workers ASSETS binding, no
 * Cloudflare account resource required. Good enough for this mostly-static,
 * read-mostly storefront where ISR revalidation isn't relied on. A real deploy
 * would swap in r2-incremental-cache if on-demand revalidation is needed.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
