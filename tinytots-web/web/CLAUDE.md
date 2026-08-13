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

---

## 4. Protected Subsystems (Do Not Touch)

Source: `TINYTOTS-BUILD-BRIEF.md` §11.

- **Rule:** Do not modify the following without an instruction that explicitly and specifically calls for it: authentication; product/inventory/pricing logic; cart/checkout/order logic; Supabase queries & Row-Level Security (RLS); API contracts; admin functionality (business logic, not visual styling); the WhatsApp notification pipeline (`lib/whatsapp-notify/`, `app/api/v1/whatsapp-*`); Meta-agent integration (`lib/meta-agent/`, `app/api/v1/meta-agent/*`); the Electron POS app (`tinytots-app/`, a separate top-level app, entirely out of scope); the signage feature; offline/PWA caching behavior.
- **Objective:** Prevent visual/presentation-focused work (e.g. a redesign) from silently altering business logic, security boundaries, or protected features it was never meant to touch.
- **Implementation Constraint:** If a task appears to require changing one of these areas, stop and report the conflict instead of making the change silently. Flag it to the user as a decision point.

---

## 5. Verification & Completion Reporting

Source: `TINYTOTS-BUILD-BRIEF.md` §12.

- **Rule:** Follow the operating loop **Read → Plan → Edit → Test → Review → Report** for implementation work.
- **Objective:** Ensure changes are actually validated, not just asserted, and that completion is reported in a consistent, scannable format.
- **Implementation Constraint:** After implementing, run whatever validation applies (type check, lint, build, route-level check, visual check, responsive check). Never claim a check passed without actually running it. This repo has no automated test suite, so "tests" means `npm run build` + `npm run lint` + TypeScript type-check — nothing more. Report completed work using:
  ```
  IMPLEMENTED:
  FILES CHANGED:
  DEPENDENCIES:
  VALIDATION:
  KNOWN ISSUES:
  NEXT STEP:
  ```

---

## 6. Design & Content Value Integrity

Source: derived from `TINYTOTS-BUILD-BRIEF.md` §2 (source-of-truth ordering) and §6 (color/typography gap analysis).

- **Rule:** Never fabricate a color, type-scale size, spacing value, or other design/content value and present it as approved, or attribute an invented value to a document that does not actually specify it.
- **Objective:** Prevent silently-invented values from being mistaken for approved design decisions, which would be difficult to detect and costly to unwind later.
- **Implementation Constraint:** If a design doc marks a direction as "approved" or "approved-direction" but leaves exact production values unresolved, do not pick one and move on. Instead: derive candidate values from real references (existing visual assets, brand reference images, working code), verify them where applicable (e.g. WCAG contrast for color), and present them explicitly as a proposal for sign-off — not as a final, silently-applied decision.