# Add Product

## Document Information
| Field | Value |
|---|---|
| Document ID | 07-07 |
| Folder | 07 - Screens |
| Status | Planned |
| Version | 1.0.0 |
| Primary Source | TinyTots OS 2.0 — Chapter 5 Inventory IA and Product Management Structure |
| Last Updated | 2026-08-09 |

## Purpose
Create a new product without violating the established inventory architecture.

## Scope
Product creation workflow, validation, pricing, inventory, category/variant relationships, and post-create navigation.

## Entry Points
- Products → Add Product
- Quick Action where authorized.

## Interactions
The form must use the shared form/input system from Phase 05/08. Validation should be explicit and prevent invalid product records.

## States
Loading, validation error, submission error, and success states are required.

## Implementation Notes
Creation logic belongs in the established application/service/data layers. The screen should not directly implement persistence rules.

## TODO
- Verify exact product-create fields.
- Verify required/optional fields.
- Verify image-upload behavior.
- Verify default post-create destination.

## Related Documents
- 07-05 Products.md
- 07-06 Product Detail.md
- 07-08 Edit Product.md
- Phase 08 — Components

## Revision History
| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-09 | Initial screen specification. |
