/**
 * Collection filter helpers for variants.size free-text values.
 * Display on product cards / PDP stays the original string — this only
 * drives filter pills and match checks.
 */

export type ParsedSize =
  | { kind: "numeric"; numbers: number[] }
  | { kind: "letter"; key: string }
  | { kind: "opaque"; key: string };

export type SizeFilterOption = {
  /** Token stored in the selected-sizes set (e.g. "4", "M", "1 Month"). */
  token: string;
  label: string;
  group: "numeric" | "letter" | "opaque";
};

const LETTER_ORDER = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const LETTER_SET = new Set<string>(LETTER_ORDER);

const SINGLE_INT = /^\d+$/;
const INT_RANGE = /^(\d+)-(\d+)$/;

export function parseSizeToken(raw: string | null | undefined): ParsedSize | null {
  if (raw == null) return null;
  const key = raw.trim();
  if (!key) return null;

  if (SINGLE_INT.test(key)) {
    return { kind: "numeric", numbers: [Number(key)] };
  }

  const range = key.match(INT_RANGE);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    // Guard absurd spans (bad data); still cover real catalog ranges like 2-5, 10-12.
    if (hi - lo > 30) return { kind: "opaque", key };
    const numbers: number[] = [];
    for (let n = lo; n <= hi; n++) numbers.push(n);
    return { kind: "numeric", numbers };
  }

  const upper = key.toUpperCase();
  if (LETTER_SET.has(upper) && key.length <= 3) {
    // Normalize letter pills to canonical casing while matching case-insensitively.
    return { kind: "letter", key: upper };
  }

  return { kind: "opaque", key };
}

/** True if the stored size string matches any selected filter token (OR / union). */
export function sizeMatchesSelected(
  rawSize: string | null | undefined,
  selectedTokens: Set<string>
): boolean {
  if (selectedTokens.size === 0) return true;
  const parsed = parseSizeToken(rawSize);
  if (!parsed) return false;

  if (parsed.kind === "numeric") {
    return parsed.numbers.some((n) => selectedTokens.has(String(n)));
  }
  return selectedTokens.has(parsed.key);
}

export function productMatchesSizeFilter(
  variants: { size: string | null }[],
  selectedTokens: Set<string>
): boolean {
  if (selectedTokens.size === 0) return true;
  return variants.some((v) => sizeMatchesSelected(v.size, selectedTokens));
}

/** Build deduped, ordered filter pills from raw size strings in a collection. */
export function buildSizeFilterOptions(rawSizes: Iterable<string | null | undefined>): SizeFilterOption[] {
  const numerics = new Set<number>();
  const letters = new Set<string>();
  const opaques = new Set<string>();

  for (const raw of rawSizes) {
    const parsed = parseSizeToken(raw);
    if (!parsed) continue;
    if (parsed.kind === "numeric") {
      for (const n of parsed.numbers) numerics.add(n);
    } else if (parsed.kind === "letter") {
      letters.add(parsed.key);
    } else {
      opaques.add(parsed.key);
    }
  }

  const options: SizeFilterOption[] = [];

  for (const n of [...numerics].sort((a, b) => a - b)) {
    options.push({ token: String(n), label: String(n), group: "numeric" });
  }

  for (const letter of LETTER_ORDER) {
    if (letters.has(letter)) {
      options.push({ token: letter, label: letter, group: "letter" });
    }
  }
  // Any unexpected letter-ish tokens not in LETTER_ORDER (shouldn't happen, but safe).
  for (const letter of [...letters].sort()) {
    if (!(LETTER_ORDER as readonly string[]).includes(letter)) {
      options.push({ token: letter, label: letter, group: "letter" });
    }
  }

  for (const key of [...opaques].sort((a, b) => a.localeCompare(b))) {
    options.push({ token: key, label: key, group: "opaque" });
  }

  return options;
}
