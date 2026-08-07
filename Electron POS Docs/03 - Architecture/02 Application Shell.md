\# Application Shell



\*\*Document ID:\*\* 03-02  

\*\*Folder:\*\* 03 - Architecture  

\*\*Status:\*\* Living Document  

\*\*Version:\*\* 1.0  

\*\*Last Updated:\*\* 2026-08-07



\---



\# Purpose



This document defines the architectural design of the TinyTots Electron POS Application Shell.



The Application Shell is the permanent structural framework of the desktop application. It provides the consistent user interface, navigation, state initialization, global services, and layout that remain active regardless of the currently displayed screen.



Unlike individual pages, the shell persists throughout the application's lifetime and orchestrates the interaction between the user interface, business logic, Electron APIs, and shared application state.



\---



\# Scope



This document covers:



\- Application Shell architecture

\- Layout composition

\- Shell responsibilities

\- Global providers

\- Navigation container

\- Persistent UI elements

\- Lifecycle management

\- Shell-state ownership



Related Documents



\- 03-01 System Architecture.md

\- UI Architecture.md

\- Navigation.md

\- State Management.md



\---



\# Application Shell Overview



The Application Shell is the root interface loaded immediately after successful authentication.



It provides the structural layout for every operational screen while maintaining a consistent user experience.



```

Electron Window

&#x20;       │

&#x20;       ▼

Application Shell

&#x20;       │

&#x20;┌──────┼─────────┐

&#x20;│      │         │

Sidebar Header Status Bar

&#x20;│

&#x20;▼

Current Screen

```



The shell remains mounted throughout the user session.



\---



\# Primary Responsibilities



The shell is responsible for:



\- Screen composition

\- Global navigation

\- Global search

\- Notifications

\- Window controls

\- Status indicators

\- Context initialization

\- Theme management

\- Keyboard shortcuts

\- Session persistence



The shell is \*\*not responsible\*\* for business logic such as checkout, inventory calculations, or customer management.



\---



\# Shell Hierarchy



```

Electron Window

&#x20;   │

&#x20;   ▼

React Root

&#x20;   │

&#x20;   ▼

Application Shell

&#x20;   │

&#x20;├── Sidebar

&#x20;├── Header

&#x20;├── Global Search

&#x20;├── Notification Center

&#x20;├── Main Content Area

&#x20;├── Dialog Layer

&#x20;├── Toast Layer

&#x20;└── Status Bar

```



\---



\# Layout Structure



```

┌─────────────────────────────────────────────────────────┐

│ Header                                                  │

├───────────────┬─────────────────────────────────────────┤

│               │                                         │

│               │                                         │

│ Sidebar       │     Active Screen                       │

│               │                                         │

│               │                                         │

├───────────────┴─────────────────────────────────────────┤

│ Status Bar                                              │

└─────────────────────────────────────────────────────────┘

```



This layout should remain consistent across all modules.



\---



\# Persistent Components



The following UI elements belong to the shell and remain active across navigation.



\## Sidebar



Responsibilities



\- Primary navigation

\- Module switching

\- Active page indicator

\- Collapse/expand behavior



Persistent



Yes



\---



\## Header



Responsibilities



\- Store information

\- Current user

\- Search

\- Quick actions

\- Notifications

\- Sync status



Persistent



Yes



\---



\## Main Content Area



Responsibilities



\- Render current screen

\- Route transitions

\- Dynamic layouts



Persistent



Container only



\---



\## Status Bar



Responsibilities



\- Online/Offline state

\- Queue count

\- Sync status

\- Application version

\- Current shift



Persistent



Yes



\---



\## Toast Layer



Responsibilities



\- Success messages

\- Error notifications

\- Warnings

\- Background task updates



Persistent



Yes



\---



\## Dialog Layer



Responsibilities



Render application-wide modal windows.



Examples



\- Checkout

\- Customer Search

\- Printer Settings

\- Shift Closing

\- Confirmations



Persistent



Yes



\---



\# Application Startup



```

Electron Launch



↓



Main Process



↓



Browser Window



↓



Preload



↓



React Root



↓



Context Providers



↓



Application Shell



↓



Dashboard / POS

```



The shell initializes only after required application services are available.



\---



\# Context Initialization



The shell owns initialization of global providers.



Verified contexts include:



\- AuthContext

\- CartContext

\- OfflineContext

\- SettingsContext



Initialization order should ensure dependent contexts are available before child components are rendered.



\---



\# Navigation Ownership



Navigation belongs to the Application Shell.



Responsibilities include:



\- Screen switching

\- Route persistence

\- Active menu state

\- Keyboard navigation

\- Navigation history (future)



Business modules should never control global navigation directly.



\---



\# Global Search



Search is a shell-level capability.



Potential search domains include:



\- Products

\- Customers

\- Orders

\- Inventory

\- Settings



The shell provides a unified search interface while individual modules perform domain-specific queries.



\---



\# Notification Management



The shell centralizes user notifications.



Examples



\- Sale completed

\- Sync successful

\- Printer disconnected

\- Inventory warnings

\- Offline mode

\- System updates



Notifications should remain independent of screen-specific logic.



\---



\# Window Management



The shell coordinates Electron window behavior.



Responsibilities include:



\- Window title

\- Maximize

\- Minimize

\- Restore

\- Close confirmation

\- Fullscreen support (future)



Native window operations remain isolated within Electron.



\---



\# Keyboard Shortcut Integration



The shell acts as the registration point for application-wide shortcuts.



Examples



| Shortcut | Action |

|----------|--------|

| Ctrl + F | Global Search |

| Ctrl + P | Product Search |

| Ctrl + N | New Sale |

| Ctrl + Shift + S | Settings |

| Esc | Close Dialog |



Future shortcuts should be registered centrally rather than within individual screens.



\---



\# Theme Management



The shell controls application appearance.



Responsibilities



\- Light/Dark themes

\- Brand colors

\- Typography

\- Density settings

\- High contrast mode (future)



Individual screens should consume theme tokens rather than defining custom styles.



\---



\# Status Management



The status bar exposes system-wide operational state.



Typical indicators



\- Online

\- Offline

\- Syncing

\- Pending Queue

\- Printer Connected

\- Cash Drawer Ready

\- Logged-in User

\- Active Shift



Status information originates from global providers and services.



\---



\# Screen Rendering



The shell renders only one primary screen at a time.



```

Shell



↓



Navigation



↓



Current Screen



↓



Screen Components

```



Each screen is responsible only for its internal layout and interactions.



\---



\# Error Boundaries



The shell should contain top-level error boundaries to prevent application-wide failures.



Responsibilities



\- Capture rendering errors

\- Display recovery UI

\- Log diagnostic information

\- Preserve application stability



\*\*Status:\*\* TODO (Implementation Verification Required)



\---



\# Performance Considerations



To maintain responsive operation, the shell should:



\- Minimize unnecessary re-renders

\- Keep persistent components lightweight

\- Lazy-load infrequently used modules

\- Isolate expensive operations

\- Cache reusable layout elements



\---



\# Design Principles



The Application Shell follows these principles:



\- Consistency

\- Predictability

\- Separation of concerns

\- Persistent navigation

\- Centralized global services

\- Modular screen rendering

\- Hardware independence

\- Accessibility



\---



\# Future Enhancements



Potential improvements include:



\- Multi-window support

\- Dockable panels

\- Workspace layouts

\- Command palette

\- User-customizable navigation

\- Plugin registration

\- Multi-monitor awareness



These enhancements should extend the shell without altering its core responsibilities.



\---



\# Architecture Summary



The Application Shell provides the permanent structural foundation of the Electron POS application.



It coordinates navigation, global state, persistent interface elements, and application-wide services while remaining independent of business-specific functionality.



By centralizing shared behaviors within the shell, the system achieves a consistent user experience, improved maintainability, and clear architectural boundaries between infrastructure and feature modules.



\---



\# Related Documents



\- 03-01 System Architecture.md

\- UI Architecture.md

\- Component Architecture.md

\- Navigation.md

\- State Management.md

\- Application Shell/Sidebar.md

\- Application Shell/Header.md

\- Application Shell/Status Bar.md



\---



\# Revision History



| Version | Date | Author | Notes |

|----------|------------|--------------------|-----------------------------------------------|

| 1.0 | 2026-08-07 | Documentation Team | Initial Application Shell architecture specification based on verified repository analysis. |

