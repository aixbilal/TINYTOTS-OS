\# Business Logic Architecture



\*\*Document ID:\*\* 03-10  

\*\*Folder:\*\* 03 - Architecture  

\*\*Status:\*\* Living Document  

\*\*Version:\*\* 1.0  

\*\*Last Updated:\*\* 2026-08-07



\---



\# Purpose



This document defines the Business Logic Architecture of TinyTots OS.



Business logic is the collection of rules, workflows, calculations, validations, and domain operations that determine how the system behaves. It is independent of the user interface and represents the operational intelligence of the application.



The objective of this document is to define where business logic resides, how it is organized, how it interacts with the rest of the architecture, and the principles that govern future development.



\---



\# Scope



This document covers:



\- Business logic architecture

\- Service layer responsibilities

\- Domain ownership

\- Business rules

\- Validation

\- Workflow orchestration

\- Database interaction

\- Architectural constraints



Related Documents



\- 03-01 System Architecture.md

\- 03-04 Component Architecture.md

\- 03-05 State Management.md

\- 03-07 Data Flow.md

\- 09 - Features/



\---



\# Overview



TinyTots OS separates business logic from presentation logic.



Business rules are implemented inside dedicated service modules and the database rather than inside React components.



```

User Interface



↓



Context



↓



Business Services



↓



Supabase



↓



Database

```



This architecture allows business rules to evolve independently from the user interface.



\---



\# Business Logic Principles



The architecture follows several core principles.



\- Single Source of Truth

\- Separation of Concerns

\- Service-Oriented Design

\- Predictable Data Flow

\- Centralized Validation

\- Reusable Business Rules

\- Database Integrity

\- Offline Resilience



\---



\# Architectural Layers



```

Presentation Layer



↓



State Layer



↓



Business Layer



↓



Infrastructure Layer



↓



Database

```



Business logic exists entirely within the Business Layer.



\---



\# Business Domains



The repository currently contains multiple business domains.



Verified domains include:



\- Sales

\- Products

\- Customers

\- Inventory

\- Authentication

\- Settings

\- Offline Synchronization

\- Receipt Printing



Each domain owns its own rules and workflows.



\---



\# Service Layer



Business operations are implemented inside dedicated services.



Verified services include:



```

customerService.ts



offlineService.ts



productService.ts



salesService.ts



supabaseClient.ts

```



Each service encapsulates one domain of business functionality.



\---



\# Sales Domain



Primary Service



```

salesService.ts

```



Responsibilities



\- Sale creation

\- Order validation

\- Cart processing

\- Payment processing

\- Receipt generation

\- Database writes

\- Offline fallback



Sales logic should never be duplicated within UI components.



\---



\# Product Domain



Primary Service



```

productService.ts

```



Responsibilities



\- Product retrieval

\- Variant loading

\- Product caching

\- Inventory availability

\- Catalog synchronization



Products remain owned by Supabase.



\---



\# Customer Domain



Primary Service



```

customerService.ts

```



Responsibilities



\- Customer search

\- Customer creation

\- Customer lookup

\- Customer assignment

\- Loyalty integration (future)



\---



\# Offline Domain



Primary Service



```

offlineService.ts

```



Responsibilities



\- Queue transactions

\- Store offline sales

\- Queue replay

\- Synchronization

\- Conflict handling



The offline service becomes temporarily authoritative while the application operates without connectivity.



\---



\# Authentication Domain



Verified Context



```

AuthContext

```



Responsibilities



\- Staff authentication

\- Session lifecycle

\- User identity

\- Access control

\- Permission management



Authentication logic should remain centralized.



\---



\# Receipt Domain



Verified Components



\- ReceiptModal

\- printer.ts

\- escposFormatter.ts



Responsibilities



\- Receipt formatting

\- Print requests

\- Hardware communication



Receipt generation occurs after successful sale processing.



\---



\# Inventory Domain



Inventory ownership belongs to Supabase.



Verified database implementation



```

sale\_items



↓



Trigger



↓



deduct\_stock()



↓



variants.stock

```



The Electron application does not directly calculate inventory updates.



\---



\# Business Rule Ownership



Each business rule should have exactly one owner.



Examples



| Business Rule | Owner |

|--------------|-------|

| Cart Total | CartContext |

| Sale Processing | salesService |

| Product Retrieval | productService |

| Customer Lookup | customerService |

| Inventory Deduction | PostgreSQL Trigger |

| Offline Queue | offlineService |

| Authentication | AuthContext |



No rule should exist in multiple locations.



\---



\# Validation Strategy



Business validation occurs before data reaches the database.



Examples



\- Required fields

\- Product availability

\- Payment validation

\- Customer validation

\- Printer availability

\- Authentication checks



Database constraints provide the final validation layer.



\---



\# Workflow Example



POS Checkout



```

Cashier



↓



Checkout Modal



↓



CartContext



↓



salesService



↓



Validation



↓



Supabase



↓



Receipt



↓



Cart Cleared

```



\---



\# Offline Workflow



```

Checkout



↓



salesService



↓



offlineService



↓



Local Queue



↓



Reconnect



↓



Synchronization



↓



Supabase

```



Offline processing follows the same business rules as online processing.



\---



\# Database Business Logic



Some business logic intentionally resides within PostgreSQL.



Verified examples



\- Inventory deduction trigger

\- Stock updates

\- Constraints

\- Referential integrity



This ensures consistency regardless of which application writes data.



\---



\# UI Responsibilities



The user interface should only:



\- Display information

\- Collect user input

\- Trigger business operations

\- Render results



The UI should not contain business calculations or persistence logic.



\---



\# Error Handling



Business services should handle expected failures.



Examples



\- Network interruption

\- Product unavailable

\- Invalid customer

\- Printer disconnected

\- Authentication failure

\- Database rejection



Services should return structured results to the presentation layer.



\---



\# Service Communication



Services may communicate with:



\- Supabase

\- Electron IPC

\- Local Storage

\- IndexedDB



Services should not communicate directly with React components.



\---



\# Component Interaction



Correct interaction



```

Component



↓



Context



↓



Service



↓



Database

```



Incorrect interaction



```

Component



↓



Database

```



Business operations should always pass through the service layer.



\---



\# Performance Principles



Business services should:



\- Avoid duplicate queries

\- Cache reusable data

\- Minimize database round-trips

\- Support asynchronous execution

\- Remain stateless where practical



Performance optimizations should not compromise correctness.



\---



\# Future Business Domains



Potential future domains include:



\- Promotions

\- Gift Cards

\- Loyalty Program

\- Supplier Management

\- Purchase Orders

\- Warehouse Transfers

\- Multi-Store Inventory

\- Customer Rewards



Each new domain should follow the same architectural principles.



\---



\# Architectural Constraints



Future development must preserve the following rules.



\- Business rules belong in services or the database.

\- UI components remain presentation-focused.

\- Contexts distribute shared state.

\- Business logic should not be duplicated.

\- Database integrity remains authoritative.

\- Services should be reusable and testable.

\- Every domain has a clearly defined owner.



\---



\# Architecture Summary



TinyTots OS organizes business logic into dedicated service modules that encapsulate operational workflows independently of the user interface.



The service layer coordinates validation, business rules, persistence, offline processing, and hardware interaction while Supabase remains the authoritative system of record. Critical database rules, such as inventory deduction, are implemented through PostgreSQL triggers to ensure consistency across every client.



This separation provides a maintainable, scalable, and testable architecture capable of supporting future growth without coupling business behavior to presentation code.



\---



\# Related Documents



\- 03-01 System Architecture.md

\- 03-04 Component Architecture.md

\- 03-05 State Management.md

\- 03-07 Data Flow.md

\- 09 - Features/

\- Repository Audit.md



\---



\# Revision History



| Version | Date | Author | Notes |

|----------|------------|----------------------|------------------------------------------------|

| 1.0 | 2026-08-07 | Documentation Team | Initial Business Logic Architecture specification based on the verified TinyTots OS repository audit and engineering analysis. |

