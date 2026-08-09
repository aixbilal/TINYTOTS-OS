# Receipts

## Document Information
| Field | Value |
|---|---|
| Document ID | 07-03 |
| Folder | 07 - Screens |
| Status | Planned |
| Version | 1.0.0 |
| Primary Source | TinyTots OS 2.0 — Chapter 5 Receipt Architecture and Information Architecture |
| Last Updated | 2026-08-09 |

## Purpose
Provide searchable access to past transactions and their associated receipt records.

## Scope
Receipt history, search, filtering, preview, printing, refund entry points, customer/payment context, and navigation to Receipt Details.

## Screen Architecture
```text
Receipt List
↓
Receipt Preview
↓
Payment
↓
Customer
↓
Items
↓
Print
↓
Refund
```

## Primary Information
The source defines Receipts as the transaction-history screen. Receipt Details is responsible for complete inspection of an individual sale.

## Interactions
- Search receipts.
- Open a receipt.
- Preview receipt.
- Print receipt.
- Start refund where authorized.
- Navigate to customer information where applicable.

## States
### Loading
Use the shared loading/skeleton system.

### Empty
Clearly communicate that no receipts match the current query.

### Error
Use Phase 06 error handling.

### Offline
The screen must clearly distinguish locally queued/pending transactions from synchronized transaction history when supported by the implementation.

## Permissions
Receipt actions follow the application permission strategy. Refund actions require appropriate authorization.

## Implementation Notes
Do not duplicate receipt generation or printing business logic in the screen.

## TODO
- Verify current receipt-list route and filters.
- Verify exact receipt search fields.
- Verify refund permissions and audit integration.
- Verify offline receipt visibility.

## Related Documents
- 07-02 POS.md
- 07-04 Receipt Details.md
- Phase 09 — Features
- Phase 06 — Application Shell

## Revision History
| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-09 | Initial screen specification. |
