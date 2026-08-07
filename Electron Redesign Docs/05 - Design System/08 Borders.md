# 05-08 Borders

---

## Document Information

| Field | Value |
|--------|-------|
| **Document ID** | TTOS-EPS-05-08 |
| **Folder** | 05 - Design System |
| **Status** | Draft |
| **Version** | 1.0.0 |
| **Last Updated** | 2026-08-07 |
| **Owner** | TinyTots OS Engineering |
| **Depends On** | 05-03 Colors.md, 05-05 Spacing.md, 05-07 Radius.md |
| **Next Document** | 05-09 Elevation & Shadows.md |

---

# Purpose

This document defines the border system for the TinyTots Electron POS Design System.

Borders are structural elements that provide separation, emphasis, and interaction feedback. Their purpose is to organize the interface—not decorate it.

A consistent border system improves readability, reinforces layout hierarchy, and creates predictable component behavior across the application.

Exact border widths, colors, and token values are defined in **05-18 Design Tokens.md**.

---

# Scope

This document defines:

- Border philosophy
- Border hierarchy
- Border usage
- Component border standards
- Interactive border behavior
- Accessibility considerations
- Implementation rules

This document does **not** define:

- Border color values
- CSS properties
- Tailwind classes
- Implementation tokens

---

# Design Philosophy

Borders should quietly support the interface.

Users should notice the organization they create—not the borders themselves.

Borders exist to:

- Separate
- Define
- Group
- Focus
- Communicate state

Decorative borders should be avoided.

---

# Design Objectives

The border system should:

- Improve visual organization
- Create consistent separation
- Reinforce hierarchy
- Support accessibility
- Clearly communicate interaction states
- Reduce layout ambiguity
- Enable reusable components

---

# Border Architecture

```
Border System
        │
        ├── Structural Borders
        ├── Component Borders
        ├── Interactive Borders
        ├── Divider Borders
        ├── Status Borders
        └── Focus Borders
```

Each border type has a specific responsibility.

---

# Border Hierarchy

```
Invisible

↓

Subtle Divider

↓

Standard Component

↓

Interactive Control

↓

Focused Element

↓

Critical Status
```

The visual strength of borders should increase only as interaction importance increases.

---

# Border Categories

| Category | Purpose |
|-----------|----------|
| Structural | Define layout regions |
| Component | Outline reusable components |
| Divider | Separate related content |
| Interactive | Identify controls |
| Focus | Keyboard accessibility |
| Status | Communicate warnings or errors |

---

# Structural Borders

Structural borders organize major interface sections.

Examples include:

- Sidebar
- Header
- Status Bar
- Panels
- Split Views
- Docked Areas

Structural borders should remain subtle and should not compete with content.

---

# Component Borders

Reusable UI components should use consistent borders.

Examples:

- Cards
- Forms
- Tables
- Dropdowns
- Popovers
- Dialogs

Every instance of the same component should use identical border treatment.

---

# Divider Borders

Dividers separate related content.

Typical use cases:

- Menu Groups
- Form Sections
- Card Footers
- Sidebar Categories
- Table Sections

Dividers should indicate separation without creating unnecessary visual weight.

---

# Input Borders

Every form control should clearly indicate its boundaries.

Examples:

- Text Fields
- Search Fields
- Password Inputs
- Number Inputs
- Date Pickers
- Select Controls

Input borders should remain consistent throughout the application.

---

# Button Borders

Button borders depend on the component variant.

Examples:

- Primary
- Secondary
- Outline
- Ghost
- Danger

Each button style should have standardized border behavior across every screen.

---

# Table Borders

Tables require structured borders to improve readability.

Borders should define:

- Header
- Rows
- Columns (when necessary)
- Footer
- Selection Areas

Dense data should remain easy to scan.

---

# Card Borders

Cards should use subtle borders to define content containers.

Card borders should:

- Improve separation
- Maintain consistency
- Complement shadows
- Avoid excessive visual weight

Cards should never rely on thick borders for emphasis.

---

# Dialog Borders

Dialogs are elevated surfaces.

Their borders should reinforce:

- Window boundaries
- Content grouping
- Layer separation

Borders should work together with elevation rather than replace it.

---

# Interactive Border States

Interactive controls require consistent border behavior.

Required states include:

```
Default

↓

Hover

↓

Focus

↓

Active

↓

Disabled

↓

Error
```

State changes should remain predictable across all controls.

---

# Focus Borders

Focus indicators are essential for keyboard accessibility.

Every focusable element should display a clear, visible focus state.

Examples:

- Buttons
- Inputs
- Dropdowns
- Navigation Items
- Table Rows
- Checkboxes

Focus borders should always take precedence over decorative styling.

---

# Error Borders

Error borders communicate validation failures.

Examples:

- Invalid Input
- Required Field
- Connection Failure
- Synchronization Error

Error borders should be accompanied by supporting text or icons.

Color alone must not communicate meaning.

---

# Warning Borders

Warning borders indicate attention is required.

Examples:

- Unsaved Changes
- Low Stock
- Pending Actions
- Synchronization Delays

Warnings should remain visually distinct from errors.

---

# Success Borders

Success borders indicate successful completion.

Examples:

- Saved
- Synced
- Printed
- Uploaded
- Connected

Success borders should reinforce positive feedback without dominating the interface.

---

# Border Hierarchy in Layout

```
Application

│
├── Sidebar Border
│
├── Header Border
│
├── Card Border
│
├── Input Border
│
└── Divider Border
```

Each level should contribute to the overall structure.

---

# Relationship with Color

Borders should derive their appearance from the semantic color system.

Border styling should remain consistent with:

- Surface colors
- Interactive colors
- Status colors
- Focus indicators

Hardcoded colors should never be used.

---

# Relationship with Radius

Borders must follow the radius system.

The border should exactly match the component's corner radius.

Radius inconsistencies should never occur.

---

# Relationship with Shadows

Borders and shadows should complement each other.

Examples:

- Low elevation → subtle border
- High elevation → lighter border with stronger shadow

Avoid using heavy borders and heavy shadows simultaneously.

---

# Accessibility

Borders contribute directly to accessibility.

Borders should:

- Clearly define controls
- Improve focus visibility
- Distinguish adjacent elements
- Support keyboard navigation
- Maintain sufficient contrast

---

# Implementation Rules

Developers should follow these rules.

1. Never hardcode border colors.
2. Never hardcode border widths.
3. Use Design Tokens.
4. Reuse component styles.
5. Maintain semantic border behavior.
6. Preserve accessibility.
7. Keep interaction states consistent.

---

# Anti-Patterns

Avoid:

- Thick decorative borders
- Random border colors
- Mixed border widths
- Missing focus borders
- Double borders
- Inconsistent component borders
- Border-only status communication
- Screen-specific border styles

---

# Design Review Checklist

Every component should satisfy the following.

| Question | Requirement |
|-----------|-------------|
| Uses shared border tokens | ✓ |
| Matches component family | ✓ |
| Supports interaction states | ✓ |
| Supports accessibility | ✓ |
| Matches radius system | ✓ |
| Does not use hardcoded values | ✓ |

---

# Success Indicators

The border system is considered successful when:

- Layouts remain visually organized.
- Components share consistent outlines.
- Focus states are immediately recognizable.
- Status borders communicate meaning clearly.
- Future components integrate without introducing new border styles.
- Developers rely entirely on shared border tokens.

---

# Related Documents

- 05-03 Colors.md
- 05-05 Spacing.md
- 05-07 Radius.md
- 05-09 Elevation & Shadows.md
- 05-17 Component States.md
- 05-18 Design Tokens.md
- 08 - Components/

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-08-07 | Initial border specification for the TinyTots Electron POS Design System. |

---