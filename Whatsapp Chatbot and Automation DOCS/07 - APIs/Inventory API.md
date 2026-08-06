# Inventory API

> Version: 1.0

---

# Purpose

Provides real-time product inventory information to the Meta Business Agent.

This API is read-only.

---

# Endpoint

GET /api/v1/meta-agent/inventory

---

# Purpose

Allows customers to ask questions like:

- Is this item available?
- Do you have size 26?
- Is the blue version in stock?
- Show denim trousers.

---

# Authentication

Authorization: Bearer <META_AGENT_SECRET>

---

# Query Parameters

sku

category

product_id

search

color

size

---

# Example Request

GET /api/v1/meta-agent/inventory?sku=TT-DNM-001

---

# Example Response

{
    "success": true,
    "data": {
        "sku": "TT-DNM-001",
        "name": "Denim Cargo Trouser",
        "price": 2499,
        "stock": 18,
        "available": true,
        "product_url": "https://tinytots.pk/products/tt-dnm-001"
    }
}

---

# Errors

400 Invalid Request

401 Unauthorized

404 Product Not Found

429 Too Many Requests

500 Internal Server Error

---

# Notes

Read-only endpoint.

No inventory modification is allowed.