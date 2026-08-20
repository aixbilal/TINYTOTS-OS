import { decodeHtmlEntities, normalizeQuillHtml, stripLeadingLegalChrome } from "@/lib/html-text";

// Given admin-authored HTML (from the Quill editor in /admin/pages/[slug]),
// slugifies each <h2> into an id and builds a matching table-of-contents
// list, so legal pages stay driven entirely by admin content while keeping
// the sticky "Contents" side nav / scroll-spy UI.
export function extractTocAndAnnotate(html: string) {
  const sections: { id: string; title: string }[] = [];
  const used = new Set<string>();

  // Normalize &nbsp;/&amp; at render so legacy Quill rows wrap correctly
  // without a DB migration; save-time normalize covers future edits.
  const cleaned = stripLeadingLegalChrome(normalizeQuillHtml(html));

  const annotated = cleaned.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (_match, attrs, inner) => {
    const text = decodeHtmlEntities(inner.replace(/<[^>]+>/g, ""));
    const base = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "section";
    let id = base;
    let i = 2;
    while (used.has(id)) id = `${base}-${i++}`;
    used.add(id);
    sections.push({ id, title: text || `Section ${sections.length + 1}` });
    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });

  return { html: annotated, sections };
}

// Splits id-annotated HTML (output of extractTocAndAnnotate) into one chunk
// per <h2> section, for rendering as numbered icon-led cards instead of one
// long scroll of raw HTML. Any content before the first <h2> (e.g. a lone
// intro paragraph) is dropped here - callers render `intro` separately.
export function splitIntoSections(
  annotatedHtml: string
): { id: string; title: string; bodyHtml: string }[] {
  const sections: { id: string; title: string; bodyHtml: string }[] = [];
  const re = /<h2[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2[^>]*id=|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(annotatedHtml)) !== null) {
    const [, id, titleHtml, bodyHtml] = match;
    const title = titleHtml.replace(/<[^>]+>/g, "").trim();
    sections.push({ id, title, bodyHtml: bodyHtml.trim() });
  }
  return sections;
}

// Best-effort icon for a legal section, inferred from its real heading text
// (never fabricated content - just a visual affordance). Falls back to a
// neutral document icon when nothing matches.
const SECTION_ICON_RULES: [RegExp, string][] = [
  [/account|registration/i, "person"],
  [/payment|pricing|price/i, "credit_card"],
  [/order/i, "receipt_long"],
  [/shipping|delivery/i, "local_shipping"],
  [/return|refund|exchange/i, "assignment_return"],
  [/intellectual property|copyright|trademark/i, "verified"],
  [/acceptable use|conduct/i, "gavel"],
  [/liability|disclaimer|warrant/i, "report"],
  [/governing law|jurisdiction|dispute/i, "balance"],
  [/change|update|amend/i, "history"],
  [/contact/i, "mail"],
  [/privacy|data|information|cookie|tracking/i, "shield"],
  [/security/i, "lock"],
  [/general|introduction|overview/i, "description"],
];

export function iconForSectionTitle(title: string): string {
  for (const [pattern, icon] of SECTION_ICON_RULES) {
    if (pattern.test(title)) return icon;
  }
  return "article";
}
