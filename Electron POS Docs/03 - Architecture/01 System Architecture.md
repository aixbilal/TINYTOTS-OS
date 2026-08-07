\# System Architecture



\*\*Document ID:\*\* 03-01  

\*\*Folder:\*\* 03 - Architecture  

\*\*Status:\*\* Living Document  

\*\*Version:\*\* 1.0  

\*\*Last Updated:\*\* 2026-08-07



\---



\# Purpose



This document defines the overall architecture of TinyTots OS.



It describes the major architectural layers, system boundaries, responsibilities, communication patterns, and engineering principles governing the Electron POS application and its relationship with the TinyTots web platform.



This document serves as the architectural foundation for all subsequent documentation within the project.



\---



\# Scope



Repository



```

TINYTOTS-OS

```



Applications



\- Electron POS

\- Next.js Website

\- Shared Supabase Backend



Related Documents



\- Existing Architecture.md

\- Repository Audit.md

\- Technology Stack.md

\- Business Logic.md

\- Data Flow.md



\---



\# Architectural Vision



TinyTots OS is designed as an omnichannel retail platform where multiple applications operate independently while sharing a unified business domain and centralized data platform.



The architecture prioritizes:



\- Maintainability

\- Scalability

\- Modularity

\- Offline resilience

\- Hardware abstraction

\- Clear separation of concerns

\- Shared business logic

\- Single source of truth



The objective is to allow each application to evolve independently without compromising data consistency or operational reliability.



\---



\# High-Level Architecture



```

&#x20;                    TinyTots OS



&#x20;       ┌──────────────────────────────┐

&#x20;       │      Electron POS            │

&#x20;       │                              │

&#x20;       │  React + Electron + IPC      │

&#x20;       └──────────────┬───────────────┘

&#x20;                      │

&#x20;                      │

&#x20;              Business Services

&#x20;                      │

&#x20;                      ▼

&#x20;         ┌────────────────────────────┐

&#x20;         │        Supabase            │

&#x20;         │                            │

&#x20;         │ PostgreSQL + Auth + Storage│

&#x20;         └──────────────┬─────────────┘

&#x20;                        │

&#x20;                        │

&#x20;       ┌────────────────▼─────────────┐

&#x20;       │      Next.js Website         │

&#x20;       │                              │

&#x20;       │ Server Components + Client UI│

&#x20;       └──────────────────────────────┘

```



\---



\# Core Architectural Principles



The system follows several foundational principles.



\## Single Source of Truth



All operational business data resides within Supabase.



Neither application owns business data.



Instead, both consume and update the same centralized datastore.



\---



\## Independent Applications



Electron POS and Website are separate applications.



Each may be:



\- developed independently

\- deployed independently

\- versioned independently



while remaining synchronized through the backend.



\---



\## Layer Separation



Presentation logic is separated from business logic.



Business logic is separated from infrastructure.



Infrastructure is separated from external services.



\---



\## Hardware Isolation



All native hardware access remains inside Electron.



React components never communicate directly with:



\- printers

\- USB devices

\- operating system APIs



\---



\## Offline First



Retail operations must continue during temporary network failures.



The desktop application therefore prioritizes transaction continuity over immediate synchronization.



\---



\# Architectural Layers



TinyTots OS follows a layered architecture.



```

Presentation Layer



↓



Application Layer



↓



Business Layer



↓



Infrastructure Layer



↓



Data Layer

```



Each layer has a clearly defined responsibility.



\---



\# Layer 1 — Presentation



Responsibilities



\- User Interface

\- User Interaction

\- Rendering

\- Navigation

\- Visual Feedback



Technologies



\- React

\- Next.js

\- Electron Renderer



This layer should contain minimal business logic.



\---



\# Layer 2 — Application



Responsibilities



\- State Management

\- User Workflows

\- Screen Coordination

\- Context Providers

\- Routing



Primary Components



\- Context API

\- Custom Hooks

\- Layout Components



This layer coordinates application behavior but does not own business rules.



\---



\# Layer 3 — Business



Responsibilities



\- Product Operations

\- Checkout

\- Customer Management

\- Sales Processing

\- Inventory Operations



Implementation



Business services encapsulate operational rules and interact with the backend.



Business logic remains reusable regardless of presentation technology.



\---



\# Layer 4 — Infrastructure



Responsibilities



\- Electron IPC

\- Supabase Client

\- Authentication

\- Local Storage

\- Printer Communication

\- Barcode Input



Infrastructure provides technical capabilities required by the business layer.



\---



\# Layer 5 — Data



Responsibilities



\- Persistent Storage

\- Transactions

\- Relationships

\- Inventory

\- Customers

\- Sales

\- Product Catalog



Technology



PostgreSQL



This layer represents the permanent source of business information.



\---



\# Electron POS Architecture



The Electron POS application is responsible for in-store retail operations.



```

React UI



↓



Context Providers



↓



Business Services



↓



Electron IPC



↓



Main Process



↓



Hardware



↓



Receipt Printer

Cash Drawer

Barcode Scanner

```



Key characteristics



\- Native desktop application

\- Offline capable

\- Hardware integration

\- Fast transaction workflow



\---



\# Website Architecture



The website provides customer-facing commerce.



```

Next.js



↓



Server Components



↓



Client Components



↓



Supabase



↓



Customer Browser

```



Primary responsibilities



\- Product discovery

\- Shopping

\- Checkout

\- Content presentation



\---



\# Shared Backend Architecture



Both applications communicate with a common backend.



```

Electron POS



↓



Supabase



↑



Website

```



Shared domains include



\- Products

\- Variants

\- Customers

\- Sales

\- Inventory

\- Images



This architecture eliminates duplicate business data.



\---



\# Database Architecture



PostgreSQL functions as the operational core of the platform.



Responsibilities include:



\- product catalog

\- inventory

\- customer records

\- transactions

\- media references



Database triggers perform critical operational logic such as automatic inventory deduction.



\---



\# State Management Architecture



The desktop application primarily uses React Context for shared state.



Verified contexts include:



\- AuthContext

\- CartContext

\- OfflineContext

\- SettingsContext



State ownership remains localized to the domain responsible for managing it.



\---



\# Service-Oriented Design



Business functionality is organized into services.



Examples include:



\- productService

\- salesService

\- customerService

\- offlineService



Services isolate business operations from presentation components.



This improves maintainability and testability.



\---



\# Communication Architecture



Communication occurs through clearly defined interfaces.



```

React Component



↓



Context



↓



Service



↓



Supabase



↓



Database

```



For hardware operations:



```

React



↓



Electron IPC



↓



Main Process



↓



Hardware

```



\---



\# Offline Architecture



The Electron POS implements a local-first strategy.



```

Sale



↓



Offline Queue



↓



Local Storage



↓



Synchronization



↓



Supabase

```



Sales continue regardless of temporary network availability.



Synchronization occurs after connectivity returns.



\---



\# Hardware Architecture



Native devices are isolated behind Electron.



Supported integrations include:



\- Thermal Printer

\- Cash Drawer

\- Barcode Scanner



The UI never communicates directly with hardware.



All requests pass through secure IPC channels.



\---



\# Security Boundaries



TinyTots OS separates trusted and untrusted execution environments.



Renderer Process



\- User Interface

\- Business Interaction



Main Process



\- Native Access

\- File System

\- Printer

\- Operating System



Supabase



\- Authentication

\- Database

\- Storage



This separation reduces the attack surface of the desktop application.



\---



\# Scalability Strategy



The architecture supports future expansion through modular boundaries.



Potential future additions include:



\- Multi-store operations

\- Warehouse management

\- Supplier portal

\- Mobile applications

\- Customer loyalty platform

\- Analytics services

\- AI-assisted inventory forecasting



These systems can integrate with the existing backend without requiring major architectural changes.



\---



\# Architectural Constraints



The following principles should not be violated during future development.



\- Business logic must not be embedded in UI components.

\- Hardware access must remain isolated within Electron.

\- Supabase remains the authoritative data source.

\- State ownership should remain localized.

\- Services should encapsulate operational workflows.

\- Presentation layers must remain independent of one another.

\- Database integrity must be preserved through controlled access patterns.



\---



\# Architecture Summary



TinyTots OS adopts a modular, layered, service-oriented architecture that separates presentation, business logic, infrastructure, and data management.



This design enables:



\- independent application development

\- shared operational data

\- native desktop capabilities

\- modern web commerce

\- offline resilience

\- maintainable code organization

\- scalable future growth



The architecture is intentionally designed to support long-term evolution without requiring large-scale rewrites of core business functionality.



\---



\# Related Documents



\- Application Shell.md

\- UI Architecture.md

\- Component Architecture.md

\- State Management.md

\- Service Layer.md

\- Database Architecture.md

\- IPC Architecture.md

\- Offline Architecture.md

\- Hardware Integration.md

\- Security Architecture.md



\---



\# Revision History



| Version | Date | Author | Notes |

|----------|------------|----------------------|-----------------------------------------------|

| 1.0 | 2026-08-07 | Documentation Team | Initial system architecture specification based on verified repository analysis. |

