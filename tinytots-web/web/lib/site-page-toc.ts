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
