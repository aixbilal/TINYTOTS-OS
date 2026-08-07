# 05-18 Design Tokens

---

## Document Information

| Field | Value |
|--------|-------|
| **Document ID** | TTOS-EPS-05-18 |
| **Folder** | 05 - Design System |
| **Status** | Draft |
| **Version** | 1.0.0 |
| **Last Updated** | 2026-08-07 |
| **Owner** | TinyTots OS Engineering |
| **Depends On** | Entire Design System |
| **Next Document** | 06 - Application Shell |

---

# Purpose

This document defines the design token architecture for TinyTots Electron POS.

Design tokens are the single source of truth for visual decisions.

Tokens convert design decisions into reusable engineering values that can be shared between:

- Figma
- React
- Electron
- Tailwind
- CSS Variables
- Future applications

Tokens prevent hardcoded values and ensure consistency.

---

# Scope

This document defines:

- Token philosophy
- Token architecture
- Naming conventions
- Token hierarchy
- Token categories
- Governance rules

This document does not define final implementation values.

Numeric values are defined during implementation.

---

# Design Philosophy

A component should never contain direct visual values.

Incorrect:

```css
background: #ffffff;
padding: 16px;
border-radius: 8px;
```

Correct:

```css
background: var(--surface-primary);
padding: var(--spacing-md);
border-radius: var(--radius-md);
```

Tokens create:

- Consistency
- Maintainability
- Scalability

---

# Token Architecture

```text
Foundation Tokens

      │

      ▼

Semantic Tokens

      │

      ▼

Component Tokens

      │

      ▼

UI Components
```

---

# Foundation Tokens

Foundation tokens define raw values.

Examples:

- Colors
- Spacing
- Radius
- Shadows
- Typography
- Motion

Foundation tokens should not be used directly inside components.

---

# Semantic Tokens

Semantic tokens define meaning.

Examples:

```text
surface-primary
surface-secondary

text-primary
text-secondary

border-default

success
warning
error
```

Semantic tokens remain stable even if visual values change.

---

# Component Tokens

Component tokens are specific to UI elements.

Examples:

```text
button-primary-bg
button-primary-hover

input-border

dialog-shadow

table-row-hover
```

Components consume component tokens.

---

# Token Categories

---

## Color Tokens

Examples:

```text
color-neutral-50
color-neutral-100

color-brand-500

color-success-500
color-warning-500
color-error-500
```

---

## Surface Tokens

Examples:

```text
surface-primary
surface-secondary
surface-elevated
surface-overlay
```

---

## Text Tokens

Examples:

```text
text-primary
text-secondary
text-disabled
text-inverse
```

---

## Border Tokens

Examples:

```text
border-default
border-focus
border-error
```

---

## Spacing Tokens

Examples:

```text
spacing-xs
spacing-sm
spacing-md
spacing-lg
spacing-xl
```

---

## Radius Tokens

Examples:

```text
radius-sm
radius-md
radius-lg
radius-xl
```

---

## Elevation Tokens

Examples:

```text
shadow-sm
shadow-md
shadow-lg
```

---

## Typography Tokens

Examples:

```text
font-size-sm
font-size-md

font-weight-medium
font-weight-bold
```

---

## Motion Tokens

Examples:

```text
duration-fast
duration-medium

easing-standard
easing-emphasized
```

---

## Opacity Tokens

Examples:

```text
opacity-disabled
opacity-hover
opacity-overlay
```

---

## Z-Index Tokens

Examples:

```text
z-dropdown
z-dialog
z-toast
z-tooltip
```

---

# Naming Convention

Recommended structure:

```text
category-purpose-variant
```

Examples:

```text
surface-primary
button-primary-bg
text-secondary
spacing-md
radius-lg
```

Avoid:

```text
blue-color
small-space
big-radius
```

Names should describe purpose, not appearance.

---

# Token Inheritance

```text
Color Token

↓

Semantic Token

↓

Component Token

↓

UI Component
```

Example:

```text
neutral-100

↓

surface-primary

↓

card-background

↓

Card Component
```

---

# Theme Support

Themes should replace token values.

Components should not change.

```text
Light Theme

surface-primary = white

Dark Theme

surface-primary = dark gray
```

---

# Responsive Support

Responsive behavior should reuse tokens.

Examples:

```text
spacing-md

font-size-lg

grid-gap-md
```

Avoid screen-specific values.

---

# Accessibility Support

Tokens should support:

- Contrast
- Focus states
- Disabled states
- Motion reduction

Accessibility requirements should be built into token definitions.

---

# Implementation Architecture

Example:

```text
Figma

↓

JSON Tokens

↓

Tailwind

↓

CSS Variables

↓

React Components

↓

Electron Application
```

---

# Governance Rules

Developers should:

1. Never hardcode values.
2. Reuse existing tokens.
3. Create semantic names.
4. Avoid duplication.
5. Review token additions.

---

# Token Lifecycle

```text
Need

↓

Design Review

↓

Token Creation

↓

Implementation

↓

Documentation

↓

Reuse
```

---

# Anti-Patterns

Avoid:

- Hardcoded colors
- Duplicate spacing values
- Random shadows
- Multiple radius systems
- Direct color references
- Component-specific hacks

---

# Future Expansion

Tokens should support:

- Dark Mode
- High Contrast Mode
- White Label Systems
- Multi-brand Deployments
- Additional applications

---

# Success Indicators

The token system is successful when:

- No hardcoded values exist.
- Themes work automatically.
- Components remain reusable.
- Design and engineering remain synchronized.
- Future applications reuse the same foundation.

---

# Related Documents

- 05-03 Colors.md
- 05-04 Typography.md
- 05-05 Spacing.md
- 05-09 Elevation & Shadows.md
- 05-13 Motion & Animations.md
- 05-16 Themes.md
- 08 - Components/
- 10 - Development/

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-08-07 | Initial design token architecture specification. |

---