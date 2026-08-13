# TinyTots Redesign — Condensed Build Brief

**Purpose:** This is a distilled entry point for whoever implements the redesign (Claude Code). It replaces reading all 177 files in `Website Redesign Docs/` on day one. Full detail always lives in the source docs — paths are given throughout so you can go deeper on any topic.

Generated from a full read-through of the repo (`github.com/aixbilal/TINYTOTS-OS`) on 2026-08-13.

---

## 1. What TinyTots Is

A real, operating children's clothing **retailer** (not a manufacturer — never put TinyTots branding on garments or imply private-label manufacturing). This is a visual redesign of an already-working commerce site. The backend, data, and business logic are correct and must be preserved; only presentation changes.

---

## 2. Source of Truth (in priority order)

1. **Business reality** — confirmed constraints, actual product/catalog data.
2. **The repository** (`tinytots-web/web`) — authority for routes, components, APIs, data contracts, dependencies. Never invent any of these.
3. **`Website Redesign Docs/`** — authority for the *new* visual/UX direction. Individual docs are approved (see §3).
4. **Visual references / moodboards** (`16-ASSETS/`) — support the system, don't override written rules.
5. AI-generated reports (including this one) — evidence/recommendations, not automatic authority.

Full doc: `00-MASTER/00.05 — Source of Truth.md`

---

## 3. Documentation Status — Read This First

The tracker file `00-MASTER/00.08 — Progress Tracker.md` shows phases 01–17 as "NOT STARTED." **This is stale — ignore the table.** I checked the YAML frontmatter on all 177 individual doc files directly: Brand, Design System, Art Direction, Motion, Global UX, User Frontend page specs, Responsive, Implementation, and QA docs are each individually marked `approved`, `approved-direction`, `governing`, or `mandatory`. Per the project's own Source-of-Truth rule ("once a document is marked approved, it becomes the design authority"), treat the individual doc status as real. Flag the tracker table to be updated, but don't wait on it.

**Not yet approved / evaluative only (treat as reference, not instruction):** `06-INTERACTION-REFERENCES` (UI library evaluations), `12-REFERENCE-BRANDS` 12.01–12.07 (competitor analysis — 12.08 TinyTots Synthesis *is* governing), `00.02` (current-state audit).

---

## 4. Repo State Right Now

- Latest commit (`a9e1587`, today) only added video assets — **zero redesign code exists yet.** Full history before that is normal feature/bugfix work (WhatsApp pipeline, PWA offline cache, Vercel/perf fixes) — a mature, actively maintained app, not a scaffold.
- `tinytots-web/web/AGENTS.md` and `CLAUDE.md` already exist in the repo (separate from this brief) — generic Next.js-version warning + generic security/perf rules. Worth reading, not TinyTots-specific.
- `tinytots-web/web/stitch_tinytots_premium_e_commerce_platform (1)/` — real HTML/CSS + screenshots (desktop & mobile) for several pages: cart drawer, checkout, address book, collection catalog, contact us, account settings, and more. **The current color tokens in `globals.css` were already generated from this Stitch output** — so this folder is effectively the "before" reference, useful for understanding current patterns even though the target direction differs (see §6).
- `repomix-output.xml` (1.6MB) — a packed full-repo dump, useful for tools without direct repo access. Not needed if you have real repo access.

---

## 5. Stack (verified from `package.json`)

- **Next.js 16.2.9** — very recent. The repo's own `AGENTS.md` warns: *"This is NOT the Next.js you know... read `node_modules/next/dist/docs/` before writing any code."* Take this seriously — don't assume older App Router conventions.
- React 19.2.4, TypeScript 5
- **Tailwind CSS v4** (`@theme inline` block in `globals.css`, not a `tailwind.config.js`) + `@tailwindcss/postcss`
- shadcn/ui (`components.json`) + `@base-ui/react` + `class-variance-authority`
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — auth, data, everything backend
- Framer Motion (animation), lucide-react (icons)
- Serwist (PWA/service worker — offline support is a real, tuned feature, don't break it)
- Upstash Redis (`@upstash/ratelimit`) — rate limiting
- Zod, DOMPurify, sanitize-html — validation/sanitization
- **No test suite** (no jest/vitest/playwright/cypress). "Tests" in any Definition of Done = `npm run build` + `npm run lint` + TS type-check, nothing more.
- Dev server runs on **port 3001**, not 3000 (`next dev -p 3001`).

---

## 6. Current vs Target — The Actual Gap (this is the important part)

### Color
**Current** (`app/globals.css`, tagged "Colors from Stitch design system"): a Material-Design-3-style multi-hue system — primary `#9c422e` (rust/terracotta), secondary `#396280` (blue), tertiary `#186c40` (green), plus a full surface/outline/container scale, layered *underneath* shadcn's own default theme vars (`--border`, `--card`, `--popover`, `--accent`, `--destructive`, `--sidebar-*`, `--chart-*`). Two overlapping token systems currently coexist.

**Target** (`02-DESIGN-SYSTEM/02.02 — Color System.md`): a warm-neutral architecture — Warm Ivory → Soft Sand → Warm Stone → Muted Taupe → Deep Charcoal → Near Black — with **one** restrained warm accent used sparingly, not a 3-hue palette. Semantic naming convention differs too: target wants `surface.canvas`, `text.primary`, `border.subtle`, `brand.primary`, `feedback.success`, etc.

**Gap:** real, structural, not cosmetic — this is a "shared system" level change (per `13-IMPLEMENTATION/13.01`), not a find-and-replace. **No hex values are specified in the docs** — they explicitly say *"exact production values must be approved after visual reference generation and contrast testing."* Don't invent a hex code and attribute it to the docs. Derive candidate values from `16-ASSETS/02 — Generated Images/00 — Master Visual References/01 — Visual DNA/` (the master visual direction board images) and confirm WCAG contrast before locking anything in.

### Typography
**Current:** Plus Jakarta Sans (display/headline) + Inter (body/label), via `next/font` in `app/layout.tsx`.
**Target** (`02.03 — Typography System.md`): **Playfair Display** (serif, editorial/display candidate) + Geist/Inter (UI/body) + JetBrains Mono (SKU/technical). This is a real typographic character shift — geometric sans → high-contrast serif for display — consistent with the "editorial sophistication" brand direction (§7). Exact type scale sizes aren't specified either; current `--text-*` values in `globals.css` (e.g. `display-lg: 48px`) are a reasonable starting scaffold to adapt, not to discard.

### Spacing / Radius / Shadow
Current uses purpose-named tokens (`--spacing-stack-sm/md/lg`, `--spacing-margin-mobile/desktop`, `--radius-sm..4xl` via `calc()` off a base `--radius`). Target docs want a numbered semantic scale (`space-1..10`, `radius-none/sm/md/lg/pill`, `elevation-none/subtle/raised/floating`) with **no exact values given** — lower priority than color/type, mostly a renaming/consolidation task, not a redesign.

---

## 7. Brand Direction (condensed from `01-BRAND/`)

**Position:** Premium children's fashion brand, not a generic kids' clothing store. Sits between "playful children's brand" and "luxury fashion house" — closer to the luxury end, but must keep warmth. Emotional territory: *quiet confidence + childhood warmth + editorial sophistication.*

**References (style, never copy layout/branding):** Zara (editorial composition, restraint), Jacadi (premium children's positioning), Ralph Lauren Children (lifestyle storytelling), COS (whitespace, typography), Aesop (calm information architecture), Apple (interaction quality).

**Personality balance** (from `01.03`): Refined (high) > Modern ≈ Confident > Warm > Playful (intentionally lowest — "childhood warmth," not "childish UI").

**Explicitly rejected** (`01.07 — Anti-Patterns & Rejected Directions.md`) — don't propose or default to any of:
- Childish UI (cartoon buttons, stickers, primary-color overload)
- Generic black-and-gold "luxury"
- Neon/futuristic/cyberpunk treatments
- Animation-as-showcase (magnetic buttons everywhere, scroll-jacking, constant parallax)
- Mixing unrelated UI-library effects without a unifying system
- Excessive glassmorphism / heavy blur everywhere
- "Card everything" (not every block needs to be a rounded card)
- Fake urgency (fake stock warnings, artificial countdowns)

---

## 8. Implementation Roadmap (from `17.04`, matches the Day 1–5 plan)

```
Phase A — Repository Baseline      (audit routes, components, tokens, deps — DO THIS FIRST)
Phase B — Design-System Foundation (colors, type, spacing, buttons, cards, icons as real tokens/components)
Phase C — Global Shell             (header, nav, mega menu, search, account, cart, footer, global states)
Phase D — Core User Journey        (Homepage → Products → Product Details → Cart → Checkout → Account)
Phase E — Supporting Pages         (Our Story, Blog, Help, Size Guide, Shipping & Returns, Contact, Report Issue, Track Order)
Phase F — Motion                   (after layouts are stable — CSS/simple → component → choreography)
Phase G — 3D                       (reserved; only with fallback + approved asset + stable perf baseline)
Phase H — Admin Frontend           (after public frontend is stable — separate effort)
Phase I — Asset Integration        (verify → optimize → connect to data → implement → test)
Phase J — QA                       (visual, responsive, motion, 3D, accessibility, performance, functional)
Phase K — Final Acceptance
```
Public frontend is the first target; admin follows once the shared design system and public site are stable (`17.04 §14`).

---

## 9. Global Shell Requirements (Phase C detail, from `07-GLOBAL-USER-EXPERIENCE/`)

**Header/Nav** (`07.01`): Logo → primary nav → search → account → cart, in that conceptual order on desktop. Mobile priority: menu → logo → search → cart (account can live inside the menu). Sticky/compressing header allowed; avoid aggressive hide/show. **Nav categories must come from real catalog data** (`app/api/categories/route.ts` already exists) — the doc explicitly says don't invent categories without repo/catalog confirmation.

**Footer** (`07.10`): Content groups — Shop / Help / About / Account / Contact / Legal / Social — but **only real, existing routes**, no placeholder links. Can be visually stronger than a typical utility footer (oversized type, imagery) but must stay functional; collapse into accordions on mobile.

**Current shell code:** `components/SiteShell.tsx` (client component — wraps `CartProvider`/`AuthProvider`/`WishlistProvider`, renders `HeaderCart`, `CartStickyBar`, `MobileSubNav`, lazy-loaded `FooterFaq`; has a working `SearchOverlay` that fetches `/api/products` and filters client-side by name/brand/sku/category). This is real, working code — adapt visually, don't rewrite the data/interaction logic without reason.

---

## 10. Component Architecture Rules (from `13.02`)

Layer: `App/Route → Page Composition → Section → Feature → UI Primitive`. Pages should mostly compose sections, not hold styling/logic directly. Prefer composition + explicit variants over duplicated components or boolean-prop soup. Keep animation and (especially) any future 3D isolated behind clear boundaries, not scattered through unrelated components.

---

## 11. Do Not Touch (protected, per this project's own rules)

Authentication, product/inventory/pricing logic, cart/checkout/order logic, Supabase queries & RLS, API contracts, admin functionality, WhatsApp notification pipeline (`lib/whatsapp-notify/`, `app/api/v1/whatsapp-*`), Meta-agent integration (`lib/meta-agent/`, `app/api/v1/meta-agent/*`), Electron POS (separate top-level `tinytots-app/`, not in scope at all), signage feature, offline/PWA caching behavior. Visual-only changes should not touch these layers — if a task seems to require it, that's a stop-and-report moment, not a silent change.

---

## 12. Verification Expected (per `14.03 — Claude Code Instructions.md`)

Operating loop: **Read → Plan → Edit → Test → Review → Report.** After implementation, run whatever applies: type check, lint, build, route-level check, visual check, responsive check. Never claim a check passed without actually running it (no test suite exists — see §5). Report format:
```
IMPLEMENTED:
FILES CHANGED:
DEPENDENCIES:
VALIDATION:
KNOWN ISSUES:
NEXT STEP:
```

---

## 13. Where to Go Deeper

| Topic | Path |
|---|---|
| Full color/type/spacing/radius/shadow/button specs | `Website Redesign Docs/02-DESIGN-SYSTEM/` |
| Art direction, photography style, moodboards | `03-ART-DIRECTION/`, `11-VISUAL-REFERENCE-LIBRARY/` |
| Motion rules & tokens | `04-MOTION/` |
| Per-page specs (Homepage, Products, PDP, Account, Blog, etc.) | `08-USER-FRONTEND/` (each file is `governing-page-spec`) |
| Admin redesign (Phase H, later) | `09-ADMIN-FRONTEND/` |
| Responsive breakpoint philosophy | `10-RESPONSIVE/` |
| SEO / accessibility / browser support requirements | `13-IMPLEMENTATION/13.08–13.10` |
| QA checklists by category | `15-QUALITY-ASSURANCE/` |
| Approved image/video/icon assets | `16-ASSETS/` (see `16.00 — Asset Production Blueprint.md` first) |
| Full final spec + AI context package | `17-MASTER-SPECIFICATION/17.01` and `17.05` |

---

## 14. First Real Task Once Claude Code Is Running

Phase A, literally: point Claude Code at `tinytots-web/web`, have it inspect the real route tree, `components/`, `lib/`, and current `globals.css` tokens against this brief, and produce a short **change plan** for Phase B (design-system foundation) before writing any code — per this project's own rule, plan before edit.
