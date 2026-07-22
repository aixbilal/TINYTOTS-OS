---
name: Premium Juvenile Editorial
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#56423e'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#89726d'
  outline-variant: '#dcc0bb'
  surface-tint: '#9c422e'
  primary: '#9c422e'
  on-primary: '#ffffff'
  primary-container: '#f2846b'
  on-primary-container: '#6b1e0d'
  inverse-primary: '#ffb4a3'
  secondary: '#396280'
  on-secondary: '#ffffff'
  secondary-container: '#b2dcff'
  on-secondary-container: '#38617f'
  tertiary: '#186c40'
  on-tertiary: '#ffffff'
  tertiary-container: '#65b381'
  on-tertiary-container: '#004324'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a3'
  on-primary-fixed: '#3d0600'
  on-primary-fixed-variant: '#7d2c19'
  secondary-fixed: '#cae6ff'
  secondary-fixed-dim: '#a2cbee'
  on-secondary-fixed: '#001e30'
  on-secondary-fixed-variant: '#1e4b67'
  tertiary-fixed: '#a3f4bd'
  tertiary-fixed-dim: '#88d7a2'
  on-tertiary-fixed: '#00210f'
  on-tertiary-fixed-variant: '#00522d'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
  button:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
  bento-gap: 20px
---

## Brand & Style

The visual identity of the design system is rooted in a "Modern Editorial" aesthetic tailored for the premium juvenile market. It balances the warmth and softness required for a children's brand with the sophisticated, structured clarity of a high-end fashion boutique. 

The design style utilizes **Minimalism** with a **Bento-box** structural influence. This approach uses generous whitespace to create an "airy" feel, ensuring that product photography remains the focal point. Layouts are organized into clean, rounded modules that suggest safety and playfulness without sacrificing professional organization. The emotional response is intended to be one of trust, calm, and aspirational quality.

## Colors

The palette is anchored by a warm, editorial off-white base that prevents the clinical feel of pure white. 

- **Primary (Soft Coral):** Used for high-intent actions, primary buttons, and brand-critical touchpoints. It provides a warm, energetic contrast to the neutral base.
- **Secondary (Dusty Blue):** Used for accents, category labels, and supporting UI elements to provide a gender-neutral, calming balance.
- **Text (Soft Charcoal):** A softened black that maintains high legibility while appearing more integrated into the warm background than a harsh #000000.
- **Functional Colors:** Sage green and muted amber provide feedback for success and warning states, chosen specifically for their muted tones to remain harmonious with the brand palette.

## Typography

This design system utilizes a tiered typographic scale to reinforce its editorial character. 

**Plus Jakarta Sans** is the headline face; its soft, rounded terminals evoke a friendly and modern personality. Headlines should use tighter letter-spacing and substantial line heights to maintain a premium feel.

**Inter** is used for all functional and body text. Its neutral, systematic nature ensures maximum readability for product descriptions, checkout flows, and navigation. 

Use `display` levels sparingly for hero sections and seasonal lookbooks. `Label-lg` is optimized for category tags and small headers, utilizing an uppercase treatment with slight tracking for a refined, organized look.

## Layout & Spacing

The layout is based on a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

The "Bento-box" philosophy dictates that content should be grouped into logical containers with consistent gaps. This creates a modular, organized feel that is easy to navigate visually. 

- **Desktop:** Utilize a 1280px max-width container with 64px side margins to create an "airy" frame.
- **Mobile:** Margins are reduced to 20px, and bento-style cards reflow into a single-column stack while maintaining the 20px gap.
- **Whitespace:** Prioritize vertical "stacking" space (`stack-lg`) between major sections to emphasize the premium, unhurried brand pace.

## Elevation & Depth

This design system avoids traditional heavy shadows in favor of a flat, layered approach that relies on **Low-contrast outlines** and **Tonal layers**.

Depth is created through:
- **Hairline Borders:** A subtle `1px` border using `rgba(43, 43, 43, 0.08)` is used to define containers and bento-boxes against the warm off-white background.
- **Surface Tiering:** Use slight variations in background color (e.g., a pure white `#FFFFFF` surface on top of the `#FAF7F2` base) to indicate interactivity or nesting.
- **Hover States:** Instead of elevation (shadows), hover states should be indicated by subtle background color shifts or slight scaling of the image within a container.

## Shapes

The shape language is consistently "Soft-Rounded." All interactive elements and content containers use a `0.5rem` (8px) to `1rem` (16px) radius to echo the softness associated with children's products.

- **Standard Elements (Buttons, Inputs):** Use 8px-12px.
- **Main Containers (Bento Cards, Product Cards):** Use 16px.
- **Chips/Badges:** Use a full "Pill" radius for maximum friendliness.

Avoid sharp corners entirely to maintain the approachable, high-end feel.

## Components

### Buttons
Primary buttons use the Soft Coral background with white text. They should have a generous height (48px-56px) and 12px rounded corners. Secondary buttons use a transparent background with a 1px Soft Charcoal border.

### Input Fields
Inputs are minimal: a 1px hairline border, the warm base color or pure white, and 8px rounded corners. Labels should use the `label-md` style, positioned consistently above the field.

### Product Cards
The core of the e-commerce experience. Cards are borderless or use the hairline border with a 16px radius. The product image should be the dominant element, with price and title using `body-md` and `headline-md` respectively.

### Sticky Navigation
The top bar is fixed, using a semi-transparent blur of the `#FAF7F2` background. It includes a centered logo with navigation links on the left and utility icons (search, account, cart) on the right.

### Chips & Badges
Used for "New Arrival" or "Sustainable" labels. These are small, pill-shaped elements using the Secondary (Dusty Blue) or Tertiary (Sage Green) colors at low opacity (10-15%) with high-contrast text.

### Bento Grid Sections
Use these for homepage categories. Each "cell" in the bento grid should have a 16px radius and contain a lifestyle image and a clear call-to-action label.