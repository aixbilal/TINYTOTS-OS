# Existing Screens

**Document ID:** 02-07  
**Folder:** 02 - Current System  
**Status:** Verified (Version 1)  
**Version:** 1.0  
**Last Updated:** 2026-08-06

---

# Purpose

This document provides an inventory of the screens currently implemented within the TinyTots OS repository.

It serves as the baseline reference for the redesign project by identifying existing user-facing interfaces across both the Electron POS application and the Next.js web application.

This document intentionally describes the current implementation only. It does not define future redesign requirements.

---

# Scope

Applications covered:

- TinyTots Electron POS
- TinyTots Website
- Shared Administrative Interfaces (where applicable)

---

# Screen Classification

The repository currently contains two independent user interfaces:

```
TinyTots OS
│
├── Electron POS
│
└── Website
```

Although both applications share the same backend, they provide different user experiences and are optimized for different operational environments.

---

# Electron POS

The Electron application is designed for in-store retail operations.

Its interface prioritizes:

- Fast navigation
- Touch-friendly interactions
- Keyboard efficiency
- Hardware integration
- Offline operation

The following screens and operational modules were identified during the repository audit.

---

## POS Interface

### Purpose

Primary cashier workspace.

### Responsibilities

- Browse products
- Search products
- Add products to cart
- Modify quantities
- Apply discounts
- Select customer
- Complete checkout
- Generate receipt

### Major Components

- Header
- Product Grid
- Product Card
- Sidebar (Cart)
- Checkout Modal
- Receipt Modal

### Status

Verified

---

## Checkout Modal

### Purpose

Finalize customer purchases.

### Responsibilities

- Payment processing
- Cash handling
- Card payments
- Customer assignment
- Total calculation
- Sale confirmation

### Dependencies

- CartContext
- salesService
- Receipt Printing

### Status

Verified

---

## Receipt Preview

### Purpose

Display receipt before printing.

### Responsibilities

- Receipt preview
- Print confirmation
- Thermal printer integration

### Dependencies

- Electron IPC
- printer.ts

### Status

Verified

---

## Customer Search

### Purpose

Search and assign customers during checkout.

### Responsibilities

- Customer lookup
- Customer selection
- Customer creation

### Dependencies

- customerService
- Supabase

### Status

Verified

---

## Discount Management

### Purpose

Apply pricing adjustments.

### Responsibilities

- Cart discounts
- Item discounts

### Dependencies

- CartContext

### Status

Verified

---

## Shift Management

### Purpose

Manage daily cashier shifts.

### Responsibilities

- Open shift
- Close shift
- Cash reconciliation

### Dependencies

- Shift state
- Sales records

### Status

Verified

---

## Settings

### Purpose

Configure local POS settings.

### Responsibilities

- Printer configuration
- Store information
- Hardware preferences

### Dependencies

- SettingsContext
- Electron

### Status

Verified

---

## Offline Status

### Purpose

Provide network and synchronization feedback.

### Responsibilities

- Online status
- Offline status
- Pending transactions
- Queue synchronization

### Dependencies

- OfflineContext

### Status

Verified

---

# Website

The website provides the customer-facing online shopping experience.

The repository audit identified the following implemented pages.

---

## Homepage

### Route

```
/
```

### Purpose

Landing page for customers.

### Responsibilities

- Hero content
- Featured collections
- Product highlights
- Promotional sections

### Rendering

Server Component

### Status

Verified

---

## Product Catalog

### Route

```
/products
```

### Purpose

Browse available products.

### Responsibilities

- Product listing
- Filtering
- Search
- Product navigation

### Rendering

Hybrid (Server + Client)

### Status

Verified

---

## Product Details

### Route

```
/products/[id]
```

### Purpose

Display complete product information.

### Responsibilities

- Product images
- Variants
- Size selection
- Color selection
- Add to cart

### Components

- Product Gallery
- Product Detail Interactive

### Status

Verified

---

## Collections

### Route

```
/collections/[slug]
```

### Purpose

Display products belonging to a specific collection or category.

### Responsibilities

- Collection browsing
- Product listing

### Status

Verified

---

## Shopping Cart

### Route

```
/cart
```

### Purpose

Review selected products.

### Responsibilities

- Quantity updates
- Remove products
- Cart totals
- Checkout navigation

### Status

Verified

---

## Checkout

### Route

```
/checkout
```

### Purpose

Complete online purchases.

### Responsibilities

- Customer information
- Shipping details
- Payment flow
- Order confirmation

### Status

Verified

---

## Blog

### Route

```
/blog
```

### Purpose

Display editorial and marketing content.

### Responsibilities

- Blog listing
- Article navigation

### Status

Verified

---

## Blog Article

### Route

```
/blog/[slug]
```

### Purpose

Display an individual blog post.

### Responsibilities

- Article rendering
- SEO metadata
- Content presentation

### Status

Verified

---

# Shared User Journeys

Although implemented in separate applications, several workflows share the same backend.

Examples include:

```
Product Catalog
        │
        ▼
Inventory
        │
        ▼
Supabase
        │
        ├──────────────┐
        ▼              ▼
Electron POS      Website
```

Shared business domains include:

- Products
- Inventory
- Customers
- Orders
- Authentication
- Images

---

# Screen Coverage Summary

| Application | Screen / Module | Status |
|-------------|-----------------|--------|
| Electron POS | POS Interface | Verified |
| Electron POS | Checkout Modal | Verified |
| Electron POS | Receipt Preview | Verified |
| Electron POS | Customer Search | Verified |
| Electron POS | Discount Management | Verified |
| Electron POS | Shift Management | Verified |
| Electron POS | Settings | Verified |
| Electron POS | Offline Status | Verified |
| Website | Homepage | Verified |
| Website | Product Catalog | Verified |
| Website | Product Details | Verified |
| Website | Collections | Verified |
| Website | Shopping Cart | Verified |
| Website | Checkout | Verified |
| Website | Blog | Verified |
| Website | Blog Article | Verified |

---

# Screens Requiring Further Verification

The repository audit did not provide sufficient evidence to confirm the implementation status of the following interfaces:

- Authentication screens
- User account management
- Administrative dashboard
- Analytics interface
- Reporting interface
- Inventory management interface
- Order management interface
- Customer management interface
- Staff management interface

**Status:** NOT VERIFIED

These areas should be confirmed through direct repository inspection or future repository audits before being documented as implemented screens.

---

# Summary

The current TinyTots OS implementation provides two distinct user experiences:

- A desktop-focused Electron POS optimized for retail operations.
- A Next.js web application focused on customer shopping and product discovery.

Both applications share a common backend while maintaining independent presentation layers.

This separation provides a strong architectural foundation for the redesign while allowing each application to evolve according to its operational requirements.

---

# Related Documents

- Repository Audit.md
- Existing Architecture.md
- Current Workflow.md
- Current UI Analysis.md
- Problems.md
- Technical Debt.md
- Technology Stack.md
- Business Logic.md

---

# Revision History

| Version | Date | Author | Notes |
|----------|------------|----------------------|-----------------------------------------------|
| 1.0 | 2026-08-06 | Documentation Team | Initial inventory of implemented application screens based on verified repository analysis. |