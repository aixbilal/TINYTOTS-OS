/** Fixed blog categories — dropdown only; add new values here deliberately. */

export const BLOG_CATEGORIES = [
  "Parenting Tips",
  "Sizing & Fit",
  "Policies, Explained Simply",
  "Behind the Scenes",
  "Brand Story",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export function isBlogCategory(value: unknown): value is BlogCategory {
  return typeof value === "string" && (BLOG_CATEGORIES as readonly string[]).includes(value);
}

export function slugifyBlog(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
