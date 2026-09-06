# TinyTots OS — Electron · Splash / Sign-in / Final Polish

**Branch:** `electron-redesign-2026-09-06`
**Starting SHA:** `d555757`
**Final SHA:** branch tip after this pass (4 commits — see §Commits)
**Date:** 2026-09-06
**Scope:** focused visual/product polish from live owner-review screenshots. No
business-logic change; functional freeze in force.

---

## 1. Owner feedback → what was done

| Feedback | Action |
|---|---|
| Low Stock Items on Dashboard show no images | `/api/low-stock` now also returns `imageUrl` (`products.image_url` — additive, no new contract/schema); the Dashboard list renders a real thumbnail when present, Lucide `Package` well when not. |
| Quick-actions strip feels lifeless | Each action gets its own restrained semantic icon well + icon-scale/chevron hover + `active` press. Still compact, still borderless. |
| Notifications panel still looks weak | Rebuilt spacing/typography: softer `rounded-xl` + `shadow-lg` float, `type-card-title` header, tracked group labels, bigger tinted wells, 2-line descriptions, unread = brand tint + olive left rail, faint dividers, tabular time. Read/mark/clear untouched. |
| Sign-in image good; composition should feel ~40/60–45/55 | Split is now **44/56** (`md:w-[44%] lg:w-[45%]`). |
| Remove "TinyTots OS Console" / "Retail terminal" labels | Removed — no brand-mark chip, no footer label. |
| Bigger "TinyTots OS" + Vengeance Flip Text | Heading is Playfair **40px** "TinyTots OS"; `FlipText` component rotates 4 short lines with one restrained per-character `rotateX` flip. |
| Better sign-in image allowed | Swapped to `editorial-story-02.webp` (two children reading, warm daylight) — a more human family/kidswear lifestyle frame than the flat-lay. Bundled locally. |
| Vengeance Image Scatter for Splash; fade → sign-in morph | Splash implemented: 5 coherent warm tiles settle into a loose fan behind the wordmark, then fade as Sign-in morphs in (fade + slight scale + de-blur). CSS only. |
| Don't overcomplicate POS / slow it down | POS pass is cosmetic only: lighter dividers, gentle product-image hover. Search, filters, checkout, scanner/F2 untouched. |
| Dev reliability (stale renderer/port cost time) | `vite.config.js` `strictPort: true` on 5173; `electron/main.js` clears renderer cache once before the first dev load. Dev-only. |

---

## 2. Dashboard

- **Low-stock thumbnails — implemented end-to-end.** Backend: `product:products(name, supplier_id, image_url)` added to the existing `/api/low-stock` select, mapped to `imageUrl`. Frontend: `<img loading="lazy" object-cover>` when `it.imageUrl`, else the `Package` icon well. Rows stay compact (`py-2.5`), gain a hover tint and lighter `/70` dividers.
  *Observed in QA:* the current low-stock catalog items have no primary photo set (`products.image_url` is null), so the icon fallback shows — no fake placeholder. Thumbnails appear automatically for any product that has a photo. (The QA session's backend also predated the change and must be restarted to serve the new field.)
- **Quick Actions** — six semantic wells: New Sale = olive fill, then success / brand-soft / surface-elevated / info / accent at ~12% tint. `group-hover` scales the well and reveals a slide-in chevron; `active:translate-y-px`. `rounded-lg`, no borders.
- **Recent Activity** — category-tinted wells (`inventory→warning`, `sales→success`, `employee→info`, `goal→brand`, `system→neutral`), right-aligned `timeAgoShort` meta, `/40` dividers, row hover.
- **KPI row / greeting** unchanged from §18 (already borderless semantic tiles + deterministic greeting).
- No data contract changed on the frontend; no fabricated data.

## 3. POS — calmness pass

Cosmetic only. Session-strip divider `/60`, cart-header divider `/60`, cart-item dividers `/50`, product tiles `rounded-lg` with a 200ms `scale-[1.04]` image hover and `active:translate-y-px`. Search field, "Advanced" filter, payment controls, totals, **Checkout CTA** and the `ScannerListener` / F2 path are all unchanged. Verified no horizontal scroll at 1366×768.

## 4. Notifications

Truthfulness preserved exactly (action routes, `view_activity` has no button, no `retry_*`). Visual: `w-[380px]` `rounded-xl` `border-default` `shadow-lg`; header `type-card-title` + "Mark all read" / "Clear all" (hover → brand); sticky tracked **New / Earlier** group labels; rows `px-4 py-3` with a `w-9 h-9` priority-tinted well, 2-line `line-clamp` description, `tabular-nums` relative time via `lib/time.js#timeAgo`; unread row = `bg-brand/[0.045]` + a 2px olive left rail + bolder title; read row = muted title; `divide-border-default/40`. Mark-one-read / mark-all / clear-all logic untouched. QA: opens, groups render with real data, times read "31 min ago" / "1 hr ago" (no "Today …" bug).

## 5. Sign-in

- 44/56 split; image `src/assets/lifestyle/kids-reading.webp` (`object-cover object-center`), faint warm inner gradient where it meets the form.
- Heading: `font-display` (Playfair) **40px** "TinyTots OS", `tracking-[-0.01em]`.
- `FlipText` (`src/components/motion/FlipText.jsx`): rotates every 3.8s through
  *"Store operations, beautifully simple" · "POS, inventory and receipts in one calm place" · "Run the counter with confidence" · "Warm retail operations"*, one `rotateX` character flip per change (22ms stagger, 460ms), `aria-live="polite"`. Reduced-motion → plain swap (global collapse).
- Form: unchanged bordered inputs (controls), unchanged olive CTA, no enclosing card. Root carries `tt-signin-enter` for the splash hand-off morph.
- **Auth logic byte-for-byte unchanged** (`handleSubmit` diff = 0).
- QA: 1366×768 and 1280×720 — image width = 45% of viewport, all fields + CTA visible, no scroll, no "Console/terminal" wording present.

## 6. Splash

- **Implemented** (was deferred). `src/screens/Splash.jsx`, five tiles from `src/assets/lifestyle/` (`rail-basket`, `girl-reading`, `kids-reading` centre/lifted, `peg-rail`, `rail-booties`).
- Sequence: tiles `tt-scatter-in` staggered 0/90/180/270/360ms (600ms each) → wordmark + one-shot `tt-splash-bar` fade in at ~620ms → hold → `tt-splash-leaving` at 1500ms → `navigate` at 1920ms. Total ≈ 1.9s (owner target 1.2–2.5s).
- Rotation lives on the static slot, only the tile animates → resting composition correct under `prefers-reduced-motion`.
- **No** video / canvas / render / Lottie / motion library.
- Route: `/login` when logged out, `/dashboard` when a session already exists (`isLoggedIn()`).
- QA screenshot at 1366×768: five warm editorial tiles in a loose fan, centre tile forward/larger, Playfair wordmark + "MANAGE · SELL · GROW" + progress line + "Powered by Vantixis". Coherent cream/olive palette.

## 7. New local assets

`src/assets/lifestyle/` (5 files, ≈ 792 KB total, all real approved TinyTots
website photos from one editorial photoshoot — sources in
`tinytots-web/web/public/images/homepage/`):

| Bundled as | Source | Used by |
|---|---|---|
| `rail-basket.webp` | `brand-story-support.webp` | Splash |
| `rail-booties.webp` | `lifestyle-support.webp` | Splash |
| `girl-reading.webp` | `editorial-story-01.webp` | Splash |
| `kids-reading.webp` | `editorial-story-02.webp` | Splash + **Sign-in** |
| `peg-rail.webp` | `cta-closing-visual.webp` | Splash |

Old `src/assets/login-brand.webp` removed (Sign-in now imports `kids-reading.webp`). No new image was generated — this toolchain has no image generation; the approved website set is coherent and sufficient. If the owner later wants a bespoke sign-in/splash frame, drop a `.webp` into `src/assets/lifestyle/` and swap the import — nothing else changes.

## 8. Flip Text / Image Scatter

- **Flip Text — implemented** as `src/components/motion/FlipText.jsx` (adapted grammar, not a library import). One slow character flip per phrase change; honours reduced motion.
- **Image Scatter — implemented** as the Splash composition (adapted for a startup context, not scroll-based).

## 9. Dev hardening

- `vite.config.js`: `server.port: 5173`, `server.strictPort: true` — a stale/zombie dev server on 5173 now makes `npm run dev` fail loudly instead of drifting to 5174 while Electron's hard-coded `DEV_URL` loads the zombie.
- `electron/main.js` (dev branch only): `webContents.session.clearCache()` once before the first `loadURL(DEV_URL)`, so a changed module graph can't be served stale by Chromium's cache. Packaged `loadFile` path untouched.

## 10. QA

| Check | Result |
|---|---|
| `npm run build` | **PASS** (`✓ built in ~1.3s`; only the pre-existing >500 kB chunk advisory). 5 lifestyle `.webp` bundled. |
| Targeted ESLint (changed files) | **0 new findings.** Baseline only: `NotificationBell` `load()`-in-effect and `POS` `Date.now()` purity (both fire identically on `d555757`); the `no-undef process/Buffer` noise in `server.js` / `electron/main.js` / `vite.config.js` is the frontend eslint config applied to Node files — error counts are **identical HEAD vs working** (19/19, 11/11, 4/4), i.e. untouched by this pass. |
| Real dev renderer (Vite + Playwright, 1366×768 & 1280×720) | **PASS** — Splash, Sign-in, Dashboard, POS, Notifications all render; **no white screen**; **0 console errors/warnings** across the whole session; no horizontal scroll. |
| Splash | Scatter renders (5 tiles, all images loaded), wordmark, progress; routes correctly logged-out → `/login`, logged-in → `/dashboard`. |
| Sign-in | 45% image, Playfair 40px heading, FlipText cycling, no Console/terminal text, fields + CTA visible at both sizes. |
| Dashboard | Greeting "Evening rush, Bilal.", semantic KPI tiles, 6 quick-action wells (distinct tints verified), low-stock icon fallback (no product photos in current data), activity tinted wells + relative time. |
| POS | Search visible, Advanced present, Cart + Checkout present, "Scanner active", no scroll. |
| Notifications | Opens on bell; `rounded-xl` (16px); New/Earlier groups; "Mark all read" + "Clear all" intact; real times formatted correctly. |
| Inventory / Low Stock pages | Not edited; `Table` default path and `/api/low-stock` page consumer unaffected by the additive `imageUrl`. |
| Database | Schema changed — **NO**. Migrations — **NO**. Production writes — **NO** (QA set the session in `sessionStorage`; only GET endpoints were hit; the backend was not restarted). |

## 11. Remaining owner decisions

- Restart the local backend so `/api/low-stock` serves `imageUrl`; set primary photos on the products that are actually low on stock to see thumbnails on the Dashboard.
- Confirm the four Flip-Text lines (copy is easy to change in `src/screens/Login.jsx#SIGN_IN_LINES`).
- Splash tile selection / order — swap any `src/assets/lifestyle/*.webp` if a different frame is preferred.
- Sign-in vertical placement is centred; can be nudged upward if the owner wants it more anchored.

## Commits

1. `style(electron): enrich dashboard and calm POS surfaces`
2. `style(electron): refine notifications and sign-in composition`
3. `feat(electron): add TinyTots splash image-scatter and flip-text motion`
4. `chore(electron): dev hardening and splash/sign-in polish report`

## Verdict

**READY FOR OWNER REVIEW.** No packaging, installer, main-branch merge, deploy or
migration performed.
