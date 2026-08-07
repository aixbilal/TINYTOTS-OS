\# Folder Structure



\*\*Document ID:\*\* 03-08  

\*\*Folder:\*\* 03 - Architecture  

\*\*Status:\*\* Living Document  

\*\*Version:\*\* 1.0  

\*\*Last Updated:\*\* 2026-08-07



\---



\# Purpose



This document defines the architectural folder structure of the TinyTots OS repository and explains how source code, shared assets, documentation, configuration, and infrastructure are organized.



The objective is to establish a scalable, maintainable, and predictable project organization that supports long-term development across both the Electron POS application and the Next.js web platform.



This document serves as the authoritative reference for repository organization.



\---



\# Scope



This document covers:



\- Repository organization

\- Project separation

\- Folder responsibilities

\- Architectural boundaries

\- Naming conventions

\- Ownership rules

\- Future scalability



Related Documents



\- 03-01 System Architecture.md

\- 03-04 Component Architecture.md

\- 10 - Development/Folder Structure.md

\- Repository Audit.md



\---



\# Repository Overview



TinyTots OS is organized as a monorepository containing two primary applications that share a common backend infrastructure.



```

TINYTOTS-OS/



├── tinytots-app/

│

└── tinytots-web/

```



Both applications are independent deployment targets while sharing a unified Supabase backend.



\---



\# Repository Layout



```

TINYTOTS-OS/



├── tinytots-app/

│   └── electron-app/

│

└── tinytots-web/

&#x20;   └── web/

```



Repository Responsibilities



| Folder | Responsibility |

|---------|----------------|

| tinytots-app | Desktop POS Application |

| tinytots-web | Website, Admin \& Backend |

| Supabase | Shared Database |

| Documentation | Engineering Knowledge Base |



\---



\# High-Level Architecture



```

TINYTOTS-OS



│



├──────────────┐



│              │



▼              ▼



Electron POS   Website



│              │



└──────┬───────┘



&#x20;      ▼



&#x20;Supabase Backend

```



This separation allows independent development while maintaining a single source of business data.



\---



\# Desktop Application Structure



Repository



```

tinytots-app/



└── electron-app/

```



Primary Responsibilities



\- Electron application

\- POS interface

\- Offline functionality

\- Receipt printing

\- Hardware integration

\- Local caching



\---



\## Electron Application Layout



```

electron-app/



├── electron/

├── src/

├── public/

├── package.json

├── tsconfig.json

├── vite.config.ts

└── electron.builder.json

```



\---



\# Electron Folder Responsibilities



\## electron/



Contains Electron-specific code.



Responsibilities



\- Main Process

\- IPC

\- Window Lifecycle

\- Printer Drivers

\- Auto Updates

\- Native APIs



Verified Files



\- main.ts

\- preload.ts

\- printer.ts

\- updater.ts



\---



\## src/



Contains the React application.



Responsibilities



\- UI

\- Screens

\- Components

\- Hooks

\- Contexts

\- Services

\- Utilities



\---



\# React Source Structure



```

src/



├── components/

├── contexts/

├── hooks/

├── services/

├── types/

├── utils/

├── assets/

└── main.tsx

```



\---



\# Component Organization



Verified repository structure



```

components/



├── CheckoutModal

├── CustomerSearchModal

├── DiscountModal

├── Header

├── OfflineIndicator

├── ProductCard

├── ProductGrid

├── ReceiptModal

├── SettingsModal

├── ShiftModal

└── Sidebar

```



Each component encapsulates a distinct UI responsibility.



\---



\# Context Organization



Verified Contexts



```

contexts/



├── AuthContext

├── CartContext

├── OfflineContext

└── SettingsContext

```



Contexts provide shared application state.



\---



\# Hook Organization



Verified Hooks



```

hooks/



├── useBarcodeScanner

├── useCustomers

├── useOfflineQueue

├── useProducts

└── useThermalPrinter

```



Hooks encapsulate reusable application behavior.



\---



\# Service Organization



Verified Services



```

services/



├── customerService

├── offlineService

├── productService

├── salesService

└── supabaseClient

```



Services own business operations and external communication.



\---



\# Utility Organization



Utilities contain reusable helper logic.



Examples



```

utils/



├── currency

├── escposFormatter

└── storage

```



Utilities should remain stateless.



\---



\# Type Definitions



```

types/



├── customer

├── product

└── pos

```



Shared interfaces should reside only in this directory.



\---



\# Web Application Structure



Repository



```

tinytots-web/



└── web/

```



Responsibilities



\- Website

\- Admin

\- APIs

\- PWA

\- Supabase Integration



\---



\# Web Folder Structure



```

web/



├── app/

├── components/

├── lib/

├── public/

├── supabase/

├── package.json

└── next.config.mjs

```



\---



\# App Router Organization



Verified structure



```

app/



├── layout.tsx

├── page.tsx

├── api/

├── products/

├── collections/

├── cart/

├── checkout/

├── blog/

└── sw.ts

```



App Router organizes routing by feature rather than file type.



\---



\# Components Folder



```

components/



├── navbar

├── footer

├── product-card

├── product-gallery

└── blog-card

```



Components remain reusable across multiple pages.



\---



\# Library Folder



```

lib/



├── cache-warmer

├── supabase-admin

├── supabase-anon

├── supabase/

└── utils

```



The library folder contains shared infrastructure code.



\---



\# Supabase Folder



Verified structure



```

supabase/



└── migrations/

```



Responsibilities



\- Database schema

\- SQL migrations

\- RLS Policies

\- Storage Buckets

\- Triggers

\- Functions



Database changes should always be version-controlled through migrations.



\---



\# Separation of Responsibilities



The repository intentionally separates responsibilities.



Electron



\- POS

\- Hardware

\- Offline

\- Printing



Web



\- Storefront

\- Administration

\- APIs

\- PWA



Supabase



\- Data

\- Authentication

\- Storage

\- Business Rules



This separation minimizes coupling.



\---



\# Folder Ownership Rules



Every folder should have a single responsibility.



Examples



| Folder | Responsibility |

|----------|----------------|

| components | UI |

| contexts | Shared State |

| hooks | Reusable Logic |

| services | Business Logic |

| utils | Helper Functions |

| types | Shared Types |

| electron | Native Integration |



Folders should not mix unrelated concerns.



\---



\# Dependency Direction



Dependencies should flow downward.



```

UI



↓



Contexts



↓



Services



↓



Supabase



↓



Database

```



Lower layers must never depend on higher layers.



\---



\# Naming Conventions



Recommended conventions



Folders



```

components/



services/



hooks/



contexts/

```



React Components



```

ProductGrid.tsx



CheckoutModal.tsx

```



Hooks



```

useProducts.ts



useOfflineQueue.ts

```



Services



```

salesService.ts



productService.ts

```



Contexts



```

CartContext.tsx



AuthContext.tsx

```



Utilities



```

currency.ts



storage.ts

```



Consistency should be maintained across the repository.



\---



\# Future Folder Expansion



The architecture supports future additions.



Examples



```

components/



charts/



forms/



navigation/



tables/



dialogs/



shared/

```



```

services/



inventory/



analytics/



notifications/



reports/

```



```

hooks/



useInventory



useReports



useNotifications

```



Expansion should preserve the existing organizational model.



\---



\# Documentation Organization



Engineering documentation is maintained separately.



```

Electron POS Docs/



00



01



02



03



...



16

```



Documentation should never be mixed with application source code.



\---



\# Repository Principles



The repository follows these principles.



\- Separation of Concerns

\- Feature Isolation

\- Modular Organization

\- Consistent Naming

\- Single Responsibility

\- Predictable Structure

\- Scalable Architecture



\---



\# Architectural Constraints



Future development should preserve the following rules.



\- Business logic belongs in services.

\- Shared state belongs in contexts.

\- UI components remain presentation-focused.

\- Electron code remains isolated.

\- Database changes occur only through migrations.

\- Shared types should not be duplicated.

\- Documentation remains independent of source code.



\---



\# Architecture Summary



The TinyTots OS repository follows a modular monorepo architecture that cleanly separates the Electron POS application, the Next.js web platform, and the shared Supabase backend.



Within each application, responsibilities are organized into dedicated folders for components, contexts, services, hooks, utilities, and infrastructure. This organization reduces coupling, improves maintainability, supports parallel development, and provides a scalable foundation for future expansion.



The folder structure serves as an architectural contract, ensuring that every part of the codebase has a clearly defined purpose and ownership.



\---



\# Related Documents



\- 03-01 System Architecture.md

\- 03-04 Component Architecture.md

\- 03-05 State Management.md

\- 10 - Development/Folder Structure.md

\- Repository Audit.md



\---



\# Revision History



| Version | Date | Author | Notes |

|----------|------------|----------------------|------------------------------------------------|

| 1.0 | 2026-08-07 | Documentation Team | Initial Folder Structure specification based on verified repository architecture and engineering audit. |

