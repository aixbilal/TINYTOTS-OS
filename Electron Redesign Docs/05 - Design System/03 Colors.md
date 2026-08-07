# 05-03 Colors

---

## Document Information

| Field | Value |
|--------|-------|
| **Document ID** | TTOS-EPS-05-03 |
| **Folder** | 05 - Design System |
| **Status** | Draft |
| **Version** | 1.0.0 |
| **Last Updated** | 2026-08-07 |
| **Owner** | TinyTots OS Engineering |
| **Depends On** | 05-01 Introduction.md, 05-02 Design Principles.md |
| **Next Document** | 05-04 Typography.md |

---

# Purpose

This document defines the color strategy for the TinyTots Electron POS Design System.

Rather than specifying only individual colors, it establishes how color should be used throughout the application to communicate hierarchy, interaction, status and feedback.

All production color values must ultimately originate from the Design Tokens document (05-18 Design Tokens.md). This document defines the design intent and usage rules.

---

# Scope

This document defines:

- Color philosophy
- Semantic color system
- Surface colors
- Interactive colors
- Feedback colors
- Status colors
- Accessibility requirements
- Usage guidelines

This document does **not** define:

- Hex values
- CSS variables
- Tailwind configuration
- Implementation tokens

---

# Design Philosophy

Color exists to improve communication—not decoration.

The interface should remain calm, professional and readable throughout long operating sessions.

Color should guide attention toward important information while allowing operators to remain focused on completing retail tasks.

Every color should have a purpose.

---

# Design Objectives

The color system should:

- Improve readability
- Establish clear hierarchy
- Communicate system status
- Provide immediate feedback
- Reduce visual fatigue
- Maintain consistency
- Support accessibility
- Scale across future modules

---

# Color System Architecture

```
Brand Colors
      │
      ├── Primary
      ├── Secondary
      └── Accent
            │
            ▼
Semantic Colors
      │
      ├── Success
      ├── Warning
      ├── Error
      └── Information
            │
            ▼
Surface Colors
      │
      ├── Background
      ├── Containers
      ├── Panels
      └── Cards
            │
            ▼
Interactive States
```

---

# Color Categories

The Design System organizes colors into six categories.

| Category | Purpose |
|----------|----------|
| Brand | Identity |
| Surface | Layout |
| Text | Readability |
| Border | Separation |
| Feedback | User Communication |
| Interactive | Buttons, Links and Controls |

---

# Brand Colors

Brand colors establish the visual identity of TinyTots.

They should be used sparingly to highlight primary interactions rather than dominate the interface.

Typical usage includes:

- Primary actions
- Active navigation
- Important highlights
- Key interface accents

Brand colors should never reduce readability.

---

# Surface Colors

Surface colors define the application's visual structure.

Surface hierarchy should clearly distinguish:

- Application background
- Sidebar
- Header
- Panels
- Cards
- Dialogs
- Dropdowns
- Tables

Adjacent surfaces should remain visually distinct without excessive contrast.

---

# Text Colors

Text color should prioritize readability above all else.

Text hierarchy should include:

| Level | Purpose |
|--------|----------|
| Primary | Main content |
| Secondary | Supporting information |
| Tertiary | Metadata |
| Disabled | Inactive content |

Body text should always maintain sufficient contrast against its background.

---

# Border Colors

Borders separate interface regions without creating unnecessary visual weight.

Borders should be used for:

- Input fields
- Cards
- Tables
- Dialogs
- Dividers
- Containers

Borders should reinforce layout rather than dominate it.

---

# Interactive Colors

Interactive elements should clearly communicate their state.

Examples include:

- Primary Buttons
- Secondary Buttons
- Links
- Navigation
- Inputs
- Selected Items

Interactive colors should remain consistent throughout the application.

---

# Semantic Colors

Semantic colors communicate meaning independent of brand identity.

## Success

Used for:

- Completed operations
- Successful saves
- Completed synchronization
- Successful checkout
- Successful printing

---

## Warning

Used for:

- Low stock
- Pending synchronization
- Unsaved changes
- Validation warnings

Warnings indicate attention is required but the application remains operational.

---

## Error

Used for:

- Failed operations
- Validation failures
- Connection errors
- Synchronization failures
- Hardware failures

Error colors should communicate urgency without overwhelming the interface.

---

## Information

Used for:

- Tips
- Notifications
- Status updates
- Informational messages
- Process guidance

Information colors should remain visually distinct from warnings and errors.

---

# Status Colors

Status indicators should use semantic colors consistently.

Examples include:

| Status | Color Category |
|----------|----------------|
| Online | Success |
| Offline | Warning |
| Synchronizing | Information |
| Failed | Error |
| Completed | Success |
| Disabled | Neutral |

Status colors should never rely on color alone; they should always be accompanied by text or icons.

---

# Interactive States

Every interactive component should define consistent color behavior.

Required states include:

- Default
- Hover
- Focus
- Active
- Selected
- Disabled
- Loading

The relationship between these states should remain identical across all components.

---

# Color Hierarchy

Visual emphasis should follow a consistent hierarchy.

```
Primary Action
      │
      ▼
Secondary Action
      │
      ▼
Supporting Content
      │
      ▼
Background
```

The strongest colors should be reserved for the most important actions.

---

# Background Strategy

The application should use neutral backgrounds to reduce eye fatigue.

Backgrounds should:

- Support content readability
- Minimize distractions
- Improve focus
- Create separation through layering

Large areas of highly saturated color should be avoided.

---

# Contrast Requirements

Every color combination should satisfy accessibility requirements.

Design goals include:

- Clear text readability
- Visible focus indicators
- Distinguishable interactive states
- Readable disabled content

Color should never reduce usability.

---

# Dark Theme Considerations

If multiple themes are supported in future releases, semantic meaning must remain consistent.

Examples:

- Success remains success.
- Error remains error.
- Warning remains warning.

Only the visual appearance should change—not the meaning.

---

# Color Usage Guidelines

Use color to communicate:

- hierarchy
- interaction
- feedback
- status
- importance

Do **not** use color:

- purely for decoration
- inconsistently between screens
- as the only indicator of meaning
- excessively within dense interfaces

---

# Anti-Patterns

Avoid:

- Multiple primary colors
- Inconsistent semantic colors
- Low contrast text
- Decorative gradients
- Overuse of accent colors
- Random component colors
- Hardcoded color values
- Color-only status communication

---

# Implementation Rules

Implementation should follow these rules.

1. Never hardcode colors.
2. Always reference design tokens.
3. Reuse semantic colors.
4. Maintain accessibility.
5. Preserve hierarchy.
6. Use shared component styles.

---

# Success Indicators

The color system is considered successful when:

- Operators immediately recognize interface hierarchy.
- Semantic colors remain consistent across modules.
- Accessibility standards are maintained.
- Color usage is predictable.
- Components share identical color behavior.
- Future themes can be implemented without redesigning components.

---

# Related Documents

- 05-01 Introduction.md
- 05-02 Design Principles.md
- 05-04 Typography.md
- 05-09 Elevation & Shadows.md
- 05-16 Surface System.md
- 05-17 Component States.md
- 05-18 Design Tokens.md

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-08-07 | Initial color strategy for the TinyTots Electron POS Design System. |

---