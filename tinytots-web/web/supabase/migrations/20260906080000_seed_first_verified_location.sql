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
-- Coordinates + Place ID (verified 2026-09-06 via Google Maps/Locator
-- Builder representation of the actual location, owner-approved):
--   latitude  30.9714996
--   longitude 72.4801063
--   place_id  ChIJq3uXXhsPIzkRYglWOoG7h1Q
-- directions_url is built from these verified values using Google's
-- documented, key-free Maps URL scheme
-- (https://developers.google.com/maps/documentation/urls/get-started#directions-action):
-- `destination` carries the verified lat/lng as a guaranteed pin, and
-- `destination_place_id` resolves it to the exact business listing. No
-- Maps JavaScript API, Locator Plus, API key, or billing involved — this is
-- a plain externally-opened URL.
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
  latitude,
  longitude,
  google_place_id,
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
  30.9714996,
  72.4801063,
  'ChIJq3uXXhsPIzkRYglWOoG7h1Q',
  'https://www.google.com/maps/dir/?api=1&destination=30.9714996%2C72.4801063&destination_place_id=ChIJq3uXXhsPIzkRYglWOoG7h1Q',
  true,
  true,
  0
)
on conflict (slug) do nothing;
