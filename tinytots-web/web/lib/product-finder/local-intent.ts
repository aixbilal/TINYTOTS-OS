/**
 * Deterministic, zero-cost shopping-intent parser for the customer Product
 * Finder. Runs BEFORE any LLM call. Handles the obvious English / Roman-Urdu
 * requests ("5 saal ke larkay ke liye blue kapray 3000 se kam") outright, and
 * conservatively escalates anything where natural-language meaning still
 * matters (occasions, relationships, style words, conflicts, unclear age).
 *
 * It emits the SAME raw shape the LLMs emit
 * ({ gender, age, category, color, size, min_price, max_price, keywords }) so
 * the route's existing server-side validation applies identically — nothing
 * here is trusted straight into a catalog query.
 *
 * Self-contained on purpose (no app imports) so it is trivially unit-testable
 * with plain `node`.
 */

export type RawShoppingIntent = {
  gender?: "boy" | "girl" | "unisex";
  age?: number;
  category?: string;
  color?: string;
  size?: string;
  min_price?: number;
  max_price?: number;
  keywords?: string[];
};

export type LocalIntentResult = {
  /** Raw, pre-validation filters — feed through the same validators as LLM output. */
  filters: RawShoppingIntent;
  /** high = safe to skip AI · low = escalate · none = not a shopping query. */
  confidence: "high" | "low" | "none";
  /** True when the query still needs semantic parsing (Groq, then Gemini). */
  needsAi: boolean;
};

// Colours the finder can actually match (mirror of KNOWN_COLORS in config.ts)
// plus conservative Roman-Urdu / common aliases → canonical english token.
const COLOR_ALIASES: Record<string, string> = {
  gulabi: "pink", pink: "pink",
  neela: "blue", nila: "blue", blue: "blue", navy: "navy", sky: "sky",
  kala: "black", kaala: "black", black: "black",
  safed: "white", white: "white", cream: "cream", beige: "beige",
  lal: "red", laal: "red", red: "red", maroon: "maroon",
  hara: "green", green: "green", olive: "olive", teal: "teal",
  peela: "yellow", yellow: "yellow", mustard: "mustard",
  narangi: "orange", orange: "orange", peach: "peach",
  jamni: "purple", purple: "purple",
  bhura: "brown", brown: "brown",
  grey: "grey", gray: "gray", silver: "silver", gold: "gold",
};

// Generic clothing nouns → a normalised english noun the route resolves against
// the LIVE active categories.name set. Deliberately small; "kapray" / "clothes"
// map to nothing (too generic to be a category).
const CATEGORY_NOUNS: Record<string, string> = {
  dress: "dress", dresses: "dress", frock: "dress", frocks: "dress", gown: "dress",
  shirt: "shirt", shirts: "shirt", tshirt: "shirt", "t-shirt": "shirt", tee: "shirt",
  top: "top", tops: "top",
  trouser: "trouser", trousers: "trouser", pant: "pant", pants: "pant",
  bottom: "bottom", bottoms: "bottom",
  jacket: "jacket", jackets: "jacket",
  outerwear: "outerwear", coat: "outerwear",
  shorts: "shorts",
  romper: "romper", rompers: "romper",
};

const BOY_WORDS = ["boy", "boys", "larka", "larke", "larkay", "larko", "lrka", "lrke", "beta", "bete", "beto", "son", "ladka", "ladke"];
const GIRL_WORDS = ["girl", "girls", "larki", "larkiyan", "larkiyon", "larkiyo", "lrki", "beti", "betiyan", "daughter", "ladki", "ladkiyan"];
const UNISEX_WORDS = ["unisex", "boys and girls", "girls and boys", "both", "either"];

// Words that mean the request needs real language understanding — escalate even
// if some structured filters were also found.
const SEMANTIC_WORDS = [
  "birthday", "bday", "b-day", "shaadi", "shadi", "wedding", "mehndi", "mayun",
  "function", "party", "eid", "occasion", "ceremony", "festival", "event",
  "elegant", "fancy", "stylish", "trendy", "classy", "chic", "premium look",
  "style", "styling", "outfit idea", "look", "vibe", "theme",
  "niece", "nephew", "cousin", "friend", "colleague", "sister's", "brother's",
  "gift", "present", "gifting", "school function", "annual day", "photoshoot",
];

const CLOTHING_HINTS = [
  "kapra", "kapray", "kapre", "kaprey", "clothes", "clothing", "wear", "pehn",
  "dress", "outfit", "suit", "shirt", "trouser", "pant", "jacket", "shorts",
  "frock", "romper", "hoodie", "sweater", "jersey", "chahiye", "chahiye",
  "dikhao", "dikha", "chahye", "chaiye", "buy", "shop", "looking for",
];

function normalize(input: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(token: string): number | null {
  const t = token.replace(/[, ]/g, "").replace(/(rs\.?|pkr|rupees?)/gi, "");
  const km = t.match(/^(\d+(?:\.\d+)?)k$/i);
  if (km) return Math.round(parseFloat(km[1]) * 1000);
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function extractPrice(q: string): { min?: number; max?: number } {
  const out: { min?: number; max?: number } = {};
  const num = "(\\d[\\d, ]*\\d|\\d+k?|\\d+)";

  // range: "2000 se 4000", "between 2000 and 4000", "2000 to 4000", "2000-4000"
  const range =
    q.match(new RegExp(`${num}\\s*(?:se|to|-|–|and|aur)\\s*${num}\\s*(?:tak|ke andar|k andar)?`)) ||
    q.match(new RegExp(`between\\s+${num}\\s+and\\s+${num}`));
  if (range) {
    const a = toNumber(range[1]);
    const b = toNumber(range[2]);
    if (a != null && b != null) {
      out.min = Math.min(a, b);
      out.max = Math.max(a, b);
      return out;
    }
  }

  // max: "under 3000", "below 3000", "less than 3000", "3000 tak", "3000 se kam",
  //      "3000 se neeche", "max 3000", "upto 3000", "budget 3000"
  const max =
    q.match(new RegExp(`(?:under|below|less than|upto|up to|max(?:imum)?|within|budget(?: of)?|not more than)\\s*(?:rs\\.?|pkr)?\\s*${num}`)) ||
    q.match(new RegExp(`${num}\\s*(?:se kam|se neeche|se kam ka|tak|ke andar|k andar|se niche|or usse kam)`));
  if (max) {
    const v = toNumber(max[1]);
    if (v != null) out.max = v;
  }

  // min: "above 2000", "over 2000", "at least 2000", "2000 se ooper/upar"
  const min =
    q.match(new RegExp(`(?:above|over|more than|at least|minimum|min)\\s*(?:rs\\.?|pkr)?\\s*${num}`)) ||
    q.match(new RegExp(`${num}\\s*(?:se ooper|se upar|se zyada|se ziada|or usse zyada)`));
  if (min) {
    const v = toNumber(min[1]);
    if (v != null) out.min = v;
  }

  return out;
}

function extractAge(q: string): { age?: number; unclear: boolean } {
  if (/\b(new ?born|naya paida|abhi paida|infant)\b/.test(q)) return { age: 0, unclear: false };

  // range: "10 sa 14 saal", "10 se 14 year", "10-14 saal", "10 to 14 years" → lower bound
  const range = q.match(/\b(\d{1,2})\s*(?:sa|se|to|-|–|aur)\s*(\d{1,2})\s*(?:saal|sal|year|years|yr|yrs)\b/);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const lo = Math.min(a, b);
      if (lo >= 0 && lo <= 16) return { age: lo, unclear: false };
    }
  }

  // "5 saal", "5 sal", "5 years", "5 year", "5 yr", "5yo", "5-year-old", "age 5"
  const m =
    q.match(/\b(\d{1,2})\s*(?:saal|sal|sala|year|years|yr|yrs|y\/o|yo)\b/) ||
    q.match(/\bage\s*(?:of\s*)?(\d{1,2})\b/) ||
    q.match(/\b(\d{1,2})[\s-]*year[\s-]*old\b/);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n >= 0 && n <= 16) return { age: n, unclear: false };
  }

  // "toddler" / "baby" without a number → age is meaningful but imprecise
  if (/\b(toddler|baby|chota bacha|nanha)\b/.test(q) && !/\d/.test(q)) {
    return { unclear: true };
  }
  return { unclear: false };
}

function hasAny(q: string, words: string[]): boolean {
  return words.some((w) =>
    w.includes(" ") ? q.includes(w) : new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(q)
  );
}

export function parseLocalIntent(rawQuery: string): LocalIntentResult {
  const q = normalize(rawQuery);
  const filters: RawShoppingIntent = {};

  if (q.length < 2) return { filters, confidence: "none", needsAi: false };

  // ---- gender -------------------------------------------------------------
  const isBoy = hasAny(q, BOY_WORDS);
  const isGirl = hasAny(q, GIRL_WORDS);
  const isUnisex = hasAny(q, UNISEX_WORDS);
  let genderConflict = false;
  if (isUnisex) filters.gender = "unisex";
  else if (isBoy && isGirl) genderConflict = true;
  else if (isBoy) filters.gender = "boy";
  else if (isGirl) filters.gender = "girl";

  // ---- age --------------------------------------------------------------
  const { age, unclear: ageUnclear } = extractAge(q);
  if (age != null) filters.age = age;

  // ---- price ----------------------------------------------------------
  const price = extractPrice(q);
  if (price.min != null) filters.min_price = price.min;
  if (price.max != null) filters.max_price = price.max;
  const priceConflict =
    filters.min_price != null && filters.max_price != null && filters.min_price > filters.max_price;
  if (priceConflict) {
    delete filters.min_price;
    delete filters.max_price;
  }

  // ---- colour (first match wins; finder supports one) -----------------
  for (const token of q.split(/[^a-z]+/)) {
    if (token && COLOR_ALIASES[token]) {
      filters.color = COLOR_ALIASES[token];
      break;
    }
  }

  // ---- category (generic noun → normalised english; route resolves) --
  for (const [noun, mapped] of Object.entries(CATEGORY_NOUNS)) {
    if (hasAny(q, [noun])) {
      filters.category = mapped;
      break;
    }
  }

  // ---- signals ------------------------------------------------------
  const hasSemantic = hasAny(q, SEMANTIC_WORDS);
  const isShopping =
    hasAny(q, CLOTHING_HINTS) ||
    filters.gender != null ||
    filters.age != null ||
    filters.color != null ||
    filters.category != null ||
    filters.max_price != null ||
    filters.min_price != null;

  const meaningfulCount =
    (filters.gender ? 1 : 0) +
    (filters.age != null ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.color ? 1 : 0) +
    (filters.max_price != null ? 1 : 0) +
    (filters.min_price != null ? 1 : 0);

  if (!isShopping) return { filters: {}, confidence: "none", needsAi: false };

  const needsAi =
    genderConflict ||
    hasSemantic ||
    meaningfulCount === 0 ||
    // "baby"/"toddler" with no other signal → let the model place the age
    (ageUnclear && meaningfulCount < 2);

  return {
    filters: needsAi ? stripToSafe(filters) : filters,
    confidence: needsAi ? "low" : "high",
    needsAi,
  };
}

// When we escalate, still pass along any UNambiguous hard filters we already
// found (gender/age/price/colour) so the LLM prompt + validation can build on
// them; drop the fuzzy category guess so the model re-derives it.
function stripToSafe(f: RawShoppingIntent): RawShoppingIntent {
  const { category, ...rest } = f;
  void category;
  return rest;
}
