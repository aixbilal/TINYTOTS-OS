# IPC Overview

**Document ID:** 02-11  
**Folder:** 02 - Current System  
**Status:** Verified (Version 1)  
**Version:** 1.0  
**Last Updated:** 2026-08-06

---

# Purpose

This document describes the Inter-Process Communication (IPC) architecture used by the Electron POS application.

Electron separates execution into multiple processes. IPC provides the secure communication mechanism between the renderer process and the native Electron main process.

---

# Scope

Application:

```
tinytots-app/electron-app
```

---

# IPC Architecture

```
React Renderer

↓

Context Bridge

↓

Electron IPC

↓

Main Process

↓

Native Operating System

↓

Hardware
```

Renderer processes never communicate directly with hardware.

---

# Process Responsibilities

## Renderer Process

Responsibilities

- User Interface
- React Components
- Context Providers
- User Interaction
- Business Logic

Cannot directly access:

- USB
- File System
- Native APIs

---

## Main Process

Responsibilities

- Window Management
- Printer Access
- Native Hardware
- System Integration
- IPC Handlers

Verified File

```
electron/main.ts
```

---

## Preload Process

Purpose

Expose a secure API from the main process to the renderer using Electron's Context Bridge.

Verified File

```
electron/preload.ts
```

Responsibilities

- Register safe APIs
- Hide native Electron modules
- Prevent unrestricted Node.js access

---

# IPC Communication Flow

```
React Component

↓

window.electron

↓

Context Bridge

↓

ipcRenderer

↓

ipcMain

↓

Native Function

↓

Result

↓

Renderer
```

---

# Verified IPC Channels

## PRINTER_PRINT

Direction

Renderer → Main

Purpose

Print a formatted thermal receipt.

Implementation

```
electron/printer.ts
```

Typical Flow

```
Checkout

↓

ReceiptModal

↓

PRINTER_PRINT

↓

printer.ts

↓

Thermal Printer
```

Status

Verified

---

## PRINTER_GET_LIST

Direction

Renderer → Main

Purpose

Retrieve connected thermal printers.

Typical Usage

```
Settings

↓

PRINTER_GET_LIST

↓

Printer Enumeration

↓

Renderer
```

Status

Verified

---

## CASH_DRAWER_OPEN

Direction

Renderer → Main

Purpose

Send the ESC/POS pulse command to open the connected cash drawer.

Typical Flow

```
Checkout Complete

↓

CASH_DRAWER_OPEN

↓

Printer Driver

↓

Cash Drawer
```

Status

Verified

---

# Security Model

Electron IPC follows a restricted communication model.

Renderer

✔ May call approved IPC methods.

Renderer

✖ Cannot directly access:

- File System
- USB
- Operating System APIs
- Native Modules

All privileged operations are handled by the main process.

Status: Verified

---

# Hardware Communication

```
React

↓

Electron IPC

↓

printer.ts

↓

USB / Serial

↓

Thermal Printer
```

Hardware communication remains isolated from UI logic.

---

# Printer Workflow

```
Receipt Data

↓

ESC/POS Formatter

↓

PRINTER_PRINT

↓

printer.ts

↓

Printer

↓

Printed Receipt
```

---

# Cash Drawer Workflow

```
Sale Complete

↓

Renderer

↓

CASH_DRAWER_OPEN

↓

Printer Driver

↓

ESC/POS Pulse

↓

Cash Drawer Opens
```

---

# Printer Discovery Workflow

```
Settings

↓

PRINTER_GET_LIST

↓

Native Enumeration

↓

Available Devices

↓

User Selection
```

---

# IPC Design Principles

The current implementation demonstrates the following architectural principles:

- Separation of UI and native logic
- Secure Context Bridge
- Hardware abstraction
- Centralized IPC handlers
- Renderer isolation
- Native capability encapsulation

---

# Future IPC Expansion

Potential future IPC channels may include:

- File export
- Backup and restore
- Automatic updates
- Native notifications
- System diagnostics
- Local database management

**Status:** TODO (Not Verified)

---

# Summary

Electron IPC forms the secure boundary between the React application and native operating system capabilities.

All hardware operations—including receipt printing, printer discovery, and cash drawer control—are routed through verified IPC channels exposed by the preload layer and handled within the Electron main process.

This architecture minimizes security risks while maintaining a clean separation between presentation logic and native functionality.

---

# Related Documents

- Existing Architecture.md
- Technology Stack.md
- Business Logic.md
- Data Flow.md
- Architecture/Application Shell.md
- Architecture/System Architecture.md

---

# Revision History

| Version | Date | Author | Notes |
|----------|------|--------|-------|
| 1.0 | 2026-08-06 | Documentation Team | Initial IPC architecture documentation based on verified repository analysis. |