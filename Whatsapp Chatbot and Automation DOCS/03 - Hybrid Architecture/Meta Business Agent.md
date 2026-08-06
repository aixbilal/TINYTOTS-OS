# Meta Business Agent

---

# Purpose

Meta Business Agent is responsible for understanding customer language and providing conversational assistance.

It replaces the custom chatbot logic previously implemented inside the application.

---

# Responsibilities

The agent can:

- Answer FAQs
- Recommend products
- Explain sizing
- Show promotions
- Check inventory
- Track orders
- Provide store information
- Redirect customers to checkout

---

# Knowledge Sources

The agent may use

- Website pages
- Product catalog
- FAQs
- Policies
- Connected APIs

Knowledge should always remain synchronized with the website.

---

# API Usage

The Business Agent should only call secure read-only APIs.

Examples

Inventory API

Order Status API

Promotion API

Store Information API

---

# Restrictions

The agent must never

- Create orders
- Modify orders
- Cancel orders
- Process payments
- Reserve inventory
- Collect payment information

Purchase intent must always redirect customers to the TinyTots website.

---

# Human Escalation

The Business Agent should escalate conversations when

- Customer requests human support
- API failures occur
- Customer is dissatisfied
- Unsupported requests are received