/**
 * Canonical public site origin for sitemap, Open Graph, and absolute URLs.
 * Set NEXT_PUBLIC_SITE_URL to the production domain in deployed environments
 * (e.g. https://tinytotsofficial.com) — never leave localhost in production.
 */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").trim();
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
