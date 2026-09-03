import type { Metadata } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

/**
 * Central SEO / social-metadata helpers so canonical URLs, Open Graph and
 * Twitter tags stay consistent across every route without hard-coding the
 * domain in dozens of files. JSON-LD is always emitted through
 * `jsonLdScriptString` (lib/json-ld.ts) at the call site.
 */

export const SITE_NAME = "TinyTots";
export const OG_LOCALE = "en_PK";

/**
 * Owned, brand-safe default social image (an existing homepage lifestyle
 * asset). A dedicated 1200x630 OG artwork could be produced later; until
 * then this is a real TinyTots image, never a placeholder or demo URL.
 */
export const OG_DEFAULT_IMAGE = "/images/homepage/cta-closing-visual.webp";

export function absoluteImage(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  return absoluteUrl(src.startsWith("/") ? src : `/${src}`);
}

type OgType = "website" | "article";

export interface PageMetaInput {
  /** Page title as shown in the tab; the root template adds " | TinyTots". */
  title?: string;
  /** Set instead of `title` to bypass the "%s | TinyTots" template. */
  absoluteTitle?: string;
  description: string;
  /** Site-relative path, e.g. "/products" or "/blog/my-post". */
  path: string;
  ogType?: OgType;
  /** Absolute or site-relative image URL; falls back to OG_DEFAULT_IMAGE. */
  image?: string | null;
  imageAlt?: string;
  /** Pass to mark the page non-indexable (login, cart, filtered views, …). */
  robots?: Metadata["robots"];
}

/**
 * Build a complete, self-consistent Metadata object: canonical + Open Graph
 * + Twitter, all pointing at the same absolute URL and image.
 */
export function pageMetadata(input: PageMetaInput): Metadata {
  const {
    title,
    absoluteTitle,
    description,
    path,
    ogType = "website",
    image,
    imageAlt,
    robots,
  } = input;

  const url = absoluteUrl(path);
  const ogImage = absoluteImage(image) ?? absoluteImage(OG_DEFAULT_IMAGE)!;
  const ogTitle = absoluteTitle ?? (title ? `${title} | ${SITE_NAME}` : SITE_NAME);

  return {
    ...(absoluteTitle
      ? { title: { absolute: absoluteTitle } }
      : title
        ? { title }
        : {}),
    description,
    alternates: { canonical: url },
    ...(robots ? { robots } : {}),
    openGraph: {
      type: ogType,
      siteName: SITE_NAME,
      locale: OG_LOCALE,
      title: ogTitle,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: imageAlt ?? SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [ogImage],
    },
  };
}

/** robots value for pages that should never be indexed but may pass link equity. */
export const NOINDEX_FOLLOW: Metadata["robots"] = { index: false, follow: true };
/** robots value for private/functional pages — no index, no crawl-through. */
export const NOINDEX_NOFOLLOW: Metadata["robots"] = { index: false, follow: false };

/* ---------------------------------------------------------------- JSON-LD -- */

export function organizationJsonLd() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: `${site}/`,
    logo: `${site}/icon.png`,
  };
}

export function websiteJsonLd() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${site}/`,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
