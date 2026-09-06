# TinyTots — Test / Seeded Data Cleanup Audit

**Date:** 2026-09-06
**Project:** `vldjscskhsrrzdhhvcht` — "Tiny Tots Automated System" (production)
**Method:** READ-ONLY. No `DELETE` / `UPDATE` / `TRUNCATE` performed. No stock recalculated. No rows removed.
**Status:** REPORT ONLY — cleanup deferred for owner approval (§78–§79).

---

## 1. Summary of findings

| Table | Total rows | Confirmed test/QA | Probable (owner review) | Required / real |
|---|---:|---:|---:|---:|
| `admin_users` (staff) | 5 | **3** (active **admin**-role QA accounts) | 1 | 1 |
| `customers` | 23 | 17 | 3 | 3 |
| `orders` | 8 | 5 (guest dev orders) | 2 (team accounts) | 1 review |
| `order_items` | 8 | mirrors orders | — | — |
| `sales` (POS) | 5 | 2 (`cashier = "Test"`) | 3 (real staff names, early smoke) | — |
| `sale_items` | 5 | mirrors sales | — | — |
| `products` | 82 | 2 (`is_active = false`) | 0 | 80 |
| `variants` | 314 | 2 (belong to the 2 test products) | 0 | 312 |
| `discounts` | 4 | **4** (all inactive, expired) | 0 | 0 |
| `goals` | 1 | 0 | 0 | 1 |
| `categories` | 12 | 0 | 0 | 12 |
| `notifications` | 107 | see §6 (byproduct rows) | — | — |

### Blocker-level item (§81)

**3 QA/test accounts in `admin_users` carry `role = 'admin'` and `is_active = true`.** These are fake operational accounts with security implications and should be deactivated or removed **before client handoff**. Details in §2. Owner "Bilal" (`devxbilal@gmail.com`, admin) is unaffected — last-admin protection is not at risk.

### Not blockers

- Both test **products** are `is_active = false`; the `SEC-02` RLS policy (`products_select ... USING (is_active = true)`) means **they are not visible on the public website** and never appear in storefront reads.
- All 4 test **discounts** are `is_active = false` with past `ends_at` — not customer-visible, no active price effect.
- No corrupt production data found. No public-facing fake catalog content. Stock inconsistencies from test transactions exist but are contained (§5).

---

## 2. `admin_users` — staff accounts

| Class | id | name | email | role | active | Evidence | Dependencies | Safe action |
|---|---|---|---|---|---|---|---|---|
| **A — CONFIRMED TEST** | `0ce244ea…170d2` | Blog Entry | `blog-entry-1785701269193@tinytots.local` | admin | true | Non-routable `@tinytots.local` domain; name/email are a QA fixture; matches `customers` id 41 created same second | May own an `auth.users` row; check `signage`/content `created_by` refs before hard delete | Set `is_active = false` now; delete after confirming no content FK |
| **A — CONFIRMED TEST** | `15988771…b4fc0` | QA E2E (temp) | `qa-e2e-2026-09-02@tinytots.local` | admin | true | Name literally says "(temp)"; `@tinytots.local`; pairs with `customers` id 53 "QA E2E Tester" | `auth.users` row likely | Set `is_active = false` now; delete with its `auth.users` entry |
| **A — CONFIRMED TEST** | `b2be54b6…683d1` | Hero UI Verify | `hero-verify-ui-1785682670732@tinytots.local` | admin | true | `@tinytots.local` QA fixture; pairs with `customers` id 37 | `auth.users` row likely | Set `is_active = false` now; delete after auth cleanup |
| **B — PROBABLE / REVIEW** | `a80ca580…3aeb` | Afshan | `afshanishaq826@gmail.com` | inventory_only | true | Real Gmail, real given name, non-admin role, created 2026-07-21 | Unknown | **Owner confirm**: real staff member? If yes → KEEP |
| **C — REQUIRED** | `0cb6f78b…60db` | Bilal | `devxbilal@gmail.com` | admin | true | Owner / operator account | Primary admin | **KEEP** |

> Recommended immediate mitigation (owner-approved, separate run): `UPDATE public.admin_users SET is_active = false WHERE email LIKE '%@tinytots.local';` — reversible, removes admin access without touching `auth.users` or FK history. Full deletion (incl. `auth.users`) can follow.

---

## 3. `customers`

### A — CONFIRMED TEST/QA (17 rows) — synthetic domains, `orders_count = 0`, no dependencies

| id | full_name | email | Evidence |
|---|---|---|---|
| 28 | — | `checkout-auth-1785583271172@example.com` | `@example.com` + `checkout-auth-<ts>` QA pattern |
| 30 | — | `checkout-auth-1785583498836@example.com` | same |
| 33 | — | `hero-slides-verify-1785678873741@tinytots.local` | `@tinytots.local` QA fixture |
| 34 | — | `hero-ui-verify-1785679031137@tinytots.local` | same |
| 35 | — | `hero-upload-verify-1785680046358@tinytots.local` | same |
| 36 | — | `hero-slides-setup-1785681085133@tinytots.local` | same |
| 37 | — | `hero-verify-ui-1785681293923@tinytots.local` | same (pairs with `admin_users` Hero UI Verify) |
| 38 | — | `hero-recrop-1785681703219@tinytots.local` | same |
| 39 | — | `hero-verify-ui-1785682670732@tinytots.local` | same |
| 40 | — | `help-seed-1785692919285@tinytots.local` | help-centre seeding fixture |
| 41 | — | `blog-entry-1785701269193@tinytots.local` | pairs with `admin_users` Blog Entry |
| 42 | — | `blog-entry-1785715431943@tinytots.local` | blog seeding fixture |
| 43 | — | `auth.reset.test@tinytots.local` | password-reset test |
| 44 | — | `auth-reset-test@tinytotsofficial.com` | password-reset test |
| 45 | — | `auth-admin-test@tinytotsofficial.com` | admin-auth test |
| 52 | — | `qa-batchh-2026-09-03@tinytots.local` | dated QA batch fixture |
| 53 | QA E2E Tester | `qa-e2e-2026-09-02@tinytots.local` | phone `03001234567`; pairs with `admin_users` QA E2E (temp) |

Safe action: deletable after owner approval. Each may have an `auth.users` row — remove that in the same step. None referenced by `orders` (`orders_count = 0`).

### B — PROBABLE TEST — OWNER REVIEW

| id | full_name | email | orders_count | Evidence / caution |
|---|---|---|---|---|
| 21 | `TEST` | `fatehbibi998@gmail.com` | 0 | Display name is `TEST`, but a real Gmail. Likely a test signup; confirm with owner. |
| 19 | `Sarim` | `sarimjalil91@gmail.com` | 1 | Dev/QA team Gmail alias. **Has order 16** — see §4. Removing needs order + stock handling. |
| 20 | `Nusrat` | `sarimjalil88@gmail.com` | 1 | Dev/QA team Gmail alias. **Has order 17** — see §4. Removing needs order + stock handling. |

### D — REAL / UNKNOWN — DO NOT TOUCH

| id | full_name | email | Note |
|---|---|---|---|
| 2 | Muhammad Bilal Saim | `devxbilal@gmail.com` | Owner/dev personal customer account |
| 3 | Malik  Bilal | `sarimjalil99@gmail.com` | Team account, `orders_count = 0` |
| 47 | Asad Mehar | `meharasad2017@gmail.com` | Real name + Gmail, `orders_count = 0` |

---

## 4. `orders` + `order_items` (8 each)

| id | order_number | customer | guest_name | status | total | Class | Evidence |
|---|---|---|---|---|---:|---|---|
| 5 | ORD-1783923574843 | guest | Muhammad Bilal Saim | new | 2649.00 | A | Dev guest checkout, phone `03001234567`, 2026-07-13 |
| 6 | ORD-1783923878831 | guest | Muhammad Bilal Saim | new | 1549.00 | A | same session |
| 7 | ORD-1784105564732 | guest | Muhammad Bilal Saim | new | 1449.00 | A | same, 2026-07-15 |
| 16 | ORD-1784875796185 | id 19 Sarim | — | new | 3100.00 | B | Team account order, 2026-07-24 |
| 17 | ORD-1784876887282 | id 20 Nusrat | — | new | 1500.00 | B | Team account order, 2026-07-24 |
| 35 | ORD-1786375632496 | guest | Muhammad Bilal Saim | new | 150.00 | A | Dev guest, Rs 150, 2026-08-10 |
| 36 | ORD-1786375735800 | guest | Muhammad Bilal Saim | new | 150.00 | A | same, 2026-08-10 |
| 37 | ORD-1786464736457 | guest | Muhammad Bilal Saim | new | 150.00 | A | same, 2026-08-11 |

- **All 8 orders are `status = 'new'`** (never advanced to fulfilment / shipped / delivered) and **`stock_restored = false`**.
- Every order still holds its stock deduction (the `order_items` → `deduct_stock_order_item` trigger fired at insert; nothing restored it).
- `order_items`: 8 rows, one per order (1 line each). Same classification as parent.

**Deletion caution (§75/§76):** deleting these order rows **without** first restoring the deducted units would leave `variants.stock` permanently under-counted for the affected variants. Correct order of operations if the owner approves cleanup:
1. For each order, compute per-variant deducted qty from `order_items`.
2. `UPDATE public.variants SET stock = stock + <qty>` for each (a manual stock correction, **or** flip `status` to `cancelled` and let `restore_stock_on_cancel` do it idempotently — preferred, uses existing tested path).
3. Then delete `order_items`, then `orders`.
4. Only then, if also removing customers 19/20, delete those customer rows + their `auth.users` entries.

---

## 5. `sales` + `sale_items` (POS, 5 each)

| id | receipt_number | cashier | total | created_at | Class | Evidence |
|---|---|---|---:|---|---|---|
| 104 | TT-1786266196429 | Asif Javed | 1575.00 | 2026-08-09 | B | Real staff name; early POS smoke; sold variant 678 (real product) |
| 105 | TT-1786267488665 | **Test** | 1260.00 | 2026-08-09 | A | `cashier = "Test"`; sold variant 240 "Boy Bodysuit" |
| 106 | TT-1786355976082 | ASIF JAVED | 1500.00 | 2026-08-10 | B | Real staff name; sold variant 678 |
| 107 | TT-1786361352217 | NUSRAT SOHAIL | 1500.00 | 2026-08-10 | B | Real staff name; sold variant 678 |
| 108 | TT-1788702802909 | **Test** | 100.00 | **2026-09-06 13:53** | A | `cashier = "Test"`; sold variant 679 of **"TEST PRODUCT - DO NOT SHIP"**; Rs 100 — the most recent regression/print test sale |

- All 5 are `status = 'completed'`. Each deducted stock once via the `sale_items` → `deduct_stock` trigger. There is **no POS-side "restore on cancel"** equivalent, so a plain delete of `sales`/`sale_items` rows would under-count `variants.stock` for variants 678 (×3), 240 (×1), 679 (×1).
- Sale 108 is almost certainly the transaction behind the owner's "sale succeeded but receipt print failed" report (see the checkout→print analysis in the closure response). It committed cleanly; only printing failed.

**Recommendation:** POS sales are the store's financial ledger. Even test ones. Preferred handling is to **keep** rows 104/106/107 (real staff, plausibly legitimate opening-day activity — owner to confirm) and, for 105 + 108, either keep as-is (harmless, `cashier = "Test"` is self-documenting) **or** delete with a matching `+1` stock correction on variants 240 and 679. Do not bulk-delete without the stock step.

---

## 6. `discounts` (4) — all CONFIRMED test, all inactive

| id | name | value | is_active | ends_at | Safe action |
|---|---|---:|---|---|---|
| 1 | Test Sale | 20% | false | 2026-07-21 (past) | Deletable; no child table, `product_ids` is an array column — no FK |
| 2 | Test | 20% | false | 2026-07-21 (past) | same |
| 3 | Test | 10% | false | 2026-07-24 (past) | same |
| 4 | ZZ_QA_TEST_K5C_DELETE_ME | 5% | false | 2026-09-05 (past) | Name is an explicit self-delete marker; deletable |

No dependency risk. Safe cleanup set.

---

## 7. `products` / `variants` — 2 test products

| Class | product id | name | sku | is_active | variant | Evidence | Dependencies |
|---|---|---|---|---|---|---|---|
| A — CONFIRMED | 131 | `TEST PRODUCT - DO NOT SHIP` | `TEST1` | **false** | 679 | Explicit name; created 2026-08-10 | **Referenced by `sale_items` (sale 108).** Cannot hard-delete without first removing that sale line (+ stock correction). |
| A — CONFIRMED | 136 | `ZZ_QA_TEST_K5C_DO_NOT_SAVE` | `ZZQA-K5C-TEST` | **false** | (1) | Explicit name; created 2026-09-05; pairs with discount id 4 | No `sale_items` / `order_items` refs found → variant + product deletable directly |

Neither is public (`is_active = false` + `SEC-02` RLS). Low urgency. Product 136 is cleanly removable; product 131 is pinned by sale 108's history.

---

## 8. `notifications` (107)

Not seeded — these are **runtime byproducts** of the test sales/orders/stock events above (e.g. "Sale Completed — Invoice #TT-…", "Low Stock", "Out of Stock" from the `createNotification` calls in `backend/server.js`). They carry no FK dependencies and no financial meaning. Not classified individually. Optional: bulk-delete rows whose `action_payload.saleId` / `action_payload.variantId` point at the confirmed test sales, or simply leave them — they age out of the bell UI. **Not a blocker, not required.**

---

## 9. Cleanup sets (DO NOT EXECUTE — owner-approved separate run)

### SAFE CLEANUP SET (low risk, no stock impact, no financial history)
1. `discounts` id 1, 2, 3, 4 — direct delete.
2. `products` id 136 + its variant — direct delete (no txn refs).
3. `customers` ids 28, 30, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 52, 53 — delete row + matching `auth.users` entry. (`orders_count = 0`, no `orders` refs.)
4. `admin_users` `@tinytots.local` rows (Blog Entry, QA E2E (temp), Hero UI Verify) — **first** `is_active = false` (immediate, reversible), then delete row + `auth.users` entry once content-FK check is clean.

**Order of operations for set:** discounts → product 136 variant → product 136 → customers (app row then auth row) → admin_users (deactivate now; delete later).

### OWNER REVIEW SET (needs a decision before any action)
- `customers` id 21 (`full_name = "TEST"`, real Gmail) — real signup or test?
- `customers` id 19 "Sarim" + id 20 "Nusrat" — remove team accounts? Requires cascading `orders` 16/17 + `order_items` + stock restore first.
- `orders` 5, 6, 7, 35, 36, 37 (dev guest checkouts) + 16, 17 (team) — remove? Each needs a stock restore (prefer flipping `status` → `cancelled` to reuse `restore_stock_on_cancel`) before delete.
- `sales` 104, 106, 107 (real staff names) — legitimate early activity or smoke tests? Financial-ledger rows — default KEEP.
- `sales` 105, 108 (`cashier = "Test"`) — keep (harmless) or delete with +1 stock correction on variants 240, 679.
- `products` id 131 "TEST PRODUCT - DO NOT SHIP" — pinned by sale 108; only removable if sale 108 is also removed.
- `admin_users` Afshan (`inventory_only`) — confirm real staff (expected KEEP).

### KEEP SET (required / real)
- `admin_users` Bilal (`devxbilal@gmail.com`, admin).
- `customers` ids 2, 3, 47.
- `goals` — the single row `704e0595-…` (real performance goal, consumed by Dashboard).
- All 12 `categories`, all 80 non-test products / 312 non-test variants.
- All `site_pages` / homepage / help / blog CMS content (seeded intentionally by migrations — required system data).

---

## 10. Stock-consistency note (§76)

No inventory was altered by this audit. The following test transactions currently hold live stock deductions that a naive row-delete would strand:

| Source | Variant(s) affected | Units to restore on cleanup |
|---|---|---|
| `orders` 5, 6, 7, 16, 17, 35, 36, 37 | per `order_items` (1 line each) | flip `status` → `cancelled` to auto-restore via `restore_stock_on_cancel` (idempotent), then delete |
| `sales` 105 | variant 240 | +1 manual (`variants.stock`) |
| `sales` 108 | variant 679 | +1 manual (`variants.stock`) |
| `sales` 104, 106, 107 | variant 678 (×3) | only if owner classifies these as test |

Any cleanup run must pair every transactional delete with the corresponding stock correction in the same operation.

---

## 11. Verdict (original audit, 2026-09-06 — before any action)

- **Data deleted:** NONE
- **Stock modified:** NO
- **Real/unknown rows touched:** NONE
- **Corrupt production data:** none found
- **Public fake catalog content:** none (both test products `is_active = false`, RLS-hidden)
- **Fake operational accounts with security implications:** **YES — 3 active admin-role QA accounts in `admin_users`.** Recommend owner deactivate (`is_active = false`) before client handoff; full deletion can follow. This is the only finding at blocker severity.
- **Cleanup execution:** DEFERRED FOR OWNER APPROVAL (§79).

---

## 12. Post-closure cleanup — EXECUTED 2026-09-06

Owner-approved: deactivate the 3 QA admin accounts, then remove **only** rows
classified CONFIRMED TEST/SEEDED where relational + stock safety is fully
provable. Probable / review / unknown / real rows left untouched. The 3 QA
admin rows were **deactivated, not deleted** (rows + `auth.users` links kept).

### QA admin accounts (during final closure, `is_active = false` — NOT deleted)

| id | name | now |
|---|---|---|
| `0ce244ea-…08d5596170d2` | Blog Entry | `is_active = false` |
| `b2be54b6-…d29f1d0683d1` | Hero UI Verify | `is_active = false` |
| `15988771-…1cb1a7d5bac1` | QA E2E (temp) | `is_active = false` |

`Bilal` (admin) and `Afshan` (`inventory_only`) remain **active**. ≥1 active admin.

### Rows DELETED this run (atomic, single transaction)

| Table | Rows deleted | Count | Cascade / effect |
|---|---|---:|---|
| `discounts` | ids 1, 2, 3, 4 | 4 | inactive, expired, no coupon/order references, no FK children |
| `products` | id **136** (`ZZ_QA_TEST_K5C_DO_NOT_SAVE`) | 1 | `is_active=false`; 0 `sale_items` / 0 `order_items` / 0 `product_location_tags`; its 1 `variant` + 1 `product_images` row cascade-deleted. Its `stock=1` was fabricated QA data on a fake product (Class A — no real aggregate affected). |
| `customers` | ids 28, 30, 33, 34, 35, 36, 37, 38, 40, 42, 43, 44, 45, 52 | 14 | synthetic `@tinytots.local` / `@example.com`; `orders_count=0`; no orders / complaints / reviews / addresses / wishlist / referrals; 13 welcome `vouchers` cascade-deleted |

`variants` total 314 → 313 (product 136's variant). `customers` 23 → 9. `discounts` 4 → 0. `products` 82 → 81 (website-visible catalog **unchanged** — 136 was never public).

### Rows RECLASSIFIED to OWNER REVIEW (were "confirmed" in the closure summary, held back on re-validation)

| Row(s) | Reason held back |
|---|---|
| `customers` 39, 41, 53 | `auth_user_id` is **shared with a preserved QA admin account** (Hero UI Verify / Blog Entry / QA E2E (temp)). Deleting risks entangling with the "keep the QA admins and their auth.users links" directive. |
| `products` 131 (`TEST PRODUCT - DO NOT SHIP`) | Pinned by **1 `sale_items` + 3 `order_items`** rows (RESTRICT FK on `variants`). Only removable if those transactions are removed first. |
| `orders` 5, 6, 7, 35, 36, 37 (+ `order_items`) | Class **C** — stock deduction from `deduct_stock_order_item` is **still present** (`status='new'`, `stock_restored=false`). Reversal is calculable but **not provable** that `variants.stock` hasn't been manually recounted since (weeks elapsed). §8: uncertain → owner review. |
| `sales` 105, 108 (+ `sale_items`) | Class **C** — `sale_items → deduct_stock` deduction still present, no POS restore path. Same non-provability. §8: owner review. |
| `customers` 19, 20, 21; `orders` 16, 17; `sales` 104, 106, 107 | Already "probable / owner-review" in the original audit — untouched. |

### Stock

- Stock corrections **required**: none for the deleted set.
- Stock corrections **performed**: **NONE**.
- `variants.stock` of every real product: **unchanged**. `negative_stock_variants = 0`. Aggregate stock internally consistent.
- The held-back transactional test data (orders 5/6/7/35/36/37, sales 105/108) still carries its original stock deductions — a **separate** owner-approved pass must pair each delete with a `status → cancelled` restore (orders) or a proven manual `+qty` (sales).

### Post-cleanup verification (read-only)

| Check | Result |
|---|---|
| Deleted customers / product / discounts gone | YES (0 remain) |
| Review rows still present (customers 19/20/21/39/41/53, product 131, orders ×8, sales ×5) | YES |
| Bilal active / Afshan active / 3 QA admins inactive | YES |
| Real catalog (81 products / 313 variants), real customers (9), real orders (8), real sales (5) | intact |
| Tiny Tots — Toba Tek Singh location | present, once |
| `product_location_tags` schema | intact (0 rows) |
| FK breakage | none |
| Negative stock | none |
| Website-visible catalog missing a legitimate product | no (deleted product was `is_active=false`) |

### Known residue (minor, non-blocking)

- 6 orphaned `auth.users` rows for deleted test customers (28, 30, 43 have standalone auth ids; the other deleted customers had `auth_user_id = null`). Non-routable `@tinytots.local` / `@example.com` addresses — cannot authenticate to anything meaningful. Left in place to avoid touching the `auth` schema in this scoped pass; safe to remove in a future auth-cleanup step.
- Product 136's image file remains in the `product-images` Storage bucket (only the DB row cascaded). Orphaned, unreferenced.

**Probable / owner-review / unknown / real data deleted this run: NONE.**
