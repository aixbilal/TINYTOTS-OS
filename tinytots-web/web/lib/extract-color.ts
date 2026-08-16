import sharp from "sharp";

/**
 * Extracts an approximate dominant color from an image URL by downsampling
 * to 1x1 (sharp's resize does area averaging, which is a cheap, well-known
 * stand-in for "dominant color" without a dedicated color-quantization
 * library). Returns a hex string like "#C9A876", or null if the fetch/
 * decode fails - callers should treat this as a suggestion, not a source
 * of truth, since a single flat image average can be thrown off by
 * background, lighting, or a multi-color garment.
 */
export async function extractDominantColorHex(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());

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
