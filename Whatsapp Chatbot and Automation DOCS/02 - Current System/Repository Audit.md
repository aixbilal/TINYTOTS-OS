# Repository Audit

---

# Purpose

This document identifies the WhatsApp-related implementation currently present in the TinyTots repository.

It provides an inventory of components before migration.

---

# Current Directory Structure

```
app/api/whatsapp/

app/api/v1/meta-agent/

lib/whatsapp/
```

---

# Current Components

## Webhook

Responsibilities:

- Receive Meta webhook events
- Verify webhook requests
- Parse incoming payloads

---

## WhatsApp Client

Responsible for:

- Sending messages
- Sending templates
- Calling Meta Graph API

---

## Database Helpers

Responsible for:

- Product lookup
- Order lookup
- Inventory queries
- Customer queries

---

## Dialog Engine

Responsible for:

- Conversation flow
- Multi-step interactions
- User navigation

---

## Intent Parser

Responsible for:

- Regex matching
- Keyword matching
- Intent detection

---

## Quiz Ordering

Responsible for:

- Product selection
- Size selection
- Quantity selection
- Address collection

---

## State Machine

Responsible for:

- Session storage
- User progress
- Conversation recovery

---

# Integration Points

Website

↓

Next.js API

↓

WhatsApp

↓

Supabase

---

# Technical Debt

Current areas of concern include:

- Large conversational logic.
- Mixed responsibilities.
- Business logic inside chatbot.
- Difficult testing.
- Tight coupling.
- Multiple conversation states.
- Complex branching logic.

---

# Components Expected To Change

Likely to remain

- Webhook verification
- WhatsApp client
- Database helpers

Likely to migrate

- Conversation flow
- Intent detection
- Quiz ordering
- Session management

Migration decisions will be documented separately.