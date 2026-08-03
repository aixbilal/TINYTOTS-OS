import sanitizeHtml from "sanitize-html";
import { normalizeQuillHtml } from "@/lib/html-text";

/**
 * Server-safe HTML sanitizer (no jsdom / isomorphic-dompurify).
 * Vercel Turbopack + jsdom hits ERR_REQUIRE_ESM via html-encoding-sniffer.
 */

const CONTENT_TAGS = [
  ...sanitizeHtml.defaults.allowedTags,
  "img",
  "h1",
  "h2",
  "h3",
  "h4",
];

/** Public content pages (blog, help, legal) — keep heading `id` for TOC. */
export function sanitizeContentHtml(html: string): string {
  return normalizeQuillHtml(
    sanitizeHtml(html || "", {
      allowedTags: CONTENT_TAGS,
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ["href", "name", "target", "rel"],
        img: ["src", "alt", "title", "width", "height"],
        "*": ["id"],
      },
      allowedSchemes: ["http", "https", "mailto"],
    })
  );
}

/** Admin write-path sanitizer (matches previous isomorphic-dompurify allow-lists). */
export function sanitizeRichTextHtml(
  html: string,
  opts?: { allowImages?: boolean }
): string {
  const allowedTags = [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "h1",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "a",
    ...(opts?.allowImages ? (["img"] as const) : []),
  ];

  return normalizeQuillHtml(
    sanitizeHtml(html || "", {
      allowedTags,
      allowedAttributes: {
        a: ["href", "target", "rel"],
        ...(opts?.allowImages ? { img: ["src", "alt"] } : {}),
      },
      allowedSchemes: ["http", "https", "mailto"],
    }).replace(/\p{Cf}/gu, "")
  );
}
