# Order Confirmation Workflow

---

# Purpose

Automatically notify customers after a successful order.

---

# Trigger

New order created.

Source:

Website

or

Electron POS

---

# Input

Order ID

Customer Name

Phone Number

Products

Total Amount

---

# Workflow

Order Created

↓

n8n Trigger

↓

Retrieve Order Details

↓

Build WhatsApp Template

↓

Send Template

↓

Log Success

---

# Failure Handling

Retry three times.

If unsuccessful:

Log error.

Notify administrator.

---

# Expected Result

Customer receives an order confirmation within seconds after checkout.