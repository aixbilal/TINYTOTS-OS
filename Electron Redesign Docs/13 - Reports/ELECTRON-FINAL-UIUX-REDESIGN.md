# TinyTots OS — Electron · Final UI/UX Redesign + Permanent Design System

| | |
|---|---|
| **Branch** | `electron-redesign-2026-09-06` |
| **Starting SHA** | `b55df3edb7db347113f7d10b6c21cd9b0af9d63a` (`b55df3e` — "docs(electron): freeze V1 functional scope") |
| **Final SHA** | `9c16852` (this document + evidence add a further commit) |
| **Direction** | Warm Operational Minimalism |
| **Scope** | Visual / interaction quality only. V1 functionality frozen. |
| **Design authority** | `tinytots-app/electron-app/DESIGN.md` |

---

## 1. Design philosophy

The app was functionally complete but felt bordered, boxed, retro, card‑inside‑card
and generated‑dashboard‑like. The redesign keeps every workflow and every number
exactly where they were and rebuilds the *surface*: modern, calm, premium, fast,
cohesive — and unmistakably TinyTots. Website = warm editorial; Electron = warm
operational. Same brand, different job.

Hierarchy is now built in this order: **whitespace → alignment → typography →
surface change → divider → border (only when necessary)**. Olive is reserved for
action, selection, focus, active navigation and progress — not decoration.

## 2. Reference sources used

Studied conceptually for interaction, composition and polish — never as visual
authorities, never copied:

| Source | Ideas extracted |
|---|---|
| **Magic UI** | subtle metric emphasis, restrained entrance micro‑motion, notification list rhythm — deliberately *without* the beams/sparkle/gradient surface it is known for |
| **Vengeance UI** | restrained "premium dark" component density (applied only to the inverse sidebar) |
| **Motion / Motion for React** | spring/emphasis easing curves and enter/exit choreography — reproduced with CSS, the library was **not** added |
| **21st.dev** | composition of command/search + table + dialog patterns |
| **Impeccable** | tightening of spacing rhythm and typographic restraint |
| **Shopify Polaris / Linear / Raycast / Stripe** (secondary) | open table behaviour, sidebar calm, popover/menu composition, empty/loading states |
| **On‑disk design docs** | `Electron Redesign Docs/05 - Design System/02 Design Principles.md`, `18 Design Tokens.md`, `01 - Vision/Design Manifesto.md`, `Design Philosophy.md` — the token architecture and the ten principles this system implements. (No separate "Taste" / "Awesome‑Design" skill exists in this repo; the `project-ui` skill is scoped to `tinytots-web` and was not used.) |

## 3. Major design‑system changes

- **Warm is canonical.** The approved TinyTots palette moved onto `:root` / `@theme`
  as the default. There is **no dark default** any more. The old
  `dark defaults + .tt-warm override + warm prop` architecture is gone.
- **The sidebar is the one inverse surface**, via an explicit `.tt-inverse` scope
  (`.tt-sidebar` kept as an alias).
- **New token scales**: `radius` (sm 8 / md 10 / lg 12 / xl 16), `shadow`
  (sm/md/lg — warm, single‑layer), `motion` (`--ease-standard` /
  `--ease-emphasized`, `--duration-fast|normal|slow`, wired into Tailwind's
  default transition so bare `transition-colors` is consistent app‑wide).
- **Motion decision: CSS only.** Four entrance helpers (`tt-anim-dialog`,
  `tt-anim-pop`, `tt-anim-fade`, `tt-anim-enter`) + a global
  `prefers-reduced-motion` reset. No animation dependency added.
- **Shared primitives normalized** (`src/components/ui/`): `Button` (lighter
  secondary, press feedback, `subtle` variant), `Input`/`Textarea`/`Select`
  (clean white field, single hairline, olive focus — no double frame),
  `Card` (no rest shadow), `Badge` (small, warm), `Table` (open rows,
  olive‑ruled selected state, sticky‑header option), `Dialog` (radius‑xl,
  shadow token, focus trap + restore, entrance motion), `States`.
  **New**: `Layout` (`Section`, `PageHeader`, `KpiGroup`, `KpiTile` — the
  anti‑card‑soup composition set) and `SearchField`.
- **Chart theme consolidated** to the single warm theme (olive series,
  warm‑stone grid, taupe axis, warm tooltip). All dark hex ramps and every
  `theme=` prop removed.
- **Legacy runtime styling removed**: no `#0a0a0b`‑family / `#f0483e`‑family
  values, no arbitrary black shadows, no `rounded-2xl`. Print‑safe receipt
  colours are intentionally untouched.

## 4. Screens redesigned

Shell + Sidebar + Header + Notifications · Dashboard · Performance · Reports ·
POS (+ advanced‑search + sale‑success) · Inventory browse (grid + list) ·
Product Detail · Add/Edit Product modal · AI description action · Variants table
(+ Add Variant) · Image uploader (+ crop) · Barcode/QR panel · Low Stock ·
Receipts (+ Receipt Detail) · Categories · Customers · Customer Detail · Users
(+ Add User dialog) · Profile · Printer Settings · Employees modal · Login ·
Splash · loading / empty / error states · dialogs / popovers.

## 5. Temporary architecture removed

- `AppShell` `warm` prop and every `<AppShell warm>` / `<AppShell dense warm>` call.
- `.tt-warm` scope (index.css + Login/Splash markup).
- `theme` props on all chart components and call sites.
- Dead prototype files: `src/App.jsx`, `src/App.css`, `src/screens/ComingSoon.jsx`,
  `src/components/ProductGrid.jsx`, `src/components/ProductCard.jsx`,
  `src/components/CartSidebar.jsx` (proven unimported by `main.jsx` and the live
  screens).

## 6. Permanent architecture

```
TinyTots Electron tokens  (:root default = warm; .tt-inverse = sidebar)
  canvas · surface(panel/elevated/sunken/secondary) · overlay · inverse
  text(primary/secondary/muted/inverse) · border(default/strong)
  brand(+hover/active/soft) · accent(terracotta) · semantic(success/warning/error/info)
  radius(sm/md/lg/xl) · shadow(sm/md/lg) · spacing(4·8·12·16·20·24·32)
  typography(type-* scale) · motion(duration-* · ease-*)
        ↓
  shared primitives (src/components/ui/)
        ↓
  all screens
```

## 7. Visual QA results

App launched via `vite` + the local backend (real Supabase data) and inspected in
Chromium at the acceptance sizes.

| Check | Result |
|---|---|
| 1366 × 768 (primary) | **PASS** — Login, Dashboard, POS (empty + 4‑item cart), Inventory grid/list, Product Detail, Add Product, AI action, Variants, Barcode/QR, Low Stock, Performance, Reports, Receipts + detail, Categories, Customers + detail, Users + dialog, Profile, Printer Settings, Notifications, Employees modal, empty/error states, Splash |
| 1920 × 1080 | **PASS** — POS populated cart, analytics; layouts breathe, no stranded whitespace |
| 1280 × 720 (stress) | **PASS** — POS keeps search, product area, cart, total, payment and Checkout all visible; cart list scrolls internally with the checkout footer pinned |
| Horizontal application overflow | **NONE** at 1280 / 1366 / 1920 |
| Old / retro / card‑inside‑card surfaces | **NONE** found |
| Dark / coral / neon remnants | **NONE** in runtime UI (print‑safe receipt colours excepted, by design) |
| One‑product feel | **PASS** — every screen reads as one system |
| Console (whole session) | 0 errors, 0 warnings |

Evidence: `Electron Redesign Docs/13 - Reports/final-uiux-evidence/`
(`baseline-*` = before, `qa-*` / `wip-*` = after).

## 8. Motion

| | |
|---|---|
| Purposeful only | **PASS** — hover/press, active‑nav, dropdown/menu pop‑in, dialog fade+rise, row selection, loading skeletons |
| Reduced‑motion support | **PASS** — global `@media (prefers-reduced-motion: reduce)` collapses all transitions/animations to ~1ms |
| Decorative / continuous motion | **NONE** — no blobs, parallax, glow, sparkle, bounce, background animation; nothing pulses at rest |

## 9. Accessibility

| | |
|---|---|
| Focus | **PASS** — olive `focus-visible` ring + offset, visible on canvas, white and the inverse sidebar |
| Contrast | **PASS** — `text-primary #4A4F44` on canvas and on white both clear AA; brand‑fill text standardised on `pure-white` for AA on olive at small sizes |
| Keyboard | **PASS** — full tab order; dialogs trap Tab and restore focus to the trigger; Escape closes |
| Dialogs / controls | **PASS** — `role="dialog"` + `aria-modal`, icon‑only buttons carry `aria-label`, disabled state is `opacity-45 cursor-not-allowed` |

## 10. Functional regression results

Verified structurally and by inspection; no unnecessary real transactions created.

| Area | Result | Notes |
|---|---|---|
| Auth | **PASS** | `auth.js`, `RequireAuth`, `main.jsx` route gating and the Login `handleSubmit` (online + `window.electron.offlineLogin` fallback) are unchanged — only Login/Splash JSX classes changed. Splash → `/dashboard`, admin/non‑admin gating, logout all intact. |
| POS | **PASS** | product load + cache, search, F2 focus, `ScannerListener` keyboard‑wedge path, add/remove/qty, discount UI, tender selection, checkout, offline queue, sale‑success, receipt print + cash‑drawer IPC calls — all preserved verbatim; only presentation changed. |
| Offline queue | **PASS** | `queueSale` / `syncQueuedSales` / `getQueueCount` / `getFailedSales` / `removeQueuedSale` / `retrySale` and the shared `client_sale_id` idempotency flow untouched. |
| Checkout math unchanged | **YES** | `subtotal`, auto + manual discount, `taxableAmount`, `tax` (`TAX_RATE` from `receiptConfig`), `total`, `buildSale` — byte‑for‑byte identical. |
| Inventory | **PASS** | grid/list, search, filters, sort, detail, create/edit (`/api/products`), variants (`/api/variants`, `/api/products/:id/variants`), images (`/api/products/:id/images`), barcode/QR + `/api/print-labels`, low stock — all handlers preserved; `variants.stock` authority untouched. |
| Receipts | **PASS** | list, filters, pagination, detail, download, reprint (`/api/receipts/:id/reprint`); print‑safe receipt preview geometry and colours unchanged. |
| Customers | **PASS** | read‑only list + detail on `/api/customers`; **no** POS customer selector introduced (migration stays unapplied). |
| Users | **PASS** | list, create, delete with confirmation, `acting_user_id` self‑delete hint, last‑admin guard, Employees modal parity — all preserved. |
| Reports / Performance | **PASS** | no formula changes; only `theme` prop removal and warm palette. Range selectors, goal ring/bar, heatmap, category breakdown intact. |
| AI Description | **PASS** | `/api/products/generate-description`, min‑input gating (`name` + `category`), loading state, overwrite confirmation, non‑blocking failure with the manual editor always usable, no secret exposure. Graceful "temporarily unavailable" copy remains valid when provider keys are absent. |
| Printer configuration | **PASS** | `bridge.listPrinters` / `getReceiptPrinter` / `setReceiptPrinter`, the machine‑local `printer-config.json` model and the `preferredPrinter` localStorage key for labels are untouched; no runtime fallback, no automatic printer selection. In a browser preview `window.electron` is absent and the screen correctly shows its "only available inside the desktop app" state. |

## 11. Printer

| | |
|---|---|
| Physical receipt printing previously verified | **YES** (POS‑80C, earlier phase) |
| Runtime printer fallback | **NONE** — selection is explicit and machine‑local |
| Configured printer behaviour unchanged | **YES** |
| Label printer behaviour unchanged | **YES** — label printer selection remains independent; only the "no printer" help text was made model‑agnostic |

## 12. Database

| | |
|---|---|
| Schema changed | **NO** |
| Migrations applied | **NO** |
| Production touched | **NO** |

## 13. Build / lint

| | |
|---|---|
| `npm run build` | **PASS** — the pre‑existing "chunks larger than 500 kB" warning is unchanged; no bundler refactor performed |
| Targeted lint (all changed UI files) | **PASS** — **0 new findings** |
| Full `eslint src` | **7 problems — identical to baseline** (all pre‑existing `react-hooks/set-state-in-effect` in screen data‑fetch effects, none introduced by this work) |
| Full `eslint .` | **109 problems — identical to baseline** |

## 14. Hardware truth

| Device | Status |
|---|---|
| Receipt printer | Physically verified earlier (POS‑80C). Not re‑tested — printer logic unchanged. |
| Barcode scanner | Software path only (`ScannerListener` keyboard‑wedge). Hardware unavailable. |
| QR scanner | Software path only. Hardware unavailable. |
| Cash drawer | Code/config path only (`window.electron.openCashDrawer` IPC). Hardware unavailable. |

## 15. Known deferred functionality (intentional V1)

POS customer assignment (migration unapplied) · Activity/Audit logs · Sessions ·
Security Center · Backup · Import/Export · Category mutation · Profile editing ·
Report export · Refund engine · Hold/Park sale · Split payment ·
Cash‑received/change. No UI implies any of these exists.

## 16. Owner decisions still open

- **Tax** — rate and tax settings remain business‑policy dependent; unchanged.
- **POS customer association** — `sales.customer_id` migration stays intentionally
  unapplied; no POS customer UI.
- **AI provider configuration** — real Groq/Gemini keys may be absent; the
  graceful "unavailable" state is the accepted behaviour. No responses hardcoded.
- No new decision was discovered during this work.

## 17. Commits

| SHA | Message |
|---|---|
| `a7d8ac0` | style(electron): establish permanent TinyTots design system |
| `6004cb8` | style(electron): redesign shell and analytics surfaces |
| `1e32a5f` | style(electron): modernize POS operational workspace |
| `3a81770` | style(electron): modernize inventory, product form and label workflows |
| `8d987c0` | style(electron): modernize receipts, directories and admin screens |
| `9c16852` | style(electron): login, splash, and permanent token consolidation |
| _(this commit)_ | test(electron): final UI regression, evidence and design freeze |

## 18. Verdict

**READY FOR OWNER VISUAL ACCEPTANCE.**

Next: owner visual acceptance → packaged Electron certification → final
production / release work. No merge to `main`, no deploy, no customer migration,
no production DB change until the owner has reviewed.
