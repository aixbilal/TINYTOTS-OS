# Test Cases

> Version: 1.0

---

# Purpose

This document defines the functional test cases for the TinyTots WhatsApp platform.

Each feature should pass all applicable test cases before deployment.

---

# Business Agent

## TC-001

Name

Greeting Response

Steps

1. Open WhatsApp.
2. Send "Hello".

Expected Result

The Business Agent responds with a friendly greeting.

Status

Pending

---

## TC-002

Name

Product Search

Steps

1. Ask for denim trousers.

Expected Result

Relevant products are recommended.

Status

Pending

---

## TC-003

Name

Inventory Lookup

Steps

Ask whether a product is in stock.

Expected Result

Inventory API returns current availability.

Status

Pending

---

## TC-004

Name

Order Tracking

Steps

Provide a valid order number.

Expected Result

Current order status is returned.

Status

Pending

---

## TC-005

Name

Purchase Intent

Steps

Send:

"I want to buy this."

Expected Result

Business Agent sends website product or checkout link.

No order is created inside WhatsApp.

Status

Pending

---

## TC-006

Name

Human Escalation

Steps

Ask to speak with a human.

Expected Result

Conversation is escalated.

Status

Pending

---

# n8n

## TC-007

Order Confirmation

Expected

Customer receives confirmation after checkout.

---

## TC-008

Shipping Update

Expected

Customer receives shipping notification.

---

## TC-009

OTP Delivery

Expected

OTP arrives successfully.

---

## TC-010

Promotion Campaign

Expected

Campaign delivered successfully.

---

# APIs

Inventory API

Order Status API

Promotion API

Store Information API

Each endpoint should return valid responses.

---

# Security

Authentication

Rate Limiting

Webhook Verification

Bearer Token Validation

Each feature should pass before deployment.