# Architecture Decision

---

# Purpose

This document records the architectural decisions made during the WhatsApp platform redesign.

It explains why the project changed direction and the reasoning behind the chosen solution.

---

# Original Direction

The original implementation planned to build a fully custom WhatsApp chatbot capable of:

- Product search
- Ordering
- Cart management
- Checkout
- Payment flow
- Customer support
- Session management
- Conversation state

---

# Problems Identified

During implementation several issues became apparent.

- Large conversational state machine.
- Complex intent detection.
- Difficult testing.
- Duplicate checkout logic.
- High maintenance.
- Increased technical debt.
- Difficult scalability.

The architecture became increasingly difficult to maintain as new features were added.

---

# Alternatives Considered

## Continue Custom Development

Advantages

- Complete control.

Disadvantages

- High maintenance.
- Slow feature development.
- Large codebase.

---

## Hybrid Architecture (Selected)

Conversation

↓

Meta Business Agent

Automation

↓

n8n

Business Services

↓

Next.js APIs

Data

↓

Supabase

Advantages

- Lower maintenance.
- Easier scaling.
- Faster development.
- Better separation of concerns.

---

# Final Decision

Adopt a Hybrid Architecture.

Meta Business Agent

Conversation

n8n

Automation

Next.js

Business APIs

Supabase

Database

---

# Design Principles

- Keep checkout on the website.
- Keep conversations inside Meta.
- Keep automation inside n8n.
- Keep data inside Supabase.
- Keep APIs lightweight.

---

# Long-Term Benefits

- Easier maintenance.
- Better scalability.
- Lower development cost.
- Cleaner architecture.
- Faster onboarding for new developers.