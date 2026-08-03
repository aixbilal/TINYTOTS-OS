/** Strip tags/entities for meta descriptions and other plain-text excerpts. */
export function htmlToPlainText(html: string, maxLen = 160): string {
  const text = decodeHtmlEntities(String(html || "").replace(/<[^>]+>/g, " "));
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trimEnd()}…`;
}

/** Decode common HTML entities in stripped/plain text (TOC labels, excerpts). */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Quill habitually stores spaces as &nbsp; and & as &amp;.
 * Normalize those before persisting so TOC extraction and plain-text
 * paths stay clean; leave &lt;/&gt; alone so tag-like text stays escaped.
 */
export function normalizeQuillHtml(html: string): string {
  return html
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/&amp;/g, "&");
}

/**
 * Legal pages render title + "Last updated" in LegalPageLayout.
 * Strip a leading pasted <h1> and optional "Last updated" paragraph so
 * they don't duplicate / overlap the layout chrome.
 */
export function stripLeadingLegalChrome(html: string): string {
  return html
    .replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, "")
    .replace(
      /^\s*<p\b[^>]*>\s*(?:<em\b[^>]*>\s*)?Last(?:\s|&nbsp;)+updated:[\s\S]*?(?:<\/em>\s*)?<\/p>\s*/i,
      ""
    );
}
