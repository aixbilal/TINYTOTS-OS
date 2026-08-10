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

---

# Update — Meta Business Agent Dropped (2026-08-10)

During implementation, it was discovered that Meta's WhatsApp AI offering splits
into two distinct tiers:

- **Free/self-serve Meta Business Agent** (runs inside the regular WhatsApp
  Business App): cannot call external APIs or query live business data. Started
  charging per-token (~$2/1M tokens) as of August 1, 2026.
- **Enterprise Business Agent Platform**: can call external APIs (like the 4
  read-only APIs built for this project), but is currently invite-only/waitlist,
  not generally available.

## Decision

The AI conversational agent layer was dropped entirely — the free tier can't do
live inventory/order lookups (the original point of building it), and the
Enterprise tier isn't accessible. The 4 read-only APIs remain built and deployed
in case Enterprise access becomes available later, or for internal admin tooling,
but nothing currently calls them.

## Revised Architecture

Conversational support is now split across two WhatsApp numbers instead of one
AI-driven number:

- **0333-5268060** — regular WhatsApp Business App, human-staffed, no AI, no cost
- **0334-6417385** — WhatsApp Cloud API number, used exclusively for automated
  one-way notifications (see ADR-003 update), no conversational logic

This is a simpler architecture than originally planned — no AI conversation layer
at all, at this stage.