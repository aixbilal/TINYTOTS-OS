# 05-04 Typography

---

## Document Information

| Field | Value |
|--------|-------|
| **Document ID** | TTOS-EPS-05-04 |
| **Folder** | 05 - Design System |
| **Status** | Draft |
| **Version** | 1.0.0 |
| **Last Updated** | 2026-08-07 |
| **Owner** | TinyTots OS Engineering |
| **Depends On** | 05-01 Introduction.md, 05-02 Design Principles.md, 05-03 Colors.md |
| **Next Document** | 05-05 Spacing.md |

---

# Purpose

This document defines the typography system for the TinyTots Electron POS Design System.

Typography is one of the primary tools for establishing visual hierarchy, improving readability and reducing cognitive load during daily retail operations.

Rather than focusing only on fonts, this document defines how typography communicates information throughout the application.

Actual font families, font sizes, weights and implementation tokens are defined in **05-18 Design Tokens.md**.

---

# Scope

This document defines:

- Typography philosophy
- Text hierarchy
- Font usage
- Text roles
- Readability standards
- Numeric typography
- Alignment rules
- Accessibility guidelines
- Typography usage principles

This document does **not** define:

- Exact font sizes
- Font files
- CSS implementation
- Design tokens

---

# Typography Philosophy

Typography should communicate information before it communicates personality.

The Electron POS is a productivity application used continuously throughout the business day.

Typography should therefore prioritize:

- readability
- clarity
- consistency
- efficiency
- hierarchy

Decorative typography should never interfere with usability.

---

# Design Objectives

The typography system should:

- Improve readability
- Create clear information hierarchy
- Reduce visual clutter
- Support rapid scanning
- Improve accessibility
- Maintain consistency
- Scale across every screen

---

# Typography Architecture

```
Typography System
        │
        ├── Display
        ├── Heading
        ├── Body
        ├── Caption
        ├── Labels
        ├── Numbers
        └── Monospace
```

Each category serves a specific communication purpose.

---

# Typography Hierarchy

Information should always follow a consistent hierarchy.

```
Display
      │
      ▼
Heading
      │
      ▼
Subheading
      │
      ▼
Body
      │
      ▼
Caption
      │
      ▼
Metadata
```

Hierarchy should be established primarily through size, weight and spacing rather than color.

---

# Font Roles

The Design System defines multiple typography roles.

| Role | Purpose |
|------|----------|
| Display | Large promotional content |
| Heading | Page titles |
| Subheading | Section titles |
| Body | Primary reading content |
| Label | Forms and controls |
| Caption | Supporting information |
| Metadata | Dates, timestamps, IDs |
| Monospace | Technical identifiers |

---

# Display Typography

Display typography should be used sparingly.

Typical usage includes:

- Dashboard titles
- Welcome screens
- Major section headers

Display typography should never be used inside dense operational workflows.

---

# Heading Typography

Headings organize screens into logical sections.

Examples include:

- Dashboard
- Products
- Inventory
- Orders
- Reports

Every screen should contain a single primary heading.

---

# Subheading Typography

Subheadings divide content into manageable groups.

Examples include:

- Customer Information
- Payment Details
- Inventory Summary
- Sales Overview

Subheadings improve navigation within large pages.

---

# Body Typography

Body text represents the majority of written content.

Examples include:

- Descriptions
- Help text
- Lists
- Documentation
- Messages

Body text should prioritize maximum readability during extended usage.

---

# Label Typography

Labels identify interface controls.

Examples include:

- Input fields
- Dropdowns
- Checkboxes
- Radio buttons
- Search fields

Labels should remain concise and descriptive.

---

# Caption Typography

Captions provide secondary information.

Typical examples include:

- Helper text
- Validation guidance
- Small descriptions
- Notes
- Secondary metadata

Captions should never compete visually with primary content.

---

# Metadata Typography

Metadata communicates supporting information.

Examples include:

- SKU
- Order ID
- Receipt Number
- Invoice Number
- Product Code
- Created Date
- Updated Date

Metadata should remain readable without drawing unnecessary attention.

---

# Monospace Typography

Monospace typography is reserved for technical identifiers.

Examples include:

- Barcode values
- Transaction IDs
- Receipt IDs
- System Logs
- Internal References

Monospace fonts improve readability for structured data.

---

# Numeric Typography

Retail systems display large quantities of numeric information.

Examples include:

- Prices
- Totals
- Discounts
- Taxes
- Stock Levels
- Quantities

Numeric typography should:

- align consistently
- remain highly readable
- reduce ambiguity
- support rapid comparison

Tabular numeral support should be preferred where available.

---

# Alignment Principles

Text alignment should remain consistent throughout the application.

Recommended alignment:

| Content | Alignment |
|----------|-----------|
| Headings | Left |
| Body | Left |
| Labels | Left |
| Tables | Left |
| Prices | Right |
| Quantities | Right |
| Currency | Right |
| Numeric Columns | Right |

Centered text should be used only when it improves comprehension.

---

# Line Length

Readable text should avoid excessively long lines.

Guidelines:

- Short interface labels
- Moderate paragraph width
- Comfortable reading rhythm

Long paragraphs should be divided into logical sections.

---

# Line Height

Adequate line spacing improves readability.

Line height should:

- prevent crowded text
- improve scanning
- reduce fatigue
- support accessibility

Dense interfaces should remain readable without sacrificing information density.

---

# Text Emphasis

Emphasis should be applied sparingly.

Preferred methods:

- Font weight
- Hierarchy
- Position
- Spacing

Avoid relying on:

- ALL CAPS
- Excessive bold text
- Multiple emphasis styles simultaneously

---

# Capitalization

Text should use consistent capitalization.

Recommended usage:

| Element | Style |
|----------|-------|
| Page Titles | Title Case |
| Section Headings | Title Case |
| Buttons | Sentence Case |
| Labels | Sentence Case |
| Body Text | Sentence Case |
| Notifications | Sentence Case |

Consistency improves recognition.

---

# Truncation

When content exceeds available space:

- preserve important information
- truncate gracefully
- avoid breaking words
- provide full content through tooltips where appropriate

Critical business information should never be hidden unintentionally.

---

# Accessibility

Typography should support all operators.

Requirements include:

- clear font rendering
- readable character spacing
- sufficient contrast
- scalable sizing
- distinguishable hierarchy

Typography should remain readable under prolonged daily usage.

---

# Internationalization

Typography should support future localization.

The system should accommodate:

- varying word lengths
- multilingual content
- expanded labels
- right-to-left support (future consideration)

Layouts should not depend on fixed text lengths.

---

# Typography Usage Guidelines

Typography should communicate:

- hierarchy
- importance
- relationships
- readability

Typography should never be used purely for decoration.

---

# Anti-Patterns

Avoid:

- Multiple font families within one screen
- Random font sizes
- Excessive bold text
- Decorative fonts
- Inconsistent capitalization
- Crowded line spacing
- Hardcoded typography values
- Poor numeric alignment

---

# Implementation Rules

Implementation should follow these principles:

1. Never hardcode typography values.
2. Always use design tokens.
3. Maintain hierarchy.
4. Reuse typography styles.
5. Preserve accessibility.
6. Ensure consistent alignment.

---

# Success Indicators

The typography system is considered successful when:

- Information hierarchy is immediately recognizable.
- Body text remains readable during extended use.
- Numeric values are easy to compare.
- Typography is consistent across all screens.
- Accessibility requirements are maintained.
- Future modules integrate without introducing new text styles.

---

# Related Documents

- 05-01 Introduction.md
- 05-02 Design Principles.md
- 05-03 Colors.md
- 05-05 Spacing.md
- 05-18 Design Tokens.md
- 06 - Application Shell/
- 08 - Components/

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-08-07 | Initial typography specification for the TinyTots Electron POS Design System. |

---