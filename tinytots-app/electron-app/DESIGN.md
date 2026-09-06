# TinyTots OS — Electron Design System

**Status:** Canonical · **Direction:** Warm Operational Minimalism
**Applies to:** `tinytots-app/electron-app` (the desktop retail terminal)
**Companion:** the TinyTots website is *warm editorial*; this app is *warm operational*. Same brand, different job.

---

## 0. How to use this document

This is the implementation authority for the Electron UI. When a screen and this
document disagree, this document wins. When this document is silent, follow the
nearest existing primitive and promote the pattern here.

Reference hierarchy (highest first):

1. **Current functional code** — business logic, calculations, contracts. Never changed for visual reasons.
2. **TinyTots brand palette** (§2) — colour authority.
3. **Current screen information architecture** — what each screen shows and in what order.
4. **External references** — Magic UI, Vengeance UI, Motion, 21st.dev, Impeccable, Shopify Polaris, Linear, Raycast, Stripe. *Interaction and composition mines only — never visual authorities, never copied wholesale.*

---

## 1. Philosophy

TinyTots Electron should feel **modern, smooth, calm, premium, fast, operational,
retail-ready, cohesive** — and unmistakably TinyTots.

It must **not** feel bordered, boxed, retro, card-inside-card, fragmented, or like
a generated dashboard.

> **Owner rule (2026-09-06): _Borderless by default. Borders by purpose._**
> Separate content with whitespace, typography, surface tone, alignment and
> imagery first. A visible outline is earned by a control, a floating surface, a
> data table, receipt paper, or a genuinely contained interactive area — not by a
> KPI, a section heading, a metric, or a dashboard region. Full detail in §18.

Ten working rules:

- premium but not luxury-fashion
- friendly but not childish
- soft but not washed out
- modern but not futuristic
- dense but not cramped
- minimal but not empty
- warm but highly operational
- animated but never distracting
- quietly confident
- the employee understands what to do immediately

Every decision answers one question: **does this improve the operator's ability to
complete their work?** If no, reconsider it.

---

## 2. Colour tokens

The permanent palette. These are the **default** token values (warm), set on
`:root` and exposed to Tailwind v4 via `@theme`. There is no dark default any
more — the only inverse surface is the sidebar (§2.3).

### 2.1 Canvas & surfaces

| Token | Value | Use |
|---|---|---|
| `--color-surface-app` | `#F6F1E8` | Application canvas / workspace background |
| `--color-surface-panel` | `#FFFFFF` | Elevated functional surface — tables, dialogs, popovers, the few real cards |
| `--color-surface-elevated` | `#EFE8DB` | Gentle secondary raise — chips, row hover, skeletons, icon wells |
| `--color-surface-sunken` | `#F1EADF` | Inset wells (search fields sitting on white) |
| `--color-surface-secondary` | `#E7D8C0` | Approved *Soft Secondary Surface* — **rare**, only a genuinely distinct zone |
| `--color-surface-overlay` | `rgba(42, 38, 33, 0.55)` | Dialog scrim |

> **Surface note.** The strong *Soft Secondary Surface* `#E7D8C0` is
> `surface-secondary` and is used sparingly. Everyday raises (hover, chips,
> skeletons, icon containers) use `surface-elevated` `#EFE8DB`, which reads as a
> quiet step on white and a faint definition on canvas.

### 2.2 Text

| Token | Value | Use |
|---|---|---|
| `--color-text-primary` | `#4A4F44` | Primary text, headings, metric values |
| `--color-text-secondary` | `#675949` | Secondary text, labels, supporting copy |
| `--color-text-muted` | `#BAB2A6` | Captions, placeholders, disabled, de-emphasis |
| `--color-text-inverse` | `#F6F1E8` | Text/icons on the inverse sidebar |

Light text on a filled **brand or danger button/badge/avatar** uses
`--color-pure-white` (§2.6) — it clears AA on the olive at small sizes where the
warmer `text-inverse` is borderline.

### 2.3 Borders & the inverse sidebar

| Token | Value | Use |
|---|---|---|
| `--color-border-default` | `#D2C7B4` | Hairline dividers, table separators, input borders |
| `--color-border-strong` | `#BAB2A6` | Focus-adjacent, selected outlines, control borders that must read |

The **sidebar** is the one intentional inverse surface. It is applied with the
explicit `.tt-inverse` scope (formerly `.tt-sidebar`), not a global dark default:

| Token (inside `.tt-inverse`) | Value |
|---|---|
| `--color-surface-sidebar` | `#2A2621` (Near Black, warm) |
| `--color-surface-elevated` | `#3A352F` (active / hover nav row) |
| `--color-border-default` | `#3A352F` |
| `--color-text-primary` | `#F6F1E8` |
| `--color-text-secondary` | `#BEB4A4` |
| `--color-text-muted` | `#8C8375` |
| `--color-brand` | `#7A8552` (olive, lifted for contrast on near-black) |

### 2.4 Brand & action

| Token | Value | Use |
|---|---|---|
| `--color-brand` | `#616845` | Olive — primary buttons, active nav, selected state, focus, progress, high-confidence emphasis |
| `--color-brand-hover` | `#53593B` | Primary hover |
| `--color-brand-active` | `#474C33` | Primary press |
| `--color-brand-soft` | `#EDEADD` | Tinted fill behind brand icons / subtle brand chips |
| `--color-accent` | `#8F5030` | Terracotta — **restrained** secondary accent. Rare. Never a second primary. |

Olive is **not decoration**. Do not make every icon olive. Terracotta is used
rarely (a single editorial highlight, a secondary link in a brand moment).

### 2.5 Semantic status

Small, semantic, always paired with text or an icon — never colour alone.

| Token | Value |
|---|---|
| `--color-success` / `--color-success-text` | `#3F6B3A` |
| `--color-warning` / `--color-warning-text` | `#8A5A1C` |
| `--color-error` / `--color-error-text` | `#B91C1C` |
| `--color-info` / `--color-info-text` | `#3B5B8A` |

Status fills are the base hue at `/10`–`/14` with matching text and an optional
`/25`–`/30` ring.

### 2.6 Fixed values

| Token | Value | Use |
|---|---|---|
| `--color-pure-white` | `#FFFFFF` | Text on filled brand/danger buttons; print surfaces (never restyled) |

### 2.7 Forbidden

Do **not** reintroduce: bright coral as primary, electric blue branding, cyan,
purple, neon green identity, gaming black, glows, colored shadows. The legacy
dark values (`#0a0a0b`, `#0f0f11`, `#151517`, `#1c1c20`, `#27272c`, `#f0483e`,
`#d93a30`, `#b92e26`, `#050506`) must not appear in runtime UI. Print-safe
receipt colours and genuinely semantic status colours are exempt.

---

## 3. Surface hierarchy

The app builds hierarchy in this order. Reach for the earliest tool that works:

1. **Whitespace**
2. **Alignment**
3. **Typography**
4. **Surface change** (canvas → white)
5. **Divider** (`border-default` hairline, single edge)
6. **Border** (full outline) — *only when necessary*

Never nest: `canvas → bordered card → bordered panel → bordered subsection →
bordered item`. Prefer: `canvas → open section → white surface only where useful →
subtle divider`.

Not every section needs a card. A "card" is earned by: a table, a dialog, a
popover, a genuinely elevated interactive surface (POS cart, chart panel with
real chrome), or a form group that must read as one contained unit.

### Border rule

Borders are for: inputs, selects, dialogs, popovers, data-table outer edge,
selected/focus states, contained interactive controls, a critical grouped
operational area. **Not** for: every KPI, every heading section, every metric,
every small content block, every dashboard region. Use a hairline divider
instead.

---

## 4. Radius

`@theme` scale — use the Tailwind utility, never an arbitrary value.

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `8px` | Small controls, chips, table-action buttons, badges (non-pill) |
| `--radius-md` | `10px` | Default — buttons, inputs, selects, small tiles |
| `--radius-lg` | `12px` | Panels, cards, white functional surfaces |
| `--radius-xl` | `16px` | Dialogs, popovers, the POS cart column |
| `--radius-pill` | `999px` | Pills / status dots only where semantically a pill |

Do not make every container extremely rounded. POS stays slightly tighter (prefer
`sm`/`md`). No bubbly SaaS aesthetic.

---

## 5. Shadows

Most hierarchy works with **no shadow**. Shadows are warm, soft, single-layer.

| Token | Value | Use |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(42,38,33,0.06)` | Rare — a tile that must lift on hover |
| `--shadow-md` | `0 6px 20px -8px rgba(42,38,33,0.18)` | Dropdowns, popovers, notification menu |
| `--shadow-lg` | `0 16px 40px -16px rgba(42,38,33,0.24)` | Dialogs, the POS sale-success panel, floating cart |

Forbidden: shadow on every card, deep black shadows, glow, colored shadow,
"floating everything". No `shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)]` style
arbitrary black shadows — replace with `--shadow-lg`.

---

## 6. Typography

Keep the existing semantic `type-*` scale (`src/styles/typography.css`). It is
good. Roles:

| Role | Utility | Notes |
|---|---|---|
| Page title | `type-heading-lg` (25px/700) | One per screen |
| Section title | `type-section` (16px/700) | Group headers |
| Card title | `type-card-title` (15px/700) | |
| Metric value | `type-stat` (26px/700) | Value dominates its tile |
| Primary body | `type-body` (14px/400) | |
| Secondary body | `type-body-sm` (13px/400) | |
| Label | `type-field-label` (12px/600) / `type-label` (11px/500, tracked) | |
| Caption | `type-caption` (12px/400) | |
| Navigation | `type-nav` (14px/600) | |
| Button | `type-btn` (14px/600) | |
| Table head | `type-table-head` (13px/700) | |
| Table cell | `type-table` (13px/500) | |
| Mono / code | `type-mono` (JetBrains Mono, `tnum`) | SKU, public codes, receipt numbers, technical IDs |

- **Fonts:** Geist (→ Inter fallback) for all operational UI. JetBrains Mono for
  codes/identifiers only. **Playfair Display only** on Login and Splash brand
  marks — never in tables, forms, or operational chrome.
- Weights: 400 / 500 / 600 / 700 only. Avoid excessive bold — `font-extrabold` /
  `font-black` are clamped to 700.
- Hierarchy comes from weight, size and spacing — **not** from boxing text.
- No arbitrary per-screen font sizes. If you need a size that isn't in the scale,
  the scale is probably right and the design is wrong.

---

## 7. Spacing

Rhythm: **4 · 8 · 12 · 16 · 20 · 24 · 32**. `40` / `48` only for major page
separation.

Density by screen:

| Screen class | Outer padding | Gap rhythm |
|---|---|---|
| POS | `p-4` (dense) | `gap-3` |
| Inventory / Variants / admin tables | `p-5` | `gap-3`–`gap-4` |
| Dashboard / Performance / Reports | `p-5 md:p-7` | `gap-4`–`gap-5` |
| Login / Splash | spacious | `gap-6`+ |

This is a retail operational app: **high signal, moderate density, clear
grouping.** Do not add whitespace that forces avoidable scrolling.

Content width: admin screens may cap at `max-w-[1600px]` centred. POS uses full
operational width. The shell provides the only page padding (`PageContainer`) —
screens don't reinvent page margins.

---

## 8. Icons

Lucide only. No second icon library.

| Context | Size | Stroke |
|---|---|---|
| Inline / common | 16–18 | 1.9 |
| Compact table actions | 14–16 | 1.9 |
| Major actions only | 20–22 | 1.9 |

Consistent stroke weight. Do not put icons inside coloured squares everywhere —
a bare icon with a text label is the default. A tinted `brand-soft` container is
reserved for a genuine emphasis moment (one per view, at most).

---

## 9. Motion

**Decision: CSS transitions + a small keyframe set. No motion library.** Framer
Motion / `motion` is not added — CSS covers every purposeful interaction this app
needs, and an extra runtime dependency isn't justified. Revisit only if a future
interaction genuinely cannot be expressed in CSS.

Shared motion tokens live in `index.css`:

| Token | Value | Use |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default (also the Tailwind `--default-transition-timing-function`) |
| `--ease-emphasized` | `cubic-bezier(0.3, 0, 0, 1)` | Dialog / layout |
| `--duration-fast` | `130ms` | Hover, press, colour shifts (also `--default-transition-duration`, so bare `transition-colors` is already this) |
| `--duration-normal` | `180ms` | Dropdown / popover / tab indicator |
| `--duration-slow` | `220ms` | Dialog enter/exit, layout |

Entrance helper classes (all collapse under reduced-motion): `tt-anim-dialog`
(fade + 4px rise, emphasized), `tt-anim-pop` (pop-in for menus/popovers),
`tt-anim-fade` (plain fade, scrims), `tt-anim-enter` (content settling after a
load). For an inline value use `duration-(--duration-normal)`; do not hard-code
millisecond literals in JSX.

Timing guide: hover/press 100–160ms · dropdown/popover 140–200ms · dialog
160–220ms · layout/tab 180–260ms. Nothing over ~260ms in product UI.

**Allowed:** button press, hover feedback, active-nav transition, tab indicator,
dropdown/popover enter-exit, modal enter-exit, toast, row selection, cart
add/remove, loading→loaded fade, subtle metric count-up, success confirmation,
collapsible filter.

**Forbidden:** decorative blobs, scroll spectacle, continuous card motion,
parallax, 3D, mouse-following, animated gradients, sparkles, glowing borders,
bouncing buttons, rotating decoration, background animation, constant pulse.
(`animate-pulse` on skeletons during load is fine; nothing pulses at rest.)

**Reduced motion:** `@media (prefers-reduced-motion: reduce)` collapses all
transitions/animations to ~1ms globally in `index.css`. No feature may depend on
animation.

---

## 10. Accessibility

- Visible focus everywhere: olive ring (`focus-visible:ring-2 ring-brand/55`)
  with a `2px` offset against the current surface. Legible on canvas, white, and
  the inverse sidebar. Never remove an outline without replacing it.
- Full keyboard navigation; logical tab order; dialogs trap and restore focus
  (existing `Dialog` behaviour preserved and extended).
- Contrast: body text ≥ 4.5:1, large text ≥ 3:1 on its surface. The warm
  palette's `text-primary #4A4F44` on `surface-app #F6F1E8` and on white both
  pass.
- No state communicated by colour alone — pair with text/icon/shape.
- Icon-only buttons carry `aria-label`. Labels are tied to fields via `htmlFor`.
- Disabled controls: `opacity-45 cursor-not-allowed`, and not focusable when
  genuinely inert.
- Click targets ≥ 28px in dense contexts, ≥ 32px elsewhere.

---

## 11. Component primitives

Location: `src/components/ui/`. Improve in place — do not fork per screen. If a
pattern repeats across two screens, promote it here.

### Button (`Button.jsx`)

Variants: `primary` (olive fill, `text-inverse`, minimal shadow), `secondary`
(warm elevated surface, hairline `border-default`, not a heavy outline), `ghost`
(transparent, quiet, for secondary nav/actions), `danger` (error fill).
Optional: `subtle` / icon-only (square, `ghost` treatment, `aria-label` required).

Sizes `sm` / `md` / `lg`. Radius `md`. Press: `active:` translateY(0.5px) +
`brand-active`. Loading shows a spinner and disables. Focus ring olive.

### Input / Textarea / Select

White (or `surface-app` where a field must sit on white), hairline
`border-default`, `radius-md`, consistent height (`py-2`), olive focus ring +
`border-brand`, placeholder `text-muted`. No thick outlines, no double framing,
no dark field islands, no giant pills. Error state: `border-error` + caption in
`error-text`.

### Card / Panel (`Card.jsx`)

White surface, `border-default` hairline, `radius-lg`, `p-5`, **no shadow** at
rest. `glass` prop stays a no-op for API compatibility. Prefer *not* using Card —
see §3. `CardHeader` gives title/description/action.

### Badge (`Badge.jsx`)

Small. `radius-sm` or pill for status dots. Low-saturation semantic fill + text +
optional inset ring. Never huge, never neon. Always has a label.

### Table (`Table.jsx`)

Open rows, hairline horizontal dividers (`divide-border-default`), **no full-cell
grid**, no heavy container border (a single `border-default` on the outer
`radius-lg` wrapper is the max), light row hover (`surface-sunken`/`elevated` at
low alpha), clear selected row (olive left rule + tint), compact padding
(`px-4 py-2.5`), right-aligned numeric columns, `type-mono` identifiers. Sticky
header where the table scrolls. No zebra striping. No giant row heights.

### Dialog (`Dialog.jsx`)

White panel, `radius-xl`, `border-strong`, `--shadow-lg`, `surface-overlay`
scrim (a `2px` blur is acceptable, not glass). Enter: fade + 4px rise over
`--duration-slow` `--ease-emphasized`. Title (`type-heading-sm`) + optional
description + body + right-aligned footer actions. Destructive: `secondary`
cancel + `danger` confirm. Escape closes; focus trapped and restored. No stacked
borders.

### Dropdown / Popover

White/`surface-panel`, `radius-lg`, `border-strong`, `--shadow-md`. Small enter
motion (`--duration-normal`). Clear hover + selected. No blur/glass, no dark
remnants.

### States (`States.jsx`)

- **Loading:** restrained skeletons that preserve layout, or a compact inline
  spinner. No full-page spinner, no shimmer sweep.
- **Empty:** compact, specific, helpful. e.g. *"No receipts yet — sales appear
  here after checkout."* No mandatory illustration. Never fabricate rows to look
  populated.
- **Error:** plain language, retry when valid, no stack traces or secrets. No
  full-page red panic for a recoverable API failure.

### KPI / Metric

Open tile: `surface-app`-toned or bare, `radius-lg`, no border by default (a
group of tiles may share one subtle white surface). Value in `type-stat`
dominates; label `type-body-sm text-secondary` above; delta quiet and semantic.
Four identical heavily bordered cards is the anti-pattern.

### Search field

Icon + input in one hairline-bordered control on `surface-sunken`, `radius-md`,
clear-button appears when populated. In POS it is the scanner-first entry — see
§13.

### Toast / feedback

No toast infrastructure exists today and none is added in this pass. Existing
inline feedback (badges, section messages, the POS sale-success panel) is the
pattern; keep it calm (success), clear (warning), strong enough (error), never
neon. Blocking `alert()`/`confirm()` in POS/forms are functional and stay as-is
(functional freeze) — do not swap them for a new UI system here.

---

## 12. App shell

- **Sidebar** (`.tt-inverse`, `#2A2621`, `w-56`): calm, compact, minimal borders,
  less "template". Brand mark is small (symbol + `TinyTots OS`) — no large logo
  region, no marketing. Nav uses spacing + type; active item = subtle warm
  elevated row + `2px` olive left indicator + olive icon + primary text. Role
  filtering preserved. **Only routes that exist are listed** — no Audit Logs,
  Sessions, Security, Backup, Import/Export, etc. Physical-store V1 primary
  destinations (owner polish §18): Dashboard · POS · Inventory · Low Stock ·
  Performance · Receipts · Staff · Printer, then the profile identity + logout at
  the bottom. Categories / Reports / Customers are **hidden from nav but keep
  their routes and code** for future work. User area at the bottom keeps name +
  role + profile link + logout with minimal boxing.
- **Header** (`h-14`, on `surface-app`): minimal — **notifications only**. Profile
  identity lives solely in the sidebar; there is no header profile menu and no
  "Manage Employees" shortcut (that duplicated the Staff & Access page). No giant
  topbar. The page title/greeting lives in the screen, not duplicated in the
  shell. The bar is deliberately quiet.
- **PageContainer:** the single scroll region. `dense` → `p-4` (POS); default
  `p-5 md:p-7`. Screens don't wrap themselves in another visible container.
- No horizontal application-level overflow at 1280 / 1366 / 1920 width.

---

## 13. POS-specific rules (highest-priority screen)

POS must feel **fast, scanner-first, dense, confident, low cognitive load**. It is
**not** a storefront — no large ecommerce product cards, no image-heavy grid.

Composition: **product workspace (left, flex-1)** + **cart / checkout column
(right, ~380px, `radius-xl` white panel, the one genuinely elevated surface)**.

Visual priority, highest first:

1. Cart total / checkout CTA
2. Cart contents
3. Product search / scanner entry
4. Product availability
5. Payment method
6. Secondary actions (cash drawer, queue, notes)

Rules:

- **Checkout CTA** is visually dominant: full-width `primary` `lg`, olive, at the
  pinned bottom of the cart column. Total above it in `type-stat` olive.
- **Product tiles** compact: small image (or placeholder), name (2 lines max),
  variant, price, stock number/word. Subtle hover + select feedback. No border
  per tile — a very light `surface`/hairline at most.
- **Cart rows** lightweight: spacing + text + a hairline divider between rows —
  **no border around each row**. Compact qty stepper. Remove control stays quiet
  (`text-muted`) until row hover/focus.
- **Payment** selection clearly shows the active method (olive fill) — brand /
  neutral hierarchy, never neon semantic colours. All existing tender behaviour
  preserved; nothing implies unavailable tenders.
- **Offline / queued** states are unmistakable but calm — `warning` semantic
  treatment, not panic-red. Red is only for genuine failure/destructive.
- **No customer selector.** `sales.customer_id` migration is intentionally
  unapplied — POS shows no customer assignment UI.
- Must stay fully usable at **1366×768**: search visible, product area useful,
  cart visible, total visible, payment visible, checkout visible, no horizontal
  body scroll, scanner flow unobstructed.
- The cart item list scrolls internally while the payment/summary/checkout footer
  stays pinned; if the viewport is too short for header+footer, the whole column
  scrolls as a unit rather than clipping the CTA.

---

## 14. Charts (Dashboard / Performance / Reports)

Permanent warm chart theme (Recharts). Real data only — never fabricated series.

| Element | Value |
|---|---|
| Primary series | `--color-brand` `#616845` (olive) |
| Secondary series | `#8F5030` (terracotta) / `#A9B18B` (soft olive) as needed |
| Grid | `--color-border-default` `#D2C7B4`, thin, horizontal only where possible |
| Axis / labels | `--color-text-secondary` |
| Tooltip | white, `radius-lg`, `--shadow-md`, hairline border |
| Semantic points | only where a value is genuinely good/bad |

Reduce chart chrome — no deep frames, no gradients (a single very restrained
area fill at low alpha is the maximum), no neon. Charts are not trapped inside
nested bordered panels.

- **Dashboard** = operational snapshot: context → primary KPIs → sales trend →
  secondary/category → operational items (low stock / recent activity, real
  only). Reduce card soup; metrics breathe.
- **Performance** = analysis: range control, high-signal KPIs, trend, category
  breakdown, goal region, heatmap. Must not look like a re-skinned Dashboard.
- **Reports** = review/summary/period comparison. Same language, different
  composition. No fake export button.

---

## 15. Screen notes (deltas from generic rules)

- **Inventory** — retail catalog management. Header: title · search · filters ·
  grid/list toggle · Add Product. Grid: compact subtle-surface tiles (image,
  name, category, SKU, price, stock), hover reveals affordance, restrained status
  badges, no thick framed card per product. List: the permanent Table.
- **Product Detail** — sections by spacing, not nested panels: identity/header ·
  information · variants/stock workspace · barcode/QR workspace.
- **Product Form (Add/Edit modal)** — scannable groups: Identity · Description ·
  Pricing · Variants · Photos. Not a wall of fields. All functionality preserved.
- **AI description action** — subtle intelligent helper, *not* a flashy AI
  gradient button, no purple. Olive/neutral. States: ready / generating /
  success / error. Failure is non-blocking; manual editing always available.
- **Rich text (ReactQuill)** — native to the new form: quiet toolbar, clean white
  editor surface, no dark/legacy remnants.
- **Image uploader** — subtle dropzone (not a heavy dashed box), thumbnail grid,
  clear primary indicator, quiet remove affordance. Crop/upload preserved.
- **Variants** — dense operational table, clear editable cells, stock status,
  bulk/select preserved, no card nesting.
- **Barcode/QR panel** — compact operational utility. Codes are not giant
  decorative features. Label printer selection stays independent.
- **Low Stock** — urgent but not alarming: table (item, stock remaining, status,
  action), restrained warning tone, no giant banner unless truly required.
- **Receipts** — search/filter · clean table · selection · detail. No giant
  receipt cards. Detail may use a subtle white paper preview; the print-safe
  receipt geometry is never changed. Primary action Print/Reprint — clear, not
  oversized.
- **Categories** — read-only, compact table/list, no giant cards, real data only.
- **Customers** — list: search · count · compact table. Detail: identity/contact
  + real order data. No fake CRM / VIP / loyalty.
- **Users** — compact, clear, safe. Table · Add User · Delete (destructive
  confirm). No fake online indicators. Final-admin protection preserved.
- **Profile** — read-only, simple, no giant avatar card. Logout visible, not
  dominant.
- **Printer Settings** — exceptionally clear: purpose is "select the receipt
  printer for *this PC*". Show installed printers, current configured printer,
  refresh, save/change. No hardcoded model language (POS-80C is only this
  machine's current selection). Underlying printer logic untouched.
- **Notifications** — lightweight dropdown: clear unread state, small priority
  indicators, short text, quiet separators, `--shadow-md`. No giant cards.
- **Employees modal** — consistent with Users. Functionality preserved.
- **Login** — warm canvas, clean brand (Playfair mark OK), one white/elevated
  surface, olive CTA. No hero illustration, no gradient glow, no glassmorphism,
  no marketing copy.
- **Splash** — minimal brand mark/name + subtle progress on warm surface. Fast,
  no cinematic animation.

---

## 16. Do / Don't

**Do**
- Build hierarchy with whitespace, alignment, type, then surface, then divider.
- Reserve olive for action, selection, focus, active nav, progress.
- Keep one elevated surface per view at most (usually a table or the POS cart).
- Use the radius / shadow / motion / spacing scales via tokens.
- Keep tables open and dense; right-align numbers; mono for codes.
- Respect `prefers-reduced-motion`.
- Keep POS usable at 1366×768 above all aesthetics.

**Don't**
- Wrap every KPI / section / metric in its own bordered card.
- Nest card-in-card-in-card.
- Use arbitrary black shadows or any glow / colored shadow.
- Make every icon olive or every icon sit in a coloured square.
- Use Playfair or serif in operational tables/forms.
- Add a component framework or a second animation library.
- Introduce dark `#0a0a0b`-family or coral `#f0483e`-family values into runtime UI.
- Build UI for deferred features (POS customer assignment, audit logs, sessions,
  security centre, backup, import/export, category mutation, profile editing,
  report export, refunds, hold/park, split payment, cash-received/change).
- Change checkout math, tax rate, stock authority, printer logic, auth contracts,
  or the Supabase schema for any visual reason.

---

## 17. Token architecture (target)

```
TinyTots Electron tokens  (:root default = warm; .tt-inverse = sidebar)
        │
        ├── canvas / surface / elevated / sunken / inverse
        ├── text (primary / secondary / muted / inverse)
        ├── border (default / strong)
        ├── brand (+ hover / active / soft) · accent
        ├── semantic (success / warning / error / info)
        ├── radius (sm / md / lg / xl / pill)
        ├── shadow (sm / md / lg)
        ├── spacing (4 · 8 · 12 · 16 · 20 · 24 · 32)
        ├── typography (type-* scale)
        └── motion (duration-fast/normal/slow · ease-standard/emphasized)
                    ↓
            shared primitives (src/components/ui/)
                    ↓
                 all screens
```

The end state is **one intentionally designed TinyTots Electron system** — not a
dark app with a warm override.

---

## 18. Borderless by default — owner acceptance polish (2026-09-06)

Second-pass owner feedback: the app was cleaner than the old dark/coral language
but still leaned on **cream canvas + white rectangles + hairline borders** to
separate everything, so it still read like a generated admin template rather than
TinyTots. This section records the corrections.

### 18.1 Separation order (reinforces §3)

Reach for the earliest that works: **whitespace → typography → background tone →
alignment → imagery/icon → divider → border.** A border is for a control, a
floating surface (dialog/popover/dropdown), a data table's outer edge, receipt
paper, a selected/focus state, or a genuinely contained interactive area. **Not**
for a KPI, a dashboard section, a receipt-list, a POS workspace, an analytics
group, profile information, a printer-state block, or an empty state.

Use **surface tone** to zone a screen: `canvas` → open section → a `surface-panel`
raise only where useful → `surface-elevated` / soft semantic tint for a distinct
operational zone. Don't turn every region a different colour — keep rhythm.

### 18.2 Restrained semantic life

Operational screens may carry restrained semantic saturation: a small tinted icon
well, a soft tinted KPI ground (~6–8% tint + a stronger icon well + neutral
text), a semantic badge, a selected state, real product imagery. **Not** full
bright rainbow cards. Directions: sales/success → olive/sage; orders/commerce →
restrained terracotta (`accent`); average-value/analytics → muted blue-grey
(`info`); low stock → warm amber (`warning`); goal progress → olive. These are the
existing semantic tokens — extended centrally in `KpiTile` (`tone` prop) and
`KpiRow`, not hardcoded per screen.

### 18.3 Images vs icons

Use a **real image** only where the dataset already provides one and it
identifies a real product/catalog item. Where none exists, use a simple Lucide
icon in a tinted well. Never fabricate images, add a stock-photo service, or make
a network fetch just for decoration. **Login is the one brand exception** — it
uses an approved TinyTots website lifestyle image packaged into the bundle
(`src/assets/login-brand.webp`, from the site's `brand-story-support.webp`).

### 18.4 Navigation & duplication

- Physical-store V1 sidebar: Dashboard · POS · Inventory · Low Stock ·
  Performance · Receipts · Staff · Printer. Categories / Reports / Customers are
  hidden from nav; **routes and code stay live** (still reachable by direct URL).
- **Performance** is the single primary analytics destination. **Reports** stays
  dormant until it has genuinely distinct report/export capability.
- **Staff & Access** (`/users`, sidebar label "Staff") is the single
  user-management authority. The header profile menu and its "Manage Employees"
  shortcut are removed; the dead `EmployeesModal` is deleted.
- **One profile system:** sidebar identity + `/profile` + sidebar logout. No
  competing header profile.

### 18.5 Time-aware greeting (Dashboard hero)

`src/lib/greetings.js` — ~48 curated short lines across six time bands (late
night / early morning / morning / afternoon / evening / night). A line is chosen
**deterministically** from the date + band + username, so it's stable within a
session/band and only drifts across the day and days; it never flips on
re-render, and no text is fetched from an AI. The greeting name is a **local,
per-username preference** (`tinytots:greeting-name:<username>`), editable on the
Profile screen, "used only for greetings on this device" — it never touches the
account record. Fallback derives the first meaningful name token from the session
name; username is used only if there is no name at all.

### 18.6 Notification truthfulness

Action affordances map only to routes the app can actually fulfil:
`view_receipt` / `view_order` → Receipts, `view_product` → Inventory,
`view_performance` → Performance. `view_activity` (employee-login) shows with
**no** action button — there is no activity screen, so no misleading link.
`retry_sync` / `retry_printer` are gone (no real retry contract; they only did a
window reload). `timeAgo()` no longer prints "Today &lt;time&gt;" for older days:
Just now → `N min ago` → `N hr ago` (same day) → Yesterday → a plain date.
Notifications group into **New / Earlier**; the redundant full-width Close row is
removed (outside-click / bell toggle / Escape all close the panel).

---

## 19. Post-review polish — Splash, Sign-in motion, dashboard life (2026-09-06)

A focused pass on top of §18 from live owner-review screenshots.

### 19.1 Shared relative time

`src/lib/time.js` owns both forms — `timeAgo()` (full: "5 min ago" / "Yesterday" /
"12 Aug") for the notification panel and `timeAgoShort()` (compact: "5m" / "3h" /
"2d") for the Dashboard activity meta line. One implementation → no drift, and
the "Today &lt;time&gt;" bug can't come back.

### 19.2 Dashboard life

- **Low-stock thumbnails.** `/api/low-stock` now also returns `imageUrl`
  (`products.image_url`, the primary photo already kept in sync — additive to the
  existing response, no new contract, no schema change, no over-fetch). The
  Dashboard low-stock list shows a real thumbnail when present and a Lucide
  `Package` well when not. The Low Stock *page* ignores the new field, so its
  approved composition is untouched.
- **Quick Actions.** Each action carries its own restrained semantic icon well
  (New Sale = olive fill; then success / brand-soft / elevated / info / accent at
  12 % tint) with an icon-scale + slide-in chevron on hover and an `active`
  press. Still compact rows, no borders.
- **Recent Activity.** Category-tinted icon wells (warning / success / info /
  brand / neutral), a right-aligned `timeAgoShort` meta, calmer `/70`–`/40`
  dividers and a row hover.

### 19.3 Motion primitives (extends §9 — still CSS-only, no library)

| Class | Use |
|---|---|
| `.tt-flip-char` (`@keyframes tt-flip-char`) | One restrained per-character `rotateX` flip when a Flip-Text line changes |
| `.tt-scatter-tile` (`@keyframes tt-scatter-in`) | Splash image tiles settling in, staggered by `--sd` |
| `.tt-splash-leaving` / `.tt-signin-enter` | Splash fade-out handing off to a soft Sign-in morph (fade + slight scale + de-blur) |
| `.tt-splash-bar` | One-shot splash progress fill |

All collapse under `prefers-reduced-motion` via the existing global rule — the
resting composition (tile rotation lives on the static slot) is always correct.

### 19.4 Sign-in (supersedes the §15 Login note's proportions)

~44/56 image / form split. No brand-mark chip, no "Store Console" / "Retail
terminal" labels. Heading is a large Playfair **"TinyTots OS"**; beneath it a
`FlipText` (`src/components/motion/FlipText.jsx`) rotates ~4 short operational
lines. Form stays open and borderless (no auth card). The image is a real
approved TinyTots website lifestyle photo bundled locally
(`src/assets/lifestyle/kids-reading.webp`). Auth logic is byte-for-byte
unchanged.

### 19.5 Splash — Image Scatter (implements the deferred Splash)

Adapted from the Vengeance UI Image Scatter grammar: five warm TinyTots editorial
tiles (`src/assets/lifestyle/*.webp`, one photoshoot, coherent cream/olive
palette) settle into a loose fan behind the wordmark, hold briefly, then the
whole splash fades as Sign-in morphs in. Pure CSS + two timers, ≈ 1.9 s total. No
video, no canvas, no render, no motion library. Splash → `/login` when logged
out, `/dashboard` when a session already exists.

### 19.6 Dev reliability

`vite.config.js` pins `server.port: 5173` + `strictPort: true` (Electron's
`DEV_URL` is hard-coded to 5173 — a stale dev server must now fail loudly, not
silently drift to 5174 and let Electron load a zombie graph). `electron/main.js`
clears the renderer cache once before the first dev `loadURL` so a changed module
graph can't be served stale. Both are dev-only; the packaged `loadFile` path is
untouched.
