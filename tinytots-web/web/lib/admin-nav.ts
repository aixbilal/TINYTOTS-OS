import type { can } from "@/lib/admin-permissions";

// ---------------------------------------------------------------------------
// Single source of truth for Admin navigation — the primary (sidebar) model
// and the secondary (in-section) navigations. Kept as plain data so both the
// sidebar (app/admin/layout.tsx) and individual pages (AdminSubnav) stay in
// sync. Routes and permissions are unchanged from the historical flat list;
// only the grouping / labels are new.
// ---------------------------------------------------------------------------

export type Perm = Parameters<typeof can>[1];
/** A single permission, an any-of list, or null = visible to any team member. */
export type PermSpec = Perm | Perm[] | null;

export type NavLeaf = {
  href: string;
  label: string;
  icon: string;
  perm: PermSpec;
  /** Opens in a new browser tab instead of client-navigating. */
  external?: boolean;
};

export type NavGroup = {
  /** Stable key used for the expand/collapse accordion state. */
  key: string;
  label: string;
  icon: string;
  /** Where the group header links when clicked (its primary destination). */
  href: string;
  items: NavLeaf[];
};

// --- Primary sidebar model (8 areas + pinned account) ----------------------

export const PRIMARY_NAV: NavGroup[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    href: "/admin",
    items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", perm: null }],
  },
  {
    key: "orders",
    label: "Orders",
    icon: "receipt_long",
    href: "/admin/orders",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "receipt_long", perm: "canManageOrders" },
      { href: "/admin/complaints", label: "Complaints", icon: "support_agent", perm: "canHandleComplaints" },
    ],
  },
  {
    key: "catalog",
    label: "Catalog",
    icon: "inventory_2",
    href: "/admin/products",
    items: [
      { href: "/admin/products", label: "Products", icon: "inventory_2", perm: "canManageInventory" },
      { href: "/admin/categories", label: "Categories", icon: "category", perm: "canManageInventory" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: "sell",
    href: "/admin/discounts",
    items: [
      { href: "/admin/discounts", label: "Discounts", icon: "percent", perm: "canManageDiscounts" },
      { href: "/admin/coupons", label: "Coupons", icon: "confirmation_number", perm: "canManageCoupons" },
      { href: "/admin/referrals", label: "Referrals", icon: "group_add", perm: "canManageReferrals" },
      { href: "/admin/vouchers", label: "Vouchers", icon: "card_giftcard", perm: "canManageReferrals" },
    ],
  },
  {
    key: "content",
    label: "Content",
    icon: "web",
    href: "/admin/homepage",
    items: [
      {
        href: "/admin/homepage",
        label: "Website",
        icon: "home",
        perm: ["canManageSettings", "canManagePages"],
      },
      { href: "/admin/blog", label: "Blog", icon: "article", perm: "canManageBlog" },
      { href: "/admin/help", label: "Help Center", icon: "help_center", perm: "canManageHelp" },
      { href: "/admin/testimonials", label: "Social proof", icon: "reviews", perm: "canManageSettings" },
    ],
  },
  {
    key: "signage",
    label: "Store experience",
    icon: "tv",
    href: "/admin/signage",
    items: [
      { href: "/admin/signage", label: "Digital Signage", icon: "tv", perm: "canManageSettings" },
      { href: "/admin/campaigns", label: "Campaigns", icon: "campaign", perm: "canManageSettings" },
      { href: "/admin/site-content", label: "Content library", icon: "collections", perm: "canManageSettings" },
    ],
  },
  {
    key: "business",
    label: "Business",
    icon: "monitoring",
    href: "/admin/reports",
    items: [
      { href: "/admin/reports", label: "Reports", icon: "bar_chart", perm: "canManageOrders" },
      { href: "/admin/shipping-cities", label: "Delivery cities", icon: "pin_drop", perm: "canManageSettings" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    icon: "settings",
    href: "/admin/settings",
    items: [
      { href: "/admin/settings", label: "Store settings", icon: "settings", perm: "canManageSettings" },
      { href: "/admin/team", label: "Team", icon: "groups", perm: "canManageTeam" },
    ],
  },
];

/** Pinned to the sidebar footer, never part of the primary accordion. */
export const ACCOUNT_NAV: NavLeaf = {
  href: "/admin/account",
  label: "My account",
  icon: "person",
  perm: null,
};

// --- Secondary (in-section) navigations -----------------------------------
// Consumed by <AdminSubnav> on the relevant pages. `perm` mirrors the route
// guard in app/admin/layout.tsx (ROUTE_PERMISSIONS).

export const SUBNAV = {
  website: [
    { href: "/admin/homepage", label: "Homepage", perm: "canManageSettings" },
    { href: "/admin/about-page", label: "Our Story", perm: "canManagePages" },
    { href: "/admin/shipping-returns", label: "Shipping & Returns", perm: "canManagePages" },
    { href: "/admin/pages", label: "Site pages", perm: "canManagePages" },
  ],
  blog: [
    { href: "/admin/blog", label: "Articles", perm: "canManageBlog" },
    { href: "/admin/blog-content", label: "Page settings", perm: "canManageBlog" },
  ],
  help: [
    { href: "/admin/help", label: "Articles", perm: "canManageHelp" },
    { href: "/admin/help-content", label: "Page settings", perm: "canManageHelp" },
  ],
  socialProof: [
    { href: "/admin/testimonials", label: "Testimonials", perm: "canManageSettings" },
    { href: "/admin/ugc-posts", label: "Instagram & UGC", perm: "canManageSettings" },
  ],
  signage: [
    { href: "/admin/signage", label: "Overview", perm: "canManageSettings" },
    { href: "/admin/campaigns", label: "Campaigns", perm: "canManageSettings" },
    { href: "/admin/site-content", label: "Content library", perm: "canManageSettings" },
    { href: "/signage", label: "Live display", perm: "canManageSettings", external: true, icon: "tv" },
  ],
} satisfies Record<string, { href: string; label: string; perm: PermSpec; external?: boolean; icon?: string }[]>;
