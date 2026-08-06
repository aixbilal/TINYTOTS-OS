# API Layer

---

# Purpose

The API layer acts as the secure communication bridge between Meta Business Agent, n8n, and Supabase.

It exposes business information while protecting internal systems.

---

# API Design Principles

- Stateless
- Secure
- Read-only where possible
- Lightweight
- Fast
- Versioned

---

# Current APIs

GET /api/v1/meta-agent/inventory

Returns product availability.

---

GET /api/v1/meta-agent/order-status

Returns tracking information.

---

GET /api/v1/meta-agent/promotions

Returns current offers.

---

GET /api/v1/meta-agent/store-info

Returns business information.

---

# Security

Every request should

- Require authentication
- Validate authorization
- Rate limit clients
- Log requests

---

# Future APIs

Customer Loyalty

Coupons

Gift Cards

Recommendations

Customer Profile