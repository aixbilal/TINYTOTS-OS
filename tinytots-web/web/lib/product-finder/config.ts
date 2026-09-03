// Shared, real-catalog vocabulary for the customer Product Finder. Guided UI,
// the deterministic query and the AI intent parser all validate against these
// exact values — nothing outside them ever reaches a database filter.

export const FINDER_GENDERS = ["boy", "girl", "unisex"] as const;
export type FinderGender = (typeof FINDER_GENDERS)[number];

// Mirrors the distinct products.age_bracket values in the live catalog.
export const AGE_BRACKETS = ["0-1", "1-3", "3-5", "5-8", "8-14"] as const;
export type AgeBracket = (typeof AGE_BRACKETS)[number];

// Selectable budget bands (upper bound is inclusive; null = no cap).
export const BUDGET_RANGES: { label: string; min: number; max: number | null }[] = [
  { label: "Under Rs. 1,500", min: 0, max: 1500 },
  { label: "Rs. 1,500 – 3,000", min: 1500, max: 3000 },
  { label: "Rs. 3,000 – 5,000", min: 3000, max: 5000 },
  { label: "Rs. 5,000+", min: 5000, max: null },
];

export const PRICE_CEILING = 100_000; // clamp for any AI-supplied number

// A conservative colour list used only to validate an AI-supplied colour
// against something sane before it becomes a case-insensitive LIKE on
// variants.color. Guided UI doesn't require colour.
export const KNOWN_COLORS = [
  "black", "white", "grey", "gray", "blue", "navy", "red", "maroon", "pink",
  "purple", "green", "olive", "yellow", "mustard", "orange", "brown", "beige",
  "cream", "gold", "silver", "teal", "sky", "peach",
] as const;

export function ageToBracket(age: number): AgeBracket | null {
  if (!Number.isFinite(age) || age < 0) return null;
  if (age <= 1) return "0-1";
  if (age <= 3) return "1-3";
  if (age <= 5) return "3-5";
  if (age <= 8) return "5-8";
  if (age <= 14) return "8-14";
  return null;
}
