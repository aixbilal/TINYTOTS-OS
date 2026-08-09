# Receipt Details

## Document Information
| Field | Value |
|---|---|
| Document ID | 07-04 |
| Folder | 07 - Screens |
| Status | Planned |
| Version | 1.0.0 |
| Primary Source | TinyTots OS 2.0 — Chapter 5 Receipt Architecture |
| Last Updated | 2026-08-09 |

## Purpose
Provide complete inspection of a single sale and its receipt.

## Scope
Receipt preview, payment, customer, items, print, refund, and related transaction information.

## Screen Architecture
```text
Receipt
├── Receipt Preview
├── Payment
├── Customer
├── Items
├── Print
└── Refund
```

## Interactions
- Review transaction items.
- Review payment information.
- Review customer information when attached.
- Print/reprint receipt.
- Initiate refund when authorized.

## States
Loading, empty/not-found, error, and offline/pending states must follow the shared application-state system.

## Permissions
Refund and other privileged actions are permission-controlled.

## Implementation Notes
Receipt data must come from the established transaction/receipt layer. The screen should not independently calculate historical transaction totals.

## TODO
- Verify exact receipt fields from repository.
- Verify refund workflow integration.
- Verify reprint behavior.

## Related Documents
- 07-02 POS.md
- 07-03 Receipts.md
- Phase 09 — Features

## Revision History
| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-09 | Initial screen specification. |
