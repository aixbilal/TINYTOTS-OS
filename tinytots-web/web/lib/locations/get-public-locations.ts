import { supabaseAnon } from "@/lib/supabase-anon";

export type PublicLocation = {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string;
  directionsUrl: string | null;
  displayOrder: number;
};

const PUBLIC_LOCATION_COLUMNS =
  "id, name, slug, address, city, region, country, directions_url, display_order";

/**
 * Verified, customer-facing TinyTots store locations, in display order.
 * RLS on public.locations already restricts rows to is_public/is_active —
 * this only selects display columns, never the visibility flags themselves.
 * Returns [] on error or when no verified rows exist yet; callers must
 * render a clean empty state rather than treating [] as a failure.
 */
export async function getPublicLocations(): Promise<PublicLocation[]> {
  const { data, error } = await supabaseAnon
    .from("locations")
    .select(PUBLIC_LOCATION_COLUMNS)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[getPublicLocations]", error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address,
    city: row.city,
    region: row.region,
    country: row.country,
    directionsUrl: row.directions_url,
    displayOrder: row.display_order,
  }));
}
