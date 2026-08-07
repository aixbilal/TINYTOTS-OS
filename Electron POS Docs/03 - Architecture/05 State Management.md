\# State Management



\*\*Document ID:\*\* 03-05  

\*\*Folder:\*\* 03 - Architecture  

\*\*Status:\*\* Living Document  

\*\*Version:\*\* 1.0  

\*\*Last Updated:\*\* 2026-08-07



\---



\# Purpose



This document defines the State Management Architecture of the TinyTots Electron POS application.



It explains how application state is organized, owned, shared, synchronized, and persisted throughout the system.



The objective is to ensure every piece of application data has a clearly defined owner, predictable lifecycle, and controlled access pattern.



\---



\# Scope



This document covers:



\- State architecture

\- State ownership

\- Context Providers

\- Local state

\- Shared state

\- Persistent state

\- State synchronization

\- State lifecycle



Related Documents



\- 03-01 System Architecture.md

\- 03-02 Application Shell.md

\- 03-04 Component Architecture.md

\- Business Logic.md

\- Data Flow.md



\---



\# Overview



TinyTots Electron POS follows a layered state management architecture based primarily on the React Context API combined with custom hooks and service-layer abstractions.



The architecture separates state according to ownership and lifetime rather than by component hierarchy.



This approach minimizes duplication, improves maintainability, and keeps business logic independent of the user interface.



\---



\# State Management Principles



The architecture follows these principles:



\- Single Source of Truth

\- Clear Ownership

\- Minimal Shared State

\- Localize State Whenever Possible

\- Immutable Updates

\- Predictable Data Flow

\- Separation of UI State and Business State

\- Context-based Global State



\---



\# State Categories



Application state is divided into four categories.



```

Application State



├── Local UI State

├── Shared Application State

├── Persistent State

└── Remote State

```



Each category has different ownership and lifecycle rules.



\---



\# Local UI State



Local state exists only within an individual component.



Examples include:



\- Modal visibility

\- Form inputs

\- Active tab

\- Expanded panels

\- Selected rows

\- Temporary filters

\- Loading indicators



Ownership



Single component



Lifetime



Until component unmounts.



Storage



```

useState()



useReducer()

```



\---



\# Shared Application State



Shared state is required by multiple screens or components.



It is managed through React Context Providers.



Examples



\- Current User

\- Shopping Cart

\- Printer Settings

\- Offline Queue

\- Authentication

\- Active Shift



Ownership



Context Provider



\---



\# Persistent State



Persistent state survives application restarts.



Examples



\- Store configuration

\- Printer configuration

\- Theme preferences

\- Offline transactions

\- Cached products



Storage



\- Local Storage

\- IndexedDB



Persistent state is restored during application startup.



\---



\# Remote State



Remote state resides in Supabase.



Examples



\- Products

\- Variants

\- Customers

\- Inventory

\- Sales

\- Reports



Supabase remains the authoritative source for operational business data.



\---



\# State Hierarchy



```

Supabase



↓



Services



↓



Context Providers



↓



React Components



↓



UI Elements

```



Data always flows downward.



\---



\# Context Providers



The repository currently contains the following verified Context Providers.



\---



\## AuthContext



Purpose



Manages application authentication.



Responsibilities



\- Logged-in user

\- Authentication status

\- Staff information

\- Session lifecycle

\- Permissions



Consumers



\- Header

\- Navigation

\- Protected Screens



Ownership



Application-wide



Status



Verified



\---



\## CartContext



Purpose



Maintains the active sale.



Responsibilities



\- Cart Items

\- Quantity

\- Discounts

\- Taxes

\- Totals

\- Selected Customer



Consumers



\- Product Grid

\- Sidebar

\- Checkout

\- Receipt



Ownership



Application-wide



Status



Verified



\---



\## OfflineContext



Purpose



Manages offline operation.



Responsibilities



\- Pending Queue

\- Network Status

\- Synchronization

\- Queue Statistics



Consumers



\- Status Bar

\- Header

\- Checkout



Ownership



Application-wide



Status



Verified



\---



\## SettingsContext



Purpose



Stores application configuration.



Responsibilities



\- Printer Settings

\- Store Information

\- User Preferences



Consumers



\- Settings

\- Receipt Printing

\- Header



Ownership



Application-wide



Status



Verified



\---



\# State Ownership



Every state object must have exactly one owner.



Example



```

Cart Total



Owner



CartContext



Consumers



Sidebar

Checkout

Receipt

```



Consumers should never duplicate ownership.



\---



\# State Flow



```

User Action



↓



Component



↓



Context Action



↓



Service



↓



Supabase



↓



Updated State



↓



UI Re-render

```



This ensures a predictable flow throughout the application.



\---



\# Service Interaction



Contexts coordinate state.



Services perform business operations.



Example



```

Checkout



↓



CartContext



↓



salesService



↓



Supabase



↓



Updated Cart

```



Contexts should not directly communicate with the database.



\---



\# State Synchronization



Application state remains synchronized through controlled updates.



```

Database



↓



Services



↓



Context



↓



Components

```



No component should bypass this flow.



\---



\# Offline State Management



Offline transactions follow a separate lifecycle.



```

Sale



↓



OfflineContext



↓



Offline Queue



↓



Network Restored



↓



Synchronization



↓



Supabase

```



The queue becomes the temporary source of truth while offline.



\---



\# Derived State



Some values are calculated rather than stored.



Examples



\- Cart Total

\- Tax

\- Discount Amount

\- Pending Queue Count

\- Low Stock Indicators



Derived values should not be duplicated in multiple locations.



\---



\# State Persistence



Persistent state should include only information necessary across sessions.



Persisted examples



\- Settings

\- Offline Queue

\- Cached Products

\- Authentication Session (where applicable)



Transient UI state should never be persisted.



\---



\# Component Access



Components should obtain shared state through Context Providers.



Correct



```

Component



↓



Context



↓



Service

```



Avoid



```

Component



↓



Supabase

```



Direct database access from UI components is discouraged because it breaks architectural separation.



\---



\# State Lifecycle



```

Initialize



↓



Read



↓



Modify



↓



Synchronize



↓



Persist



↓



Dispose

```



Each stage should occur through well-defined interfaces.



\---



\# Error Handling



State updates should account for failures.



Examples



\- Network interruption

\- Authentication failure

\- Database errors

\- Printer unavailable



Failures should preserve application stability and avoid inconsistent state.



\---



\# Performance Considerations



To reduce unnecessary rendering:



\- Split unrelated contexts.

\- Keep context values minimal.

\- Memoize expensive calculations.

\- Avoid deeply nested providers where possible.

\- Use local state instead of global state when appropriate.



\---



\# Future Evolution



Potential improvements include:



\- Dedicated cache layer

\- Optimistic UI updates

\- Real-time subscriptions

\- Background synchronization improvements

\- Undo/Redo support

\- State inspection tools

\- Event sourcing for transaction history



These enhancements should preserve the existing ownership model.



\---



\# Architectural Constraints



Future development should follow these rules:



\- Every state has one owner.

\- Business state belongs in Contexts.

\- Business operations belong in Services.

\- UI components remain presentation-focused.

\- Persistent state should be intentionally limited.

\- Remote state remains owned by Supabase.

\- State changes should be predictable and traceable.



\---



\# Architecture Summary



The TinyTots Electron POS state management architecture separates application data into local, shared, persistent, and remote domains.



React Context Providers coordinate application-wide state, while services encapsulate business operations and Supabase remains the authoritative source for persistent business data.



This architecture provides predictable data flow, clear ownership boundaries, offline resilience, and a maintainable foundation for future development.



\---



\# Related Documents



\- 03-01 System Architecture.md

\- 03-02 Application Shell.md

\- 03-03 UI Architecture.md

\- 03-04 Component Architecture.md

\- 03-06 Navigation.md

\- Business Logic.md

\- Data Flow.md



\---



\# Revision History



| Version | Date | Author | Notes |

|----------|------------|----------------------|------------------------------------------------|

| 1.0 | 2026-08-07 | Documentation Team | Initial State Management architecture specification based on verified repository analysis. |

