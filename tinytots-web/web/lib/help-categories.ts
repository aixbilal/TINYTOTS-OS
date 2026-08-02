/** Fixed Help Center categories — stored as slug, shown as label. */

export const HELP_CATEGORIES = [
  { value: "orders", label: "Orders" },
  { value: "shipping", label: "Shipping & Delivery" },
  { value: "returns", label: "Returns & Exchanges" },
  { value: "sizing", label: "Sizing" },
  { value: "payments", label: "Payments" },
  { value: "account", label: "Account" },
] as const;

export type HelpCategoryValue = (typeof HELP_CATEGORIES)[number]["value"];

const VALUE_SET = new Set<string>(HELP_CATEGORIES.map((c) => c.value));

const LABEL_BY_VALUE = Object.fromEntries(
  HELP_CATEGORIES.map((c) => [c.value, c.label])
) as Record<HelpCategoryValue, string>;

/** Legacy / typo aliases → canonical slug. */
const ALIASES: Record<string, HelpCategoryValue> = {
  general: "orders",
  order: "orders",
  "shipping & delivery": "shipping",
  "shipping and delivery": "shipping",
  delivery: "shipping",
  "returns & exchanges": "returns",
  "returns and exchanges": "returns",
  return: "returns",
  exchange: "returns",
  exchanges: "returns",
  size: "sizing",
  sizes: "sizing",
  payment: "payments",
  accounts: "account",
};

export function isHelpCategory(value: unknown): value is HelpCategoryValue {
  return typeof value === "string" && VALUE_SET.has(value);
}

/** Map free-text / legacy values onto a canonical category. Defaults to orders. */
export function normalizeHelpCategory(raw: unknown): HelpCategoryValue {
  if (typeof raw !== "string") return "orders";
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return "orders";
  if (VALUE_SET.has(trimmed)) return trimmed as HelpCategoryValue;
  if (ALIASES[trimmed]) return ALIASES[trimmed];
  // Partial match on known labels/values
  for (const c of HELP_CATEGORIES) {
    if (trimmed.includes(c.value) || c.label.toLowerCase().includes(trimmed)) {
      return c.value;
    }
  }
  return "orders";
}

export function helpCategoryLabel(value: string | null | undefined): string {
  if (value && isHelpCategory(value)) return LABEL_BY_VALUE[value];
  const normalized = normalizeHelpCategory(value);
  return LABEL_BY_VALUE[normalized];
}

/** Sort key for storefront / admin grouping (lower = first). */
export function helpCategorySortIndex(value: string | null | undefined): number {
  const normalized = normalizeHelpCategory(value);
  const idx = HELP_CATEGORIES.findIndex((c) => c.value === normalized);
  return idx === -1 ? HELP_CATEGORIES.length : idx;
}
