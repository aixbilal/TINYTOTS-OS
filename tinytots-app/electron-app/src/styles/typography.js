/**
 * TinyTots OS typography tokens — class-name map for components.
 * Prefer these over ad-hoc Tailwind text-* / font-* combos.
 */

export const font = {
  /** Playfair Display — brand / welcome / login title only */
  display: "font-display",
  /** Geist (Inter fallback) — default UI */
  sans: "font-sans",
  /** JetBrains Mono — SKU / barcode / IDs only */
  mono: "font-mono type-mono",
};

export const type = {
  displayXxl: "type-display-xxl",
  displayXl: "type-display-xl",
  displayL: "type-display-l",
  headingXl: "type-heading-xl",
  headingLg: "type-heading-lg",
  headingMd: "type-heading-md",
  headingSm: "type-heading-sm",
  section: "type-section",
  cardTitle: "type-card-title",
  stat: "type-stat",
  bodyLg: "type-body-lg",
  body: "type-body",
  bodySm: "type-body-sm",
  caption: "type-caption",
  label: "type-label",
  fieldLabel: "type-field-label",
  btn: "type-btn",
  input: "type-input",
  tableHead: "type-table-head",
  table: "type-table",
  nav: "type-nav",
  prose: "type-prose",
};

/** Brand page title (login / empty-state heroes) */
export const brandTitle = `${font.display} ${type.displayL}`;

/** Dashboard editorial greeting */
export const welcomeTitle = `${font.display} ${type.headingXl}`;

/** In-app page titles (Inventory, POS, etc.) — Geist, not Playfair */
export const pageTitle = `${font.sans} ${type.headingLg}`;

/** Section headings inside cards/panels */
export const sectionTitle = `${font.sans} ${type.section}`;

/** Module / feature card titles */
export const cardTitle = `${font.sans} ${type.cardTitle}`;
