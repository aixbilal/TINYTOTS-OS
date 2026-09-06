-- Seeds the first owner-verified physical TinyTots store location.
--
-- Owner-approved factual data only (verified 2026-09-06): "Tiny Tots, Shop
-- No. 169, Street Markazi Jamia Masjid, Toba Tek Singh, Punjab, Pakistan,
-- 36050". Split across columns as app/stores/page.tsx already composes the
-- full display line as [address, city, region, country].join(", ") — so
-- `address` below holds only the street/postal fragment (city/region/
-- country live in their own columns) to avoid rendering "...Pakistan,
-- 36050, Toba Tek Singh, Punjab, Pakistan" with the tail duplicated. Every
-- verified fact is preserved exactly once; nothing added or dropped.
--
-- No coordinates: none have been verified, and none are guessed here —
-- directions_url is deterministically derived from the complete verified
-- address text using Google's documented Maps Search URL scheme
-- (https://developers.google.com/maps/documentation/urls/get-started#search-action),
-- not from invented lat/lng.
--
-- No second store: no second address has been verified yet. No
-- variant_location_stock rows: no branch inventory has been verified either.
--
-- NOT applied to any live database as part of this change.

insert into public.locations (
  name,
  slug,
  address,
  city,
  region,
  country,
  directions_url,
  is_public,
  is_active,
  display_order
) values (
  'Tiny Tots',
  'toba-tek-singh',
  'Shop No. 169, Street Markazi Jamia Masjid, 36050',
  'Toba Tek Singh',
  'Punjab',
  'Pakistan',
  'https://www.google.com/maps/search/?api=1&query=Tiny%20Tots%2C%20Shop%20No.%20169%2C%20Street%20Markazi%20Jamia%20Masjid%2C%20Toba%20Tek%20Singh%2C%20Punjab%2C%20Pakistan%2C%2036050',
  true,
  true,
  0
)
on conflict (slug) do nothing;
