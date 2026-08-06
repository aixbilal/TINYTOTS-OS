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

## Meta Business Agent

Responsibilities

- Natural conversations
- FAQs
- Product discovery
- Product recommendations
- Size guidance
- Promotions
- Order tracking
- Store information
- Redirect customers to website

The Business Agent never creates orders.

---

## n8n

Responsibilities

- Workflow automation
- Scheduled jobs
- Event-driven automation
- Notifications
- Integration between services

n8n never performs conversations.

---

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

```
Customer

↓

WhatsApp

↓

Meta Business Agent

↓

Secure Next.js APIs

↓

Supabase

↑

↓

n8n Automation

↓

WhatsApp Templates
```

---

# Benefits

- Simpler architecture
- Less custom code
- Easier maintenance
- Better scalability
- Independent components
- Lower development cost
- Easier testing