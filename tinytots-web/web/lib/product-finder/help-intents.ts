// Deterministic answers to common non-shopping questions. These consume ZERO
// AI requests and always use verified TinyTots facts. Matched before any AI
// call and before the guided product query.

export type HelpIntent = {
  id: string;
  /** answer text shown in the finder panel */
  answer: string;
  /** optional call-to-action link */
  link?: { href: string; label: string };
};

const INTENTS: { id: string; patterns: RegExp[]; intent: HelpIntent }[] = [
  {
    id: "shipping",
    patterns: [/\bship(ping|s|ped)?\b/, /\bdeliver(y|ies|ed)?\b/, /\bcourier\b/, /how long.*(arrive|deliver)/],
    intent: {
      id: "shipping",
      answer:
        "We ship across Pakistan. Standard delivery is free; some remote areas may carry a delivery fee depending on the area. You'll see any fee before you confirm the order.",
      link: { href: "/shipping-returns", label: "Shipping & returns" },
    },
  },
  {
    id: "returns",
    patterns: [/\breturn(s|ed|ing)?\b/, /\bexchange\b/, /\brefund\b/, /\bsend.*back\b/],
    intent: {
      id: "returns",
      answer:
        "Unworn items with tags can be returned within 7 days of delivery for an exchange or store credit. Start a return from your account.",
      link: { href: "/account/returns", label: "Start a return" },
    },
  },
  {
    id: "track-order",
    patterns: [/\btrack\b/, /where.*(my )?order/, /order.*status/, /\bparcel\b/],
    intent: {
      id: "track-order",
      answer: "You can check your order status any time with your order number on the Track Order page.",
      link: { href: "/track-order", label: "Track your order" },
    },
  },
  {
    id: "size-guide",
    patterns: [/\bsize(s|ing)?\b/, /\bmeasurement/, /which size/, /fit(s|ting)?\b/, /how big/],
    intent: {
      id: "size-guide",
      answer: "Our size guide has age-based measurements for every category to help you pick the right fit.",
      link: { href: "/size-guide", label: "Open size guide" },
    },
  },
  {
    id: "payment",
    patterns: [/\bpay(ment|ing)?\b/, /\bcod\b/, /cash on delivery/, /\bcard\b/, /\beasypaisa\b/, /\bjazzcash\b/, /\bbank\b/],
    intent: {
      id: "payment",
      answer:
        "Right now we accept Cash on Delivery. Easypaisa, JazzCash and bank card payments are coming soon.",
      link: { href: "/help", label: "Payment help" },
    },
  },
  {
    id: "contact",
    patterns: [/\bcontact\b/, /\bphone\b/, /\bwhatsapp\b/, /\bemail\b/, /talk to (someone|a human)/, /customer (care|service|support)/],
    intent: {
      id: "contact",
      answer: "Our team is happy to help. Reach us through the contact page.",
      link: { href: "/contact", label: "Contact us" },
    },
  },
  {
    id: "shop-boys",
    patterns: [/shop.*boy/, /\bboys?('| )?(wear|clothes|clothing|section)/, /for (my )?son\b/],
    intent: {
      id: "shop-boys",
      answer: "Here's everything for boys.",
      link: { href: "/products?gender=boy", label: "Shop boys" },
    },
  },
  {
    id: "shop-girls",
    patterns: [/shop.*girl/, /\bgirls?('| )?(wear|clothes|clothing|section)/, /for (my )?daughter\b/],
    intent: {
      id: "shop-girls",
      answer: "Here's everything for girls.",
      link: { href: "/products?gender=girl", label: "Shop girls" },
    },
  },
];

/** Returns a verified answer if the text clearly maps to a known intent. */
export function matchHelpIntent(text: string): HelpIntent | null {
  const t = (text || "").toLowerCase().trim();
  if (t.length < 2) return null;
  for (const entry of INTENTS) {
    if (entry.patterns.some((re) => re.test(t))) return entry.intent;
  }
  return null;
}
