# Phase 10 — Data Models

Phase 10 defines the canonical semantic data-model layer between operational features and implementation.

## Position in the Documentation Architecture

```text
07 — Screens
      ↓
08 — Components
      ↓
09 — Features
      ↓
10 — Data Models
      ↓
11 — Development
      ↓
12 — Testing
```

## Purpose

These documents define what the application's core data represents, how entities relate, their lifecycle, ownership, constraints, and current-versus-target state.

They do not replace:

- Phase 03 architecture
- Phase 09 feature workflows
- Phase 11 implementation/migration documentation

## Source Discipline

The redesign specification is the primary source for target-state requirements.

The verified repository/database schema is the source for current implementation.

Unsupported details remain TODO.

## Inventory

- Data Model Overview
- Product
- Variant
- Category
- Customer
- Order
- Order Item
- Payment
- Receipt
- Inventory
- Inventory Movement
- User
- Role & Permission
- Store
- Settings
- Synchronization
- Offline Queue Item

## Important Boundary

A conceptual model must not be treated as proof that the corresponding schema or implementation already exists. Current implementation claims require repository/database verification.
