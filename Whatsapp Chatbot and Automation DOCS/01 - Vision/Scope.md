# Scope

---

# Purpose

This document clearly defines what belongs inside the WhatsApp platform and what belongs elsewhere.

Maintaining a clear scope prevents feature creep and unnecessary complexity.

---

# In Scope

The WhatsApp platform is responsible for:

## Customer Support

- Frequently Asked Questions
- Store timings
- Store location
- Shipping information
- Return policy
- Exchange policy
- Size guide

---

## Product Discovery

- Product recommendations
- Product availability
- Basic product information
- Promotions
- Featured collections

---

## Order Information

- Order status
- Tracking information
- Delivery updates
- Order confirmation
- Shipping confirmation

---

## Notifications

- Order confirmation
- Shipping updates
- Delivery notifications
- OTP messages
- Welcome messages
- Promotional campaigns
- Birthday campaigns
- Review requests

---

## Human Escalation

When necessary, the system should transfer customers to a human representative.

---

# Out of Scope

The WhatsApp platform must NOT perform the following functions.

## Shopping

- Shopping cart management
- Checkout
- Payment collection
- Coupon application
- Wishlist management

---

## Order Management

- Create orders
- Modify orders
- Cancel orders
- Reserve inventory
- Process refunds

---

## Customer Account Management

- Account settings
- Address management
- Saved payment methods
- Password management (except sending reset links or OTPs)

---

# Platform Responsibilities

## Website

Responsible for:

- Product catalog
- Product pages
- Search
- Cart
- Checkout
- Payments
- Customer accounts
- Order management

---

## WhatsApp Business Agent

Responsible for:

- Conversations
- FAQs
- Product discovery
- Recommendations
- Order tracking
- Redirecting purchase intent to the website

---

## n8n

Responsible for:

- Automation
- Scheduled tasks
- Event-driven notifications
- Workflow orchestration
- Integration between services

---

## Supabase

Responsible for:

- Products
- Inventory
- Customers
- Orders
- Authentication
- Realtime synchronization

---

# Guiding Principle

If a feature requires a full user interface, multiple form fields, payment processing, or complex business logic, it belongs on the website—not inside WhatsApp.

The WhatsApp platform should remain focused on communication and automation, while the website remains the primary commerce platform.