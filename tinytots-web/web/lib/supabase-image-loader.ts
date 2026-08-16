type LoaderProps = { src: string; width: number; quality?: number };

/**
 * Supabase Storage images were round-tripping through Vercel's /_next/image
 * optimizer on every cold request - that re-encode step is what was 500/504ing
 * (Goal A blocker #1). Supabase's own CDN already serves these fast, so we
 * bypass the optimizer entirely for supabase.co URLs and return them as-is.
 *
 * Everything else (local /public assets, Google-hosted defaults) is ALSO
 * returned as-is now, not routed through /_next/image. That route doesn't
 * exist once images.loader is set to "custom" in next.config.ts - this is
 * documented Next.js behavior, not something a URL parameter can opt back
 * into. The previous version of this file built a /_next/image?url=...
 * link for non-Supabase sources, which 404'd on every single request
 * (confirmed via direct curl - real files on disk, real 200 when fetched
 * directly, 404 only through that dead route). Local images added to this
 * project are pre-optimized (resized + webp) before being committed, so
 * serving them unoptimized-by-Next has no meaningful cost.
 */
export default function supabaseImageLoader({ src }: LoaderProps) {
  return src;
}