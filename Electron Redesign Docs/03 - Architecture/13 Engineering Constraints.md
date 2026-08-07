\# Engineering Constraints



\*\*Document ID:\*\* 03-13  

\*\*Folder:\*\* 03 - Architecture  

\*\*Status:\*\* Living Document  

\*\*Version:\*\* 1.0  

\*\*Last Updated:\*\* 2026-08-07



\---



\# Purpose



This document defines the engineering constraints that govern the development of TinyTots OS.



Unlike architectural principles, which describe desired design philosophy, engineering constraints define mandatory rules that all contributors, AI assistants, and future developers must follow.



These constraints exist to preserve architectural integrity, prevent technical debt, and ensure long-term maintainability.



Failure to follow these constraints should be considered an architectural violation.



\---



\# Scope



This document defines mandatory constraints for:



\- Repository organization

\- Architecture

\- UI development

\- Business logic

\- State management

\- Database

\- Electron

\- Security

\- Performance

\- Documentation

\- Future development



Related Documents



\- 03-01 System Architecture.md

\- 03-08 Folder Structure.md

\- 03-10 Business Logic Architecture.md

\- 03-11 IPC Architecture.md

\- 03-12 Architectural Principles.md

\- 15 - Decisions (ADR)/



\---



\# Constraint Levels



Engineering constraints are classified into three levels.



| Level | Meaning |

|----------|------------------------------|

| Critical | Must never be violated |

| Required | Should always be followed |

| Recommended | Preferred engineering practice |



Critical constraints override every other engineering decision.



\---



\# Repository Constraints



\## EC-001 — Repository Structure



\*\*Level:\*\* Critical



The repository structure must remain modular.



Applications must remain separated.



```

TINYTOTS-OS/



├── tinytots-app/

└── tinytots-web/

```



Applications should never be merged into a single codebase.



\---



\## EC-002 — Single Responsibility



\*\*Level:\*\* Critical



Every folder must have one responsibility.



Examples



```

components/



contexts/



hooks/



services/



utils/



types/

```



Folders must not mix unrelated concerns.



\---



\## EC-003 — No Circular Dependencies



\*\*Level:\*\* Critical



Dependencies must never form cycles.



Correct



```

UI



↓



Context



↓



Services



↓



Database

```



Incorrect



```

Service



↓



Component



↓



Service

```



\---



\# UI Constraints



\## EC-004 — UI Contains No Business Logic



\*\*Level:\*\* Critical



React components must never:



\- Execute SQL

\- Perform inventory calculations

\- Calculate receipts

\- Modify stock

\- Handle synchronization

\- Implement business rules



Components are responsible only for presentation.



\---



\## EC-005 — Stateless Components



\*\*Level:\*\* Required



Whenever practical, UI components should remain stateless.



Complex logic belongs in:



\- Contexts

\- Hooks

\- Services



\---



\## EC-006 — Reusable Components



\*\*Level:\*\* Required



Duplicate UI components are prohibited.



Shared components should be reused across screens.



\---



\# State Management Constraints



\## EC-007 — Shared State



\*\*Level:\*\* Critical



Shared application state must be managed centrally.



Verified mechanisms include:



\- AuthContext

\- CartContext

\- OfflineContext

\- SettingsContext



State duplication is not permitted.



\---



\## EC-008 — Local State



\*\*Level:\*\* Required



Component state should remain local unless multiple modules require access.



\---



\# Business Logic Constraints



\## EC-009 — Service Ownership



\*\*Level:\*\* Critical



Business logic belongs only in:



\- Services

\- Database functions



Business logic must never be duplicated.



\---



\## EC-010 — One Owner Per Rule



\*\*Level:\*\* Critical



Every business rule must have exactly one owner.



Examples



| Business Rule | Owner |

|---------------|----------------|

| Sale Processing | salesService |

| Product Loading | productService |

| Inventory Update | PostgreSQL Trigger |

| Offline Queue | offlineService |



No competing implementations are permitted.



\---



\# Database Constraints



\## EC-011 — Database Authority



\*\*Level:\*\* Critical



Supabase PostgreSQL is the single source of truth.



Applications may cache data temporarily but must never permanently replace the database as the authoritative source.



\---



\## EC-012 — Schema Changes



\*\*Level:\*\* Critical



Database modifications must occur exclusively through version-controlled SQL migrations.



Direct production schema changes are prohibited.



\---



\## EC-013 — Referential Integrity



\*\*Level:\*\* Critical



Relationships must be protected through:



\- Foreign keys

\- Constraints

\- Database validation



Client-side validation alone is insufficient.



\---



\# Electron Constraints



\## EC-014 — Native Access



\*\*Level:\*\* Critical



Renderer processes must never access native APIs directly.



All native communication must pass through:



```

Renderer



↓



Preload



↓



IPC



↓



Main Process

```



\---



\## EC-015 — IPC



\*\*Level:\*\* Critical



Every IPC channel must have:



\- Defined purpose

\- Typed payload

\- Error handling

\- Validation



Arbitrary IPC communication is prohibited.



\---



\## EC-016 — Hardware Ownership



\*\*Level:\*\* Critical



Native hardware access belongs exclusively to the Electron Main Process.



Examples



\- Printer

\- Cash Drawer

\- USB Devices

\- File System



\---



\# Security Constraints



\## EC-017 — Least Privilege



\*\*Level:\*\* Critical



Applications should receive only the permissions required to perform their responsibilities.



Unnecessary access increases security risk.



\---



\## EC-018 — Sensitive Data



\*\*Level:\*\* Critical



The following data must never be exposed unnecessarily:



\- Service role credentials

\- Authentication tokens

\- Database secrets

\- Internal configuration



Sensitive information should remain confined to trusted environments.



\---



\# Offline Constraints



\## EC-019 — Offline Safety



\*\*Level:\*\* Critical



The POS application must continue operating during network interruptions.



Offline capability is mandatory for:



\- Product browsing

\- Cart management

\- Sales processing

\- Queue persistence



\---



\## EC-020 — Synchronization



\*\*Level:\*\* Required



Queued transactions must synchronize safely after connectivity returns.



Synchronization must avoid duplicate transaction creation.



\---



\# Performance Constraints



\## EC-021 — Database Queries



\*\*Level:\*\* Required



Repeated database queries should be minimized through caching where appropriate.



Performance optimizations must not compromise correctness.



\---



\## EC-022 — Rendering



\*\*Level:\*\* Required



React components should avoid unnecessary re-renders.



Performance-sensitive components should use memoization only when justified.



\---



\## EC-023 — Bundle Size



\*\*Level:\*\* Recommended



Large dependencies should be introduced only when they provide significant architectural value.



\---



\# Documentation Constraints



\## EC-024 — Documentation First



\*\*Level:\*\* Required



Significant architectural changes must be documented before or alongside implementation.



\---



\## EC-025 — ADR Requirement



\*\*Level:\*\* Required



Major architectural decisions should be recorded in an Architecture Decision Record (ADR).



Examples



\- Technology replacement

\- Navigation redesign

\- State management changes

\- Database redesign



\---



\## EC-026 — Documentation Accuracy



\*\*Level:\*\* Critical



Documentation must accurately reflect the implemented system.



Unknown or pending work should be marked as \*\*TODO\*\* rather than documented as completed.



\---



\# Testing Constraints



\## EC-027 — Production Changes



\*\*Level:\*\* Required



Critical functionality should be verified before release.



Examples



\- Checkout

\- Receipt printing

\- Authentication

\- Offline synchronization

\- Inventory updates



\---



\# Future Development Constraints



\## EC-028 — Backward Compatibility



\*\*Level:\*\* Recommended



Architectural evolution should minimize unnecessary breaking changes.



\---



\## EC-029 — Incremental Refactoring



\*\*Level:\*\* Required



Large refactors should be delivered incrementally whenever possible.



\---



\## EC-030 — Architecture Preservation



\*\*Level:\*\* Critical



Future development must preserve:



\- Modularity

\- Separation of concerns

\- Service ownership

\- Layered architecture

\- Secure IPC

\- Database integrity



Architectural shortcuts that compromise these principles are prohibited.



\---



\# Change Management



Before implementing a significant architectural change, contributors should evaluate:



\- Does this preserve the existing architecture?

\- Does it introduce unnecessary coupling?

\- Can an existing service or component be reused?

\- Does the change require an ADR?

\- Does documentation need updating?

\- Will existing functionality remain stable?



Only after these questions are addressed should implementation proceed.



\---



\# Compliance Checklist



Every pull request or major feature should satisfy the following checklist.



\- Repository structure preserved

\- No duplicated business logic

\- UI remains presentation-focused

\- Services own business rules

\- Database integrity maintained

\- IPC follows security model

\- Documentation updated

\- ADR created if required



\---



\# Architecture Summary



The engineering constraints defined in this document establish the mandatory rules that preserve the integrity of the TinyTots OS architecture.



By enforcing clear ownership boundaries, secure communication patterns, centralized business logic, controlled database evolution, and disciplined repository organization, these constraints provide a stable foundation for long-term development while minimizing technical debt and architectural drift.



\---



\# Related Documents



\- 03-01 System Architecture.md

\- 03-08 Folder Structure.md

\- 03-10 Business Logic Architecture.md

\- 03-11 IPC Architecture.md

\- 03-12 Architectural Principles.md

\- 15 - Decisions (ADR)/



\---



\# Revision History



| Version | Date | Author | Notes |

|----------|------------|----------------------|------------------------------------------------|

| 1.0 | 2026-08-07 | Documentation Team | Initial Engineering Constraints specification defining mandatory architectural and engineering rules for TinyTots OS. |

