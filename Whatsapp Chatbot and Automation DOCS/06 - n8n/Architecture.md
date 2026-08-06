# n8n Architecture

> Version: 1.0

---

# Purpose

This document defines the role of n8n within the TinyTots WhatsApp platform.

n8n is responsible for workflow automation.

It does not perform conversations.

It does not replace the Meta Business Agent.

Instead, it reacts to business events and executes automated workflows.

---

# Responsibilities

n8n is responsible for:

- Event-driven automation
- Scheduled jobs
- WhatsApp template delivery
- Email notifications
- Internal notifications
- Data synchronization
- Retry handling
- Workflow logging

---

# High-Level Architecture

Customer

↓

Website / POS

↓

Supabase

↓

Database Event

↓

n8n Workflow

↓

Business Logic

↓

Meta WhatsApp Cloud API

↓

Customer

---

# Integration Points

n8n communicates with:

- Supabase
- Next.js APIs
- WhatsApp Cloud API
- Email Provider
- Internal Admin Systems

---

# Workflow Design Principles

Each workflow should:

- Have one responsibility
- Be independent
- Support retries
- Log every execution
- Handle failures gracefully
- Be reusable

---

# Future Integrations

Possible future integrations include:

- CRM
- Google Sheets
- Slack
- Discord
- Analytics
- Marketing Platforms