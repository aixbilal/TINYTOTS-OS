# 05-11 Icons

---

## Document Information

| Field | Value |
|--------|-------|
| **Document ID** | TTOS-EPS-05-11 |
| **Folder** | 05 - Design System |
| **Status** | Draft |
| **Version** | 1.0.0 |
| **Last Updated** | 2026-08-07 |
| **Owner** | TinyTots OS Engineering |
| **Depends On** | 05-02 Design Principles.md, 05-03 Colors.md, 05-04 Typography.md |
| **Next Document** | 05-12 Illustrations.md |

---

# Purpose

This document defines the iconography system for the TinyTots Electron POS Design System.

Icons are functional interface elements that help users recognize actions, identify information, and navigate the application more efficiently. Their primary purpose is to improve comprehension—not to decorate the interface.

A standardized icon system ensures consistency across every module, reduces cognitive load, and simplifies future development.

---

# Scope

This document defines:

- Icon philosophy
- Icon categories
- Icon usage rules
- Icon hierarchy
- Navigation icons
- Action icons
- Status icons
- Accessibility requirements
- Implementation guidelines

This document does **not** define:

- Icon library implementation
- SVG files
- Asset storage
- Icon token values

---

# Design Philosophy

Icons should support recognition before reading.

An operator should be able to glance at the interface and immediately recognize common actions through familiar iconography.

Icons should always reinforce text—not replace it.

The Electron POS should favor simple, modern, geometric icons that remain readable at small sizes.

---

# Design Objectives

The icon system should:

- Improve navigation
- Reduce reading effort
- Improve workflow speed
- Standardize interface language
- Support accessibility
- Scale across future modules
- Simplify implementation

---

# Icon Architecture

```
Icon System
      │
      ├── Navigation
      ├── Actions
      ├── Status
      ├── Objects
      ├── Notifications
      ├── System
      └── Brand
```

Every icon belongs to one clearly defined category.

---

# Icon Principles

The icon system follows these principles.

## Recognition

Icons should represent concepts users already understand.

Examples:

- Search
- Print
- Save
- Delete
- Edit

Avoid abstract or ambiguous symbols.

---

## Consistency

Icons should share:

- Style
- Stroke weight
- Corner treatment
- Optical size
- Alignment

Icons from different visual styles must never be mixed.

---

## Simplicity

Icons should remain visually simple.

Avoid:

- unnecessary details
- decorative fills
- excessive shapes
- gradients
- shadows

The icon should communicate its meaning within milliseconds.

---

## Predictability

The same action must always use the same icon.

Examples:

```
Save

↓

Same Icon

↓

Every Screen
```

Changing icon meaning between screens is prohibited.

---

# Icon Categories

The system defines six primary categories.

| Category | Purpose |
|-----------|----------|
| Navigation | Move between modules |
| Actions | Perform operations |
| Status | Show system state |
| Objects | Represent business entities |
| Notifications | Alerts and messages |
| System | Hardware and application controls |

---

# Navigation Icons

Navigation icons identify application modules.

Examples:

- Dashboard
- POS
- Products
- Inventory
- Customers
- Orders
- Reports
- Analytics
- Settings

Navigation icons should remain recognizable at small sizes.

---

# Action Icons

Action icons represent user operations.

Examples include:

- Add
- Edit
- Delete
- Save
- Cancel
- Search
- Refresh
- Filter
- Sort
- Upload
- Download
- Print
- Share
- Copy

Actions should remain visually consistent throughout the application.

---

# Status Icons

Status icons communicate application state.

Examples:

- Success
- Warning
- Error
- Information
- Offline
- Online
- Synchronizing
- Pending

Status icons should always accompany semantic colors and descriptive text.

Icons alone must not communicate critical information.

---

# Object Icons

Object icons represent business entities.

Examples:

- Product
- Customer
- Employee
- Receipt
- Invoice
- Category
- Warehouse
- Supplier
- Report

Object icons improve recognition within navigation and data tables.

---

# Notification Icons

Notification icons communicate events.

Examples:

- Reminder
- Alert
- Promotion
- Update
- Security
- Message

Notifications should prioritize clarity over visual complexity.

---

# System Icons

System icons represent application-level functionality.

Examples:

- Settings
- Window Controls
- Theme
- Keyboard
- Scanner
- Printer
- Cash Drawer
- Network
- Database
- Backup

System icons should remain consistent across every module.

---

# Icon Hierarchy

Icons should visually reflect their importance.

```
Primary Action

↓

Navigation

↓

Content

↓

Supporting Information

↓

Decorative (Avoid)
```

Icons should never compete with important text.

---

# Icon Placement

Icons should maintain consistent positioning.

Examples:

Buttons

```
[Icon] Label
```

Navigation

```
[Icon] Module Name
```

Inputs

```
[Icon] Search...
```

Tables

```
Row Icon → Content
```

Placement should remain predictable.

---

# Icon Sizing

Icons should scale proportionally.

The system should define standardized size categories.

Examples:

- Small
- Medium
- Large

Developers should never introduce arbitrary icon sizes.

---

# Filled vs Outline Icons

The TinyTots Electron POS should adopt one primary icon style.

The recommended standard is:

- Outline icons for general UI
- Filled icons only for selected or emphasized states

Mixing both styles without purpose creates inconsistency.

---

# Interactive Icons

Interactive icons should support the following states:

- Default
- Hover
- Focus
- Active
- Selected
- Disabled

State transitions should remain subtle and consistent.

---

# Icons in Buttons

Icons inside buttons should:

- Align with button text
- Maintain equal spacing
- Preserve readability
- Never exceed button hierarchy

Icons should support the action—not dominate it.

---

# Icons in Tables

Tables may include icons for:

- Row status
- Product type
- Inventory state
- Customer type
- Actions

Icons should reduce scanning time while maintaining readability.

---

# Icons in Forms

Forms may use icons to improve usability.

Examples:

- Search
- Calendar
- Password Visibility
- Validation
- Upload

Icons should never replace descriptive labels.

---

# Accessibility

Every meaningful icon should include an accessible label.

Interactive icons must support:

- Keyboard navigation
- Focus visibility
- Screen readers

Decorative icons should be hidden from assistive technologies.

---

# Performance Considerations

The application should:

- Prefer vector icons
- Avoid raster assets
- Reuse shared icon components
- Minimize duplicate assets

Icons should render consistently across all supported platforms.

---

# Implementation Rules

Developers should follow these rules.

1. Use a single approved icon library.
2. Never mix icon styles.
3. Reuse shared icon components.
4. Do not create custom icons unless approved.
5. Maintain semantic meaning.
6. Support accessibility.
7. Use standardized icon sizes.

---

# Anti-Patterns

Avoid:

- Mixed icon libraries
- Decorative icons
- Random icon sizes
- Filled and outline versions of identical icons on one screen
- Icons without labels for important actions
- Color-only icon communication
- Stretched or distorted icons
- Low-resolution bitmap icons

---

# Design Review Checklist

Every icon implementation should satisfy the following.

| Question | Requirement |
|-----------|-------------|
| Uses approved icon library | ✓ |
| Matches icon style | ✓ |
| Uses standard size | ✓ |
| Has semantic meaning | ✓ |
| Supports accessibility | ✓ |
| Consistent with other modules | ✓ |

---

# Future Considerations

The icon system should support future expansion without changing existing meanings.

Potential future additions include:

- AI Assistant
- Loyalty Program
- Gift Cards
- Digital Signage
- Warehouse Management
- Multi-store Operations
- Customer Support
- Audit Logs

These modules should reuse existing icon principles.

---

# Success Indicators

The icon system is considered successful when:

- Operators recognize common actions instantly.
- Navigation is visually intuitive.
- Every module uses consistent iconography.
- Accessibility requirements are met.
- Developers reuse shared icon components.
- New features integrate without introducing new icon styles.

---

# Related Documents

- 05-02 Design Principles.md
- 05-03 Colors.md
- 05-04 Typography.md
- 05-12 Illustrations.md
- 05-17 Component States.md
- 05-18 Design Tokens.md
- 06 - Application Shell/
- 08 - Components/

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-08-07 | Initial iconography specification for the TinyTots Electron POS Design System. |

---