# Current Screen Gap Audit

| Field | Value |
|---|---|
| Created | 2026-09-06 |
| Branch | `electron-redesign-2026-09-06` |
| After | Reference-driven redesign mega batch R1–R4 |
| Package | `tinytots-app/electron-app` |
| Router entry | `src/main.jsx` (HashRouter) |

## Purpose

Reconcile the documented screen library (`07 - Screens/07-01 … 07-30`,
`17 - Assets/Reference Library` CSL sheets) against what is actually
implemented and wired to a backend contract in the Electron app, and
classify the delta into a build roadmap for the next batch.

Backend contract source: `tinytots-app/electron-app/backend/server.js`.

## Classification legend

| Class | Meaning |
|---|---|
| **IMPLEMENTED + ALIGNED** | Screen exists, is routed, and now matches the dark reference system. |
| **IMPLEMENTED + PARTIAL** | Screen exists and is reference-aligned, but a reference sub-state / capability is not built because the contract for it is missing or thin. |
| **SAFE TO BUILD FROM EXISTING CONTRACTS** | Not a screen today, but every field it needs is already returned by an existing endpoint — pure UI work. |
| **REQUIRES BACKEND CONTRACT** | Needs a new/changed endpoint, table, or IPC before it can be built honestly. |
| **FUTURE BY SPEC** | Documented as a later phase; no near-term work. |
| **DUPLICATE / CONSOLIDATE** | Covered by another implemented screen; doc should fold in. |
| **OWNER DECISION REQUIRED** | Scope/behavior question only the owner can answer. |

---

## A. Implemented + aligned

| Doc | Screen | Route | Notes |
|---|---|---|---|
| 07-01 | Dashboard | `/dashboard` | Greeting, 5 KPI tiles (`/api/dashboard-summary` + derived AOV), Sales Overview + Goal Summary (`/api/performance/summary`), Low Stock (`/api/low-stock`), Top Categories, Recent Activity (`/api/notifications`), Quick Actions. All modules real-data-gated with loading/empty/error states. |
| 07-02 | POS | `/pos` | Product workspace (grid + live filter over `/api/products`), cart, discount/tax/total, tender selector, idempotent `checkout()`, offline queue, receipt-success panel, cash-drawer IPC, global ScannerListener. |
| 07-03 | Receipts | `/receipts` | Search + date range + payment filter + pagination over `/api/receipts`; reprint / download preserved. |
| 07-04 | Receipt Details | (panel in `/receipts`) | `ReceiptDetailPanel` — detail rows + paper-style preview from `/api/receipts/:id`; preview identity now from `receiptConfig` (was a hard-coded placeholder). |
| 07-05 | Products / Inventory | `/inventory` (browse) | Grid / list toggle, search, Filters popover (category from real categories, stock status, sort), Add Product. |
| 07-06 | Product Detail | `/inventory` (detail view) | Product information panel reached by selecting a product. |
| 07-07 | Add Product | modal in `/inventory` | `ProductFormModal` create mode → `POST /api/products`; photo step. |
| 07-08 | Edit Product | modal in `/inventory` | `ProductFormModal` edit mode → `PUT /api/products/:id`; dark-retinted Quill description editor. |
| 07-10 | Barcode Generator | panel in `/inventory` detail | `BarcodeQrPanel` → `/api/printers`, `/api/print-labels`; QR/barcode preview. |
| 07-11 | Low Stock | `/low-stock` | Shared Table/Badge/state primitives over `/api/low-stock`. |
| 07-12 | Performance | `/performance` | 5 KPI tiles with real deltas, Sales Trend, Goal Summary, category donut, daily heatmap, derived insight cards — all from `/api/performance/summary`. |
| 07-13 | Goals | section in `/performance` | `SetGoalForm` → `POST /api/goals`; goal ring from summary. |
| 07-21 | Notifications | Header bell panel | `NotificationBell` → `/api/notifications` (list, unread count, mark read, mark-all, clear). Restyled to dark. |
| 07-23 | Authentication & Login | `/login` | Online login → offline fallback (`window.electron.offlineLogin`), session, role routing. Reference dark card. |
| — | Splash | `/` | Quiet dark boot screen → `/dashboard`. |
| — | Manage Employees | modal from Header (admin) | `EmployeesModal` → `/api/users` GET/POST/DELETE. Not a documented screen; overlaps 07-17. |
| — | System states | `components/ui/States.jsx` | Loading / Empty / Error primitives used app-wide; matches CSL sheet 2 states 24–27. |

## B. Implemented + partial (reference sub-states deferred)

| Doc / ref | Screen | Deferred sub-state | Blocker |
|---|---|---|---|
| 07-02 | POS — category chips | "All / T-Shirts / Jeans …" filter row | `/api/products` (variant feed) returns no `category`; would need it added to that response (products table has `category`, the POS feed does not join it). |
| POS ref 05 | POS — Split Payment | multi-tender breakdown | No split-tender field on `/api/checkout`; sale stores a single `paymentMethod`. |
| POS ref 07 | POS — Refund / Return | select items → refund summary → process | No refund endpoint or reversing-entry contract. |
| POS ref | POS — Hold / Park sale | park cart, resume later | No parked-sale storage (local or server). |
| POS ref | POS — cash received / change | tendered vs. change line | Current `checkout()` records no tendered amount; adding it changes transaction semantics. |
| POS ref | POS — customer assignment | attach a customer to a sale | No customer table / `customer_id` on sales. |
| POS ref | POS — live printer status | "Ready / Offline" chip | Only print + `/api/printers` discovery exist; no live status contract. Network Online/Offline (real) is shown instead. |
| 07-05 ref 06 | Inventory — Variant Editor "Save Changes" bulk mode | edit many variant rows then one save | Current path is per-row `PUT /api/variants/:id` (works, inline). Bulk save is UI-only sugar; low priority. |
| 07-11 ref | Low Stock — SKU / Category / Price / Threshold columns | richer table | `/api/low-stock` returns name/size/color/stock/publicCode/supplierId only. |

## C. Safe to build from existing contracts (UI-only next batch)

| Doc | Screen | Existing contract | Notes |
|---|---|---|---|
| 07-09 | Categories | `products.category` free-text on `/api/inventory`; `POST/PUT /api/products` accept `category` | Read-only category list with product counts is fully derivable now. A managed category table (rename/merge/deactivate) is class D. |
| 07-14 | Reports | `/api/performance/summary` (+ range param) | A "reports" surface (range picker, export to CSV/PDF) can be assembled from the summary payload. Server-side PDF export would be class D. |
| 07-17 | User Management | `/api/users` GET/POST/DELETE (already used by `EmployeesModal`) | Promote the modal to a full screen; add role display. Editing an existing user / password reset is class D. |
| 07-22 | Profile | session object (`getSession()`) + `/api/users` | Read-only profile view is trivial. "Change password" for self is class D (no endpoint). |

## D. Requires a backend contract

| Doc | Screen | Missing |
|---|---|---|
| 07-15 | Customers | customers table + `/api/customers` CRUD; `customer_id` on sales. |
| 07-16 | Customer Detail | same as above + per-customer purchase history. |
| 07-18 | Activity Logs | an activity/audit feed endpoint (notifications ≠ activity log). |
| 07-19 | Audit Logs | tamper-evident audit store + endpoint. |
| 07-20 | Sessions | server-tracked login sessions + revoke endpoint. |
| 07-24 | Security Center | policy/lockout/2FA contracts. |
| 07-25 | Store Administration | store/org settings contract. |
| 07-26 | Settings | a settings store (`GET/PUT /api/settings`); today only `receiptConfig.js` (build-time constant) exists. |
| 07-27 | Printer Settings | persisted printer config endpoint (only discovery + `localStorage.preferredPrinter` today). |
| 07-28 | Store Settings | store profile endpoint (name/address/tax/currency) — currently the `receiptConfig.js` constant. |
| 07-29 | Backup | backup/restore endpoints + storage. |
| 07-30 | Import & Export | CSV/XLSX import + export endpoints. |

## E. Future by spec / consolidate / owner decision

| Item | Class | Note |
|---|---|---|
| 07-04 Receipt Details as standalone route | DUPLICATE / CONSOLIDATE | Implemented as a side panel in `/receipts`; a dedicated route is optional. |
| 07-06/07-07/07-08 as standalone routes | DUPLICATE / CONSOLIDATE | Implemented as the Inventory detail view + modals. |
| 07-13 Goals as standalone route | DUPLICATE / CONSOLIDATE | Implemented as a section of `/performance`. |
| 07-17 vs. "Manage Employees" modal | OWNER DECISION REQUIRED | Keep the lightweight modal, or invest in the full User Management screen? |
| Tax handling | OWNER DECISION REQUIRED | `receiptConfig.taxRatePercent` is `0` and `showTax` is off. Several references show an "8% tax" line. Confirm whether tax is in scope before building tax UI. |
| Currency / locale | OWNER DECISION REQUIRED | Hard-coded `Rs.` / `en-PK` throughout. Fine for now; note if multi-currency is ever intended. |
| Dead early-architecture files | OWNER DECISION REQUIRED | `src/App.jsx`, `src/App.css`, `src/components/CartSidebar.jsx`, `src/components/ProductGrid.jsx`, `src/components/ProductCard.jsx`, `src/data/products.js`, `src/screens/ComingSoon.jsx` are not referenced by `main.jsx`. Safe to delete in a cleanup commit — left in place this batch to keep the diff scoped to visual alignment. |

## Recommended next-batch order

1. **Categories (read-only)** and **User Management screen** — class C, no backend work, immediate reference coverage.
2. **Settings / Store Settings / Printer Settings** — class D but a single small settings endpoint unblocks all three; highest leverage.
3. **Customers + Customer Detail** — class D, larger; needed before POS customer-assignment and any loyalty work.
4. **POS Split Payment / cash-received / Refund** — class D and each touches trusted transaction semantics; specify carefully, do as its own batch.
5. Activity/Audit/Sessions/Security — class D, later phase.

## Revision history

| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-09-06 | Initial audit after the reference-driven redesign mega batch. |
