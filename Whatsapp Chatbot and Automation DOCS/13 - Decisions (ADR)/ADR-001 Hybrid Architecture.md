# ADR-001 — Adopt Hybrid WhatsApp Architecture

Status

Accepted

Date

2026-08-06

---

# Context

The original WhatsApp implementation relied on a fully custom conversational engine inside the Next.js application.

The application handled:

- Conversation state
- Intent recognition
- Order flow
- Session management
- Business logic
- Database operations

As new features were added, the implementation became increasingly complex and difficult to maintain.

---

# Decision

Adopt a Hybrid Architecture.

Responsibilities will be divided as follows:

Meta Business Agent

↓

Natural language conversations

↓

Next.js APIs

↓

Read-only business data

↓

Supabase

↓

Single Source of Truth

↓

n8n

↓

Business automation

---

# Consequences

Positive

- Less application code
- Easier maintenance
- Better scalability
- Faster feature development
- Cleaner architecture

Negative

- Additional platform dependencies
- Requires understanding multiple systems

---

# Alternatives Considered

Continue with custom chatbot

Rejected

Reason

Long-term maintenance cost was too high.

---

# Outcome

Approved.