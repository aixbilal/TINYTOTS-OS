\# IPC Architecture



\*\*Document ID:\*\* 03-11  

\*\*Folder:\*\* 03 - Architecture  

\*\*Status:\*\* Living Document  

\*\*Version:\*\* 1.0  

\*\*Last Updated:\*\* 2026-08-07



\---



\# Purpose



This document defines the Inter-Process Communication (IPC) architecture used by the TinyTots Electron POS application.



Electron applications operate using two isolated execution environments:



\- Main Process

\- Renderer Process



IPC provides the secure communication bridge between these environments while maintaining Electron's security model.



This document serves as the official specification for all native communication within TinyTots Electron POS.



\---



\# Scope



This document covers:



\- IPC architecture

\- Main Process responsibilities

\- Renderer responsibilities

\- Preload bridge

\- IPC channels

\- Native hardware communication

\- Security model

\- Future IPC standards



Related Documents



\- 03-01 System Architecture.md

\- 03-02 Application Shell.md

\- 03-07 Data Flow.md

\- 03-08 Folder Structure.md

\- Receipt Printing.md



\---



\# Overview



Electron separates application execution into two independent processes.



```

Renderer Process



↓



Preload Script



↓



IPC



↓



Main Process



↓



Native APIs



↓



Operating System

```



React components never communicate directly with operating system resources.



\---



\# Electron Process Model



```

┌──────────────────────────────┐

│ Renderer Process             │

│ React Application            │

└──────────────┬───────────────┘

&#x20;              │

&#x20;              ▼

┌──────────────────────────────┐

│ preload.ts                   │

│ Context Bridge               │

└──────────────┬───────────────┘

&#x20;              │

&#x20;              ▼

┌──────────────────────────────┐

│ Main Process                 │

│ Electron APIs                │

└──────────────┬───────────────┘

&#x20;              │

&#x20;              ▼

┌──────────────────────────────┐

│ Operating System             │

│ Hardware                     │

└──────────────────────────────┘

```



\---



\# Architectural Principles



The IPC architecture follows these principles.



\- Process Isolation

\- Least Privilege

\- Secure Context Bridge

\- Explicit Communication

\- No Node.js Access in Renderer

\- Centralized Native Operations

\- Typed Message Contracts



\---



\# Process Responsibilities



\## Renderer Process



Responsibilities



\- User Interface

\- React Components

\- Context Providers

\- State Management

\- User Interaction



The renderer must never directly access:



\- File System

\- USB Devices

\- Printer Drivers

\- Native APIs

\- Node.js APIs



\---



\## Preload Process



Verified File



```

electron/preload.ts

```



Purpose



Acts as the secure bridge between Renderer and Main.



Responsibilities



\- Expose approved APIs

\- Validate requests

\- Restrict native access

\- Prevent arbitrary IPC



The preload layer is the only interface available to the React application.



\---



\## Main Process



Verified File



```

electron/main.ts

```



Responsibilities



\- Window lifecycle

\- IPC handlers

\- Native APIs

\- Hardware communication

\- Auto updates

\- Application lifecycle



The Main Process owns every operating system interaction.



\---



\# Communication Flow



```

React Component



↓



window.electron



↓



preload.ts



↓



ipcRenderer



↓



ipcMain



↓



Native Service



↓



Response



↓



Renderer

```



All native communication follows this path.



\---



\# Verified IPC Channels



The repository currently contains verified IPC channels for hardware communication.



| Channel | Direction | Purpose |

|----------|-----------|---------|

| PRINTER\_PRINT | Renderer → Main | Print thermal receipt |

| PRINTER\_GET\_LIST | Renderer → Main | Enumerate connected printers |

| CASH\_DRAWER\_OPEN | Renderer → Main | Trigger cash drawer pulse |



Additional channels may be introduced as the application evolves.



\---



\# Receipt Printing Flow



Verified Architecture



```

ReceiptModal



↓



useThermalPrinter



↓



window.electron



↓



IPC



↓



printer.ts



↓



ESC/POS Formatter



↓



Thermal Printer

```



The renderer never communicates directly with the printer.



\---



\# Cash Drawer Flow



```

Checkout Complete



↓



IPC Request



↓



Main Process



↓



Printer Driver



↓



ESC/POS Pulse



↓



Cash Drawer Opens

```



Cash drawer control remains isolated from UI components.



\---



\# Printer Discovery Flow



```

Settings Screen



↓



IPC Request



↓



Main Process



↓



USB Enumeration



↓



Available Devices



↓



Renderer

```



Printer enumeration is performed exclusively by the Main Process.



\---



\# Security Model



Renderer security follows Electron best practices.



The renderer should:



\- Not expose Node.js

\- Not expose file system access

\- Not execute arbitrary IPC

\- Not bypass preload validation



Only explicitly exposed APIs should be accessible through `window.electron`.



\---



\# Context Bridge



The preload script exposes a controlled API surface.



Example



```

window.electron



↓



printReceipt()



↓



getPrinters()



↓



openCashDrawer()

```



The renderer consumes these functions without knowledge of Electron internals.



\---



\# Error Handling



IPC communication should return structured responses.



Example



```

{

&#x20;   success: true,

&#x20;   data: ...

}

```



or



```

{

&#x20;   success: false,

&#x20;   error: ...

}

```



Native exceptions should not propagate directly into the renderer.



\---



\# Timeout Handling



Long-running native operations should support timeout handling.



Examples



\- Printer unavailable

\- USB timeout

\- Device disconnected

\- Driver failure



Future implementations should standardize timeout behavior across all IPC handlers.



Status



TODO



\---



\# Logging



Native operations should be logged by the Main Process.



Recommended logging includes:



\- IPC request

\- Channel

\- Timestamp

\- Duration

\- Success

\- Failure



Sensitive payloads should never be logged.



\---



\# Performance Considerations



IPC communication should remain lightweight.



Guidelines



\- Send minimal payloads

\- Avoid frequent synchronous requests

\- Prefer asynchronous handlers

\- Batch requests where practical

\- Keep serialization overhead low



\---



\# Future IPC Expansion



Future native integrations may include:



\- Barcode scanner management

\- Customer display

\- Local backup

\- File export

\- PDF generation

\- Label printers

\- Multiple receipt printers

\- Biometric authentication



Each feature should expose dedicated IPC channels rather than reusing unrelated ones.



\---



\# Architectural Constraints



Future development must preserve the following rules.



\- Renderer never accesses native APIs directly.

\- All native functionality passes through preload.

\- IPC channels remain explicit.

\- Main Process owns hardware.

\- IPC payloads should be validated.

\- Communication should remain asynchronous.

\- Security takes precedence over convenience.



\---



\# Architecture Summary



The TinyTots Electron POS IPC architecture establishes a secure communication layer between the React renderer and Electron's native runtime.



By routing every operating system interaction through the preload bridge and Main Process, the architecture enforces process isolation, improves maintainability, and protects the application from unintended native access.



This design enables reliable hardware integration while preserving Electron's security model and supporting future expansion of native capabilities.



\---



\# Related Documents



\- 03-01 System Architecture.md

\- 03-07 Data Flow.md

\- 03-08 Folder Structure.md

\- 03-10 Business Logic Architecture.md

\- 09 - Features/Receipt Printing.md

\- 09 - Features/Cash Drawer.md



\---



\# Revision History



| Version | Date | Author | Notes |

|----------|------------|----------------------|------------------------------------------------|

| 1.0 | 2026-08-07 | Documentation Team | Initial IPC Architecture specification based on the verified TinyTots OS repository audit and Electron architecture. |

