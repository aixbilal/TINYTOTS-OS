---
id: 16.01
title: Asset Inventory
phase: 16
status: asset-governance
ai_critical: true
last_updated: 2026-08-08
---

# Asset Inventory

## Purpose

This document is the master control system for every visual asset used by the TinyTots website redesign.

It answers:

- What assets are required?
- Why does each asset exist?
- Where is it used?
- What format and dimensions are required?
- Has it been created or sourced?
- Has it been approved?
- Where does the final asset live?
- Is a responsive/mobile variant required?

The inventory must remain synchronized with the actual asset library and implementation.

---

# 1. Asset Source of Truth

The actual approved asset file is the implementation source of truth.

This document is the **metadata and planning source of truth**.

```text
ASSET INVENTORY
      ↓
ASSET FILE
      ↓
APPROVAL
      ↓
IMPLEMENTATION
```

If documentation and the actual repository disagree, verify the repository and update the documentation.

---

# 2. Asset Categories

All website assets belong to one of the following categories:

```text
16.02 — Generated Images
16.03 — Photography
16.04 — Video
16.05 — 3D
16.06 — Icons & Graphics
```

These categories must remain distinct because their creation, optimization, licensing, implementation, and performance requirements differ.

---

# 3. Asset Lifecycle

Every important asset should follow:

```text
REQUIRED
   ↓
SPECIFIED
   ↓
CREATED / SOURCED
   ↓
REVIEWED
   ↓
APPROVED
   ↓
OPTIMIZED
   ↓
IMPLEMENTED
   ↓
VALIDATED
```

Possible status values:

```text
PLANNED
IN PROGRESS
DRAFT
REVIEW
APPROVED
REJECTED
REPLACED
IMPLEMENTED
ARCHIVED
```

---

# 4. Asset ID Convention

Each important asset should have a stable identifier.

Recommended structure:

```text
TT-[CATEGORY]-[PAGE]-[NUMBER]
```

Examples:

```text
TT-IMG-HOME-001
TT-PHOTO-PRODUCT-001
TT-VIDEO-CAMPAIGN-001
TT-3D-PRODUCT-001
TT-ICON-NAV-001
```

The exact identifier should remain stable even if the filename changes.

---

# 5. Required Inventory Fields

Each production asset should be traceable using:

| Field | Purpose |
|---|---|
| Asset ID | Stable identifier |
| Asset Name | Human-readable name |
| Category | Image / Photography / Video / 3D / Graphic |
| Page | Page where it is used |
| Section | Exact section/component |
| Purpose | Why it exists |
| Source | Generated / photographed / licensed / designed |
| Status | Current lifecycle status |
| Approval | Approved / pending / rejected |
| Format | AVIF / WebP / JPG / PNG / SVG / MP4 / GLB etc. |
| Dimensions | Required dimensions |
| Aspect Ratio | Required composition |
| Responsive Variant | Desktop/tablet/mobile requirement |
| Focal Point | Important visual subject |
| Repository Path | Final implementation location |
| Original Source | Original/master asset location |
| Notes | Important implementation information |

---

# 6. Asset Naming

Production filenames should be:

- descriptive
- lowercase where repository convention allows
- predictable
- stable
- free of meaningless generated identifiers

Prefer:

```text
homepage-hero-summer-01.webp
product-dress-navy-front.webp
campaign-autumn-hero-mobile.webp
```

Avoid:

```text
IMG_8472.webp
final-final-new-2.png
image123.png
generated_asset_001.png
```

---

# 7. Generated Images

Generated imagery belongs under:

```text
16.02 — Generated Images/
```

These assets may include:

- hero compositions
- editorial scenes
- campaign visuals
- supporting backgrounds
- decorative visual compositions
- concept imagery

Generated images must still follow the approved:

- color system
- photography direction
- composition rules
- brand mood
- typography-safe areas
- responsive requirements

A generated image is not automatically approved simply because it looks attractive.

---

# 8. Photography

Photography belongs under:

```text
16.03 — Photography/
```

This includes:

- brand photography
- lifestyle photography
- product photography
- editorial photography
- campaign photography
- detail photography

Photography must follow the approved photography direction in Phase 11 and the brand synthesis in Phase 12.

Where photography is AI-generated, it should still be tracked as generated imagery or clearly identified as synthetic photography according to the actual production process.

---

# 9. Video

Video assets belong under:

```text
16.04 — Video/
```

Track:

- duration
- dimensions
- aspect ratio
- codec/container
- file size
- poster image
- desktop/mobile variant
- autoplay requirement
- fallback
- reduced-motion behavior

Large video must never be introduced without considering page performance.

---

# 10. 3D

3D assets belong under:

```text
16.05 — 3D/
```

Track:

- file format
- polygon/complexity considerations
- texture requirements
- file size
- loading strategy
- intended device class
- fallback asset
- interactive behavior

3D assets must comply with Phase 05 and Phase 13.

---

# 11. Icons & Graphics

Icons and graphics belong under:

```text
16.06 — Icons & Graphics/
```

This includes:

- UI icons
- navigation icons
- social icons
- brand graphics
- decorative graphics
- illustrations
- SVG assets
- favicon/app icons

Icons should use a consistent visual language.

Avoid mixing unrelated icon styles.

---

# 12. Responsive Asset Strategy

Every major visual asset must answer:

```text
Can desktop use the same asset?
Can tablet use the same asset?
Can mobile use the same asset?
Does the crop change?
Does the focal point change?
Does the asset need a separate file?
```

Use separate variants when composition genuinely requires them.

Do not create unnecessary duplicates.

---

# 13. Performance Metadata

Important assets should be evaluated for:

- intrinsic dimensions
- compressed size
- loading priority
- lazy-loading requirement
- cache behavior
- format
- responsive delivery

Critical hero assets receive special attention because they influence first visual rendering.

---

# 14. Asset Approval

Approval should consider:

### Brand

Does it fit the TinyTots visual identity?

### Composition

Does it work in the intended layout?

### Quality

Is the source resolution and visual quality sufficient?

### Consistency

Does it belong with the rest of the image system?

### Technical

Is it practical to deliver?

### Accessibility

Can meaningful information be communicated without depending exclusively on the asset?

---

# 15. Rejection Criteria

Reject or replace assets that are:

- visually generic
- obviously inconsistent with the brand
- low resolution
- poorly cropped
- technically oversized
- visually noisy
- difficult to use responsively
- inconsistent with approved photography direction
- dependent on misleading visual claims
- unnecessarily similar to another brand's distinctive creative work

---

# 16. Inventory Table

The live inventory should eventually be maintained here or in a linked structured data source.

| Asset ID | Name | Category | Page | Section | Source | Status | Approval | Format | Dimensions | Repository Path |
|---|---|---|---|---|---|---|---|---|---|---|
| TT-IMG-HOME-001 | Homepage Hero | Generated Image | Homepage | Hero | Generated | Planned | Pending | TBD | TBD | TBD |
| TT-IMG-HOME-002 | Editorial Feature | Generated Image | Homepage | Editorial | Generated | Planned | Pending | TBD | TBD | TBD |
| TT-PHOTO-PRODUCT-001 | Product Main Image | Photography | Products | Product Card | Product Photography | Planned | Pending | TBD | TBD | TBD |
| TT-VIDEO-CAMPAIGN-001 | Campaign Hero Video | Video | Homepage | Campaign | Video | Planned | Pending | TBD | TBD | TBD |
| TT-3D-PRODUCT-001 | Product 3D Experience | 3D | Product Details | 3D Viewer | 3D | Planned | Pending | GLB/TBD | TBD | TBD |
| TT-ICON-NAV-001 | Navigation Icon Set | Icon | Global | Navigation | Designed | Planned | Pending | SVG | TBD | TBD |

This table is a starting registry, not a declaration that these assets already exist.

---

# 17. Manual Asset Creation Rule

The asset folders are **working asset libraries**, not automatically generated by this document.

The actual files will be created, generated, selected, edited, optimized, and placed manually during the asset-production stage.

The documentation defines the system.

The asset-production process creates the files.

---

# 18. AI Asset Generation Rule

AI may be used to generate visual assets when appropriate.

However:

```text
AI GENERATED
≠
AUTOMATICALLY APPROVED
```

Every generated asset must pass:

```text
BRAND REVIEW
+
COMPOSITION REVIEW
+
TECHNICAL REVIEW
+
IMPLEMENTATION REVIEW
```

---

# 19. Duplicate Prevention

Before creating a new asset:

1. Search the asset library.
2. Search the inventory.
3. Check whether an existing asset can be reused.
4. Check whether a crop/variant is sufficient.
5. Only create a new asset when necessary.

---

# 20. Asset Replacement

When replacing an asset:

```text
OLD ASSET
↓
REPLACEMENT REVIEW
↓
NEW ASSET APPROVED
↓
IMPLEMENTATION UPDATED
↓
OLD ASSET ARCHIVED
```

Do not silently overwrite important production assets without updating their inventory record.

---

# 21. Relationship With Other Documentation

Phase 16 depends on:

```text
03 — Visual System
04 — Motion
05 — 3D
06 — Interaction References
07 — Global User Experience
08 — User Frontend
09 — Admin Frontend
10 — Responsive
11 — Visual Reference Library
12 — Reference Brands
13 — Implementation
15 — Quality Assurance
```

These phases define what the asset must achieve.

Phase 16 defines the actual asset system.

---

# 22. Final Asset Principle

TinyTots should not have a large asset library merely for the sake of having many visuals.

The goal is:

```text
FEWER
+
BETTER
+
PURPOSEFUL
+
CONSISTENT
+
PERFORMANT
ASSETS
```

Every important asset should earn its place in the experience.
