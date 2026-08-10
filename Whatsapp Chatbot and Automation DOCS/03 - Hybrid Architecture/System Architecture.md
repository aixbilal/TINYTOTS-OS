# System Architecture

> Version: 2.0 (Hybrid Architecture)

---

# Purpose

This document defines the target architecture for the TinyTots WhatsApp platform.

The objective is to simplify the existing implementation by separating conversational AI, automation, and business logic into independent components.

---

# Design Philosophy

Instead of building one large chatbot responsible for everything, responsibilities are divided among specialized systems.

Each system performs one job well.

---

# Core Components

## Website (Next.js)

Responsibilities

- Product Catalog
- Search
- Shopping Cart
- Checkout
- Payments
- Customer Account
- Order Management

The website remains the only commerce platform.

---
## Meta Business Agent — DROPPED (see Architecture Decision.md update, 2026-08-10)

The AI conversational agent layer was not adopted. See
"04 - Migration/Architecture Decision.md" for full reasoning (free tier can't call
external APIs; Enterprise tier is invite-only).

Conversational support is instead split across two plain WhatsApp numbers:

- 0333-5268060 — human-staffed WhatsApp Business App (FAQs, support, questions)
- 0334-6417385 — Cloud API number, automated notifications only, no conversation

---

## Notification Pipeline (replaces n8n — see ADR-003 update, 2026-08-10)

Responsibilities

- Order status change detection
- WhatsApp template message delivery
- Button-reply handling (order confirm/cancel)

Implementation

- Supabase Database Webhooks (fires on `orders` table changes)
- Next.js API routes (`app/api/v1/whatsapp-notify`, `app/api/v1/whatsapp-webhook`)
- WhatsApp Cloud API (Graph API), called directly — no intermediary automation tool
## Next.js APIs

Responsibilities

- Secure APIs
- Read-only customer data
- Inventory lookup
- Order status lookup
- Promotion information

Business logic remains inside the backend.

---

## Supabase

Single Source of Truth

Stores

- Products
- Orders
- Inventory
- Customers
- Authentication
- Realtime Events

---
# High-Level Architecture

Customer

↓

WhatsApp (0333 human support, OR 0334 automated notifications)

↓

Next.js APIs (whatsapp-notify, whatsapp-webhook)

↓

Supabase (orders table, Database Webhooks)

↓

WhatsApp Cloud API (Graph API)

↓

Customer


Note: The 4 read-only meta-agent APIs (inventory, order-status, promotions,
store-info) remain built and deployed but are currently unused, since the AI
conversational layer they were built for was dropped. See Architecture Decision.md
update, 2026-08-10.

# Benefits

- Simpler architecture
- Less custom code
- Easier maintenance
- Better scalability
- Independent components
- Lower development cost
- Easier testing