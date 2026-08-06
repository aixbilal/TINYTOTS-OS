# Promotions API

---

# Purpose

Returns active promotions and featured campaigns.

---

# Endpoint

GET /api/v1/meta-agent/promotions

---

# Authentication

Bearer Token Required

---

# Query Parameters

category

featured

season

---

# Example Response

{
    "success": true,
    "promotions": [
        {
            "title": "Summer Sale",
            "discount": "20%",
            "expires": "2026-08-31"
        }
    ]
}

---

# Supported Information

Current Offers

Seasonal Sales

Featured Collections

Coupon Availability

Store Campaigns

---

# Notes

Promotions are managed by the website.

This endpoint exposes information only.