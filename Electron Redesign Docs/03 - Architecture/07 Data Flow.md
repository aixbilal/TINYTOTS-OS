\# Data Flow



\*\*Document ID:\*\* 03-07  

\*\*Folder:\*\* 03 - Architecture  

\*\*Status:\*\* Living Document  

\*\*Version:\*\* 1.0  

\*\*Last Updated:\*\* 2026-08-07



\---



\# Purpose



This document defines the data flow architecture of the TinyTots Electron POS system.



It explains how information moves between the user interface, React components, contexts, services, Electron processes, Supabase, local storage, and hardware integrations.



A predictable data flow is essential for maintaining application consistency, ensuring offline resilience, simplifying debugging, and supporting future scalability.



\---



\# Scope



This document covers:



\- End-to-end application data flow

\- UI-to-database communication

\- Context interaction

\- Service layer responsibilities

\- Offline synchronization

\- Electron IPC communication

\- Database updates

\- Data ownership



Related Documents



\- 03-01 System Architecture.md

\- 03-04 Component Architecture.md

\- 03-05 State Management.md

\- Business Logic.md

\- IPC Overview.md



\---



\# Data Flow Principles



TinyTots Electron POS follows these architectural principles:



\- Single Source of Truth

\- Unidirectional Data Flow

\- Separation of Concerns

\- Context-based State Distribution

\- Service-based Business Logic

\- Database as System of Record

\- Offline-First Resilience



\---



\# High-Level Data Flow



```

User



↓



React Component



↓



Context Provider



↓



Business Service



↓



Supabase / Local Storage



↓



Updated State



↓



React Re-render



↓



User Interface

```



Every user interaction follows this general lifecycle.



\---



\# Architectural Layers



```

Presentation Layer



↓



Application State



↓



Business Logic



↓



Infrastructure Layer



↓



Database / Hardware

```



\---



\# Layer Responsibilities



\## Presentation Layer



Responsible for:



\- Rendering UI

\- Capturing user input

\- Displaying application state

\- Triggering actions



Contains:



\- Screens

\- Components

\- Dialogs

\- Forms



No database logic belongs here.



\---



\## State Layer



Responsible for:



\- Shared application state

\- State synchronization

\- UI consistency



Verified Context Providers



\- AuthContext

\- CartContext

\- OfflineContext

\- SettingsContext



\---



\## Business Layer



Responsible for:



\- Validation

\- Business rules

\- Calculations

\- Database operations

\- Hardware coordination



Verified Services



\- salesService

\- productService

\- customerService

\- offlineService



\---



\## Infrastructure Layer



Responsible for:



\- Supabase

\- Electron IPC

\- Local Storage

\- IndexedDB

\- Printer Driver

\- Operating System APIs



\---



\# Product Loading Flow



```

Application Starts



↓



Product Service



↓



Supabase Query



↓



Product Cache



↓



Product Context



↓



Product Grid



↓



User

```



If offline:



```

Application



↓



Offline Cache



↓



Product Grid

```



\---



\# Customer Search Flow



```

Customer Search



↓



Customer Search Component



↓



customerService



↓



Supabase



↓



Customer List



↓



Selection



↓



CartContext

```



\---



\# Cart Flow



```

Product Selected



↓



CartContext



↓



Cart Updated



↓



Sidebar



↓



Checkout



↓



Receipt

```



Cart calculations occur centrally within the CartContext rather than individual components.



\---



\# Checkout Flow



```

Checkout



↓



Checkout Modal



↓



Validation



↓



salesService



↓



Supabase



↓



Receipt



↓



Clear Cart

```



When offline:



```

Checkout



↓



salesService



↓



offlineService



↓



Offline Queue



↓



Pending Sync

```



\---



\# Receipt Printing Flow



Verified repository architecture



```

Checkout Complete



↓



Receipt Modal



↓



Electron IPC



↓



printer.ts



↓



ESC/POS Formatter



↓



Thermal Printer

```



Printing occurs independently from the sales transaction after successful checkout processing.



\---



\# Inventory Synchronization



Inventory synchronization occurs through the database.



```

Sale



↓



sale\_items



↓



PostgreSQL Trigger



↓



deduct\_stock()



↓



variants.stock



↓



Updated Inventory

```



The inventory deduction logic resides within Supabase rather than the Electron application.



\---



\# Offline Queue Flow



```

Sale



↓



Network Failure



↓



offlineService



↓



Local Queue



↓



Network Restored



↓



OfflineContext



↓



Replay Queue



↓



Supabase



↓



Queue Cleared

```



This architecture allows continued operation during connectivity loss.



\---



\# Authentication Flow



```

Login



↓



AuthContext



↓



Supabase Authentication



↓



Staff Information



↓



Application Shell



↓



Dashboard

```



Protected screens consume authentication state through the AuthContext.



\---



\# Settings Flow



```

Settings Screen



↓



SettingsContext



↓



Persistent Storage



↓



Application Components

```



Settings remain available across application restarts.



\---



\# Data Ownership



Every data entity has a single owner.



| Data | Owner |

|--------|-------|

| Authentication | AuthContext |

| Cart | CartContext |

| Offline Queue | OfflineContext |

| Settings | SettingsContext |

| Products | Supabase |

| Customers | Supabase |

| Sales | Supabase |



No entity should have multiple authoritative owners.



\---



\# Service Communication



Business services communicate with infrastructure components.



Example



```

salesService



↓



Supabase Client



↓



Database

```



or



```

salesService



↓



offlineService



↓



IndexedDB

```



\---



\# UI Update Cycle



```

Database Updated



↓



Service Response



↓



Context Updated



↓



Component Re-render



↓



User Interface Updated

```



This maintains synchronization between business data and presentation.



\---



\# Error Flow



```

Error



↓



Service



↓



Context



↓



Notification



↓



User Feedback

```



Errors should be handled centrally and presented consistently.



\---



\# Synchronization Model



```

Supabase



↓



Services



↓



Contexts



↓



Components



↓



User

```



No component should directly manipulate persistent business data.



\---



\# Hardware Communication Flow



Electron-specific hardware communication follows this path:



```

React



↓



Electron IPC



↓



Main Process



↓



Hardware Driver



↓



Device

```



Examples



\- Thermal Printer

\- Cash Drawer

\- Barcode Scanner



\---



\# Data Persistence



Data persistence is divided into three categories.



\## Remote



\- Products

\- Customers

\- Sales

\- Inventory



Owner



Supabase



\---



\## Local



\- Printer Settings

\- Cached Products

\- Offline Queue

\- Preferences



Owner



Electron Application



\---



\## Temporary



\- Search

\- Filters

\- Modal State

\- Loading State



Owner



React Components



\---



\# Performance Considerations



The architecture minimizes unnecessary data movement through:



\- Context separation

\- Cached product data

\- Offline queue replay

\- Derived state calculations

\- Controlled component rendering



\---



\# Future Enhancements



Potential improvements include:



\- Realtime subscriptions

\- Event-driven synchronization

\- Background synchronization workers

\- Optimistic UI updates

\- Distributed caching

\- Multi-device synchronization

\- Audit event streams



These enhancements should preserve the existing unidirectional data flow.



\---



\# Architectural Constraints



Future development should preserve the following principles:



\- Data flows downward.

\- Components do not own business data.

\- Services perform business operations.

\- Contexts distribute shared state.

\- Supabase remains the system of record.

\- Hardware access occurs only through Electron IPC.

\- Offline operations must never bypass the synchronization layer.



\---



\# Architecture Summary



The TinyTots Electron POS data flow architecture establishes a predictable and maintainable path for every piece of information within the application.



User interactions originate in the presentation layer, pass through shared state and business services, interact with infrastructure components, and finally update the authoritative data source before propagating changes back through the application.



This architecture provides consistency, offline resilience, scalability, and a clear separation of responsibilities across the entire system.



\---



\# Related Documents



\- 03-01 System Architecture.md

\- 03-04 Component Architecture.md

\- 03-05 State Management.md

\- 03-08 Folder Structure.md

\- Business Logic.md

\- IPC Overview.md



\---



\# Revision History



| Version | Date | Author | Notes |

|----------|------------|----------------------|------------------------------------------------|

| 1.0 | 2026-08-07 | Documentation Team | Initial Data Flow architecture specification based on verified repository analysis and engineering audit. |

