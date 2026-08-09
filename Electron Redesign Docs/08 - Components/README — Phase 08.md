# Phase 08 — Components

Phase 08 is the reusable UI component layer between **07 — Screens** and **09 — Features**.

## Component Boundaries

```text
05 — Design System
        ↓
08 — Components
        ↓
07 — Screens
        ↓
09 — Features
```

Components consume the design system and application shell. Screens compose components. Features provide operational capabilities.

## Groups

- Foundation — primitive and form controls
- Navigation — reusable navigation controls
- Feedback — modal, loading, error, and confirmation patterns
- Data Display — reusable operational information structures
- Charts — analytical visualizations
- Business — TinyTots domain-specific components

## Source Discipline

The redesign document is the primary source for target behavior. Repository verification is required before claiming an existing implementation. Unsupported details remain TODO.

## Architectural Rule

Do not move screen definitions into this phase or put operational features here. Component documents define reusable UI contracts.
