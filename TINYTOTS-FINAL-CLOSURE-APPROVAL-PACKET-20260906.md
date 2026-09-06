# TinyTots — Final Closure Approval Packet

**Date:** 2026-09-06
**Branch:** `electron-redesign-2026-09-06`
**Electron HEAD:** `2f7c906`
**Scope of this document:** READ-ONLY / REPORT-ONLY. No migrations applied, no production data modified, no accounts deactivated, no code edited, nothing committed or pushed. DNS, mail DNS and Supabase Auth URLs untouched.

Final closure is blocked pending three owner approvals:

1. Production migration approval (Store Assignment).
2. Decision on 3 active admin-role QA accounts.
3. Go / no-go on the narrow POS checkout/print fix (D1–D4).

This packet is the evidence for all three. The decision block is at the end.

---

## 1. Migration approval packet

**Live migration history ends at `20260903013551`.** Confirmed by direct `information_schema` query (not file inference): `public.locations`, `public.variant_location_stock`, `public.product_location_tags`, `orders.location_id`, `sales.location_id` — **none exist in the live database.** `products.id` and `variants.id` are `bigint`.

Project: `vldjscskhsrrzdhhvcht` — "Tiny Tots Automated System" (production).

### A. `20260906060000_location_inventory_foundation.sql`

**Full SQL:**

```sql
-- Multi-location data foundation (additive groundwork only).
--
-- Adds `locations` (physical TinyTots stores) and `variant_location_stock`
-- (per-store stock counts per variant) so a future store locator, PDP
-- "available at store" experience, and branch-aware Electron POS can be
-- built without another schema rewrite.
--
-- Does NOT touch existing stock authority: public.variants.stock remains the
-- sole source of truth for website ordering/checkout, and the existing
-- trg_deduct_stock_order_item / trg_restore_stock_order_item / deduct_stock
-- triggers are untouched. This migration creates structure only — no data
-- migration, no backfill, no trigger changes, no RLS changes on existing
-- tables. NOT applied to any live database as part of this change.

-- ============ LOCATIONS ============
create table if not exists public.locations (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  address text,
  city text,
  region text,
  country text not null default 'Pakistan',
  latitude numeric(9,6),
  longitude numeric(9,6),
  google_place_id text,
  directions_url text,
  is_public boolean not null default false,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.locations is
  'Physical TinyTots store locations. is_public/is_active gate customer-facing visibility (store locator, PDP availability). Rows are added manually by an admin with verified address/contact data — never auto-generated.';
comment on column public.locations.directions_url is
  'Verified Google Maps / directions link for this location. Never derive or guess this from an address string.';
comment on column public.locations.latitude is
  'Verified coordinate only. Leave null rather than estimate.';
comment on column public.locations.longitude is
  'Verified coordinate only. Leave null rather than estimate.';
comment on column public.locations.google_place_id is
  'Verified Google Place ID (from Google Maps/Locator Builder), if known. Lets directions_url target the exact business listing via the documented destination_place_id parameter (https://developers.google.com/maps/documentation/urls/get-started#directions-action) with no Maps API key or billing. Leave null rather than guess.';

alter table public.locations enable row level security;

-- Default-deny, then re-open read-only access explicitly (mirrors the
-- anon/authenticated lockdown pattern used across this schema: Supabase
-- grants new tables full access to anon/authenticated by default, so every
-- new table must explicitly revoke that before re-granting the minimum).
revoke all on table public.locations from anon, authenticated;
grant select on table public.locations to anon, authenticated;

create policy "Public can view active public locations"
on public.locations
for select
using (is_public = true and is_active = true);

-- No insert/update/delete policy for anon/authenticated — location rows are
-- service_role (admin) writes only.

-- ============ VARIANT LOCATION STOCK ============
create table if not exists public.variant_location_stock (
  id bigserial primary key,
  variant_id bigint not null references public.variants(id) on delete cascade,
  location_id bigint not null references public.locations(id) on delete cascade,
  stock integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_id, location_id)
);

alter table public.variant_location_stock
  add constraint variant_location_stock_non_negative check (stock >= 0);

create index if not exists variant_location_stock_location_id_idx
  on public.variant_location_stock (location_id);

comment on table public.variant_location_stock is
  'Per-store stock for a variant. Additive/groundwork only: NOT read by checkout or any deduction trigger today. public.variants.stock remains the sole authority for website ordering. No automatic backfill/redistribution from aggregate stock — rows are populated deliberately (future POS/admin), starting empty.';

alter table public.variant_location_stock enable row level security;

-- Fully closed to anon/authenticated: no policies defined (RLS default-deny)
-- and grants explicitly revoked. Public-facing "available at store" reads
-- must go through a server-side service using the service_role key, never
-- direct client queries — this table exposes raw quantities per store and
-- customers should only ever see a derived in-stock/out-of-stock signal.
revoke all on table public.variant_location_stock from anon, authenticated;
```

| Field | Value |
|---|---|
| Filename | `20260906060000_location_inventory_foundation.sql` |
| Committed | **YES** (tracked; commit `fe662a2 feat(inventory): add multi-location data foundation`) |
| Applied live | **NO** |
| Tables created | `public.locations`, `public.variant_location_stock` |
| Columns created | `locations`: id, name, slug, address, city, region, country, latitude, longitude, google_place_id, directions_url, is_public, is_active, display_order, created_at, updated_at. `variant_location_stock`: id, variant_id, location_id, stock, created_at, updated_at |
| FKs | `variant_location_stock.variant_id → variants(id) ON DELETE CASCADE`; `variant_location_stock.location_id → locations(id) ON DELETE CASCADE` |
| Unique constraints | `locations.slug` UNIQUE; `variant_location_stock (variant_id, location_id)` UNIQUE |
| Check constraints | `variant_location_stock_non_negative CHECK (stock >= 0)` |
| Indexes | PK on each table; UNIQUE indexes above; `variant_location_stock_location_id_idx (location_id)` |
| RLS | Enabled on both tables |
| Grants | `locations`: `REVOKE ALL` then `GRANT SELECT` to anon, authenticated. `variant_location_stock`: `REVOKE ALL` from anon, authenticated (no re-grant) |
| Policies | `locations`: `"Public can view active public locations"` — SELECT `USING (is_public = true AND is_active = true)`. `variant_location_stock`: none (RLS default-deny) |
| Insert/seed behavior | None — structure only |
| Effect on existing rows | None — two brand-new empty tables |
| UPDATE/DELETE/TRUNCATE | None |
| Existing stock data changes | None |
| `variants.stock` changes | **NO** |
| Checkout triggers change | **NO** (`deduct_stock`, `deduct_stock_order_item`, `restore_stock_order_item`, `restore_stock_on_cancel` untouched) |
| POS sale behavior immediate change | **NO** |
| Website behavior immediate change | **NO** (no code reads these tables until deployed; `getPublicLocations()` / `getVariantAvailability()` already return `[]` gracefully) |
| Rollback | `DROP TABLE public.variant_location_stock; DROP TABLE public.locations;` — no dependents. Note: `updated_at` columns have `DEFAULT now()` but **no `set_updated_at` trigger** — they won't auto-bump on UPDATE. Not a defect for this feature; flag for a future migration if needed. |

### B. `20260906070000_branch_aware_order_location_columns.sql`

**Full SQL:**

```sql
-- Additive-only contract migration for future branch-aware inventory.
-- Adds a nullable location_id to orders (web) and sales (POS) so a future
-- website/Electron cutover has one shared, canonical place to attribute an
-- order/sale to a physical location, without requiring any existing or new
-- row to have one. NOT applied to any live database. No application code
-- reads or writes this column yet; existing checkout/POS behavior,
-- triggers, and RLS are unchanged.

alter table public.orders
  add column if not exists location_id bigint references public.locations(id);

alter table public.sales
  add column if not exists location_id bigint references public.locations(id);

comment on column public.orders.location_id is
  'Reserved for future branch attribution (e.g. in-store pickup/fulfillment). Null means fulfilled from central/aggregate stock, which is every order today. Not read or written by any current code path.';
comment on column public.sales.location_id is
  'Reserved for future in-store POS branch attribution. Null means no branch tracking, which is every sale today. Not read or written by any current code path.';
```

| Field | Value |
|---|---|
| Filename | `20260906070000_branch_aware_order_location_columns.sql` |
| Committed | **YES** (commit `5aec2ad feat(inventory): prepare branch-aware stock contracts`) |
| Applied live | **NO** |
| Tables created | None |
| Columns created | `public.orders.location_id bigint NULL`; `public.sales.location_id bigint NULL` |
| FKs | `orders.location_id → locations(id)` (NO ACTION on delete — default); `sales.location_id → locations(id)` (NO ACTION) |
| Unique / check / indexes | None (no index on the FK columns) |
| RLS | Unchanged on `orders` / `sales` |
| Grants / policies | Unchanged |
| Insert/seed behavior | None |
| Effect on existing rows | Every existing `orders` / `sales` row gets `location_id = NULL`. No row rewrite beyond the nullable-column add (fast, no default). |
| UPDATE/DELETE/TRUNCATE | None |
| Existing stock data / `variants.stock` | **NO** change |
| Checkout triggers change | **NO** |
| POS / website immediate behavior | **NO** change — no code reads or writes `location_id` |
| Rollback | `ALTER TABLE public.orders DROP COLUMN location_id; ALTER TABLE public.sales DROP COLUMN location_id;` |
| Dependency | Requires `public.locations` (migration A) to exist first — the FK target |

### C. `20260906080000_seed_first_verified_location.sql`

**Full SQL:**

```sql
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
```

| Field | Value |
|---|---|
| Filename | `20260906080000_seed_first_verified_location.sql` |
| Committed | **YES** (commits `6811bae` + `8eda8fa` added coordinates) |
| Applied live | **NO** |
| Tables / columns / FK / constraints / indexes | None created |
| RLS / grants / policies | None changed |
| Insert/seed behavior | **One `INSERT` into `public.locations`** — a single owner-verified row (`name='Tiny Tots'`, `slug='toba-tek-singh'`, Toba Tek Singh / Punjab / Pakistan, verified lat/lng + Google Place ID, `is_public=true`, `is_active=true`). `ON CONFLICT (slug) DO NOTHING` → idempotent, safe to re-run. |
| Effect on existing rows | None (new row only) |
| UPDATE/DELETE/TRUNCATE | None |
| Existing stock / `variants.stock` | **NO** change |
| Checkout / POS triggers | **NO** change |
| POS immediate behavior | **NO** change |
| Website immediate behavior | **YES, once deployed** — `/stores` (`app/stores/page.tsx` via `getPublicLocations()`) begins showing this one verified Toba Tek Singh store instead of an empty state. Intended, owner-verified content. No PDP change (that needs `variant_location_stock` rows, which stay empty). |
| Rollback | `DELETE FROM public.locations WHERE slug = 'toba-tek-singh';` (only safe while nothing references its `id`) |
| Dependency | Requires migration A (`locations` table) |

### D. `20260906140000_product_location_tags.sql` — full drafted SQL

```sql
-- Product ↔ store-location assignment tags (catalog/operational metadata).
--
-- Lets an operator tag a product as "carried at / assigned to" one or more
-- verified physical TinyTots store locations (public.locations), or leave it
-- with no assignment at all. This is CATALOG metadata, not stock: it does
-- not deduct, reserve, transfer, or represent any quantity. A product with
-- zero rows here simply has no store assignment.
--
-- Depends on public.locations (20260906060000_location_inventory_foundation).
-- Additive/groundwork only: NOT applied to any live database as part of this
-- change. No existing table, trigger, RLS policy, grant, or application code
-- path is modified. public.variants.stock remains the sole authoritative
-- aggregate stock; public.variant_location_stock does NOT become
-- authoritative. No backfill — the table starts empty and rows are written
-- deliberately by an operator through the Electron product form / admin API
-- (service_role). Rollback is a plain DROP TABLE.

create table if not exists public.product_location_tags (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  location_id bigint not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (product_id, location_id)
);

comment on table public.product_location_tags is
  'Which verified store location(s) a product is assigned to / carried at. Catalog metadata only — never a stock quantity, reservation, or deduction. Zero rows for a product = no store assignment. Written deliberately by an operator (service_role) via the Electron product form / admin API; not customer-writable. Not read by checkout, POS deduction, low-stock, or the offline queue. ON DELETE CASCADE from both parents keeps it free of orphan rows.';
comment on column public.product_location_tags.product_id is
  'FK public.products(id). Cascades on product delete.';
comment on column public.product_location_tags.location_id is
  'FK public.locations(id). Cascades on location delete. Must reference a real row in public.locations — never a hardcoded "Branch 1"/"Branch 2" identity.';

create index if not exists product_location_tags_location_id_idx
  on public.product_location_tags (location_id);

alter table public.product_location_tags enable row level security;

-- Fully closed to anon/authenticated: Supabase grants new tables full access
-- to anon/authenticated by default, so revoke that and define no policies
-- (RLS default-deny). All reads/writes go through a server-side service
-- using the service_role key (Electron admin API / web admin), never direct
-- client queries. This tag is operational/catalog metadata and is not a
-- customer-facing contract; if a public "carried at store" surface is ever
-- approved it must be exposed through a dedicated server endpoint that
-- returns only store name/slug, mirroring app/api/stores/availability.
revoke all on table public.product_location_tags from anon, authenticated;
```

| Field | Value |
|---|---|
| Filename | `20260906140000_product_location_tags.sql` |
| Committed | **NO** — untracked working-tree file (`?? tinytots-web/web/supabase/migrations/20260906140000_product_location_tags.sql`), drafted this session |
| Applied live | **NO** |
| Tables created | `public.product_location_tags` |
| Columns created | `id bigserial`, `product_id bigint NOT NULL`, `location_id bigint NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()` |
| FKs | `product_id → public.products(id) ON DELETE CASCADE`; `location_id → public.locations(id) ON DELETE CASCADE` |
| Unique constraints | `UNIQUE (product_id, location_id)` |
| Check constraints | None |
| Indexes | PK on `id`; UNIQUE index on `(product_id, location_id)`; `product_location_tags_location_id_idx` on `(location_id)` |
| RLS | Enabled, **no policies** (default-deny) |
| Grants | `REVOKE ALL ... FROM anon, authenticated` (no re-grant) — service_role only |
| Policies | None |
| Insert/seed behavior | None — starts empty, no backfill |
| Effect on existing rows | None — new empty table |
| UPDATE/DELETE/TRUNCATE | None |
| Existing stock data / `variants.stock` | **NO** change |
| `variant_location_stock` | **NOT touched, NOT made authoritative** |
| Checkout triggers change | **NO** |
| POS sale behavior immediate change | **NO** (no code reads this table until the Electron store-assignment UI + admin endpoint ship) |
| Website behavior immediate change | **NO** (not customer-readable; no site code references it) |
| Rollback | `DROP TABLE public.product_location_tags;` — clean, no dependents |
| Static validation | PASS — valid PG17, matches the house `variant_location_stock` grant/RLS pattern |

### Migration order — confirmed

**`060000 → 070000 → 080000 → 140000`**, and the order is mandatory:

- **`060000` first** — creates `public.locations` (and `variant_location_stock`). Nothing else can reference `locations` until it exists.
- **`070000` depends on `060000`** — `orders.location_id` / `sales.location_id` are FKs to `locations(id)`.
- **`080000` depends on `060000`** — it `INSERT`s a row into `locations`. (Independent of `070000`; they could swap, but timestamp order already has `070000` first and that is fine.)
- **`140000` depends on `060000`** (FK `location_id → locations(id)`) **and on `public.products`** (already live). It does **not** depend on `070000` or `080000`, but running it last keeps timestamp order clean and means the seeded Toba Tek Singh row already exists to tag against.

Timestamp ordering is already correct in the filenames; Supabase applies in `version` (timestamp) order.

### Migration risk assessment

**Risk: LOW.** All four are additive: 3 new tables, 2 new nullable columns, 1 verified seed row. Zero `UPDATE`/`DELETE`/`TRUNCATE`. `variants.stock` and every stock trigger untouched. Fully backward-compatible (satisfies the repo rule that migrations must always be backward-compatible). Rollback for each is a single `DROP`/`DELETE`. The only immediate production-visible effect is `/stores` showing the one owner-verified Toba Tek Singh location once deployed — the intended outcome.

**Production data mutation beyond additive schema + verified seed: NO.**

---

## 2. Store tag model check — `product_location_tags`

| Question | Answer |
|---|---|
| `product_id` FK target | `public.products(id)` (`bigint`) |
| `location_id` FK target | `public.locations(id)` (`bigint`, created by migration A) |
| ON DELETE behavior | `CASCADE` on **both** FKs — deleting a product or a location removes its tag rows automatically; no orphan rows, no manual cleanup |
| `UNIQUE (product_id, location_id)` | Yes — a product cannot be tagged to the same location twice |
| Product with **zero** locations | Supported — simply no rows. This is "No store assignment" and is the default for all 82 existing products |
| Product with **one** location | Supported — one row |
| Product with **multiple** locations | Supported — N rows, one per location, bounded by the number of real `locations` |
| Raw location stock involved | **NO** — this table has no quantity column of any kind |
| `variant_location_stock` modified | **NO** — never read or written by this feature |
| Publicly readable | **NO** — RLS default-deny + `REVOKE ALL` from anon/authenticated. Not exposed on the storefront or PDP |
| Renderer writes directly | **NO** — the Electron renderer has no service-role access; writes go through the local backend (`backend/server.js`, `X-POS-Token`-authenticated) or the web admin API, both using `service_role` |
| Managing backend path | Planned: extend the existing product CRUD in `tinytots-app/electron-app/backend/server.js` (the same Express service that owns `/api/products`, `/api/checkout`) with `GET /api/locations` (list active `locations`) and product-create/update accepting an optional `location_ids: number[]` that the server writes to `product_location_tags` in the same request. No new public API, no parallel model. Mirrors the website's existing `lib/locations/*` + `app/api/stores/availability` service pattern. |

**Principle upheld:** Store Assignment ≠ Branch Stock. `product_location_tags` carries *which stores carry a product* (catalog metadata); it has no quantity semantics. `public.variants.stock` remains the sole authoritative aggregate stock for both website checkout and POS deduction; `variant_location_stock` stays groundwork-only and non-authoritative.

---

## 3. Three QA admin accounts

Source table: `public.admin_users` (columns: `id`, `auth_user_id`, `name`, `email`, `role`, `is_active`, `created_at` — there is **no `username` and no `last_login` column**; sign-in timestamps come from `auth.users.last_sign_in_at`). Emails are shown because the local-part *is* the identifying evidence; they are non-routable `@tinytots.local` addresses, not personal contacts.

| # | `admin_users` id | name | email | role | active | created_at | last sign-in | Evidence it is QA/test | Evidence source | Historical actions? | Deactivation affects history? | Deletion safe? | Recommended |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `0ce244ea-…-08d5596170d2` | Blog Entry | `blog-entry-1785701269193@tinytots.local` | admin | true | 2026-08-02 20:08 | 2026-08-02 20:08 (once, at creation) | Non-routable `@tinytots.local`; local-part is a `blog-entry-<epoch-ms>` fixture pattern; paired `customers` row id 41 created the same second; part of the blog-seeding fixture family (customers 41, 42) | Live `admin_users` + `auth.users` join; `customers` table; `git log` blog content migrations | **None** — no `sales` with a matching `cashier`; **no FK from any table references `admin_users`** (checked `information_schema`) | No — nothing references it | Technically yes (no FK), but not recommended | **DEACTIVATE** (`is_active=false`), keep row |
| 2 | `b2be54b6-…-d29f1d0683d1` | Hero UI Verify | `hero-verify-ui-1785682670732@tinytots.local` | admin | true | 2026-08-02 14:57 | 2026-08-02 17:06 | Non-routable `@tinytots.local`; `hero-verify-ui-<epoch-ms>` fixture pattern; part of the hero-slides QA fixture family (customers 33–39); paired `customers` row id 37 | Same as above | **None** (no sales, no FK refs) | No | Technically yes, not recommended | **DEACTIVATE**, keep row |
| 3 | `15988771-…-1cb1a7d5bac1` | QA E2E (temp) | `qa-e2e-2026-09-02@tinytots.local` | admin | true | 2026-09-02 16:26 | **2026-09-05 20:20** (recent) | Name literally contains "(temp)"; `qa-e2e-<date>` fixture; non-routable domain; paired `customers` row id 53 "QA E2E Tester" + discount id 4 `ZZ_QA_TEST_K5C_DELETE_ME` + product 136 `ZZ_QA_TEST_K5C_DO_NOT_SAVE` from the same 2026-09-05 QA batch | Same as above | **None** (no sales, no FK refs) | No | Technically yes, not recommended | **DEACTIVATE**, keep row |

**Context:** deactivating all three leaves 2 active accounts — `Bilal / devxbilal@gmail.com` (**admin**, owner) and `Afshan` (`inventory_only`, real-name Gmail, likely real staff → owner review, expected KEEP). At least one active admin remains, so any last-admin protection is unaffected.

**Why deactivate rather than delete:** even though there are no FK references and deletion is technically safe, `is_active=false` immediately removes their admin access (the app gates on `is_active`), is instantly reversible, and preserves the row + its `auth.users` link for audit. Full deletion (row + matching `auth.users` entry) can follow at the owner's discretion.

---

## 4. POS checkout / print fix — D1–D4

All four live in **one file**: `tinytots-app/electron-app/src/screens/POS.jsx` — the `checkout()` function and the `SaleSuccess` component + its render site. No other file changes.

### D1 — a post-commit `buildSale()` throw is misclassified as "offline"

- **Current behavior:** `checkout()` wraps the network call **and** `buildSale()` **and** `printViaElectron()` + `setLastSale()` in one `try`. After the server has committed the sale (`result.success === true`), `buildSale()` runs at `POS.jsx:249` still inside that `try`. If it throws, control jumps to the bare `catch {}` (line 268), which builds an `OFFLINE-…` receipt, **calls `queueSale(..., clientSaleId)`**, and shows "Sale saved offline".
- **Defect/risk:** a fully committed sale is presented as offline and a redundant sync entry is queued. Duplicate submission is prevented server-side (the queued retry reuses `client_sale_id` → backend returns `deduped: true`), so **no second sale and no double stock deduction** — but the operator is misinformed.
- **Exact change:** wrap the post-commit block (`buildSale` → `resetCart` → `printViaElectron` → `setLastSale`) in its **own nested `try/catch`** inside the `result.success` branch. On throw there: log, `resetCart()`, and `setLastSale({ sale: null, …, printError: "The sale was recorded, but the receipt could not be prepared here. Reprint it from Receipts." })`. Never reach the offline `catch`.
- File/function: `POS.jsx` → `checkout()`.
- Checkout math changes: **NO** · backend submission changes: **NO** · `client_sale_id` changes: **NO** · stock behavior changes: **NO** · printer IPC changes: **NO** · receipt geometry changes: **NO** · cart-clearing timing changes: **YES (intentional)** — `resetCart()` moves to immediately after `buildSale()` (sale is already final; clearing before the print call removes any resubmit window while printing runs).
- **User-visible after fix:** committed sale → always the "Payment successful" panel with the real receipt number; if receipt prep/print failed, an amber line points to Receipts reprint. Never "Sale saved offline" for a sale that actually committed online.

### D2 — 8-second abort after a slow-but-successful commit shows "Sale saved offline"

- **Current behavior:** `AbortController` fires at 8000 ms (`POS.jsx:221-222`). If the server commits but the response is slow or the socket drops, `apiFetch` throws → offline `catch` → `queueSale(clientSaleId)` → "Sale saved offline".
- **Defect/risk:** ambiguous messaging. Because the client never received a response, it genuinely cannot assert "sale completed" — queuing for sync is the honest choice, and the reused `client_sale_id` makes the sync idempotent (`deduped: true`). **No duplicate, no double deduction.** The only gap is that the cashier isn't clearly told "don't re-enter this".
- **Exact change:** **no queue-logic change** (current behavior is correct for a lost response). Sharpen the offline copy in `SaleSuccess` to: *"Saved on this device. It will sync to the server automatically once you're back online — do not re-enter it."*
- File/function: `POS.jsx` → `SaleSuccess` (text only).
- Checkout math: **NO** · backend submission: **NO** · `client_sale_id`: **NO** · stock: **NO** · printer IPC: **NO** · receipt geometry: **NO** · cart-clearing timing: **NO**.
- **User-visible after fix:** same flow, unambiguous instruction not to re-enter the sale.

### D3 — success panel always says "the receipt printed", even when it didn't

- **Current behavior:** `SaleSuccess` body text (`POS.jsx:686-690`) is a two-way branch on `data.offline` only. The online branch always reads *"The sale is recorded and the receipt printed."* — even when `data.printError` is set, contradicting the amber line below it.
- **Defect/risk:** cosmetic but confusing; a cashier reading the first line believes the receipt printed.
- **Exact change:** make it a three-way branch — `offline` → sync copy; `printError` (online) → *"The sale is recorded. The receipt did not print — use Print Again or reprint from Receipts."*; else → *"The sale is recorded and the receipt printed."*
- File/function: `POS.jsx` → `SaleSuccess` (text only).
- Checkout math / backend / `client_sale_id` / stock / printer IPC / receipt geometry / cart timing: **all NO**.
- **User-visible after fix:** the headline sentence matches reality in all three states.

### D4 — "Print Again" discards its result

- **Current behavior:** render site passes `onPrintAgain={() => printViaElectron(lastSale.sale)}` (`POS.jsx:588`); the button calls it and ignores the returned `{ printed, error }` (lines 704-706). A second failed reprint gives the operator **no feedback**.
- **Defect/risk:** operator can't tell whether the retry worked; may keep clicking or walk away without a receipt.
- **Exact change:** give `SaleSuccess` local state `{ state: "idle" | "printing" | "ok" | "error", error }`; `handlePrintAgain()` awaits `onPrintAgain()`, sets the state, and renders a small success/failure line under the buttons. Disable the button while `printing` and when `data.sale` is `null` (the D1 no-receipt case). No parent change beyond the handler already returning the promise.
- File/function: `POS.jsx` → `SaleSuccess`.
- Checkout math / backend submission / `client_sale_id` / stock / printer IPC / receipt geometry / cart timing: **all NO**. `printViaElectron` is reprint-only — it never calls `/api/checkout`.
- **User-visible after fix:** "Print Again" shows a spinner, then "Receipt printed." or "Still couldn't print: … Reprint from Receipts."

### Intended diff (NOT applied)

```diff
--- a/tinytots-app/electron-app/src/screens/POS.jsx
+++ b/tinytots-app/electron-app/src/screens/POS.jsx
@@
       const result = await res.json();
 
       if (!result.success) {
         alert(result.error || result.message);
         return;
       }
 
-      const sale = buildSale({
-        cart,
-        subtotal: result.subtotal,
-        discount: result.discount,
-        tax: result.tax,
-        total: result.total,
-        receiptNumber: result.receipt_number, cashier, paymentMethod,
-      });
-
-      const printResult = await printViaElectron(sale);
-      setLastSale({
-        sale,
-        receiptNumber: result.receipt_number,
-        total: result.total ?? total,
-        offline: false,
-        printError: printResult.printed ? null : printResult.error,
-      });
-
-      resetCart();
+      // The sale is committed on the server from here on. Nothing below may
+      // divert to the offline queue or re-submit — a failure now is a
+      // receipt/display problem only, never a failed transaction.
+      try {
+        const sale = buildSale({
+          cart,
+          subtotal: result.subtotal,
+          discount: result.discount,
+          tax: result.tax,
+          total: result.total,
+          receiptNumber: result.receipt_number, cashier, paymentMethod,
+        });
+
+        resetCart();
+
+        const printResult = await printViaElectron(sale);
+        setLastSale({
+          sale,
+          receiptNumber: result.receipt_number,
+          total: result.total ?? total,
+          offline: false,
+          printError: printResult.printed ? null : printResult.error,
+        });
+      } catch (postCommitErr) {
+        // buildSale / render threw AFTER a committed sale — show the sale as
+        // complete with an unresolved receipt; never re-queue it.
+        console.error("Post-commit receipt error:", postCommitErr);
+        resetCart();
+        setLastSale({
+          sale: null,
+          receiptNumber: result.receipt_number,
+          total: result.total ?? total,
+          offline: false,
+          printError:
+            "The sale was recorded, but the receipt could not be prepared here. Reprint it from Receipts.",
+        });
+      }
     } catch {
       // Offline fallback (or the network genuinely dropped) — still print
       // locally and queue the sync, reusing the SAME clientSaleId. If the
@@
     <div className="flex flex-col gap-3 h-full min-h-0">
@@
       {lastSale && (
         <SaleSuccess
           data={lastSale}
           onNewSale={() => setLastSale(null)}
           onPrintAgain={() => printViaElectron(lastSale.sale)}
         />
       )}
@@
-function SaleSuccess({ data, onNewSale, onPrintAgain }) {
+function SaleSuccess({ data, onNewSale, onPrintAgain }) {
+  const [reprint, setReprint] = useState({ state: "idle", error: null });
+
+  async function handlePrintAgain() {
+    if (!data.sale) return;
+    setReprint({ state: "printing", error: null });
+    const result = await onPrintAgain();
+    setReprint(
+      result?.printed
+        ? { state: "ok", error: null }
+        : { state: "error", error: result?.error || "Printing failed." }
+    );
+  }
+
   return (
     <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
       <div className="absolute inset-0 bg-surface-overlay tt-anim-fade" onClick={onNewSale} />
       <div className="relative w-full max-w-sm rounded-xl bg-surface-panel border border-border-strong p-6 text-center shadow-lg tt-anim-dialog">
         <div className="w-14 h-14 rounded-full bg-success/12 text-success-text flex items-center justify-center mx-auto mb-4">
           <CheckCircle2 size={30} />
         </div>
         <h2 className="type-heading-sm text-text-primary">
           {data.offline ? "Sale saved offline" : "Payment successful"}
         </h2>
         <p className="type-body-sm text-text-secondary mt-1">
-          {data.offline
-            ? "The receipt printed locally and the sale will sync automatically once you're back online."
-            : "The sale is recorded and the receipt printed."}
+          {data.offline
+            ? "Saved on this device. It will sync to the server automatically once you're back online — do not re-enter it."
+            : data.printError
+            ? "The sale is recorded. The receipt did not print — use Print Again or reprint from Receipts."
+            : "The sale is recorded and the receipt printed."}
         </p>
 
         <div className="mt-4 rounded-md border border-border-default bg-surface-sunken px-4 py-3 text-left space-y-1">
           <Row label="Receipt No." value={data.receiptNumber} />
           <Row label="Total Paid" value={formatPKR(data.total)} />
         </div>
 
-        {data.printError && (
-          <p className="type-caption text-warning-text mt-3">
-            Printing failed: {data.printError}. Use "Print Again" or reprint from Receipts.
-          </p>
-        )}
+        {data.printError && (
+          <p className="type-caption text-warning-text mt-3">
+            {data.printError}
+          </p>
+        )}
 
         <div className="mt-5 grid grid-cols-2 gap-2">
-          <Button variant="secondary" onClick={onPrintAgain}>
-            <PrinterIcon size={14} /> Print Again
-          </Button>
+          <Button
+            variant="secondary"
+            onClick={handlePrintAgain}
+            disabled={!data.sale || reprint.state === "printing"}
+            loading={reprint.state === "printing"}
+          >
+            <PrinterIcon size={14} /> Print Again
+          </Button>
           <Button onClick={onNewSale}>New Sale</Button>
         </div>
+
+        {reprint.state === "ok" && (
+          <p className="type-caption text-success-text mt-2">Receipt printed.</p>
+        )}
+        {reprint.state === "error" && (
+          <p className="type-caption text-warning-text mt-2">
+            Still couldn't print: {reprint.error}. Reprint from Receipts.
+          </p>
+        )}
       </div>
     </div>
   );
 }
```

Scope confirmation: `POS.jsx` only. Untouched: `buildSale.js`, `printReceipt.jsx`, `services/api.js`, `services/offlineQueue.js`, `electron/main.js`, `backend/server.js`, all migrations, receipt CSS/template geometry.

---

## 5. Expected print-recovery behavior — does D1–D4 achieve it?

| Spec line | Achieved? | Note |
|---|---|---|
| SALE SUBMISSION FAILS → sale not confirmed | **YES** | `!res.ok` or network throw → offline `catch`; no "success" |
| → checkout remains failed | **YES** (see caveat below) | Shown as "Sale saved offline" (queued), not "payment successful" |
| → do not clear cart | **PARTIAL — by design** | A genuine offline/timeout **does** clear the cart and queue the sale (so it isn't lost and can't be double-typed). A *server business rejection* (`result.success === false`, e.g. out of stock) keeps the cart intact and shows an alert. There is no path that both fails submission **and** silently drops the cart with nothing queued. |
| SALE SUBMISSION SUCCEEDS → sale is final | **YES** | `result.success === true` |
| → capture sale/receipt ID | **YES** | `result.receipt_number` retained in `lastSale` |
| → clear/complete transaction state safely | **YES** | `resetCart()` runs immediately after `buildSale()`, before print |
| → attempt print | **YES** | `printViaElectron(sale)` |
| PRINT SUCCEEDS → show sale completed + receipt printed | **YES** | "Payment successful" + "…and the receipt printed." |
| PRINT FAILS → show sale completed + receipt not printed | **YES (fixed by D3)** | "Payment successful" + "The receipt did not print — use Print Again or reprint from Receipts." |
| → NEVER show whole transaction as failed | **YES (fixed by D1)** | Post-commit throws now stay in the success panel; no "offline" misclassification of a committed online sale |
| → offer Retry Print / Open Receipt | **YES** | "Print Again" in-panel; Receipts screen has Reprint for every persisted sale |
| → Retry Print uses existing sale | **YES** | `printViaElectron(lastSale.sale)` — regenerates the PDF from the same sale object; no `/api/checkout` call |
| → no second sale submission | **YES** | Reprint path never touches `/api/checkout`; Receipts reprint is `GET sale + print` |
| → no second stock deduction | **YES** | Stock deducts once via the `sale_items` trigger; no new `sale_items` on any reprint |

**Every line is met after D1–D4, with one intentional deviation:** on a true offline/timeout, the cart is cleared and the sale is queued (not "kept in the cart") — this is safer than leaving a re-typeable cart, and the reused `client_sale_id` guarantees the eventual sync is idempotent.

---

## 6. Duplicate-sale risk — successful sale + failed print + cashier presses Checkout again

**Current HEAD (`2f7c906`), exact risk:**

1. After **any** terminal path (online success, post-commit throw, or offline queue), `resetCart()` runs and the cart is empty. The Checkout button is `disabled={processing || cart.length === 0}` — so **it cannot be pressed again without re-adding items.**
2. To resubmit, the cashier must re-scan/re-add every line. That generates a **new `crypto.randomUUID()` `client_sale_id`** (line 217), so the backend idempotency check would **not** recognize it — it would be a genuine second sale with a second stock deduction. But this requires deliberate full re-entry, not a double-click or a single "try again" tap.
3. The realistic accidental-duplicate vector — the same submission reaching the server twice (client retry after a lost response, or the offline queue syncing a sale that already committed) — **is fully covered** by the backend: `client_sale_id` is checked before insert, has a `23505` race catch after, and `syncQueuedSales` honors `deduped`. Same `client_sale_id` ⇒ never a second `sales`/`sale_items` row ⇒ never a second trigger-driven stock deduction.

**Verdict:** `client_sale_id` protects the **retry-of-the-same-attempt** path **completely**. It does **not** (and structurally cannot) protect a **manual full re-entry**, because that is a new sale by definition.

**Does the UX misrepresent the transaction in a way that induces re-entry?**

- On current HEAD: mostly no — worst case is "Sale saved offline" (still success framing) with the cart cleared. Low but non-zero risk that a cashier, seeing "offline" for a sale they believe was online, manually re-enters it.
- **After D1–D3:** that residual disappears for the committed-online case — the panel always says "Payment successful", names the receipt number, and (D3) states plainly whether the receipt printed. There is no screen state that tells the cashier the sale failed when it didn't, so no UX-driven reason to re-enter.

Backend idempotency is **not** being relied on alone: D1–D3 remove the misleading UI state, and the cleared cart + disabled button remove the one-tap resubmit.

---

## OWNER APPROVAL PACKET

### A. MIGRATIONS

- **Risk:** LOW
- **Recommendation:** APPROVE — apply in order `20260906060000 → 20260906070000 → 20260906080000 → 20260906140000`. Commit `20260906140000_product_location_tags.sql` first (currently untracked).
- **Exact migrations requiring approval:**
  - `20260906060000_location_inventory_foundation.sql` (committed, not live)
  - `20260906070000_branch_aware_order_location_columns.sql` (committed, not live)
  - `20260906080000_seed_first_verified_location.sql` (committed, not live)
  - `20260906140000_product_location_tags.sql` (**not committed**, not live)
- **Production data mutation beyond additive schema / verified seed:** NO

### B. QA ACCOUNTS

- **Confirmed QA accounts:** 3 — `admin_users` id `0ce244ea-…170d2` (Blog Entry), `b2be54b6-…683d1` (Hero UI Verify), `15988771-…5bac1` (QA E2E (temp)); all `role=admin`, `is_active=true`, no sales, no FK references anywhere
- **Recommended deactivate:** all 3 above (`is_active=false`, keep rows)
- **Recommended keep:** `0cb6f78b-…960db` Bilal (owner, admin)
- **Recommended owner-review:** `a80ca580-…3aeb` Afshan (`inventory_only`, real-name Gmail — confirm real staff; expected KEEP)
- **Delete recommended:** NO — no FK refs, but deactivation is reversible and preserves audit history

### C. POS PRINT FIX

- **Risk:** LOW
- **Recommended:** APPLY (D1–D4, `src/screens/POS.jsx` only)
- **Checkout math changed:** NO
- **Stock logic changed:** NO
- **Sale persistence logic changed:** NO
- **Print-recovery UX changed:** YES — committed sales always show "Payment successful" + accurate receipt-print status; "Print Again" reports its result; offline copy tells the cashier not to re-enter; `resetCart()` moves to immediately post-commit (closes the resubmit-during-print window)

---

## Related evidence documents

- `Electron Redesign Docs/13 - Reports/TEST-DATA-CLEANUP-AUDIT.md` — full read-only test/seed data audit (nothing deleted).
