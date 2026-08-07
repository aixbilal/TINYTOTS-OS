\# Technology Stack



\*\*Document ID:\*\* 03-09  

\*\*Folder:\*\* 03 - Architecture  

\*\*Status:\*\* Living Document  

\*\*Version:\*\* 1.0  

\*\*Last Updated:\*\* 2026-08-07



\---



\# Purpose



This document defines the technology stack used throughout the TinyTots OS platform, covering both the Electron POS application and the Next.js web application.



It explains why each technology exists, where it is used, and its architectural responsibility. The goal is to provide a single technical reference for developers, architects, AI assistants, and future maintainers.



\---



\# Scope



This document covers:



\- Frontend technologies

\- Backend technologies

\- Desktop technologies

\- Database technologies

\- Infrastructure

\- Offline technologies

\- Development tools

\- Build systems

\- Hardware integrations



Related Documents



\- 03-01 System Architecture.md

\- 03-05 State Management.md

\- 03-08 Folder Structure.md

\- Repository Audit.md



\---



\# Technology Stack Overview



TinyTots OS is composed of three primary layers.



```

Desktop Application

(Electron + React)



&#x20;       │



Website

(Next.js)



&#x20;       │



Shared Backend

(Supabase)

```



Each layer is independently deployable while sharing a common data platform.



\---



\# System Stack



| Layer | Primary Technology |

|---------|--------------------|

| Desktop POS | Electron |

| Desktop UI | React |

| Web Platform | Next.js App Router |

| Language | TypeScript |

| Styling | Tailwind CSS |

| Backend | Supabase |

| Database | PostgreSQL |

| Authentication | Supabase Auth |

| Storage | Supabase Storage |

| Realtime | Supabase Realtime |

| Desktop Build | Electron Builder |

| Package Manager | npm |

| Version Control | Git + GitHub |



\---



\# Desktop Application Stack



\## Electron



Purpose



Provides the native desktop runtime.



Responsibilities



\- Native window management

\- IPC

\- Hardware access

\- Printer communication

\- Auto updates

\- Operating system integration



Verified Repository



```

tinytots-app/electron-app/electron/

```



\---



\## React



Purpose



Builds the desktop user interface.



Responsibilities



\- Screens

\- Components

\- Rendering

\- State consumption

\- User interactions



Verified Repository



```

src/

```



\---



\## Vite



Purpose



Development server and production bundler for the Electron renderer.



Responsibilities



\- Fast builds

\- Hot Module Reloading

\- Production bundling



Verified Configuration



```

vite.config.ts

```



\---



\## Electron Builder



Purpose



Application packaging and distribution.



Responsibilities



\- Windows installer generation

\- Build configuration

\- Application packaging



Verified Configuration



```

electron.builder.json

```



\---



\# Web Application Stack



\## Next.js



Purpose



Framework for the public website and administration portal.



Responsibilities



\- Server Components

\- Client Components

\- Routing

\- API Routes

\- Static Generation

\- Incremental Static Regeneration



Verified Repository



```

tinytots-web/web/

```



\---



\## React



Purpose



Interactive user interface for the website.



Responsibilities



\- Interactive components

\- Product pages

\- Shopping cart

\- Checkout

\- Client-side interactions



\---



\## App Router



Purpose



File-based routing architecture.



Verified Examples



```

app/



products/



collections/



checkout/



blog/



api/

```



\---



\# Backend Stack



\## Supabase



Purpose



Primary Backend-as-a-Service platform.



Responsibilities



\- PostgreSQL

\- Authentication

\- Realtime

\- Storage

\- Row-Level Security

\- Database Functions

\- SQL Migrations



Supabase serves as the system of record for operational business data.



\---



\## PostgreSQL



Purpose



Primary relational database.



Stores



\- Products

\- Variants

\- Customers

\- Sales

\- Inventory

\- Reports



Verified Database Logic



\- Database triggers

\- Stored procedures

\- Constraints

\- Foreign keys



\---



\## Supabase Storage



Purpose



Stores application assets.



Verified Usage



\- Product Images

\- Public Media



\---



\## Supabase Authentication



Purpose



Identity management.



Responsibilities



\- Staff authentication

\- User sessions

\- Authorization



Implementation details should remain centralized within the authentication layer.



\---



\# Styling Stack



\## Tailwind CSS



Purpose



Utility-first styling framework.



Responsibilities



\- Responsive layouts

\- Design consistency

\- Utility classes



Verified Configuration



```

tailwind.config.ts

```



\---



\# Language Stack



\## TypeScript



Purpose



Primary programming language.



Benefits



\- Static typing

\- Safer refactoring

\- Improved maintainability

\- Better tooling



Used throughout both applications.



\---



\# State Management Stack



Verified Architecture



\- React Context API

\- Custom Hooks

\- Service Layer



Verified Contexts



\- AuthContext

\- CartContext

\- OfflineContext

\- SettingsContext



\---



\# Offline Technologies



Verified Components



\- IndexedDB / Local Storage

\- Offline Queue

\- Background Synchronization

\- Product Cache



Desktop POS continues operating without internet connectivity and synchronizes transactions when connectivity returns.



\---



\# Hardware Integration



Electron provides native hardware communication.



Verified Hardware



\- Thermal Receipt Printer

\- Cash Drawer

\- USB Barcode Scanner



Communication occurs through Electron IPC.



\---



\# Printing Stack



Verified Components



\- Electron Main Process

\- IPC

\- ESC/POS Formatter

\- Printer Driver



Flow



```

React



↓



IPC



↓



printer.ts



↓



ESC/POS Commands



↓



Thermal Printer

```



\---



\# Database Technology



Verified Features



\- PostgreSQL

\- SQL Functions

\- Triggers

\- Indexes

\- Constraints

\- Row-Level Security

\- Storage Buckets



Business-critical inventory synchronization occurs within the database through SQL triggers.



\---



\# Development Tooling



Verified Tools



| Tool | Purpose |

|--------|----------|

| Git | Version Control |

| GitHub | Repository Hosting |

| npm | Package Management |

| Vite | Build System |

| TypeScript | Type Safety |

| Electron Builder | Desktop Packaging |



\---



\# Repository Structure



```

TINYTOTS-OS/



├── tinytots-app/

│   └── electron-app/



└── tinytots-web/

&#x20;   └── web/

```



Both applications communicate with the same Supabase backend.



\---



\# Architectural Principles



Technology selection follows these principles.



\- Type safety

\- Cross-platform compatibility

\- Offline resilience

\- Modular architecture

\- Shared backend

\- Scalable infrastructure

\- Maintainable codebase

\- Minimal duplication



\---



\# Future Technology Considerations



Potential future additions include:



\- Storybook

\- Playwright

\- Vitest

\- Docker

\- GitHub Actions

\- Sentry

\- Redis (if required)

\- Edge Functions

\- Analytics Platform



These technologies are not considered part of the current verified stack unless implemented.



\---



\# Technology Summary



The TinyTots OS platform combines Electron, React, Next.js, TypeScript, and Supabase into a unified omnichannel architecture.



The desktop POS and web platform remain independent applications while sharing a common PostgreSQL database, authentication system, storage layer, and business logic. This architecture provides offline capability for retail operations, scalable web delivery, and a single source of truth for inventory, products, customers, and sales.



\---



\# Related Documents



\- 03-01 System Architecture.md

\- 03-05 State Management.md

\- 03-07 Data Flow.md

\- 03-08 Folder Structure.md

\- Repository Audit.md



\---



\# Revision History



| Version | Date | Author | Notes |

|----------|------------|----------------------|------------------------------------------------|

| 1.0 | 2026-08-07 | Documentation Team | Initial Technology Stack specification based on the verified TinyTots OS repository audit. |

