/**
 * Extracts an approximate dominant color from an image URL by downsampling
 * to 1x1 (area averaging is a cheap, well-known stand-in for "dominant
 * color" without a dedicated quantization library). Returns a hex string
 * like "#C9A876", or null if the fetch/decode fails or the runtime can't
 * decode the image — callers treat this as a best-effort suggestion, never
 * a source of truth, and always accept an admin-supplied color instead.
 *
 * Decoding needs `sharp` (a native Node addon). On Cloudflare Workers /
 * workerd that addon can't load, so this returns null there and the admin
 * picks the swatch color by hand — the one caller
 * (POST /api/admin/inventory) already treats a null result as "no
 * suggestion" and never blocks variant creation on it.
 */
export async function extractDominantColorHex(imageUrl: string): Promise<string | null> {
  // Native image decoding is unavailable on Workers/edge runtimes.
  if (
    typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers"
  ) {
    return null;
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());

    const { default: sharp } = await import("sharp");
    const { data } = await sharp(buffer)
      .resize(1, 1, { fit: "cover" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const [r, g, b] = data;
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  } catch {
    return null;
  }
}
