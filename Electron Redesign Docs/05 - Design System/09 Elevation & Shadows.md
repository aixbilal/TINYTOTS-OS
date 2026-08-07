# 05-09 Elevation & Shadows

---

## Document Information

| Field | Value |
|--------|-------|
| **Document ID** | TTOS-EPS-05-09 |
| **Folder** | 05 - Design System |
| **Status** | Draft |
| **Version** | 1.0.0 |
| **Last Updated** | 2026-08-07 |
| **Owner** | TinyTots OS Engineering |
| **Depends On** | 05-03 Colors.md, 05-05 Spacing.md, 05-07 Radius.md, 05-08 Borders.md |
| **Next Document** | 05-10 Opacity.md |

---

# Purpose

This document defines the elevation and shadow system for the TinyTots Electron POS Design System.

Elevation communicates the visual hierarchy of interface elements by creating depth through shadows rather than excessive borders or decorative effects. A consistent elevation system helps users understand layering, interaction, and focus while maintaining a clean, professional desktop interface.

Shadow values are implementation details and are defined in **05-18 Design Tokens.md**.

---

# Scope

This document defines:

- Elevation philosophy
- Elevation hierarchy
- Shadow behavior
- Layer relationships
- Component elevation standards
- Accessibility considerations
- Implementation rules

This document does **not** define:

- CSS box-shadow values
- Blur radii
- Shadow colors
- Tailwind utilities
- Design token values

---

# Design Philosophy

Elevation represents interface hierarchy.

Shadows should indicate **which elements exist above others**, not decorate the interface.

The TinyTots POS should appear calm and structured.

Large dramatic shadows reduce professionalism and distract operators during prolonged usage.

The interface should feel layered—but never theatrical.

---

# Design Objectives

The elevation system should:

- Communicate hierarchy
- Improve usability
- Support interaction feedback
- Differentiate floating elements
- Maintain visual consistency
- Reduce interface clutter
- Improve accessibility

---

# Elevation Architecture

```
Application Window
        │
        ▼
Base Surface
        │
        ▼
Raised Components
        │
        ▼
Floating Components
        │
        ▼
Modal Surfaces
        │
        ▼
System Overlays
```

Each level represents an increase in visual prominence.

---

# Elevation Hierarchy

```
Level 0
│
├── Application Background
│
Level 1
│
├── Cards
├── Panels
├── Widgets
│
Level 2
│
├── Dropdowns
├── Menus
├── Popovers
│
Level 3
│
├── Dialogs
├── Drawers
├── Command Palette
│
Level 4
│
├── Full-screen Overlays
├── Critical System Dialogs
└── Blocking Operations
```

Components should never skip hierarchy levels without justification.

---

# Layering Principles

The interface should establish clear visual depth.

Users should immediately recognize:

- Primary workspace
- Floating components
- Active dialogs
- Temporary overlays

Visual layering should reduce cognitive effort.

---

# Base Layer

The base layer consists of the application's permanent structure.

Examples include:

- Background
- Sidebar
- Header
- Status Bar
- Primary Content Area

These elements typically do not require visible shadows.

---

# Raised Components

Raised components separate information from the background.

Examples:

- Cards
- Dashboard Widgets
- Analytics Panels
- Summary Tiles

Raised components should appear subtly elevated while remaining integrated with the page.

---

# Floating Components

Floating components temporarily appear above surrounding content.

Examples:

- Dropdown Menus
- Context Menus
- Date Pickers
- Tooltips
- Popovers

Floating elements require greater elevation than standard cards.

---

# Modal Layer

Modal components interrupt the current workflow.

Examples:

- Checkout Dialog
- Customer Editor
- Confirmation Dialog
- Product Creation
- Settings Window

Dialogs should be visually distinct from the underlying interface.

---

# Overlay Layer

The highest elevation level is reserved for blocking operations.

Examples include:

- Critical Warnings
- Authentication Dialogs
- Loading Overlays
- Fatal Error Messages

Only one overlay should occupy the highest layer at a time.

---

# Shadow Philosophy

Shadows should be:

- Soft
- Consistent
- Natural
- Minimal
- Predictable

The goal is depth—not decoration.

---

# Shadow Hierarchy

As elevation increases:

- Shadow size increases
- Shadow softness increases
- Shadow visibility increases

However:

- Shadows should remain subtle.
- Opacity should remain controlled.
- Visual consistency must be maintained.

---

# Component Elevation

## Cards

Cards should have low elevation.

They should appear separated from the background without dominating the layout.

---

## Dashboard Widgets

Widgets should share identical elevation.

Different shadow depths between dashboard widgets create unnecessary visual inconsistency.

---

## Buttons

Buttons generally should not rely on shadows to communicate interaction.

Feedback should primarily come from:

- Color
- Border
- Motion
- State changes

Shadows may be used sparingly for elevated button variants.

---

## Dropdowns

Dropdown menus should clearly float above surrounding content.

Users should immediately recognize them as temporary interface layers.

---

## Dialogs

Dialogs require stronger elevation than all standard components.

Dialogs should remain the user's visual focus until dismissed.

---

## Tooltips

Tooltips require subtle elevation.

Their shadow should separate them from surrounding content without becoming visually distracting.

---

## Notifications

Toast notifications should appear above the application content.

Their elevation should communicate temporary importance while avoiding interference with active workflows.

---

# Elevation and Motion

Elevation should work together with motion.

Examples:

```
Hover

↓

Slight Elevation Increase

↓

Return on Exit
```

Animations should reinforce physical hierarchy.

Large elevation jumps should be avoided.

---

# Elevation During Interaction

Interactive components may slightly increase elevation during:

- Hover
- Drag
- Active manipulation

The transition should remain smooth and predictable.

---

# Relationship with Borders

Borders and shadows should complement each other.

Examples:

- Low elevation → subtle border
- Medium elevation → lighter border + shadow
- High elevation → stronger shadow with restrained border

Neither should overpower the interface.

---

# Relationship with Radius

Shadow geometry should follow component radius.

Rounded components require rounded shadows.

Radius and shadow should always appear visually connected.

---

# Accessibility

Elevation should never be the only indicator of hierarchy.

Layering should also use:

- Position
- Contrast
- Labels
- Focus indicators
- Motion

Users with reduced visual perception should still understand interface structure.

---

# Performance Considerations

Shadows affect rendering performance.

The application should:

- Limit simultaneous heavy shadows
- Reuse predefined elevation levels
- Avoid animated blur changes
- Prefer hardware-accelerated transitions

Performance should never be sacrificed for decorative effects.

---

# Implementation Rules

Developers should follow these principles.

1. Never create custom shadows.
2. Use predefined elevation tokens.
3. Reuse approved elevation levels.
4. Maintain consistent hierarchy.
5. Animate elevation sparingly.
6. Preserve accessibility.
7. Optimize for rendering performance.

---

# Anti-Patterns

Avoid:

- Large dramatic shadows
- Multiple shadow styles
- Decorative glow effects
- Colored shadows
- Random elevation levels
- Heavy shadows on dense tables
- Floating elements without elevation
- Excessive shadow animation

---

# Design Review Checklist

Every elevated component should satisfy the following.

| Question | Requirement |
|-----------|-------------|
| Uses predefined elevation token | ✓ |
| Matches component hierarchy | ✓ |
| Shadow follows radius | ✓ |
| Supports accessibility | ✓ |
| Shadow is subtle | ✓ |
| Does not impact performance | ✓ |

---

# Success Indicators

The elevation system is considered successful when:

- Users immediately understand interface layering.
- Floating elements are visually distinguishable.
- Dialogs consistently become the visual focus.
- Shadows remain subtle and professional.
- Components share consistent elevation behavior.
- New components integrate without introducing additional shadow styles.

---

# Related Documents

- 05-03 Colors.md
- 05-05 Spacing.md
- 05-07 Radius.md
- 05-08 Borders.md
- 05-10 Opacity.md
- 05-17 Component States.md
- 05-18 Design Tokens.md
- 06 - Application Shell/
- 08 - Components/

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-08-07 | Initial elevation and shadow specification for the TinyTots Electron POS Design System. |

---