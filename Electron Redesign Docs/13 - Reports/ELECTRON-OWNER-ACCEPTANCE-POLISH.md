# TinyTots OS — Electron · Owner Acceptance Polish

**Branch:** `electron-redesign-2026-09-06`
**Starting SHA:** `67356d1` — _test(electron): final UI regression, evidence and design freeze_
**Final SHA:** `02247aa` — branch tip of `electron-redesign-2026-09-06` after this pass
**Date:** 2026-09-06
**Scope:** owner acceptance polish — _not_ a redesign. Functional freeze in force.

---

## 1. Owner feedback addressed

The first final redesign successfully removed the dark/coral language, but the
app still separated information mostly with **cream canvas + white rectangles +
hairline borders**, so it still read like a generated admin template rather than
TinyTots. Owner rule for this pass:

> **Borderless by default. Borders by purpose.**

Plus: more restrained semantic life; simpler navigation for a physical-store V1;
one profile system, not two; a warmer, personal Dashboard greeting; truthful
notifications; a brand-connected login.

---

## 2. Screens changed

| Screen | Change |
|---|---|
| **Dashboard** | Deterministic time-aware greeting hero; borderless semantic KPI row (tinted grounds + icon wells) replacing the shared bordered KPI group; open lists kept. No data-contract change. |
| **POS** | Cart/checkout column set apart by surface tone + a whisper of lift instead of a hard outline. Everything else (product grid, cart rows, payment, totals, checkout CTA) already compliant and untouched. |
| **Receipts** | Results table switched to the new borderless `Table bare` (header tint + row dividers + olive selected rail); loading/empty wrappers de-boxed. Filter row already had no enclosing card. |
| **Receipt detail panel** | Outer info column loses its border (tone + radius + soft shadow); receipt-paper preview keeps its subtle edge; geometry/reprint untouched. |
| **Staff & Access** (`/users`) | Renamed from "Users". Added open metric tiles (Total Staff / Admins / Cashiers) derived from the loaded array — no new API. Initial-avatar rows; borderless table. CRUD/guards unchanged. |
| **Profile** | Richer calm composition (large initials, name, @username, role badge on a soft ground; open account rows). New local "Preferred greeting name" preference with live preview. No account mutation. |
| **Printer Settings** | Real three-state status (configured & available / configured but not detected / not configured) from the saved printer vs. printers installed right now, as a soft semantic tint block. De-boxed list. No hardcoded model, no fake status. |
| **Notifications** | Truthful action affordances; fixed relative-time formatting; New/Earlier grouping; removed the redundant Close footer; Escape closes. |
| **Login** | Split composition (~42% approved TinyTots lifestyle image, packaged into the bundle) + open borderless sign-in region. Auth logic byte-for-byte unchanged. |
| **Header** | Reduced to notifications only — the duplicate profile menu and "Manage Employees" shortcut removed. |
| **Sidebar** | Simplified primary nav; "Users" → "Staff". |
| `DESIGN.md` | New §18 documenting the borderless rule, semantic tint usage, image/icon rule, nav simplification, profile-duplication rule, greeting system, notification truthfulness. |

**Not touched (as required):** Inventory browse/detail, Product form, Variants,
Barcode/QR, Low Stock, Performance (already the primary analytics destination and
functionally unchanged), Reports, Categories, Customers, Splash.

---

## 3. Navigation changes

Primary admin sidebar is now:

```
Dashboard · POS · Inventory · Low Stock · Performance · Receipts · Staff · Printer
(then) Profile identity · Log Out
```

| Item | Action | Route/code |
|---|---|---|
| Categories | Hidden from sidebar | `/categories` route + `Categories.jsx` kept, still direct-URL reachable |
| Reports | Hidden from sidebar | `/reports` route + `Reports.jsx` kept dormant |
| Customers | Hidden from sidebar | `/customers`, `/customers/:id` routes + screens + APIs kept |
| Users → **Staff** | Relabelled; route unchanged (`/users`) | — |

Cashier role filtering unchanged (`RequireAuth adminOnly` + `NAV_ITEMS.adminOnly`).
Hidden routes still work by direct navigation.

---

## 4. Duplicate components removed

- **Header profile menu** — removed. Identity lives only in the sidebar; `/profile`
  and sidebar logout remain.
- **"Manage Employees" shortcut** — removed from the header.
- **`EmployeesModal.jsx`** — deleted. After the header change it had no importer
  (`grep -rn EmployeesModal src` → only its own file + a stale comment). Staff &
  Access is now the single user-management surface; it already used the same
  `/api/users` contracts, so no functionality was lost.

---

## 5. Greeting system

`src/lib/greetings.js`:

- **Time bands:** 00:00–04:59 late night · 05:00–08:29 early morning · 08:30–11:59
  morning · 12:00–16:59 afternoon · 17:00–20:59 evening · 21:00–23:59 night.
- **~48 curated lines**, warm / focused / lightly playful. Nothing fetched from an AI.
- **Deterministic selection:** `djb2(dateKey | band | username) % pool.length` — stable
  within a session/band, drifts across the day and across days, never flips on
  re-render (`Dashboard` computes it once via `useMemo`).
- **Preferred greeting name:** local, per username — `tinytots:greeting-name:<username>`
  in `localStorage`. Editable on Profile with a live preview. Never touches the
  account record or any backend contract.
- **Fallback:** first meaningful token of the session name (skips honorifics and a
  leading "Muhammad/Mohammad/Syed/…"); username only if there is no name at all.
  Never assumes the second token.

---

## 6. Notification fixes

Backend `action_type` values actually emitted: `view_product`, `view_receipt`,
`view_order`, `view_performance`, `view_activity`.

| action_type | Before | After |
|---|---|---|
| `view_receipt` | → `/receipts` | → `/receipts` (kept) |
| `view_order` | unhandled (no-op) | → `/receipts` |
| `view_product` | → `/inventory` | → `/inventory` (kept) |
| `view_performance` | unhandled (mismatched `view_report` case) | → `/performance` |
| `view_activity` | → `/dashboard` placeholder | **no action button** — there is no activity screen |
| `retry_sync` / `retry_printer` | `window.location.reload()` | **removed** — not emitted by any contract; a reload is not a retry |

- `timeAgo()` rewritten: `Just now` → `N min ago` → `N hr ago` (same calendar day)
  → `Yesterday` → `12 Aug` (or `12 Aug 2024` across years). No more "Today 3:14 PM"
  for last week's notification.
- Grouped into **New** (unread) / **Earlier** (read).
- Redundant full-width **Close** row removed; outside-click / bell toggle / **Escape**
  all close the panel.
- Popover keeps its edge + shadow + radius (it is a floating surface). Mark-one-read,
  mark-all-read and clear-all logic unchanged.

---

## 7. Login redesign

- Composition: `flex` split — brand panel `md:w-[42%] lg:w-[44%]` + open sign-in
  region (`flex-1`), sign-in content `max-w-[340px]`, no enclosing auth card.
- Brand image: `src/assets/login-brand.webp` (160 KB) — a **copy** of the approved
  TinyTots website asset `tinytots-web/web/public/images/homepage/brand-story-support.webp`
  (warm editorial: baby clothing on a wooden rail, natural light, cream/olive).
  Packaged into the bundle — no remote dependency, no stock image, no AI image, no
  gradient/glass/marketing copy.
- A single low-opacity warm overlay strip carries the wordmark for legibility over
  the photo (not a decorative gradient/glow).
- **Auth unchanged:** `handleSubmit` (online login → offline `window.electron.offlineLogin`
  fallback → `saveSession` → role-gated redirect, error strings) is byte-for-byte
  identical to the pre-pass version.

---

## 8. Semantic colour changes

All from the existing token set — no new palette, no per-screen hardcoded colours.
Centralised in `KpiTile`'s `tone` prop + `KpiRow`:

| Meaning | Token | Where |
|---|---|---|
| Sales / success | `success` (olive-green) ~6% ground, 12% well | Dashboard "Total Sales", Staff "Total" (`goal`/brand) |
| Orders / commerce | `accent` (terracotta) ~6% ground, 12% well | Dashboard "Orders", Staff "Cashiers" |
| Average value / analytics | `info` (blue-grey) ~6% ground, 12% well | Dashboard "Avg Order Value", Staff "Admins" |
| Low stock | `warning` (amber) ~7% ground, 14% well | Dashboard "Low Stock Items", Printer "not detected" |
| Goal progress | `brand` (olive) ~6% ground, `brand-soft` well | Dashboard "Goal Progress", Staff "Total" |
| Printer OK / missing / unset | `success` / `warning` / `error` tint block | Printer Settings status |

Tints are 5–14 % — no full-saturation cards, no rainbow.

---

## 9. Border audit (changed UI only)

Removed section/wrapper borders: Dashboard KPI group; Receipts results-table box +
loading/empty wrappers; Receipt-detail outer panel; Staff table box + count line
wrappers; Profile's two full cards; Printer "current selection" card + installed-
list box; Login auth card; header (already a divider only).

Borders **kept** (all legitimate per DESIGN.md §3 / §18.1):

- Controls: POS search field, POS notes/discount inputs, Receipts date inputs +
  pager buttons, Profile greeting input, Login username/password fields.
- Floating surfaces: notification popover, POS sale-success dialog, Add-User dialog.
- Receipt **paper** preview (subtle edge, explicitly allowed).
- The Dashboard sales-trend **error fallback** mirrors the chart panel it replaces
  so the grid doesn't collapse (rare path).

No excessive section borders remain in the changed screens.

---

## 10. Locked screens — unchanged

`Inventory.jsx`, `LowStock.jsx`, `ProductFormModal.jsx`, `VariantsTable.jsx`,
`BarcodeQrPanel.jsx` were **not edited**. The only shared-primitive change that
could reach them is `Table` — a new opt-in `bare` prop was added; the default
(bordered) path is byte-identical, and Inventory/Low Stock don't pass `bare`, so
their approved composition is untouched.

---

## 11. Splash

**Visual redesign — DEFERRED BY OWNER.** No direct edits to `Splash.jsx`. No shared
style change in this pass affected it (verified: Splash uses only `bg-surface-app`,
`bg-brand-soft`, `text-brand`, `border-default`, `type-*` — all unchanged).

Future-phase note recorded for the owner: a later Splash mini-phase may explore
restrained text/wordmark animation in CSS — **not** video, heavy render, or
cinematic graphics.

---

## 12. QA

### Build

`npm run build` — **PASS** (`✓ built in ~1.2s`). Only the pre-existing
">500 kB chunk" advisory, unchanged.

### Targeted lint

`npx eslint` on every changed file — **0 new findings.**
Two pre-existing baseline errors remain and are out of scope for this pass
(confirmed by linting the pre-pass `HEAD` copies — identical):

- `NotificationBell.jsx` — `load()` called in `useEffect` (`react-hooks/set-state-in-effect`).
- `POS.jsx` — `Date.now()` in `checkout()` (`react-hooks/purity`), line untouched.

### Functional review (static — app not launched here, see evidence README)

| Area | Result |
|---|---|
| Auth | `handleSubmit` unchanged; only Login presentation changed |
| POS | checkout math, offline queue, `clientSaleId` idempotency, F2 focus, `ScannerListener` — untouched; only the cart container class changed |
| Inventory / Low Stock | not edited; `Table` default path unchanged |
| Receipts | search/date/payment filters, pagination, open, download, reprint calls — unchanged; only markup |
| Performance | not edited |
| Staff | `/api/users` GET/POST/DELETE, `acting_user_id` self-delete hint, `removeCachedUser`, last-admin guard (backend) — unchanged |
| Notifications | mark-read / mark-all / clear-all API calls unchanged; only action routing, time format, grouping, footer |
| Printer | `listPrinters` / `getReceiptPrinter` / `setReceiptPrinter` bridge calls unchanged; status is derived read-only |

### Runtime screenshots

Not captured in this environment: the app requires the local backend against the
**production** Supabase project, and login + the non-embedded cron/recovery path
write to production — forbidden for testing under this pass's rules. Capture guide
and checklist: `owner-acceptance-polish-evidence/README.md`.

### Database

Schema changed — **NO.** Migrations applied — **NO.** Production touched — **NO.**

---

## 13. Commits

| SHA | Message |
|---|---|
| `ba1083d` | style(electron): refine borderless hierarchy and semantic dashboard |
| `5cc93d5` | style(electron): calm POS, receipts and printer settings |
| `de2045e` | feat(electron): simplify nav, personalize profile, redesign login |
| `02247aa` | fix(electron): truthful notifications; DESIGN.md §18; owner-polish report |

Pushed to `electron-redesign-2026-09-06` (no force, no merge from main).

---

## 14. Remaining decisions / deferred (unchanged)

Still deferred, not implemented: POS customer assignment (`sales.customer_id`
unapplied), category mutation, Reports export, refunds, hold/park, split payment,
audit logs, sessions/security centre, backup/import/export, cash-received/change.
Splash visual direction is the owner's next input.

---

## 15. Verdict

**READY FOR OWNER REVIEW + SPLASH DIRECTION.**

Next: owner reviews the polished app → owner defines the Splash experience →
dedicated Splash mini-phase → packaged Electron certification. No packaging,
installer, main-branch merge, deploy, or customer migration in the meantime.
