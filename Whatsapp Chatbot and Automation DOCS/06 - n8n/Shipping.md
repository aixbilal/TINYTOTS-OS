# Shipping Workflow

---

# Purpose

Notify customers whenever shipping status changes.

---

# Trigger

Shipping status updated.

---

# Possible Statuses

Processing

Packed

Dispatched

Out for Delivery

Delivered

---

# Workflow

Status Updated

↓

Retrieve Customer

↓

Generate Template

↓

Send WhatsApp Message

↓

Log Delivery

---

# Failure Handling

Retry automatically.

Notify admin if repeated failures occur.

---

# Expected Result

Customers always know the latest shipping status.