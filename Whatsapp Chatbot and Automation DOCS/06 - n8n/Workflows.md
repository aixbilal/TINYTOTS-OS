# Workflows

---

# Purpose

This document provides an overview of all automation workflows managed by n8n.

---

# Active Workflows

## Order Confirmation

Trigger:

New order created.

Purpose:

Send confirmation message.

---

## Shipping Update

Trigger:

Shipping status changes.

Purpose:

Notify customer.

---

## Delivered

Trigger:

Order marked delivered.

Purpose:

Send delivery confirmation.

---

## OTP

Trigger:

Authentication request.

Purpose:

Send verification code.

---

## Promotions

Trigger:

Scheduled campaign.

Purpose:

Send promotional template.

---

## Admin Notifications

Trigger:

Business event.

Purpose:

Notify internal staff.

---

# Future Workflows

- Review requests
- Birthday campaigns
- Loyalty rewards
- Inventory alerts
- Abandoned cart reminders
- Customer feedback collection

---

# Design Principles

Every workflow should:

- Start with one trigger.
- Execute one business process.
- Finish with one clear outcome.