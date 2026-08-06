# Existing Flow

---

# Purpose

This document explains how customer messages currently move through the WhatsApp system.

---

# Typical Customer Journey

Customer sends message.

↓

Webhook receives payload.

↓

Next.js verifies request.

↓

Intent parser analyzes message.

↓

Conversation state is loaded.

↓

Business logic executes.

↓

Database queried.

↓

Conversation state updated.

↓

Message generated.

↓

Response sent.

---

# Product Search Flow

Customer

↓

"Show me denim trousers"

↓

Intent Parser

↓

Product Search

↓

Supabase

↓

Response

---

# Order Flow

Customer

↓

"I want to buy"

↓

Quiz Flow

↓

Select Product

↓

Select Size

↓

Select Quantity

↓

Collect Address

↓

Create Order

↓

Confirmation

---

# Order Status Flow

Customer

↓

"Where is my order?"

↓

Intent Parser

↓

Database

↓

Tracking

↓

Response

---

# Current Pain Points

Conversation management requires:

- Multiple states
- State persistence
- Intent detection
- Manual routing
- Complex branching

As more features are added, the system becomes increasingly difficult to maintain.

---

# Migration Goal

The future system will simplify this flow by moving conversational understanding to the Meta Business Agent and workflow automation to n8n.

The Next.js application will primarily provide secure APIs and business services rather than acting as the conversational engine.