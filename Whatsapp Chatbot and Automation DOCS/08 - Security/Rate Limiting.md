# Rate Limiting

---

# Purpose

Protects APIs from abuse, excessive traffic, and accidental misuse.

---

# Protected Endpoints

Inventory API

Order Status API

Promotions API

Store Information API

Webhook Endpoints

---

# Objectives

Prevent:

- API abuse
- Denial of Service
- Infinite retry loops
- Brute-force attacks

---

# Example Limits

Meta Business Agent

100 requests/minute

---

n8n

200 requests/minute

---

Public APIs

Lower limits if exposed.

---

# Exceeded Limit

Return

HTTP 429

Too Many Requests

---

# Logging

Record:

- Client
- Endpoint
- Timestamp
- Request Count
- IP Address (if applicable)

---

# Future Improvements

Adaptive limits

API Gateway

Distributed rate limiting