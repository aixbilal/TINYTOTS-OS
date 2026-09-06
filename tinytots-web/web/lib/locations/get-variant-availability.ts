import { supabaseAdmin } from "@/lib/supabase-admin";

export type VariantAvailability = {
  name: string;
  slug: string;
};

/**
 * Which public/active stores currently have this exact variant in stock,
 * for the PDP "Available at" experience. Reads variant_location_stock
 * (closed to anon/authenticated — service_role only) and never returns raw
 * quantities, only which stores have stock > 0. Returns [] when there is no
 * per-location stock data yet (table is groundwork-only today) rather than
 * fabricating or deriving availability from aggregate stock.
 */
export async function getVariantAvailability(
  variantId: number
): Promise<VariantAvailability[]> {
  if (!Number.isFinite(variantId) || variantId <= 0) return [];

  type Row = {
    stock: number;
    locations: {
      name: string;
      slug: string;
      is_public: boolean;
      is_active: boolean;
    } | null;
  };

  const { data, error } = await supabaseAdmin
    .from("variant_location_stock")
    .select("stock, locations!inner(name, slug, is_public, is_active)")
    .eq("variant_id", variantId)
    .gt("stock", 0)
    .returns<Row[]>();

  if (error) {
    console.error("[getVariantAvailability]", error.message);
    return [];
  }

  return (data || [])
    .map((row) => row.locations)
    .filter((loc): loc is NonNullable<Row["locations"]> => !!loc && loc.is_public && loc.is_active)
    .map((loc) => ({ name: loc.name, slug: loc.slug }));
}
