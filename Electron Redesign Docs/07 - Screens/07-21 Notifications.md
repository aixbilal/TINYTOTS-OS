# Notifications

## Document Information
| Field | Value |
|---|---|
| Document ID | 07-21 |
| Folder | 07 - Screens |
| Status | Planned |
| Version | 1.0.0 |
| Primary Source | TinyTots OS 2.0 — Chapter 5 Global Notification Rules |
| Last Updated | 2026-08-09 |

## Purpose
Provide access to global operational notifications without interrupting workflows.

## Examples
- Sale completed
- Printer disconnected
- Stock low
- Backup complete
- Import finished

Notifications are global and should never unnecessarily interrupt workflow.

## States
Unread, read, empty, loading, and error.

## Boundary
Global notification infrastructure is defined in Phase 06. This document specifies screen-level consumption only.

## TODO
- Verify notification persistence.
- Verify notification categories.
- Verify read/unread behavior.
- Verify current implementation.

## Related Documents
- Phase 06 — Notifications
- 07-02 POS.md
- 07-11 Low Stock.md
- 07-27 Printer Settings.md

## Revision History
| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-09 | Initial screen specification. |
