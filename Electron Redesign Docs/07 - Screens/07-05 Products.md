# Products

## Document Information
| Field | Value |
|---|---|
| Document ID | 07-05 |
| Folder | 07 - Screens |
| Status | Planned |
| Version | 1.0.0 |
| Primary Source | TinyTots OS 2.0 — Chapter 5 Inventory Architecture |
| Last Updated | 2026-08-09 |

## Purpose
Provide the primary inventory-browsing workspace for products.

## Scope
Search, filters, bulk actions, table/grid presentation, pagination, and quick editing.

## Screen Architecture
```text
Header
↓
Search
↓
Filters
↓
Bulk Actions
↓
Table / Grid
↓
Pagination
```

Quick edit should not require opening Product Detail.

## Interactions
- Search products.
- Filter products.
- Select products for bulk actions.
- Quick edit supported fields where defined.
- Open Product Detail.
- Add Product.

## States
Loading, empty inventory, filtered-empty, error, and offline states follow shared systems.

## Permissions
Actions are role-aware. Buttons that are not permitted should not be exposed.

## Implementation Notes
Product data must come from the established product/inventory architecture. Avoid duplicating product business rules in the screen.

## TODO
- Verify exact table columns.
- Verify current bulk actions.
- Verify current quick-edit fields.
- Verify pagination implementation.

## Related Documents
- 07-06 Product Detail.md
- 07-07 Add Product.md
- 07-08 Edit Product.md
- 07-09 Categories.md
- 07-10 Barcode Generator.md
- 07-11 Low Stock.md

## Revision History
| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-09 | Initial screen specification. |
