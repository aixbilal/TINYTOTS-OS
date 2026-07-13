---
name: Premium Juvenile Editorial
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d8'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1b'
  on-surface-variant: '#56423e'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#89726d'
  outline-variant: '#dcc0bb'
  surface-tint: '#9c422e'
  primary: '#9c422e'
  on-primary: '#ffffff'
  primary-container: '#f2846b'
  on-primary-container: '#6b1e0d'
  inverse-primary: '#ffb4a3'
  secondary: '#4f6263'
  on-secondary: '#ffffff'
  secondary-container: '#cfe4e4'
  on-secondary-container: '#536667'
  tertiary: '#6b5c4c'
  on-tertiary: '#ffffff'
  tertiary-container: '#b2a08e'
  on-tertiary-container: '#443729'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a3'
  on-primary-fixed: '#3d0600'
  on-primary-fixed-variant: '#7d2c19'
  secondary-fixed: '#d2e6e7'
  secondary-fixed-dim: '#b6cacb'
  on-secondary-fixed: '#0b1e1f'
  on-secondary-fixed-variant: '#374a4b'
  tertiary-fixed: '#f4dfcb'
  tertiary-fixed-dim: '#d7c3b0'
  on-tertiary-fixed: '#241a0e'
  on-tertiary-fixed-variant: '#524436'
  background: '#fcf9f8'
  on-background: '#1b1c1b'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  section-gap: 80px
---

## Brand & Style
This design system targets an upscale audience seeking expert guidance in child development, nursery design, and juvenile services. The personality is "Refined Nurturer"—balancing the warmth of early childhood with the editorial precision of a high-end publication.

The aesthetic follows a **Minimalist-Editorial** movement. It prioritizes expansive whitespace (using an ivory base), high-quality photography, and sophisticated typographic hierarchies. Interactive elements are treated with subtle, tactile cues to evoke a sense of quality and trust, avoiding the overly "bubbly" tropes of standard childcare apps in favor of a clean, professional services atmosphere.

## Colors
The palette is anchored by **Ivory (#FCF9F8)**, which serves as the primary surface color to maintain an airy, premium feel. **Coral (#F2846B)** is used exclusively for primary actions and brand emphasis.

For professional services, we introduce a secondary **Deep Sage (#4A5D5E)** for text and authoritative elements, and a **Sand Tertiary (#D9C5B2)** for soft dividers and secondary backgrounds. Status indicators utilize muted, sophisticated tones: Sage for 'Scheduled', Ochre for 'In Progress', and Deep Sage for 'Completed', ensuring they integrate seamlessly without disrupting the editorial harmony.

## Typography
Plus Jakarta Sans is the sole typeface, utilized for its geometric clarity and contemporary warmth. 

- **Editorial Headlines:** Use `display-lg` with tight letter spacing for a high-end magazine feel.
- **Service Labels:** All caps with increased letter spacing (`label-md`) should be used for status tags (e.g., "CONSULTATION SCHEDULED") to distinguish them from body copy.
- **Consultant Profiles:** Names should use `title-lg`, while credentials use `label-sm` in a secondary color.

## Layout & Spacing
The layout follows a **Fluid Grid** with generous margins to enforce the premium feel. 

- **Desktop:** 12-column grid with 24px gutters. Use 80px (`section-gap`) between major content blocks like "Consultant Spotlight" and "Service Offerings."
- **Mobile:** 4-column grid with 16px margins.
- **Rhythm:** All spacing must be multiples of 4px. Use larger internal padding (32px+) for cards to maintain the "airy" editorial aesthetic.

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Soft Ambient Shadows** rather than heavy borders.

- **Level 1 (Base):** Ivory (#FCF9F8) background.
- **Level 2 (Cards/Profiles):** White (#FFFFFF) surfaces with a very soft, diffused shadow (0px 4px 20px, 4% opacity of Secondary Color).
- **Interactive States:** On hover, cards should slightly lift with an increased shadow spread. 
- **Modals/Overlays:** Use a subtle backdrop blur (8px) over the ivory base to maintain context during booking flows.

## Shapes
The shape language is **Rounded**, reflecting the juvenile nature of the brand while remaining professional.

- **Standard Elements:** 0.5rem (8px) for input fields and small cards.
- **Consultant Avatars:** Circular (full round) to emphasize the human element of professional services.
- **Booking Buttons:** 1rem (16px) or fully pill-shaped to create a distinct, friendly call-to-action.

## Components

### Consultant Profiles
Profiles should feature a circular avatar on the left or top, followed by the name in `title-lg`. Use a horizontal "Sand" divider to separate bio from service tags.

### Booking States & Status Indicators
Status indicators (e.g., 'Design in Progress') are rendered as subtle chips. 
- **Container:** Light tint of the status color (10% opacity).
- **Text:** The solid status color in `label-sm` (uppercase).
- **Border:** None; use the contrast between the tint and the ivory background for definition.

### Buttons & Inputs
- **Primary Action:** Coral (#F2846B) background with White text. Pill-shaped.
- **Secondary Action:** Transparent background with a Coral 1px border.
- **Input Fields:** White background with a 1px 'Sand' border. On focus, the border transitions to Deep Sage.

### Service Cards
Use a vertical layout for mobile and a horizontal "featured" layout for desktop. Cards must include a clear price or duration label in `label-md` at the top right to maintain transparency in professional services.