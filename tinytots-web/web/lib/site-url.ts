/**
 * Canonical public site origin for sitemap, Open Graph, canonical links and
 * every other absolute URL the app emits.
 *
 * Resolution order (first non-empty wins):
 *   1. NEXT_PUBLIC_SITE_URL            — explicit, set this in production
 *   2. VERCEL_PROJECT_PRODUCTION_URL   — Vercel's stable production hostname
 *   3. VERCEL_URL                      — the current deployment hostname (preview)
 *   4. PRODUCTION_SITE_URL fallback    — only when NODE_ENV=production and none
 *                                        of the above are set, so a missing env
 *                                        var can never make `http://localhost`
 *                                        the canonical host of a real build
 *   5. http://localhost:3001           — local development only
 *
 * The launch step of attaching tinytotsofficial.com to Vercel and setting
 * NEXT_PUBLIC_SITE_URL is still required — this only prevents a catastrophic
 * localhost canonical if that step is missed.
 */
const PRODUCTION_SITE_URL = "https://tinytotsofficial.com";
const DEV_SITE_URL = "http://localhost:3001";

function normalize(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function getSiteUrl(): string {
  const explicit = normalize(process.env.NEXT_PUBLIC_SITE_URL || "");
  if (explicit) return explicit;

  const vercelProd = normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL || "");
  if (vercelProd) return vercelProd;

  const vercelUrl = normalize(process.env.VERCEL_URL || "");
  if (vercelUrl) return vercelUrl;

  if (process.env.NODE_ENV === "production") return PRODUCTION_SITE_URL;

  return DEV_SITE_URL;
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
