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
 * resize=contain is required: Supabase's transform CDN, given `width` alone
 * with no `resize` mode, does NOT scale height proportionally — it leaves
 * the output at the source's original pixel height, silently distorting the
 * aspect ratio (e.g. a 1536x1024 source at width=800 comes back 800x1024
 * instead of 800x533). Every `object-cover` consumer downstream then crops
 * against that wrong aspect ratio, which is what produced the severe
 * over-zoomed/cropped product and banner images site-wide. `resize=contain`
 * makes Supabase compute the missing height itself, matching the source's
 * true aspect ratio (verified: 800x533 for the same 1536x1024 source).
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
      url.searchParams.set("resize", "contain");
      return url.toString();
    } catch {
      return src;
    }
  }
  return src;
}
