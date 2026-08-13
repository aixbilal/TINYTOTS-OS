<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:tinytots-project-rules -->
# TinyTots Project Rules

Full detail: `TINYTOTS-BUILD-BRIEF.md` (repo root). Read it before large redesign tasks — this is a condensed pointer, not a replacement.

## Protected Subsystems (Do Not Touch)
Do not modify without an instruction that explicitly calls for it: authentication; product/inventory/pricing logic; cart/checkout/order logic; Supabase queries & RLS; API contracts; admin business logic; the WhatsApp notification pipeline (`lib/whatsapp-notify/`, `app/api/v1/whatsapp-*`); Meta-agent integration (`lib/meta-agent/`, `app/api/v1/meta-agent/*`); the Electron POS app (`tinytots-app/`); the signage feature; offline/PWA caching behavior. If a task seems to require touching one of these, stop and report instead of changing it silently.

## Completion Reporting
Loop: Read → Plan → Edit → Test → Review → Report. No automated test suite exists in this repo — validation means `npm run build` + `npm run lint` + TypeScript type-check. Report completed work as:
```
IMPLEMENTED:
FILES CHANGED:
DEPENDENCIES:
VALIDATION:
KNOWN ISSUES:
NEXT STEP:
```

## No Fabricated Values
Never invent a color, size, spacing, or other design/content value and present it as approved, or attribute it to a document that doesn't actually specify it. When a direction is approved but exact values aren't, derive candidates from real references, verify them, and propose them for sign-off rather than applying them silently.
<!-- END:tinytots-project-rules -->
