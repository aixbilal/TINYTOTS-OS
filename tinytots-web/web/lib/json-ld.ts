/**
 * Serialize a value for embedding inside a
 *   <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ... }} />
 *
 * `JSON.stringify` alone is NOT safe here: it does not escape `<`, `>` or `&`,
 * so a string value containing `</script>` (e.g. an admin-authored product name)
 * would terminate the script element and allow arbitrary markup/JS to run on the
 * page. Escaping those (plus the U+2028 / U+2029 ECMAScript line terminators)
 * neutralizes the break-out while keeping the output valid JSON — `JSON.parse()`
 * still succeeds because a `\uXXXX` escape denotes the same character.
 *
 * The pattern is built from a string (not a regex literal) so the U+2028 /
 * U+2029 code points never appear as raw characters in this source file.
 */
const UNSAFE_JSON_LD_CHARS = new RegExp("[<>&\\u2028\\u2029]", "g");

export function jsonLdScriptString(data: unknown): string {
  return JSON.stringify(data).replace(
    UNSAFE_JSON_LD_CHARS,
    (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}
