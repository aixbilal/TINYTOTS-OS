# Secrets Management

---

# Purpose

Defines how sensitive information should be stored and managed.

---

# Examples of Secrets

- Supabase Service Key
- Supabase URL
- Meta Access Token
- Meta Verify Token
- Meta App Secret
- n8n Credentials
- SMTP Passwords
- JWT Secrets
- API Keys

---

# Storage

Secrets should never be stored in source code.

Use environment variables.

Examples:

.env.local

Vercel Environment Variables

n8n Credential Manager

GitHub Secrets

---

# Never Commit

Do not commit:

- API Keys
- Passwords
- Tokens
- Certificates
- Private Keys

---

# Rotation Policy

Secrets should be rotated:

- After exposure
- During major releases
- On scheduled intervals

---

# Access Control

Only authorized developers and deployment systems should access production secrets.

---

# Incident Response

If a secret is compromised:

1. Revoke it immediately.
2. Generate a replacement.
3. Update dependent systems.
4. Verify functionality.
5. Document the incident.

---

# Best Practices

- Principle of Least Privilege
- Separate Development and Production secrets
- Encrypt backups
- Audit secret usage regularly