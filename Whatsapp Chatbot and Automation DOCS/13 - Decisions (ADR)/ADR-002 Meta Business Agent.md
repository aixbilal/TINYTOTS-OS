# ADR-002 — Use Meta Business Agent

Status

Accepted

Date

2026-08-06

---

# Context

TinyTots requires conversational customer support through WhatsApp.

Building a complete conversational AI inside the application would require:

- Intent recognition
- Prompt management
- State management
- Conversation memory
- AI orchestration

---

# Decision

Use Meta Business Agent as the conversational layer.

Responsibilities

- Understand customer questions
- Answer FAQs
- Recommend products
- Query internal APIs
- Escalate conversations

---

# Responsibilities Not Assigned

The Business Agent will NOT:

- Create orders
- Process payments
- Modify inventory
- Perform administrative actions

---

# Benefits

- Native WhatsApp AI
- Lower maintenance
- Better language understanding
- Reduced backend complexity

---

# Outcome

Approved.