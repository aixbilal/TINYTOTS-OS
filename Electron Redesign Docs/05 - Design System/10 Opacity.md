# 05-10 Opacity

---

## Document Information

| Field | Value |
|--------|-------|
| **Document ID** | TTOS-EPS-05-10 |
| **Folder** | 05 - Design System |
| **Status** | Draft |
| **Version** | 1.0.0 |
| **Last Updated** | 2026-08-07 |
| **Owner** | TinyTots OS Engineering |
| **Depends On** | 05-03 Colors.md, 05-08 Borders.md, 05-09 Elevation & Shadows.md |
| **Next Document** | 05-11 Icons.md |

---

# Purpose

This document defines the opacity system for the TinyTots Electron POS Design System.

Opacity is a supporting visual property used to communicate interaction states, hierarchy, emphasis, availability, and transitions. It should enhance usability without reducing readability or accessibility.

Rather than serving as a decorative effect, opacity should communicate meaningful changes in interface state while maintaining visual consistency across the application.

Actual opacity values are defined in **05-18 Design Tokens.md**.

---

# Scope

This document defines:

- Opacity philosophy
- Opacity hierarchy
- Interactive opacity
- Disabled states
- Overlay opacity
- Loading opacity
- Accessibility requirements
- Implementation rules

This document does **not** define:

- Numeric opacity values
- CSS opacity properties
- Animation timing
- Design token values

---

# Design Philosophy

Opacity should communicate state—not decoration.

Changes in transparency should indicate:

- Availability
- Focus
- Layering
- Temporary interaction
- Progress

Opacity should never reduce usability or make information difficult to understand.

---

# Design Objectives

The opacity system should:

- Improve visual hierarchy
- Support interaction feedback
- Differentiate active and inactive content
- Reinforce elevation
- Improve loading experiences
- Maintain accessibility
- Simplify implementation

---

# Opacity Architecture

```
Opacity System
        │
        ├── Fully Visible
        ├── Reduced Emphasis
        ├── Disabled
        ├── Overlay
        ├── Loading
        └── Transition
```

Each opacity level represents a distinct semantic meaning.

---

# Opacity Principles

Opacity should only communicate intentional interface states.

It should never be used to:

- decorate layouts
- replace hierarchy
- hide poor design
- compensate for inconsistent colors

Every opacity change must communicate information.

---

# Opacity Hierarchy

```
100%

↓

Primary Content

↓

Secondary Content

↓

Disabled Content

↓

Overlay Background

↓

Hidden
```

Higher visibility should correspond to greater importance.

---

# Fully Visible Elements

Primary interface elements should remain fully visible.

Examples include:

- Page Titles
- Primary Buttons
- Active Navigation
- Product Information
- Checkout Actions
- Primary Forms

Critical business operations should always remain fully legible.

---

# Reduced Emphasis

Some interface elements intentionally receive less emphasis.

Examples:

- Secondary Labels
- Metadata
- Helper Text
- Supporting Icons
- Placeholder Content

Reduced emphasis should maintain readability while lowering visual priority.

---

# Disabled State

Disabled components should communicate that interaction is unavailable.

Examples:

- Disabled Buttons
- Disabled Inputs
- Inactive Menu Items
- Unavailable Actions

Disabled controls should remain recognizable while clearly indicating they cannot be used.

Disabled controls must not appear broken.

---

# Hover Behavior

Opacity may change slightly during hover interactions.

Examples:

- Buttons
- Cards
- Navigation Items
- Table Rows
- List Items

Hover changes should be subtle and immediate.

Large visual shifts should be avoided.

---

# Active State

During active interaction, opacity may briefly change to acknowledge user input.

Examples:

- Button Press
- Sidebar Selection
- Menu Selection

State changes should reinforce interaction without distracting the operator.

---

# Selected State

Selected items should use opacity together with:

- Color
- Border
- Background
- Icons

Opacity alone must never indicate selection.

Examples:

- Selected Product
- Selected Customer
- Active Navigation
- Active Filter

---

# Overlay Opacity

Modal overlays temporarily reduce emphasis on background content.

Examples:

- Confirmation Dialogs
- Checkout Window
- Settings Dialog
- Product Editor

The overlay should:

- Focus user attention
- Preserve awareness of the underlying application
- Maintain readability

The background should remain recognizable but inactive.

---

# Loading States

During loading operations, opacity may indicate temporary inactivity.

Examples:

- Skeleton Screens
- Data Refresh
- Synchronization
- Reports Loading

Loading opacity should always be paired with:

- Progress indicators
- Skeleton placeholders
- Loading animations

Users should never interpret loading states as application failure.

---

# Drag and Drop

During drag operations, opacity may indicate:

- Selected Item
- Drag Preview
- Drop Target
- Available Destination

Opacity should enhance clarity without hiding content.

---

# Read-Only Content

Read-only information should remain fully readable.

Reduced opacity should not be used simply because data cannot be edited.

Instead, distinguish read-only content through:

- Labels
- Icons
- Context

---

# Hidden Elements

Hidden interface elements should not rely solely on opacity.

If an element is inactive, it should generally be:

- Removed
- Collapsed
- Disabled

Invisible elements should not continue occupying interactive space.

---

# Opacity in Animations

Opacity transitions should support motion.

Common transitions include:

```
Hidden

↓

Fade In

↓

Visible

↓

Fade Out

↓

Hidden
```

Opacity animations should remain smooth and brief.

---

# Relationship with Color

Opacity should never replace semantic color.

Examples:

Correct:

```
Error Color
+
Opacity
```

Incorrect:

```
Normal Color
+
Low Opacity
=
Error
```

Semantic meaning must always come from the color system.

---

# Relationship with Elevation

Higher elevation often corresponds with stronger visual presence.

Opacity should reinforce—not replace—layering created through:

- Shadows
- Position
- Surface colors

---

# Accessibility

Opacity must never reduce readability below accessibility requirements.

Ensure:

- Sufficient contrast
- Legible text
- Recognizable controls
- Visible focus states

Users with reduced vision should still understand interface state.

---

# Performance Considerations

Opacity transitions are inexpensive but should still be used thoughtfully.

Avoid:

- Continuous opacity animation
- Simultaneous fading of large layouts
- Multiple overlapping transitions

Animations should remain responsive on lower-powered retail hardware.

---

# Implementation Rules

Developers should follow these principles.

1. Never hardcode opacity values.
2. Use Design Tokens.
3. Keep semantic meaning consistent.
4. Pair opacity with other visual cues.
5. Preserve accessibility.
6. Keep transitions subtle.
7. Avoid decorative transparency.

---

# Anti-Patterns

Avoid:

- Low-opacity body text
- Decorative transparency
- Invisible interactive controls
- Hidden content using opacity only
- Excessive fade animations
- Multiple opacity levels for identical components
- Opacity replacing semantic colors
- Reduced contrast caused by transparency

---

# Design Review Checklist

Every opacity implementation should satisfy the following.

| Question | Requirement |
|-----------|-------------|
| Uses Design Tokens | ✓ |
| Has semantic purpose | ✓ |
| Preserves readability | ✓ |
| Supports accessibility | ✓ |
| Consistent with component family | ✓ |
| Avoids decorative use | ✓ |

---

# Success Indicators

The opacity system is considered successful when:

- Interface states are immediately understandable.
- Disabled controls are recognizable without appearing broken.
- Modal overlays naturally guide user attention.
- Loading states communicate progress clearly.
- Opacity never reduces readability.
- Developers consistently reuse predefined opacity tokens.

---

# Related Documents

- 05-03 Colors.md
- 05-08 Borders.md
- 05-09 Elevation & Shadows.md
- 05-11 Icons.md
- 05-13 Motion & Animations.md
- 05-17 Component States.md
- 05-18 Design Tokens.md

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-08-07 | Initial opacity specification for the TinyTots Electron POS Design System. |

---