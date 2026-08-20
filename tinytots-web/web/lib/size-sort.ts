/**
 * Sorts real product size labels (e.g. "0-3M", "1-2Y", "S", "M") into
 * logical age/size progression, and groups them into numbered range
 * buckets for the Products page age filter. Never invents sizes - only
 * orders and groups whatever real values exist in the catalog.
 */
export function sizeSortKey(size: string): [number, number, string] {
  const range = size.match(/^(\d+)\s*-\s*(\d+)\s*([A-Za-z]*)$/);
  if (range) {
    const unit = range[3].toUpperCase();
    // Months sort before years at the same numeric start (0-3M before 1-2Y).
    const unitRank = unit === "M" ? 0 : unit === "Y" ? 1 : 0.5;
    return [0, Number(range[1]) + unitRank, size];
  }
  const single = size.match(/^(\d+)\s*([A-Za-z]*)$/);
  if (single) {
    const unit = single[2].toUpperCase();
    const unitRank = unit === "M" ? 0 : unit === "Y" ? 1 : 0.5;
    return [0, Number(single[1]) + unitRank, size];
  }
  const letterOrder = ["XS", "S", "M", "L", "XL", "XXL"];
  const li = letterOrder.indexOf(size.toUpperCase());
  if (li >= 0) return [1, li, size];
  return [2, 0, size];
}

export function compareSizes(a: string, b: string) {
  const ka = sizeSortKey(a);
  const kb = sizeSortKey(b);
  return ka[0] - kb[0] || ka[1] - kb[1] || ka[2].localeCompare(kb[2]);
}

/**
 * Normalizes a raw size string for DISPLAY comparison only - trims
 * whitespace, collapses internal spaces, standardizes the range dash and
 * unit casing (e.g. "3 - 4 y" and "3-4Y" both normalize to "3-4Y"). Never
 * used to alter what's stored in the database, only to detect when two
 * differently-formatted raw values represent the same real size for the
 * customer-facing filter.
 */
export function normalizeSizeLabel(size: string): string {
  return size
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-")
    .replace(/(\d)\s*([myMY])\b/g, (_, num, unit) => `${num}${unit.toUpperCase()}`)
    .replace(/^([a-z])/, (c) => c.toUpperCase());
}

/**
 * Groups real raw size values by their normalized display label, so the
 * filter shows one clean chip per real size even if the catalog has
 * formatting inconsistencies (e.g. "3-4Y" vs "3 - 4y" from different
 * product entries) - clicking a chip still filters against every raw
 * value that collapsed into it, so real filtering behavior is unchanged.
 */
export function groupSizesForDisplay(
  rawSizes: string[]
): { label: string; rawValues: string[] }[] {
  const byLabel = new Map<string, string[]>();
  for (const raw of rawSizes) {
    const label = normalizeSizeLabel(raw);
    const list = byLabel.get(label) || [];
    list.push(raw);
    byLabel.set(label, list);
  }
  return Array.from(byLabel.entries())
    .map(([label, rawValues]) => ({ label, rawValues }))
    .sort((a, b) => compareSizes(a.label, b.label));
}

/**
 * Groups a sorted list of real sizes into up to `bucketCount` contiguous
 * numbered ranges (e.g. bucket 1 = ["0-3M","3-6M"], bucket 2 = ["6-9M",...]).
 * Fewer buckets than requested if there aren't enough distinct sizes.
 * Each bucket's label is its first-to-last real size, not a made-up range.
 */
export function groupSizesIntoBuckets(
  sortedSizes: string[],
  bucketCount: number = 5
): { label: string; sizes: string[] }[] {
  if (sortedSizes.length === 0) return [];
  const count = Math.min(bucketCount, sortedSizes.length);
  const perBucket = Math.ceil(sortedSizes.length / count);
  const buckets: { label: string; sizes: string[] }[] = [];
  for (let i = 0; i < sortedSizes.length; i += perBucket) {
    const slice = sortedSizes.slice(i, i + perBucket);
    const label = slice.length === 1 ? slice[0] : `${slice[0]}–${slice[slice.length - 1]}`;
    buckets.push({ label, sizes: slice });
  }
  return buckets;
}
