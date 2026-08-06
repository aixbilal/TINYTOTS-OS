# ADR-004 — No Chat Ordering

Status

Accepted

Date

2026-08-06

---

# Context

One possible architecture allowed customers to complete purchases entirely inside WhatsApp.

This would require:

- Cart management
- Inventory locking
- Payment integration
- Address collection
- Checkout validation

---

# Decision

Customers will never complete purchases inside WhatsApp.

Instead:

Customer

↓

Business Agent

↓

Product Recommendation

↓

Website Checkout Link

↓

TinyTots Website

↓

Checkout

---

# Reasoning

The website already contains:

- Cart
- Checkout
- Payment
- Discounts
- Shipping
- Order validation

Duplicating these features in WhatsApp would increase complexity.

---

# Benefits

- Single checkout system
- Better inventory consistency
- Less duplicated logic
- Simpler maintenance
- Improved security

---

# Outcome

Approved.