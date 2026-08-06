# n8n Architecture

---

# Purpose

n8n is responsible for workflow automation.

It listens for business events and performs automated actions without requiring manual intervention.

---

# Event Sources

Events may originate from

- Website
- Electron POS
- Supabase
- Scheduled jobs
- Admin dashboard

---

# Typical Flow

Business Event

↓

Webhook

↓

n8n Workflow

↓

Business Logic

↓

WhatsApp Template

↓

Customer

---

# Initial Workflows

Order Confirmation

Shipping Update

Delivered Notification

OTP

Welcome Message

Promotion Broadcast

Birthday Campaign

Admin Notifications

---

# Future Workflows

Inventory Alerts

Abandoned Cart

Customer Feedback

Review Requests

Loyalty Rewards

CRM Integration

Marketing Automation

---

# Design Principles

Each workflow should

- Perform one responsibility
- Handle failures gracefully
- Support retries
- Log execution
- Be reusable