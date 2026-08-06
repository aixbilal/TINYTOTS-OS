# Authentication

> Version: 1.0

---

# Purpose

This document defines the authentication strategy used by the TinyTots WhatsApp platform.

Only trusted systems are allowed to access internal APIs.

---

# Protected Services

The following services require authentication:

- Meta Business Agent APIs
- n8n Workflows
- Internal Next.js APIs
- Admin APIs
- Webhooks (where applicable)

---

# Authentication Methods

## Service-to-Service

Authentication is performed using Bearer Tokens.

Example

Authorization: Bearer <TOKEN>

---

## User Authentication

Customers authenticate through Supabase Auth.

Supported methods:

- Email & Password
- OTP
- Password Reset
- Future Social Logins

---

## POS Authentication

Cashiers authenticate using Supabase Auth.

Permissions are controlled through roles.

---

# Authorization

Authentication verifies identity.

Authorization determines permissions.

Example roles:

- Customer
- Cashier
- Manager
- Administrator
- Automation Services

---

# Best Practices

- Use HTTPS only.
- Store secrets securely.
- Never expose tokens to clients.
- Validate every request.
- Rotate secrets regularly.

---

# Future Improvements

- JWT validation
- OAuth
- Service Accounts
- API Gateway