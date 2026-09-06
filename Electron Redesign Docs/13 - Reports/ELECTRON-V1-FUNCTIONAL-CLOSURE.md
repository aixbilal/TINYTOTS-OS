# TinyTots Electron — V1 Functional Closure

**Status:** FUNCTIONAL SCOPE FROZEN (Batch 6B)
**Branch:** `electron-redesign-2026-09-06`
**Closing SHA:** _(this batch's final commit — see git log)_
**Date:** 2026-09-06

This is a release-scope truth record, not a design document. The next phase is
owner UI/UX reference review → final smooth redesign → permanent design-system
consolidation → full regression → packaged certification → V1 delivery.

---

## Implemented V1 surfaces (routes)

| Route | Access | Notes |
|---|---|---|
| `/` splash, `/login` | public | unchanged |
| `/dashboard` | authenticated | unchanged |
| `/pos` | authenticated | guest checkout only (customer assignment deferred — see below) |
| `/inventory` | admin | + **AI "Generate description"** in Add/Edit product |
| `/categories` | admin | read-only, derived from `/api/inventory` |
| `/low-stock` | admin | unchanged |
| `/performance` | admin | unchanged |
| `/reports` | admin | consolidated review from `/api/performance/summary` |
| `/receipts` | admin | detail + reprint; zero-discount line now suppressed |
| `/customers` | admin | read-only list from canonical `public.customers` |
| `/customers/:id` | admin | identity + online-order history |
| `/users` | admin | GET/POST/DELETE `/api/users`; last-admin delete guard |
| `/settings/printer` | admin | machine-local receipt-printer selection |
| `/profile` | any user | read-only session view |

## Implemented operational capabilities

- **Receipt printing** — machine-local `userData/printer-config.json`; **no runtime
  fallback** (no hardcoded model, no Windows-default, no first-printer). Receipt
  print + cash-drawer IPC + backend reprint all use the configured printer and
  fail with a clear message when none is set or it is not installed.
- **Printer enumeration** — Electron `webContents.getPrintersAsync()` with a
  PowerShell + JSON fallback; replaced `pdf-to-printer.getPrinters()` which
  crashes on the POS-80C driver's wrapped paper-name list.
- **User safety** — `DELETE /api/users/:id` refuses to remove the final admin
  (server-authoritative); best-effort self-delete block via `acting_user_id`.
- **AI product description** — `POST /api/products/generate-description` on the
  Electron backend, `X-POS-Token` gated, Groq primary → one Gemini fallback,
  in-process rate limit (6/min), facts-only prompt, provider output entity-
  escaped into `<p>` paragraphs. Renderer never sees provider keys.
- **Receipt formatting** — `-0.00` eliminated: `money()` collapses float noise /
  negative zero; a zero discount line is omitted on the thermal receipt and in
  the on-screen receipt detail.
- **Customers (read)** — `GET /api/customers`, `GET /api/customers/:id` reading
  the website's canonical `public.customers`; `auth_user_id` never exposed.

## Hardware — verified

| Device | Status | Detail |
|---|---|---|
| Receipt printer | **PHYSICALLY VERIFIED** | POS-80C on the owner's current Windows machine — real print produced paper |

## Hardware — not available for test

| Device | Status |
|---|---|
| Barcode scanner | NOT PHYSICALLY VERIFIED — hardware unavailable |
| QR scanner | NOT PHYSICALLY VERIFIED — hardware unavailable |
| Cash drawer | NOT PHYSICALLY VERIFIED — hardware unavailable (code/config path verified) |

## Database migrations

| File | State | Purpose |
|---|---|---|
| `tinytots-web/web/supabase/migrations/20260906130000_pos_sales_customer_id.sql` | **CREATED, NOT APPLIED** | additive nullable `public.sales.customer_id → public.customers(id)` + partial index. Backward compatible (NULL = guest = every POS sale today). Not applied because no authorized non-production Supabase target could be identified; the only real database is the shared production project behind the live website + POS. |

## AI provider state

- Route + provider chain implemented in `tinytots-app/electron-app/backend/lib/ai/`
  (`groq.js`, `gemini.js`, `productDescription.js`).
- Env var names (values never logged, never sent to renderer, never `VITE_*`):
  `GROQ_API_KEY`, `GROQ_MODEL`, `GEMINI_PRODUCT_DESCRIPTION_API_KEY`, `GEMINI_MODEL`.
- Keys are **not present** in this machine's `backend/.env` → the feature returns
  a graceful "write it manually" message. Real provider call: **NOT RUN**.
- Manual product creation is unaffected whether or not AI is configured.

## Printer state

- Configured receipt printer: selected by the operator in `/settings/printer`
  (POS-80C on this machine). Preference persists in `userData/printer-config.json`
  across restarts by file nature.
- No runtime fallback of any kind. Verified: no `POS-80C` / `LEGACY_*` constant in
  any runtime path (only comments).

## Tax

- Source: `POS_TAX_RATE` env var, read at `backend/server.js` (`const POS_TAX_RATE =
  Number(process.env.POS_TAX_RATE ?? 0)`), applied as `tax = taxableAmount * POS_TAX_RATE`.
- Effective configured rate **in the committed repo**: **0%** (`POS_TAX_RATE` is
  absent from `backend/.env`). The 5% seen on the physical test receipt came from
  an unversioned local `.env` override.
- **OWNER BUSINESS DECISION REQUIRED** — there is no documented TinyTots decision
  authorizing a specific POS tax rate. No tax UI or calculation change was made.

## Post-V1 deferrals

| Item | Classification | Reason |
|---|---|---|
| POS customer selector + sale persistence | DEFERRED | needs `sales.customer_id` migration applied against an authorized non-prod DB |
| Offline customer association | DEFERRED | follows the above |
| Server-authoritative self-delete enforcement | DEFERRED | local session model has no server-side user identity |
| Activity Logs / Audit Logs | DEFERRED | notifications ≠ audit log; no real audit contract exists |
| Sessions / Security Center | DEFERRED | current auth model has no session/RBAC backend |
| Backup / Import / Export | DEFERRED | Supabase is authoritative; no defined safe export/restore strategy |
| Full Store Settings suite | DEFERRED | only the printer preference is needed for V1 |
| Category mutation (create/rename/delete) | DEFERRED | no `/api/categories` contract; categories are derived data |
| Profile editing / password change | DEFERRED | read-only by design; no self-service mutation contract |
| Report export (CSV/PDF) | DEFERRED | no existing export util |
| Cash received / change | DEFERRED | optional; adds a checkout business-logic surface — post-V1 |
| Refund workflow | DEFERRED | touches sales/stock/accounting/audit; no safe contract — must not be faked |
| Hold / park sale | DEFERRED | no durable persistence path |
| Split payment | DEFERRED | no payment-allocation model |

## Owner decisions remaining

1. **POS tax rate** — confirm the intended rate and where it is authoritatively set.
2. **`sales.customer_id` migration** — approve applying it (and name the target DB) to unlock POS customer association.
3. **AI keys** — provide `GROQ_API_KEY` (+ optional `GEMINI_PRODUCT_DESCRIPTION_API_KEY`) in `backend/.env` to activate description generation.
4. Physical verification of barcode scanner, QR scanner, and cash drawer once hardware is available.

## Existing functional locks (unchanged this batch)

`variants.stock` as stock authority · authoritative backend pricing · subtotal /
discount / tax / total math · `client_sale_id` idempotency · offline queue ·
receipt numbering · receipt printing & reprint · printer configuration · cash
drawer IPC · barcode/QR label generation · authentication · inventory CRUD ·
image upload · performance formulas · reports · customers read contract.
