# Technology Stack

**Document ID:** 02-08  
**Folder:** 02 - Current System  
**Status:** Verified (Version 1)  
**Version:** 1.0  
**Last Updated:** 2026-08-06

---

# Purpose

This document defines the technology stack currently used within the TinyTots OS repository.

It serves as the official reference for all frameworks, runtimes, libraries, platforms, and infrastructure used throughout the project.

Only technologies verified through repository analysis are included.

---

# Scope

Repository

```
TINYTOTS-OS
```

Applications

- Electron POS
- Next.js Web Application
- Shared Supabase Backend

---

# Technology Overview

TinyTots OS is an omnichannel retail platform composed of two independent frontend applications sharing a common cloud backend.

```
                    TinyTots OS

        ┌────────────────────────────┐
        │   Electron Desktop POS     │
        └──────────────┬─────────────┘
                       │
                       │
                Supabase Backend
                       │
                       │
        ┌──────────────▼─────────────┐
        │ Next.js Website & Admin    │
        └────────────────────────────┘
```

---

# Desktop Application Stack

Application

TinyTots Electron POS

Location

```
tinytots-app/electron-app
```

## Runtime

- Electron

Purpose

Provides a native desktop environment with access to operating system features such as:

- Printing
- File System
- Native Windows
- IPC
- Hardware Devices

---

## UI Framework

- React

Purpose

Responsible for rendering the complete desktop user interface.

Used for

- Screens
- Components
- State Updates
- User Interaction

---

## Programming Language

- TypeScript

Purpose

Provides static typing across the application.

Benefits

- Better maintainability
- Improved tooling
- Compile-time error detection
- Safer refactoring

---

## Build Tool

- Vite

Purpose

Development server and production bundler.

Responsibilities

- Module bundling
- Hot Module Replacement
- Production builds
- Development tooling

---

# Web Application Stack

Application

TinyTots Website

Location

```
tinytots-web/web
```

---

## Framework

- Next.js

Architecture

App Router

Purpose

Provides:

- Server Components
- Client Components
- API Routes
- SEO
- Routing
- Server Rendering

---

## UI Framework

- React

Purpose

Interactive user interface development.

Used by

- Product Pages
- Cart
- Checkout
- Collections
- Blog
- Shared Components

---

## Programming Language

- TypeScript

Purpose

Shared type-safe development across the website.

---

## Styling

- Tailwind CSS

Purpose

Utility-first styling system.

Responsibilities

- Layout
- Spacing
- Responsive Design
- Typography
- Color Utilities

---

# Backend Stack

Platform

Supabase

Purpose

Acts as the central backend shared by both applications.

---

## Database

- PostgreSQL

Responsibilities

- Products
- Inventory
- Customers
- Orders
- Sales
- Variants
- Images

---

## Authentication

Supabase Authentication

Purpose

Identity management.

Verified Usage

- Staff Authentication
- Application Authentication

Customer authentication requires further verification.

Status

Partially Verified

---

## Storage

Supabase Storage

Purpose

Stores:

- Product Images
- Media Assets

Repository analysis confirms the use of a dedicated storage bucket.

---

## Realtime

Supabase Realtime

Purpose

Synchronizes application data between clients.

Primary Usage

- Inventory updates

Status

Verified

---

# Desktop Hardware Integration

The Electron application communicates directly with retail hardware.

---

## Thermal Printing

Technology

ESC/POS

Purpose

Receipt printing.

Responsibilities

- Receipt formatting
- Print commands
- Cash drawer control

---

## Barcode Scanner

Purpose

Product lookup.

Implementation

Global keyboard event listener.

Status

Verified

---

## Cash Drawer

Purpose

Automatic drawer opening after completed sales.

Communication

ESC/POS kick pulse.

Status

Verified

---

# Application Architecture

The repository follows a multi-application architecture.

```
Electron POS

↓

Electron IPC

↓

Business Services

↓

Supabase

↓

Next.js Website
```

Characteristics

- Shared backend
- Independent deployments
- Shared business data
- Separate presentation layers

---

# State Management

Verified patterns include:

- React Context API

Contexts identified

- AuthContext
- CartContext
- OfflineContext
- SettingsContext

Additional state libraries were not verified during repository analysis.

---

# Service Layer

The Electron application follows a service-oriented organization.

Verified services include:

- customerService
- productService
- salesService
- offlineService

Responsibilities

- Business logic
- Database communication
- Offline support
- Customer management

---

# Custom Hooks

Verified hooks include:

- useProducts
- useCustomers
- useBarcodeScanner
- useOfflineQueue
- useThermalPrinter

Purpose

Encapsulate reusable application logic.

---

# API Layer

Verified API routes include:

```
/api/products

/api/categories
```

Framework

Next.js Route Handlers

Purpose

Provide backend endpoints for the web application.

Additional API routes require further verification.

---

# Database Technologies

Verified database technologies include:

- PostgreSQL
- SQL Migrations
- Triggers
- Functions
- Foreign Keys

Repository analysis identified automated inventory updates using database triggers.

---

# Progressive Web Application

Verified technologies

- Service Worker
- Serwist
- Cache Warming

Purpose

Provides:

- Offline support
- Cached assets
- Faster repeat visits

---

# Configuration Files

Verified configuration files include:

Desktop

- package.json
- tsconfig.json
- vite.config.ts
- electron.builder.json

Website

- package.json
- next.config.mjs
- tailwind.config.ts
- tsconfig.json

These files define the application's build, compilation, packaging, and deployment behaviour.

---

# Development Principles

The repository demonstrates several engineering practices.

Verified

- Modular folder organization
- Service layer separation
- Context-based state management
- Type-safe development
- Shared backend architecture
- Native hardware abstraction
- Database-driven inventory synchronization

---

# Technology Matrix

| Category | Technology | Status |
|-----------|------------|--------|
| Desktop Runtime | Electron | Verified |
| Desktop UI | React | Verified |
| Desktop Language | TypeScript | Verified |
| Desktop Build Tool | Vite | Verified |
| Web Framework | Next.js (App Router) | Verified |
| Web UI | React | Verified |
| Web Styling | Tailwind CSS | Verified |
| Backend Platform | Supabase | Verified |
| Database | PostgreSQL | Verified |
| Authentication | Supabase Auth | Partially Verified |
| Storage | Supabase Storage | Verified |
| Realtime | Supabase Realtime | Verified |
| Printing | ESC/POS | Verified |
| Barcode Scanner | Keyboard Input | Verified |
| PWA | Serwist | Verified |
| State Management | React Context API | Verified |

---

# Technologies Requiring Further Verification

The repository audit did not provide sufficient evidence to confirm the use of the following technologies.

- Zustand
- Redux
- React Query
- TanStack Query
- Prisma
- Docker
- Redis
- GraphQL
- WebSockets (outside Supabase Realtime)
- Electron Auto Updater configuration
- CI/CD platform
- Automated testing frameworks

These technologies should not be documented as part of the official stack until verified.

---

# Summary

TinyTots OS is built using a modern TypeScript-based technology stack centered around two independent frontend applications sharing a common Supabase backend.

The architecture emphasizes:

- Shared business data
- Native desktop capabilities
- Modern web development
- Offline resilience
- Modular services
- Type safety
- Hardware integration

This technology stack provides a solid foundation for the planned redesign while minimizing the need for changes to the underlying infrastructure.

---

# Related Documents

- Repository Audit.md
- Existing Architecture.md
- Business Logic.md
- Data Flow.md
- IPC Overview.md
- Technical Debt.md
- Development/Folder Structure.md

---

# Revision History

| Version | Date | Author | Notes |
|----------|------------|----------------------|-----------------------------------------------|
| 1.0 | 2026-08-06 | Documentation Team | Initial technology stack documentation based on verified repository analysis. |