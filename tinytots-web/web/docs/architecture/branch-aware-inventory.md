# Branch-Aware Inventory & Location Contract

Status: groundwork only. Nothing in this document is applied to a live
database or consumed by any running code today. It exists so the website
and a future branch-aware Electron POS can build toward the same model
without another schema rewrite.

## 1. Current state (authoritative today)

- `public.variants.stock` is the sole aggregate stock authority for both
  the website checkout (`trg_deduct_stock_order_item` /
  `trg_restore_stock_order_item` on `order_items`) and Electron POS
  (`trg_deduct_stock` on `sale_items`, via `deduct_stock()`).
- No location/branch concept existed anywhere in schema or app code prior
  to this branch (audited 2026-09-06).
- `tinytots-app/` (Electron POS) is out of scope for code changes in this
  work; only the shared Supabase schema it also reads is touched, and only
  additively.

## 2. Canonical location identifier

- `public.locations.id` (bigint) is the single canonical location
  identifier, shared across the website and Electron POS — no parallel ID
  scheme.
- `public.locations.slug` is the human-stable reference for URLs/config;
  `id` is the FK-stable reference for data.

## 3. Website contract (built in this branch)

- `public.locations` — store directory (migration
  `20260906060000_location_inventory_foundation.sql`).
- `public.variant_location_stock` — per-store stock (same migration). Not
  read by any deduction trigger; closed to `anon`/`authenticated`.
- `lib/locations/get-public-locations.ts` — public store list, RLS-scoped.
- `lib/locations/get-variant-availability.ts` +
  `/api/stores/availability` — customer-facing "available at store"
  signal, derived from `variant_location_stock`, never raw quantities.
- `orders.location_id` (nullable, migration
  `20260906070000_branch_aware_order_location_columns.sql`) — reserved for
  a future "fulfilled from branch X" attribution. Not read or written by
  any code today.

## 4. Future POS mutation contract (not implemented)

- When Electron POS adopts branch awareness, `sale_items` deduction should
  target `variant_location_stock.stock` for the sale's
  `sales.location_id`, not `public.variants.stock` directly.
- `public.variants.stock` would then become a derived/reconciled aggregate
  (sum of `variant_location_stock` rows) rather than an independently
  writable value. That is a breaking change to today's `deduct_stock()`
  trigger and must be its own deliberate, reviewed migration — not implied
  or pre-built by this contract.
- `sales.location_id` (nullable, migration
  `20260906070000_branch_aware_order_location_columns.sql`) is reserved
  for that future POS write path.

## 5. Order source / location relationship (proposal)

- `orders.location_id`, once populated by a future in-store or
  website-pickup flow, would indicate which branch's
  `variant_location_stock` should be decremented instead of (or during a
  transition period, in addition to) `public.variants.stock`.
- Until that decision is made and implemented, every order continues to
  deduct from `public.variants.stock` exactly as it does today, regardless
  of whether `location_id` is set.

## 6. Migration / cutover plan (sequenced; none of steps 2-5 applied yet)

1. **(this branch)** Structure only: `locations`, `variant_location_stock`,
   `orders.location_id`, `sales.location_id` — all nullable/empty, zero
   behavior change, migrations authored but not applied.
2. Owner supplies verified store data (full address, coordinates or a real
   Maps link); an admin populates `locations` rows.
3. Admin/ops populates `variant_location_stock` (manually or via a POS
   flow), reconciled against `public.variants.stock` — the aggregate stays
   authoritative and must match reality throughout this phase.
4. Electron POS gains a branch-select UI and starts writing
   `sales.location_id`, decrementing `variant_location_stock` for that
   branch.
5. Only after (4) is stable: decide whether `public.variants.stock`
   becomes a generated/reconciled sum vs. staying independently
   authoritative with a reconciliation job. This is a separate, deliberate,
   reviewed migration — explicitly not decided or pre-built here.

## 7. Explicit non-goals of this contract

- Does not change `deduct_stock_order_item()`, `deduct_stock()`, or any
  existing RLS/grants on `variants`, `orders`, `order_items`, `sales`, or
  `sale_items`.
- Does not modify any file under `tinytots-app/` (Electron POS).
- Does not backfill, seed, or guess any `location_id` value on existing
  rows.
