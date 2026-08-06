# Sequence Diagrams

---

# Product Inquiry

Customer

↓

WhatsApp

↓

Meta Business Agent

↓

Inventory API

↓

Supabase

↓

Inventory Response

↓

Business Agent

↓

Customer

---

# Order Tracking

Customer

↓

WhatsApp

↓

Business Agent

↓

Order Status API

↓

Supabase

↓

Tracking Details

↓

Business Agent

↓

Customer

---

# Purchase Intent

Customer

↓

"I want to buy"

↓

Business Agent

↓

Generate Website Checkout Link

↓

Customer

↓

Website Checkout

---

# Order Confirmation

Website Checkout

↓

Supabase

↓

Order Created

↓

n8n

↓

WhatsApp Template

↓

Customer

---

# Shipping Update

Courier Updates Status

↓

Supabase

↓

n8n

↓

WhatsApp

↓

Customer

---

# OTP Flow

Customer Login

↓

Supabase Auth

↓

n8n

↓

WhatsApp OTP

↓

Customer

---

# Human Escalation

Customer

↓

Business Agent

↓

Unable to Resolve

↓

Support Team

↓

Customer