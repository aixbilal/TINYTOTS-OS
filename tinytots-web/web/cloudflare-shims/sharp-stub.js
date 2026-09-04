// Stub for `sharp` — Cloudflare Workers build only.
//
// `lib/extract-color.ts` dynamically imports sharp to average an image down to
// 1x1 and suggest a swatch colour. sharp is a native Node addon that cannot
// load on workerd, so `extractDominantColorHex()` already returns null there
// before reaching the import, and its one caller
// (POST /api/admin/inventory) treats null as "no suggestion" and never blocks
// variant creation on it.
//
// The JS half of sharp is still bundled on the Worker despite being
// unreachable, so the Cloudflare build aliases it here (see `next.config.ts` —
// applied only when TINYTOTS_BUILD_TARGET=cloudflare, i.e. `npm run build:cf`).
// The canonical Node/Vercel build is untouched and still uses the real sharp.
throw new Error(
  "sharp stub: unreachable on Cloudflare Workers (extractDominantColorHex() returns null before importing sharp)"
);
