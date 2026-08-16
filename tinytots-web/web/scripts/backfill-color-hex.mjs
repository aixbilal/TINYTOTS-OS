/**
 * One-off backfill: suggests a color_hex for existing variants that don't
 * have one yet, using the same average-color technique as
 * lib/extract-color.ts (duplicated here in plain JS since this script runs
 * standalone via `node`, not through the Next/TS build).
 *
 * Run locally after applying the 20260816110000_variant_color_hex.sql
 * migration:
 *   node scripts/backfill-color-hex.mjs
 *
 * Safe to re-run: only updates variants where color_hex IS NULL, never
 * overwrites an admin-entered or previously-suggested value. Read-only
 * against `products` (just reads image_url), only writes color_hex on
 * `variants`.
 *
 * Uses the service role from .env.local — never commit secrets.
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envText = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
  console.error("Missing Supabase env vars in .env.local (need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function extractDominantColorHex(imageUrl) {
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
    const toHex = (n) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  } catch {
    return null;
  }
}

async function main() {
  const { data: variants, error } = await admin
    .from("variants")
    .select("id, product_id, color, color_hex")
    .is("color_hex", null);

  if (error) {
    console.error("Failed to load variants:", error.message);
    process.exit(1);
  }
  if (!variants || variants.length === 0) {
    console.log("Nothing to backfill - no variants with a null color_hex.");
    return;
  }

  console.log(`Found ${variants.length} variant(s) missing color_hex.`);

  // Group by product_id so we only fetch+decode each product's image once,
  // not once per variant.
  const productIds = Array.from(new Set(variants.map((v) => v.product_id)));
  const { data: products, error: prodError } = await admin
    .from("products")
    .select("id, image_url")
    .in("id", productIds);

  if (prodError) {
    console.error("Failed to load products:", prodError.message);
    process.exit(1);
  }

  const imageByProduct = new Map(products.map((p) => [p.id, p.image_url]));
  const hexByProduct = new Map();

  let updated = 0;
  let skipped = 0;

  for (const v of variants) {
    const imageUrl = imageByProduct.get(v.product_id);
    if (!imageUrl) {
      skipped++;
      continue;
    }

    let hex = hexByProduct.get(v.product_id);
    if (hex === undefined) {
      hex = await extractDominantColorHex(imageUrl);
      hexByProduct.set(v.product_id, hex);
    }

    if (!hex) {
      skipped++;
      continue;
    }

    const { error: updateError } = await admin
      .from("variants")
      .update({ color_hex: hex })
      .eq("id", v.id)
      .is("color_hex", null); // belt-and-suspenders: never clobber a value set since we read it

    if (updateError) {
      console.error(`  Variant ${v.id}: update failed - ${updateError.message}`);
      skipped++;
      continue;
    }

    console.log(`  Variant ${v.id} (product ${v.product_id}, "${v.color || "unnamed"}") -> ${hex}`);
    updated++;
  }

  console.log(`\nDone. Updated ${updated}, skipped ${skipped} (no image or extraction failed).`);
  console.log("Review suggested swatches in the admin product editor - override any that look wrong.");
}

main();
