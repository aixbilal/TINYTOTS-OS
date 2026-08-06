# Store Information API

---

# Purpose

Returns business information.

---

# Endpoint

GET /api/v1/meta-agent/store-info

---

# Authentication

Bearer Token Required

---

# Returns

Store Name

Store Address

Business Hours

Phone Numbers

Email

Google Maps Link

Social Media

Support Hours

---

# Example Response

{
    "success": true,
    "store": {
        "name": "TinyTots",
        "phone": "+92xxxxxxxxxx",
        "hours": "10AM - 10PM"
    }
}

---

# Notes

Read-only.

Cached aggressively because information changes infrequently.