# Business Logic

**Document ID:** 02-09  
**Folder:** 02 - Current System  
**Status:** Verified (Version 1)  
**Version:** 1.0  
**Last Updated:** 2026-08-06

---

# Purpose

This document describes the business logic currently implemented within TinyTots OS.

Business logic represents the rules, workflows, and operational processes that define how the platform functions, independent of its user interface or technical implementation.

This document serves as the authoritative reference for the current operational behavior of the system.

---

# Scope

Applications covered:

- Electron POS
- Next.js Website
- Shared Supabase Backend

---

# Business Domains

The repository audit identified the following business domains.

```
TinyTots OS
│
├── Authentication
├── Product Catalog
├── Inventory
├── Customers
├── Checkout
├── Orders
├── Receipts
├── Offline Operations
├── Hardware Integration
└── Website Commerce
```

Each domain is described below.

---

# Authentication

## Purpose

Control access to the Point of Sale system by verifying staff identity before operational use.

## Primary Responsibilities

- Staff authentication
- Session management
- Access validation
- Shift ownership

## Verified Implementation

Electron POS

```
src/contexts/AuthContext.tsx
```

## Business Rules

- Staff must be authenticated before accessing protected POS functionality.
- Authentication state is maintained throughout the application session.
- Staff identity is associated with operational activities.

## Status

Verified

---

# Product Catalog

## Purpose

Provide a centralized catalog of products available for sale across all sales channels.

## Responsibilities

- Product retrieval
- Variant management
- Pricing
- Availability
- Category organization

## Verified Implementation

Electron POS

```
services/productService.ts
```

Website

```
app/products/
```

## Shared Backend

Supabase

## Business Rules

- Products are maintained in a centralized database.
- Product information is shared across both applications.
- Variants belong to individual products.

## Status

Verified

---

# Inventory Management

## Purpose

Maintain accurate stock levels across all sales channels.

## Responsibilities

- Stock availability
- Inventory synchronization
- Automatic stock deduction
- Low stock monitoring

## Verified Implementation

Supabase

```
variants
```

```
sale_items
```

Database Trigger

```
trg_deduct_stock
```

## Business Rules

- Every completed sale reduces inventory.
- Stock updates occur automatically at the database level.
- Both applications read from the same inventory source.

## Status

Verified

---

# Customer Management

## Purpose

Associate customers with sales and maintain customer records.

## Responsibilities

- Customer lookup
- Customer selection
- Customer creation
- Customer persistence

## Verified Implementation

```
customerService.ts
```

```
useCustomers.ts
```

## Business Rules

- Customers may be assigned during checkout.
- Customer data is stored centrally.
- Customer information is reusable across future transactions.

## Status

Verified

---

# Shopping Cart

## Purpose

Temporarily store products selected for purchase before checkout.

## Verified Implementation

```
CartContext.tsx
```

## Responsibilities

- Add products
- Remove products
- Quantity updates
- Discount calculation
- Tax calculation
- Total calculation

## Business Rules

- Cart exists only during an active transaction.
- Totals are recalculated whenever cart contents change.
- Customer selection is associated with the cart before checkout.

## Status

Verified

---

# Checkout

## Purpose

Convert an active shopping cart into a completed sale.

## Verified Implementation

```
CheckoutModal.tsx

salesService.ts
```

## Responsibilities

- Payment processing
- Order validation
- Sale creation
- Receipt generation
- Inventory update

## Business Workflow

```
Cart

↓

Payment

↓

Sale Creation

↓

Inventory Update

↓

Receipt Printing

↓

Transaction Complete
```

## Business Rules

- Checkout finalizes a sale.
- Completed sales become permanent records.
- Successful checkout clears the active cart.

## Status

Verified

---

# Orders & Sales

## Purpose

Persist completed transactions.

## Verified Database Tables

```
sales

sale_items
```

## Responsibilities

- Sale records
- Purchased items
- Payment method
- Receipt reference
- Historical reporting

## Business Rules

- One sale may contain multiple sale items.
- Every sale item references a product variant.
- Sales become part of permanent transaction history.

## Status

Verified

---

# Receipt Generation

## Purpose

Provide customers with proof of purchase.

## Verified Implementation

```
ReceiptModal.tsx

electron/printer.ts

escposFormatter.ts
```

## Responsibilities

- Receipt formatting
- Thermal printing
- Cash drawer trigger

## Business Rules

- Receipts are generated after successful checkout.
- Printing is handled through Electron IPC.
- Receipt formatting is separated from UI logic.

## Status

Verified

---

# Offline Operations

## Purpose

Allow continued sales during network interruptions.

## Verified Components

```
OfflineContext.tsx

offlineService.ts

useOfflineQueue.ts
```

## Responsibilities

- Queue transactions
- Local persistence
- Background synchronization
- Retry failed uploads

## Business Workflow

```
Sale

↓

Offline Queue

↓

Local Storage

↓

Connection Restored

↓

Automatic Sync

↓

Supabase
```

## Business Rules

- Sales are never discarded because of connectivity loss.
- Transactions remain queued until synchronization succeeds.
- Queue replay occurs after connectivity returns.

## Status

Verified

---

# Barcode Processing

## Purpose

Accelerate product lookup during checkout.

## Verified Implementation

```
useBarcodeScanner.ts
```

## Responsibilities

- Listen for scanner input
- Identify products
- Add matching products to cart

## Business Rules

- Barcode input behaves as rapid keyboard input.
- Successful scans identify products without manual searching.

## Status

Verified

---

# Thermal Printing

## Purpose

Support physical retail operations.

## Verified Implementation

```
electron/printer.ts
```

## Responsibilities

- Printer discovery
- ESC/POS formatting
- Receipt printing
- Cash drawer commands

## Business Rules

- Printing occurs after successful sale completion.
- Printer communication is isolated from UI components.

## Status

Verified

---

# Website Commerce

## Purpose

Provide customers with an online shopping experience.

## Verified Responsibilities

- Browse products
- View collections
- Read blog content
- Manage cart
- Complete checkout

## Verified Routes

```
/

products/

products/[id]

collections/[slug]

cart/

checkout/

blog/
```

## Business Rules

- Website inventory reflects shared backend inventory.
- Product information is consistent with the POS system.

## Status

Verified

---

# Shared Business Rules

The repository audit identified several rules that apply across the entire platform.

### Single Source of Truth

All operational data originates from Supabase.

Status: Verified

---

### Shared Inventory

Electron POS and Website use the same inventory records.

Status: Verified

---

### Automatic Inventory Deduction

Stock is reduced using PostgreSQL triggers after sale completion.

Status: Verified

---

### Offline Continuity

Desktop sales continue without an active internet connection.

Status: Verified

---

### Hardware Isolation

Native hardware communication is isolated within the Electron layer.

Status: Verified

---

# Business Logic Relationships

```
Authentication
        │
        ▼
Product Selection
        │
        ▼
Shopping Cart
        │
        ▼
Customer Assignment
        │
        ▼
Checkout
        │
        ▼
Sales Record
        │
        ▼
Inventory Update
        │
        ▼
Receipt Printing
        │
        ▼
Transaction Complete
```

---

# Business Logic Not Yet Verified

The repository audit did not provide sufficient evidence to fully document the following areas.

- Loyalty program rules
- Gift cards
- Promotions engine
- Tax calculation strategy
- Refund workflow
- Exchange workflow
- Permission hierarchy
- Employee roles
- Multi-store support
- Supplier management
- Purchase orders

These areas should be documented only after repository verification.

---

# Summary

TinyTots OS is centered around a shared business model where both the Electron POS and the Next.js website operate on a single backend.

Core operational principles include:

- Centralized product catalog
- Shared inventory
- Database-driven stock management
- Offline-capable POS transactions
- Hardware abstraction through Electron
- Persistent sales records
- Unified customer data

The separation of business logic into services, contexts, and database procedures provides a strong foundation for future refactoring and redesign while preserving operational behavior.

---

# Related Documents

- Repository Audit.md
- Existing Architecture.md
- Current Workflow.md
- Technology Stack.md
- Data Flow.md
- IPC Overview.md
- Technical Debt.md
- Architecture/System Architecture.md

---

# Revision History

| Version | Date | Author | Notes |
|----------|------------|----------------------|-----------------------------------------------|
| 1.0 | 2026-08-06 | Documentation Team | Initial business logic documentation derived from verified repository analysis. |