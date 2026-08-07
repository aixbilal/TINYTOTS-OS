# 05-17 Component States

---

## Document Information

| Field | Value |
|--------|-------|
| **Document ID** | TTOS-EPS-05-17 |
| **Folder** | 05 - Design System |
| **Status** | Draft |
| **Version** | 1.0.0 |
| **Last Updated** | 2026-08-07 |
| **Owner** | TinyTots OS Engineering |
| **Depends On** | 05-03 Colors.md, 05-10 Opacity.md, 05-13 Motion & Animations.md, 05-14 Accessibility.md |
| **Next Document** | 05-18 Design Tokens.md |

---

# Purpose

This document defines the universal state model used by all interactive components within TinyTots Electron POS.

Component states communicate system status, interactivity, progress, and feedback. Consistent state behavior improves usability, reduces errors, and ensures predictability across the application.

This document establishes a shared state language for:

- Buttons
- Inputs
- Dropdowns
- Tables
- Cards
- Dialogs
- Navigation
- Forms
- Lists
- Interactive controls

---

# Scope

This document defines:

- State architecture
- Standard interaction states
- Loading states
- Error states
- Validation states
- Selection states
- Accessibility requirements
- Engineering rules

---

# State Philosophy

Users should immediately understand:

- Can I interact with this?
- Is this selected?
- Is this loading?
- Did something fail?
- What changed?

States communicate application behavior.

Visual differences between states must be obvious, consistent, and accessible.

---

# State Architecture

```text
Component

    │

    ├── Default
    ├── Hover
    ├── Focus
    ├── Active
    ├── Selected
    ├── Disabled
    ├── Loading
    ├── Success
    ├── Warning
    └── Error
```

Not every component requires every state.

---

# Core States

## Default

Normal component appearance.

Characteristics:

- Interactive
- Neutral appearance
- No emphasis
- Fully available

---

## Hover

Indicates possible interaction.

Available for:

- Mouse
- Trackpad
- Stylus

Hover should:

- Be subtle
- Improve discoverability
- Not shift layouts

---

## Focus

Indicates keyboard interaction.

Requirements:

- Clearly visible
- High contrast
- Consistent across application

Focus visibility must never be removed.

---

## Active

Indicates interaction in progress.

Examples:

- Button pressed
- Toggle changed
- Navigation clicked

Active states should provide immediate feedback.

---

## Selected

Indicates persistent choice.

Examples:

- Selected customer
- Active filter
- Sidebar item
- Chosen product

Selection should remain visible until changed.

---

## Disabled

Indicates unavailable interaction.

Disabled components should:

- Remain readable
- Be visually distinct
- Not receive focus

Disabled does not mean hidden.

---

# Loading States

Loading states communicate ongoing work.

Examples:

- Product loading
- Receipt generation
- Sync operation
- Report creation

Loading methods:

- Spinner
- Skeleton
- Progress indicator

Long operations should indicate progress where possible.

---

# Success States

Success confirms completed actions.

Examples:

- Sale complete
- Product saved
- Backup finished

Success feedback should be brief and non-disruptive.

---

# Warning States

Warnings indicate attention is needed.

Examples:

- Low stock
- Offline mode
- Pending sync
- Expiring session

Warnings should not interrupt workflows unnecessarily.

---

# Error States

Errors indicate failures.

Examples:

- Printer unavailable
- Network issue
- Invalid input
- Save failed

Errors should include:

- Problem
- Cause
- Recovery action

---

# Validation States

Forms support:

| State | Purpose |
|---------|----------|
| Valid | Input accepted |
| Invalid | Input rejected |
| Required | Missing input |
| Warning | Potential issue |

Validation should occur predictably.

---

# Empty States

Empty states communicate absence of content.

Examples:

- No products
- No customers
- No reports

Empty states should:

- Explain situation
- Suggest action

---

# Selection States

Used in:

- Tables
- Cards
- Product grids
- Navigation

Selection indicators may include:

- Border
- Background
- Check indicator

Selection must remain obvious.

---

# State Priority

When multiple states exist:

```text
Disabled

↓

Loading

↓

Error

↓

Selected

↓

Focus

↓

Hover

↓

Default
```

Higher-priority states override lower-priority states.

---

# Motion Rules

State transitions should:

- Be subtle
- Be fast
- Remain consistent

Examples:

- Hover
- Focus
- Selection
- Validation

Animations must never delay workflows.

---

# Accessibility

States must never depend solely on:

- Color
- Motion
- Opacity

Use combinations of:

- Text
- Icons
- Color
- Borders

---

# Engineering Standards

Developers should:

1. Reuse shared state patterns.
2. Avoid custom states.
3. Support accessibility.
4. Use semantic tokens.
5. Maintain consistency.

---

# Anti-Patterns

Avoid:

- Invisible focus
- Color-only states
- Hidden disabled controls
- Inconsistent loading indicators
- Multiple state systems

---

# Success Indicators

The state system is successful when:

- Users immediately understand interactions.
- Feedback is predictable.
- Accessibility is preserved.
- Components behave consistently.

---

# Related Documents

- 05-03 Colors.md
- 05-10 Opacity.md
- 05-13 Motion & Animations.md
- 05-14 Accessibility.md
- 05-18 Design Tokens.md
- 08 - Components/

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-08-07 | Initial component state specification. |

---