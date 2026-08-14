---
name: project-ui
description: TinyTots design system reference for tinytots-web — colors, typography, spacing, radius, components, and known gaps between the approved design docs and the actual implementation. Load before writing, editing, or reviewing any UI/styling code (CSS classes, Tailwind utilities, component markup, design tokens) in tinytots-web/web.
---

# TinyTots Design System (project-ui)

Source docs: `Website Redesign Docs/` (repo root, 392 files — this skill condenses the ones that matter for implementation). Full detail lives in `02-DESIGN-SYSTEM/`, `13-IMPLEMENTATION/13.03`, and `00-MASTER/00.05` (Source of Truth / precedence rules).

## Authority rule — read this first

The design docs are **approved principles and semantic categories**, not a source of exact values — nearly every doc explicitly defers hex/px/font values to implementation. The implementation already happened for the core token layer:

**`tinytots-web/web/app/globals.css` is the authoritative source for exact values.** When a doc and globals.css disagree on a concrete number, globals.css wins (it's downstream, approved, and contrast-tested). When globals.css is silent on something the docs describe (shadows, icon sizes, breakpoints), that's a **gap**, not a conflict — say so explicitly rather than inventing a value. Never fabricate a color/size/spacing value and present it as approved (this is also a hard rule in `CLAUDE.md`).

Dead tokens: `globals.css` still contains a commented-out old "Stitch" token block (`--color-primary: #9c422e`, `--color-surface`, `--color-outline`, etc., lines ~9-68). These are non-functional — never use classes built from them (`bg-primary`, `text-on-surface`, `border-outline-variant`...). See the `tinytots-redesign-token-migration` memory for the batch-by-batch cleanup of old call sites still using these.

## Core design principles (condensed)

- Premium is a system, not decoration — consistency across type/spacing/photography/motion/performance.
- Editorial over template: large imagery, intentional cropping, asymmetry. Avoid generic repetitive card-grid ecommerce look.
- Restraint over spectacle: every effect needs a communication reason, or skip it.
- One design language — no page invents its own visual style outside this system.
- Photography first: UI supports the image, doesn't compete with it.
- Whitespace is intentional, not filler.
- Motion preserves continuity (directional/scale/opacity), never random entrance animation.
- User-facing pages optimize for emotion/discovery/confidence/purchase; Admin optimizes for speed/scanning/density — same token system, different composition.
- Consistency beats novelty. Accessibility is designed in, not bolted on. Performance is a luxury feature.
- Never invent UI for a feature that doesn't exist in the business/backend.

## Color tokens

Use these Tailwind classes (already wired via `@theme inline` in globals.css) — never raw hex, never the dead `Stitch` names below.

| Token / class suffix | Hex | Use for |
|---|---|---|
| `surface-canvas` / `surface-primary` | `#f6f1e8` (Warm Ivory) | page background |
| `surface-secondary` | `#e7d8c0` (Soft Sand) | subtle section bg, hover bg |
| `surface-tertiary` | `#d2c7b4` (Warm Stone) | further-elevated / disabled bg |
| `surface-elevated` | `#ffffff` | cards, popovers, anything lifted above canvas |
| `surface-inverse` | `#2a2621` (Near Black) | dark sections (footer/campaign contrast) |
| `text-primary` | `#4a4f44` (Deep Charcoal) | body/headline text — 7.49:1 contrast |
| `text-secondary` | `#675949` | secondary/supporting text — 6.02:1 |
| `text-tertiary` | `#bab2a6` (Muted Taupe) | labels/UI chrome only — 3.60:1, **not body copy** |
| `text-inverse` | `#f6f1e8` | text on dark/inverse surfaces |
| `border-subtle` | `#e7d8c0` | hairline borders |
| `border-default` | `#d2c7b4` | standard borders |
| `border-strong` | `#bab2a6` | emphasized borders |
| `brand-primary` / `brand-accent` | `#8f5030` (deep terracotta) | CTAs, active/selected states, emphasis. **Not** the default link/interactive color everywhere — reserve for real emphasis per doc `02.02`. |

No `feedback.*` (success/warning/error/info) tokens exist yet. Established stopgap from the token-migration work: `text-red-700` / `border-red-700` for error, `text-green-700` for success — documented as a stopgap, not a doc-approved value. Keep using it for consistency until real feedback tokens are added; don't invent a third option.

## Typography

Font loading status: `Inter` and `Plus Jakarta Sans` are loaded via `next/font` in `app/layout.tsx` and live. **Playfair Display, Geist, and JetBrains Mono are referenced in CSS var fallback chains but not yet loaded** — they currently degrade to generic serif/sans/monospace. Playfair was approved 2026-08-13 as the permanent heading-sm/md font direction, so treat it as intended-but-pending, not wrong — don't "fix" it by swapping to Plus Jakarta Sans, and flag to the user if a task seems to depend on it actually rendering as serif.

| Token | Size | Line-height | Font (current) |
|---|---|---|---|
| `display-xl` | 64px | 1.05 | heading-serif (Playfair, unwired) |
| `display-lg` | 48px | 1.1 | Plus Jakarta Sans |
| `display-md` | 36px | 1.2 | Plus Jakarta Sans |
| `heading-xl` | 30px | 1.3 | heading-serif (Playfair, unwired) |
| `heading-lg` | 24-30px* | 1.3 | mixed — check call site |
| `heading-md` | 20px | 1.4 | mixed — check call site |
| `heading-sm` | 18px | 1.4 | heading-serif (Playfair, unwired), weight 600 |
| `body-lg` | 18px | 1.6 | Inter |
| `body-md` | 16px | 1.6 | Inter |
| `body-sm` | 14px | 1.5 | Inter |
| `label-lg` | 14px | 1 | Inter |
| `label-md` | 12px | 1 | Inter |
| `label-sm` | 11px | 1 | inherits |
| `caption` | 11px | 1.4 | heading-sans (Geist, unwired → Inter fallback) |
| `button` | 16px | 1 | Inter |
| `mono` | 13px | 1.4 | JetBrains Mono (unwired → monospace fallback) |

*`heading-lg` has two live variants at different sizes depending on the CSS var used — check the actual class in globals.css rather than assuming.

## Spacing & layout

| Token | Value |
|---|---|
| `container-max` | 1280px |
| `margin-mobile` | 20px |
| `margin-desktop` | 64px |
| `stack-sm` | 12px |
| `stack-md` | 24px |
| `stack-lg` | 48px |
| `bento-gap` | 20px |
| `gutter` | 24px |

Docs describe a `container-reading/content/wide/full` distinction — code only has one `container-max`. Don't invent the others; use `container-max` for everything until that's built out.

## Border radius

Base unit `--radius: 0.625rem` (10px), scaled:

| Token | Resolved |
|---|---|
| `radius-sm` | 6px |
| `radius-md` | 8px |
| `radius-lg` | 10px |
| `radius-xl` | 14px |
| `radius-2xl` | 18px |
| `radius-3xl` | 22px |
| `radius-4xl` | 26px |

No `radius-none`/`radius-pill` tokens — use plain Tailwind `rounded-none` / `rounded-full` for those.

## Shadows / elevation — known gap

**No shadow/elevation tokens exist in globals.css at all.** The docs call for a semantic `elevation-none/subtle/raised/floating` scale; current code just uses raw Tailwind `shadow-sm`/`shadow-md` ad hoc. Don't invent semantic elevation tokens on the fly — either use plain Tailwind shadow utilities consistently with what's already in the file being edited, or flag to the user that this is unimplemented if a task genuinely needs it.

## Iconography

Uses the `Material Symbols Outlined` webfont (`.material-symbols-outlined` class in globals.css), fixed at 24px/line-height 1, filled vs outlined toggled via `font-variation-settings: 'FILL' 0/1`. No semantic `icon-xs...xl` size tokens exist — size icons with ad-hoc Tailwind text-size classes (`text-lg`, `text-xl`, etc.) as seen throughout existing components. `html.icons-failed` is a fallback class (via `IconFontGuard`) for webfont load failure — don't remove it.

## Buttons

No centralized button component or size tokens exist — buttons are styled ad hoc per component. Established convention from the token-migration batches:
- Solid CTA: `bg-brand-primary text-white ... hover:opacity-90 transition-opacity`
- Selected/active state: `border-brand-primary bg-brand-primary/NN` (roughly half the old opacity value if migrating)
- Secondary/outline: `border border-border-default text-text-primary hover:bg-surface-secondary transition-colors`

Match whatever pattern is already used in the file/area you're editing before introducing a new one.

## Cards & surfaces

"Not everything needs to be a card" — only group content in a card when it aids comprehension. Product card hierarchy: image dominates → name → price → optional metadata. Surface tokens (`surface-canvas/secondary/tertiary/elevated/inverse`) map cleanly to doc intent — this is the one area where docs and code already align well.

## Forms & inputs

Anatomy: label → input → help/validation text. Required states: default/hover/focus/filled/error/disabled/read-only/loading. No placeholder-as-only-label. Established input convention from `account/settings/page.tsx`:
```
border rounded-lg px-4 py-3 bg-surface-elevated text-text-primary border-border-default focus:border-brand-primary focus:outline-none transition-colors
```

## Responsive breakpoints

No custom breakpoints defined in globals.css — Tailwind v4 defaults apply (`sm:640px md:768px lg:1024px xl:1280px 2xl:1536px`), unconfirmed/not explicitly overridden. Mobile QA in this project uses **390px** as the reference mobile viewport (iPhone-standard, not a doc-specified value — see the `mobile-screenshot-viewport-technique` memory for how to actually capture it, since Chrome's `resize_window` tool doesn't work in this sandbox).

## Accessibility musts

- Visible focus state on every interactive control — never remove without a replacement.
- Respect `prefers-reduced-motion: reduce`.
- All color combos must be contrast-checked before shipping (the existing palette above is already WCAG-AA verified — new combinations are not automatically safe).
- Full keyboard operability, reliable touch target sizes.

## When docs and this skill don't cover something

Don't invent a value. Say what's missing (matches the "No Fabricated Values" rule in `CLAUDE.md`), propose a candidate derived from the existing scale/palette, and flag it for sign-off rather than applying it silently — exactly as done for the `text-red-700`/`text-green-700` feedback-color stopgap during the token migration.
