# Existing Architecture

**Document ID:** 02-01  
**Folder:** 02 - Current System  
**Status:** Draft (Pending Repository Verification)  
**Version:** 1.0

---

# Purpose

This document describes the architecture of the current Electron POS implementation prior to the TinyTots OS redesign.

It serves as the architectural baseline against which the redesign will be planned, implemented, and validated.

Unlike the documents contained in later sections of this repository, this document reflects the **existing production implementation**, not the future architecture defined by the redesign specification.

---

# Scope

This document should describe the current implementation of the Electron POS, including:

- Overall application architecture
- Technology stack
- Project structure
- UI architecture
- Navigation model
- State management
- Data flow
- Local storage
- Backend integration
- Printing architecture
- Offline architecture
- Authentication
- IPC communication
- External services
- Build pipeline

Only verified implementation details belong in this document.

---

# Architecture Overview

> **TODO**
>
> This section requires verification against the current Electron POS repository.
>
> The redesign document specifies the target architecture but does not document the existing implementation.

---

# Application Structure

> **TODO**
>
> Describe the current application layers after repository analysis.

Example topics:

- Electron Main Process
- Electron Renderer
- React application
- Shared modules
- Assets
- Services
- Utilities

---

# Technology Stack

> **TODO**
>
> Verify directly from the repository.

Document:

- Electron version
- React version
- Node.js version
- Build tooling
- Package manager
- CSS framework
- State management solution
- Database client
- Printing libraries

---

# Architectural Layers

> **TODO**

Document the current architecture, including:

- Presentation Layer
- Business Logic
- Services
- Data Layer
- Infrastructure Layer

---

# Navigation Architecture

> **TODO**

Describe how users currently navigate between modules.

Include:

- Navigation pattern
- Routing
- Screen organization
- Entry points

---

# State Management

> **TODO**

Document:

- Global state
- Local component state
- Shared stores
- Context providers
- IPC state synchronization

---

# Data Flow

> **TODO**

Describe how data moves through the application.

Typical areas to verify include:

- User actions
- Business logic
- Database communication
- IPC events
- UI updates

---

# External Integrations

> **TODO**

Verify current integrations, for example:

- Supabase
- Receipt Printer
- Barcode Scanner
- Cash Drawer
- File System
- Internet Connectivity

---

# Offline Architecture

> **TODO**

Document the current offline implementation.

Include:

- Local cache
- Queueing
- Synchronization
- Conflict handling

---

# Printing Architecture

> **TODO**

Document:

- Receipt generation
- Print pipeline
- Printer communication
- Error handling

---

# Security

> **TODO**

Describe current implementation of:

- Authentication
- Authorization
- Session handling
- Secure IPC
- Environment variables

---

# Known Architectural Constraints

> **TODO**

List architectural limitations discovered during repository analysis.

---

# Relationship to the Redesign

The redesign documented throughout this repository defines the target architecture for TinyTots OS 2.0.

This document intentionally captures the current implementation so that:

- existing constraints are understood,
- migration planning is evidence-based,
- architectural decisions remain traceable,
- regressions can be identified during implementation.

---

# Related Documents

- 02 - Repository Audit.md
- 02 - Technical Debt.md
- 03 - System Architecture.md
- 03 - Application Architecture.md
- 04 - Migration Strategy.md

---

# Verification Status

| Area | Status |
|-------|--------|
| Repository Structure | TODO |
| Electron Architecture | TODO |
| UI Architecture | TODO |
| Navigation | TODO |
| State Management | TODO |
| Data Flow | TODO |
| Printing | TODO |
| Offline Mode | TODO |
| External Services | TODO |
| Security | TODO |

---

# Revision History

| Version | Date | Author | Notes |
|----------|------|--------|-------|
| 1.0 | Initial | Documentation | Initial document created. Awaiting repository verification. |