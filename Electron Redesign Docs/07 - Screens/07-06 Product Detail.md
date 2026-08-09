# Product Detail

## Document Information
| Field | Value |
|---|---|
| Document ID | 07-06 |
| Folder | 07 - Screens |
| Status | Planned |
| Version | 1.0.0 |
| Primary Source | TinyTots OS 2.0 — Chapter 5 Product Detail Architecture |
| Last Updated | 2026-08-09 |

## Purpose
Provide the complete management view for one product.

## Screen Architecture
```text
Images
↓
Overview
↓
Pricing
↓
Inventory
↓
Variants
↓
Barcode
↓
History
↓
Danger Zone
```

Every section is collapsible.

## Scope
Product identity, imagery, pricing, inventory, variants, barcode, history, and destructive actions.

## Interactions
- Expand/collapse sections.
- Edit product.
- Review variants.
- Review stock.
- Review barcode.
- Review product history.
- Access danger-zone actions where authorized.

## States
Loading, product-not-found, error, and permission-restricted states use global patterns.

## Permissions
Destructive and management actions require appropriate permissions.

## TODO
- Verify exact product fields.
- Verify history data source.
- Verify variant management behavior.
- Verify danger-zone actions.

## Related Documents
- 07-05 Products.md
- 07-07 Add Product.md
- 07-08 Edit Product.md
- 07-10 Barcode Generator.md

## Revision History
| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-09 | Initial screen specification. |
