# Edge Cases

> Version: 1.0

---

# Purpose

Defines uncommon situations that should be tested to ensure the system behaves correctly.

---

# Business Agent

Customer sends empty message.

Customer sends only emojis.

Customer sends unsupported language.

Customer sends very long message.

Customer repeatedly asks the same question.

Customer requests a restricted action.

---

# APIs

Missing parameters.

Invalid SKU.

Invalid Order ID.

Expired authentication token.

Malformed request.

Large request volume.

---

# n8n

Workflow timeout.

Duplicate trigger.

Missing customer phone number.

Invalid WhatsApp template.

API unavailable.

Database unavailable.

---

# Security

Expired Bearer Token.

Webhook replay.

Invalid webhook signature.

Brute-force requests.

Unauthorized API calls.

---

# Infrastructure

Supabase unavailable.

Internet interruption.

Meta Cloud API unavailable.

n8n offline.

Next.js server restart.

---

# Expected Behavior

The platform should:

- Fail gracefully.
- Never expose sensitive information.
- Log errors.
- Retry where appropriate.
- Inform administrators when required.
- Preserve data integrity.