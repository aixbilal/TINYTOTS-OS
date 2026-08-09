# Settings

## Document Information
| Field | Value |
|---|---|
| Document ID | 07-26 |
| Folder | 07 - Screens |
| Status | Planned |
| Version | 1.0.0 |
| Primary Source | TinyTots OS 2.0 — Chapter 5.14 Settings Architecture |
| Last Updated | 2026-08-09 |

## Purpose
Provide structured system configuration without creating one long settings page.

## Settings Categories
The redesign defines:
- General
- Store
- Printer
- Theme
- Users
- Security
- Backup
- Advanced

Each becomes its own category.

## Interactions
Selecting a category navigates to its configuration workspace.

## States
Loading, save success, save error, validation error, and permission-restricted.

## Boundary
Global theme behavior and application shell behavior remain governed by Phase 05/06.

## TODO
- Verify exact category routes.
- Verify which settings are currently implemented.
- Verify role restrictions.
- Verify unsaved-change behavior.

## Related Documents
- 07-25 Store Administration.md
- 07-27 Printer Settings.md
- 07-28 Store Settings.md
- 07-29 Backup.md
- Phase 06 — Theme System

## Revision History
| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-09 | Initial screen specification. |
