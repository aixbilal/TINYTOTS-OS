# 05-07 Radius

---

## Document Information

| Field | Value |
|--------|-------|
| **Document ID** | TTOS-EPS-05-07 |
| **Folder** | 05 - Design System |
| **Status** | Draft |
| **Version** | 1.0.0 |
| **Last Updated** | 2026-08-07 |
| **Owner** | TinyTots OS Engineering |
| **Depends On** | 05-01 Introduction.md, 05-05 Spacing.md, 05-06 Grid System.md |
| **Next Document** | 05-08 Borders.md |

---

# Purpose

This document defines the corner radius system for the TinyTots Electron POS Design System.

Corner radius is a foundational visual property that influences the perceived personality, usability, and consistency of the application. A unified radius system ensures that all UI elements appear as parts of the same product rather than independently designed components.

This document defines **when**, **where**, and **how** radius should be applied. Exact radius values are defined in **05-18 Design Tokens.md**.

---

# Scope

This document defines:

- Radius philosophy
- Radius hierarchy
- Component usage
- Radius consistency
- Accessibility considerations
- Implementation rules

This document does **not** define:

- Pixel values
- CSS variables
- Tailwind configuration
- Component implementation

---

# Design Philosophy

The TinyTots Electron POS follows a **modern professional desktop interface**.

Corner radius should communicate:

- approachability
- professionalism
- precision
- consistency

The application should avoid both extreme sharpness and excessive roundness.

The overall visual appearance should feel calm, premium and business-oriented.

---

# Design Objectives

The radius system should:

- Create visual consistency
- Improve component recognition
- Reinforce hierarchy
- Support accessibility
- Improve perceived quality
- Simplify implementation
- Enable reusable components

---

# Radius Architecture

```
Design Tokens
        │
        ▼
Radius Scale
        │
        ├── None
        ├── Small
        ├── Medium
        ├── Large
        └── Full
                │
                ▼
Reusable Components
                │
                ▼
Application Screens
```

Every component should derive its radius from the shared design token system.

---

# Radius Hierarchy

Different UI elements require different visual emphasis.

```
None
│
├── Dividers
├── Tables
└── Layout Containers

Small
│
├── Inputs
├── Buttons
└── Badges

Medium
│
├── Cards
├── Dropdowns
└── Panels

Large
│
├── Dialogs
├── Modals
└── Large Containers

Full
│
├── Avatars
├── Status Indicators
└── Circular Buttons
```

This hierarchy should remain consistent across the application.

---

# Component Guidelines

## Buttons

Buttons should use a consistent radius across all variants.

Examples:

- Primary
- Secondary
- Ghost
- Outline
- Danger

Changing button type must not change its corner radius.

---

## Input Fields

Input controls should share identical corner treatment.

Examples:

- Text Inputs
- Search Bars
- Password Fields
- Number Inputs
- Date Pickers

Input radius should visually communicate that all controls belong to the same interaction family.

---

## Cards

Cards define logical content groups.

They should have a slightly larger radius than controls to distinguish containers from interactive elements.

Examples:

- Product Cards
- Customer Cards
- Dashboard Widgets
- Analytics Cards

---

## Tables

Tables generally maintain square edges to maximize information density.

Exceptions may include:

- Floating tables
- Embedded cards
- Scroll containers

The goal is readability rather than decoration.

---

## Dialogs

Dialogs should use a larger radius than standard cards.

This helps communicate that they are elevated above the primary interface.

Examples:

- Confirmation Dialogs
- Checkout Dialogs
- Customer Creation
- Settings Windows

---

## Navigation

Navigation elements should remain visually consistent.

Sidebar items

Navigation groups

Active indicators

Quick actions

should all follow shared radius tokens.

---

## Dropdowns

Dropdown menus should visually align with:

- Context Menus
- Popovers
- Command Palettes
- Search Results

All floating surfaces should belong to the same visual family.

---

## Badges

Badges should use softer radius values to distinguish status information from buttons.

Examples:

- Low Stock
- Active
- Draft
- Offline
- Synced

---

## Chips and Tags

Small informational chips should maintain consistent curvature.

Examples:

- Categories
- Product Labels
- Search Filters
- Customer Tags

---

# Radius Consistency

Radius should remain predictable.

The same component should never appear with different corner styles on different screens.

Incorrect:

```
Login Button

Rounded

↓

POS Button

Square

↓

Inventory Button

Highly Rounded
```

Correct:

```
Every Primary Button

↓

Same Radius

↓

Every Screen
```

---

# Relationship with Elevation

Corner radius and elevation should complement one another.

Higher elevation typically corresponds with:

- larger surfaces
- larger radius
- stronger shadows

The relationship should feel natural without becoming exaggerated.

---

# Relationship with Motion

Animated transitions should preserve component shape.

Radius should remain stable during:

- Hover
- Focus
- Active
- Loading

Changing radius during interaction should generally be avoided.

---

# Accessibility

Corner radius should never reduce usability.

Controls must retain:

- adequate clickable area
- visible focus outlines
- clear boundaries
- recognizable shape

Visual styling must not interfere with interaction.

---

# Platform Consistency

The radius system should remain consistent across:

- Windows
- macOS
- Linux

Platform differences should not introduce inconsistent corner styles.

---

# Implementation Principles

Developers should follow these rules.

1. Never hardcode radius values.
2. Always use shared design tokens.
3. Reuse existing component styles.
4. Maintain consistency across modules.
5. Avoid arbitrary corner styling.
6. Preserve visual hierarchy.

---

# Anti-Patterns

Avoid:

- Random corner radius values
- Mixing square and rounded controls without purpose
- Different radius values for identical components
- Excessively rounded interfaces
- Decorative corner treatments
- Hardcoded radius values
- Radius changes during animations

---

# Design Review Checklist

Every component should satisfy the following.

| Question | Requirement |
|-----------|-------------|
| Uses shared radius token | ✓ |
| Consistent with similar components | ✓ |
| Supports accessibility | ✓ |
| Matches visual hierarchy | ✓ |
| Does not use hardcoded values | ✓ |
| Fits overall design language | ✓ |

---

# Success Indicators

The radius system is considered successful when:

- Every component feels visually related.
- Screens maintain a consistent appearance.
- Developers reuse existing radius tokens.
- Corner treatments reinforce hierarchy rather than distract from it.
- Future components integrate naturally without introducing new radius values.

---

# Related Documents

- 05-01 Introduction.md
- 05-05 Spacing.md
- 05-06 Grid System.md
- 05-08 Borders.md
- 05-09 Elevation & Shadows.md
- 05-18 Design Tokens.md
- 08 - Components/

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-08-07 | Initial radius specification for the TinyTots Electron POS Design System. |

---