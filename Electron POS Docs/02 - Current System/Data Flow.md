# Data Flow

**Document ID:** 02-10  
**Folder:** 02 - Current System  
**Status:** Verified (Version 1)  
**Version:** 1.0  
**Last Updated:** 2026-08-06

---

# Purpose

This document describes how data flows throughout TinyTots OS.

It explains how information moves between:

- User Interfaces
- React Components
- Context Providers
- Services
- Electron IPC
- Supabase
- PostgreSQL
- Hardware Devices

The purpose is to provide a clear understanding of the operational data lifecycle without requiring source code inspection.

---

# Scope

Applications covered:

- Electron POS
- Next.js Website
- Shared Supabase Backend

---

# High-Level Data Flow

```
                 TinyTots OS

        Electron POS        Website
              │                │
              │                │
              └──────┬─────────┘
                     │
               Business Services
                     │
                     ▼
                Supabase Backend
                     │
                     ▼
                PostgreSQL Database
```

---

# Primary Data Sources

| Source | Description |
|---------|-------------|
| User Input | Keyboard, mouse, touch interactions |
| Barcode Scanner | Product identification |
| Supabase | Central application database |
| Local Storage / IndexedDB | Offline transaction storage |
| Electron Hardware APIs | Printer and cash drawer integration |

---

# POS Sale Flow

```
Cashier

↓

Product Selection

↓

CartContext

↓

Checkout Modal

↓

salesService

↓

Supabase

↓

sale_items

↓

Database Trigger

↓

Inventory Update

↓

Receipt Printing
```

---

## Description

1. Cashier selects products.
2. CartContext stores the active transaction.
3. Checkout validates payment.
4. salesService creates the sale.
5. Sale is written to Supabase.
6. Database trigger updates stock.
7. Receipt is generated.
8. Printer outputs receipt.

Status: Verified

---

# Offline Sale Flow

```
Cashier

↓

Checkout

↓

Network Available?
      │
 ┌────┴────┐
 │         │
Yes       No
 │         │
 ▼         ▼
Supabase  Offline Queue
            │
            ▼
 Local Storage / IndexedDB
            │
            ▼
 Network Restored
            │
            ▼
 Queue Synchronization
            │
            ▼
 Supabase
```

---

## Description

When connectivity is unavailable:

- Transactions remain local.
- Sales continue uninterrupted.
- Synchronization occurs automatically after reconnection.

Status: Verified

---

# Product Retrieval Flow

```
Product Grid

↓

productService

↓

Supabase

↓

Products

↓

Variants

↓

UI Rendering
```

---

# Customer Lookup Flow

```
Customer Search

↓

useCustomers

↓

customerService

↓

Supabase

↓

Customer Record

↓

Checkout
```

Status: Verified

---

# Inventory Synchronization

```
Sale Completed

↓

sale_items

↓

trg_deduct_stock

↓

variants.stock

↓

Updated Inventory

↓

Electron POS

Website
```

The database acts as the single source of truth.

Status: Verified

---

# Website Product Flow

```
Browser

↓

Next.js Route

↓

Server Component

↓

Supabase

↓

Product Data

↓

React Components

↓

Customer
```

Status: Verified

---

# Receipt Printing Flow

```
Checkout

↓

ReceiptModal

↓

Electron IPC

↓

printer.ts

↓

ESC/POS Formatter

↓

Thermal Printer
```

Status: Verified

---

# Barcode Flow

```
Barcode Scanner

↓

Keyboard Events

↓

useBarcodeScanner

↓

Product Lookup

↓

CartContext

↓

Cart Updated
```

Status: Verified

---

# Authentication Flow

```
Staff Login

↓

AuthContext

↓

Supabase Authentication

↓

Session

↓

Protected POS
```

Status: Partially Verified

---

# Shared Backend Flow

```
Electron POS
      │
      │
      ▼
Supabase Database
      ▲
      │
      │
Next.js Website
```

Both applications read and write to the same backend.

Status: Verified

---

# Data Ownership

| Domain | Owner |
|---------|-------|
| Products | Supabase |
| Variants | Supabase |
| Customers | Supabase |
| Sales | Supabase |
| Inventory | PostgreSQL |
| Cart | CartContext |
| Offline Queue | OfflineContext |
| Printer Settings | SettingsContext |

---

# Data Synchronization Principles

The repository follows several important principles:

- Single Source of Truth
- Database-driven inventory updates
- Local-first offline transactions
- Hardware isolation through Electron
- Context-based state management
- Service-layer database access

---

# Data Flow Summary

```
User

↓

UI

↓

React Context

↓

Business Service

↓

Supabase

↓

Database

↓

Business Rules

↓

Updated State

↓

User Interface
```

---

# Related Documents

- Business Logic.md
- Existing Architecture.md
- Technology Stack.md
- IPC Overview.md
- Architecture/System Architecture.md

---

# Revision History

| Version | Date | Author | Notes |
|----------|------|--------|-------|
| 1.0 | 2026-08-06 | Documentation Team | Initial data flow documentation based on verified repository analysis. |