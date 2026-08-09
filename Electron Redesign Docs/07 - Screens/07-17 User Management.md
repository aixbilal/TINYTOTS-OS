# User Management

## Document Information
| Field | Value |
|---|---|
| Document ID | 07-17 |
| Folder | 07 - Screens |
| Status | Planned |
| Version | 1.0.0 |
| Primary Source | TinyTots OS 2.0 — Chapter 5 Administration/System/User architecture |
| Last Updated | 2026-08-09 |

## Purpose
Manage application users and their role-based access.

## Scope
User listing, role assignment, status, and administrative actions supported by the redesign.

## Permission Model
The source defines:
- Administrator
- Manager
- Cashier
- Viewer

Users should see only actions permitted to them.

## States
Loading, empty, error, and permission-restricted.

## TODO
- Verify user fields.
- Verify role-management workflow.
- Verify current authentication integration.
- Verify user activation/deactivation behavior.

## Related Documents
- 07-23 Authentication & Login.md
- 07-24 Security Center.md
- 07-19 Audit Logs.md
- Phase 06 — Session Management

## Revision History
| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-09 | Initial screen specification. |
