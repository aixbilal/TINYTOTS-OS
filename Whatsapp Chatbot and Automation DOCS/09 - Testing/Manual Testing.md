# Manual Testing

> Version: 1.0

---

# Purpose

Provides a structured checklist for manually verifying the WhatsApp platform.

---

# Business Agent

Test:

Greeting

Question

Product recommendation

Inventory

Order tracking

Purchase intent

Human escalation

---

# n8n

Verify:

Order Confirmation

Shipping

Delivered

OTP

Promotions

Admin Notification

Retry Logic

---

# APIs

Verify every endpoint using:

- Postman
- Browser (where appropriate)
- Internal testing tools

---

# Security

Verify:

Bearer Authentication

Invalid Token

Missing Token

Webhook Signature

Rate Limiting

---

# Failure Testing

Disconnect database.

Disable internet.

Use invalid order IDs.

Use invalid SKUs.

Simulate API timeout.

---

# Final Verification

Website

Electron POS

Business Agent

n8n

Supabase

All systems should continue functioning correctly.