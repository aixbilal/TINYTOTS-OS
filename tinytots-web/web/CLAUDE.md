@AGENTS.md

# Claude Codebase & Architecture Rules (`claude.md`)

This document serves as the absolute source of truth for engineering practices, security baselines, and architectural constraints within this project. As an AI assistant, you must adhere strictly to these guidelines when authoring, reviewing, or refactoring code.

--- 

## 1. Security & Data Isolation

### 🔒 User Data Isolation (Multi-Tenant Security)
- **Rule:** Every data access layer (queries, mutations, updates, deletions) MUST explicitly scope queries to the authenticated user's unique identifier (`UUID`).
- **Objective:** Prevent cross-tenant data leaks or unauthorized data access. Users must never be able to view, query, or mutate each other's data under any circumstance.
- **Implementation Constraint:** Do not rely solely on front-end filters. Ensure strict backend row-level security (RLS) or session-based verification on all controller/resolver layers.

### 🔑 Secure Password Reset Lifecycles
- **Rule:** All password reset tokens and links MUST have an absolute expiration window of **30 minutes** maximum.
- **Objective:** Neutralize token hijacking vulnerabilities and replay attacks on expired/old communication channels.
- **Implementation Constraint:** Store a `reset_token_expires_at` timestamp in the database. Invalidate and purge tokens immediately after single use or upon expiration.

### 🛡️ Input Validation & Sanitization
- **Rule:** Treat all external inputs as hostile. Every single input field across all endpoints, forms, and webhooks MUST be strictly validated, sanitized, and escaped.
- **Objective:** Achieve complete mitigation against SQL Injection (SQLi), Cross-Site Scripting (XSS), and Remote Code Execution (RCE).
- **Implementation Constraint:** Use strongly-typed schemas (e.g., Zod, Joi, Pydantic) and parameterized queries/ORMs. Never concatenate raw strings into database executions or inner HTML strings.

### 🌐 Strict CORS (Cross-Origin Resource Sharing) Configuration
- **Rule:** Restrict backend API communication using an explicit CORS whitelist.
- **Objective:** Block rogue/unauthorized external domains from executing cross-origin requests against our API infrastructure.
- **Implementation Constraint:** Never use `Access-Control-Allow-Origin: *` in production. Wildcards are strictly forbidden. Configure specific environment-based allowed domains.

### ⏳ Rate Limiting
- **Rule:** Implement strict rate-limiting caps across all public-facing and authenticated routes.
- **Objective:** Protect core application infrastructure against Distributed Denial of Service (DDoS) attacks, brute-force requests, and unexpected API billing spikes.
- **Implementation Constraint:** Apply tight thresholds on resource-heavy routes (e.g., authentication, password resets, expensive search queries) using a Redis token bucket or equivalent memory store.

### 🛑 Fail-Safe Error Handling
- **Rule:** Never expose stack traces, database schemas, raw error strings, or internal system architecture details to the end-user. All unhandled errors must render a generic, clean custom error message.
- **Objective:** Prevent malicious actors from footprinting or mapping out backend software versions, dependencies, or system vulnerabilities.
- **Implementation Constraint:** Catch errors globally, log detailed traces internally with a unique tracking ID, and return a sanitized payload to the client (e.g., `Internal Server Error [Ref: #XYZ-123]`).

--- 

## 2. Database Performance & Optimization

### ⚡ Selective High-Traffic Indexing
- **Rule:** Database indexes must be strategically applied *only* to fields that experience high-traffic query patterns (e.g., primary keys, foreign keys, frequently filtered/sorted dimensions).
- **Objective:** Maximize read query performance and lookups without introducing unnecessary overhead that degrades database write, insert, and update operations.
- **Implementation Constraint:** Analyze execution plans before adding indexes. Avoid indexing low-cardinality fields or highly fluid columns unless explicitly justified by metrics.

--- 

## 3. DevOps, Resilience & Monitoring

### 📊 Active Logging & Real-Time Monitoring
- **Rule:** Establish proactive telemetry, structured logging, and persistent application performance monitoring (APM).
- **Objective:** Detect anomalies, catch unexpected exceptions, and diagnose performance bottlenecks instantly so production issues can be resolved before impacting end-users.
- **Implementation Constraint:** Output clean structured logs (JSON format) containing levels (`INFO`, `WARN`, `ERROR`) and contextual metadata. Hook critical errors into alerting systems.

### 🔄 Zero-Downtime Rollback Strategy
- **Rule:** Maintain a fully production-identical deployment environment or configuration that is primed for instant, automated, zero-downtime rollbacks.
- **Objective:** Ensure a continuous availability baseline. If a new deployment fails smoke tests or encounters runtime crashes, immediately pivot traffic to the last known stable build.
- **Implementation Constraint:** Implement blue-green deployments, canary releases, or robust container orchestration rollbacks. Database migrations must always be backward-compatible (non-breaking) to avoid data corruption during a rollback event.