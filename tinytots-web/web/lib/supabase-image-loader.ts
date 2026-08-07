type LoaderProps = { src: string; width: number; quality?: number };

/**
 * Supabase Storage images were round-tripping through Vercel's /_next/image
 * optimizer on every cold request — that re-encode step is what was 500/504ing
 * (Goal A blocker #1). Supabase's own CDN already serves these fast, so we
 * bypass the optimizer entirely for supabase.co URLs and return them as-is.
 * Everything else (local /public assets, Google OAuth avatars) still goes
 * through Next's normal /_next/image pipeline for format/size optimization.
 */
export default function supabaseImageLoader({ src, width, quality }: LoaderProps) {
  if (src.includes("supabase.co")) {
    return src;
  }
  const params = [`url=${encodeURIComponent(src)}`, `w=${width}`];
  params.push(`q=${quality ?? 75}`);
  return `/_next/image?${params.join("&")}`;
}