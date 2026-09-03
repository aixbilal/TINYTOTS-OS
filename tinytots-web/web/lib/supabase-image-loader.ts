type LoaderProps = { src: string; width: number; quality?: number };

const SUPABASE_PUBLIC_OBJECT = "/storage/v1/object/public/";
const SUPABASE_RENDER_IMAGE = "/storage/v1/render/image/public/";

/**
 * Width-aware image loader.
 *
 * Supabase Storage public-object URLs are rewritten to Supabase's own image
 * transformation CDN (`render/image/public/…?width=&quality=`), so every
 * srcset candidate Next generates is a real width-specific, re-encoded file.
 * A 240KB source drops to ~30KB at width=200 — the responsive win PERF-01
 * was missing.
 *
 * We deliberately do NOT route through Vercel's `/_next/image` optimizer:
 * that re-encode step 500/504'd on cold requests for these Supabase images
 * in production (the reason a custom loader exists at all). Supabase's CDN
 * already fronts these files and does the resize at the edge.
 *
 * Everything else — local `/images/*` assets (pre-optimized WebP, committed
 * at their display size) and any other host — is returned unchanged.
 */
export default function supabaseImageLoader({ src, width, quality }: LoaderProps): string {
  if (src.includes(SUPABASE_PUBLIC_OBJECT)) {
    try {
      const url = new URL(src.replace(SUPABASE_PUBLIC_OBJECT, SUPABASE_RENDER_IMAGE));
      url.searchParams.set("width", String(width));
      url.searchParams.set("quality", String(quality ?? 75));
      return url.toString();
    } catch {
      return src;
    }
  }
  return src;
}
