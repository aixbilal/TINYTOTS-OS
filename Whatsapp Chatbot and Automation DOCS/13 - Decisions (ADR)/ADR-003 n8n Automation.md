# ADR-003 — Adopt n8n for Automation

Status

Accepted

Date

2026-08-06

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

# Decision

Move automation responsibilities to n8n.

n8n becomes responsible for:

- Workflow automation
- Notifications
- Scheduled jobs
- Retry handling
- Event processing

---

# Responsibilities Remaining

Business logic remains inside:

- Next.js
- Supabase

---

# Benefits

- Visual workflows
- Easier debugging
- Reduced backend code
- Independent deployments

---

# Outcome

Approved.