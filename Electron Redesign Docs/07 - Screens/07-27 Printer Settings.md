# Printer Settings

## Document Information
| Field | Value |
|---|---|
| Document ID | 07-27 |
| Folder | 07 - Screens |
| Status | Planned |
| Version | 1.0.0 |
| Primary Source | TinyTots OS 2.0 — Settings Architecture and POS Printer Status requirements |
| Last Updated | 2026-08-09 |

## Purpose
Configure and inspect the receipt/printing environment.

## Scope
Printer configuration and status-related settings supported by the application.

## Relationship to POS
The POS must always expose printer status. Printer configuration belongs here, not inside the transaction workspace.

## States
Ready, printing, offline, paper low, disconnected, configuration error.

## Implementation Notes
Printing must not block the POS UI.

## TODO
- Verify supported printer configuration fields.
- Verify printer discovery.
- Verify thermal-printer settings.
- Verify current Electron IPC integration.

## Related Documents
- 07-02 POS.md
- 07-10 Barcode Generator.md
- 07-26 Settings.md
- Phase 09 — Printing

## Revision History
| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-09 | Initial screen specification. |
