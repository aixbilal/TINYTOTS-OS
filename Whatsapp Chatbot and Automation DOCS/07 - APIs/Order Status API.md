# Order Status API

---

# Purpose

Returns real-time order tracking information.

---

# Endpoint

GET /api/v1/meta-agent/order-status

---

# Authentication

Bearer Token Required

---

# Query Parameters

order_id

phone

email

---

# Example Request

GET /api/v1/meta-agent/order-status?order_id=TT202600142

---

# Example Response

{
    "success": true,
    "order": {
        "order_id": "TT202600142",
        "status": "Dispatched",
        "tracking_number": "TCS293811",
        "estimated_delivery": "2026-08-08"
    }
}

---

# Possible Statuses

Pending

Confirmed

Packed

Dispatched

Out For Delivery

Delivered

Cancelled

Returned

---

# Errors

400

401

404

429

500

---

# Notes

The API never modifies orders.

It only returns tracking information.