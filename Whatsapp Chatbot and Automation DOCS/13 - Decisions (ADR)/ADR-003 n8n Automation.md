# ADR-003 — Automation Approach for Notifications

Status

Superseded (see Update below)

Date

2026-08-06

Updated

2026-08-10

---

# Context

The original implementation attempted to execute business automation directly inside the application.

Examples included:

- Order notifications
- Shipping updates
- Promotional campaigns
- OTP delivery

This increased application complexity.

---

# Original Decision (2026-08-06)

Move automation responsibilities to n8n.

n8n was intended to become responsible for:

- Workflow automation
- Notifications
- Scheduled jobs
- Retry handling
- Event processing

---

# Update — Decision Reversed (2026-08-10)

n8n was **not adopted**. After evaluating hosting costs (n8n Cloud ~$20/month,
self-hosted VPS ~$5/month minimum, Zapier priced per-task), the cost was judged
too high for the project's current stage.

## New Decision

Replace n8n with a free, custom code pipeline using services already in use:

- **Supabase Database Webhooks** (free, built into Supabase) — fires on `orders`
  table INSERT and UPDATE events
- **Next.js API route** (`app/api/v1/whatsapp-notify/route.ts`, same free Vercel
  hosting as the storefront) — receives the webhook, maps order status to the
  correct WhatsApp template, and calls the Graph API directly
- **WhatsApp Cloud API** — messages sent directly via Meta's Graph API using the
  Cloud API number (0334-6417385), no intermediary automation tool

This adds zero new hosting cost and zero new services to operate, at the cost of
losing n8n's visual workflow editor and built-in retry UI (retry/error handling is
now implemented directly in the API route instead).

---

# Responsibilities Remaining

Business logic remains inside:

- Next.js
- Supabase

---

# Outcome

Original decision (n8n) superseded by custom code approach, 2026-08-10.