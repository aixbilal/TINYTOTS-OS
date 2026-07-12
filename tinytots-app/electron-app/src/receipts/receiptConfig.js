export const receiptConfig = {
  store: {
    name: "TINY TOTS",
    subtitle: "Children's Apparel & Footwear",
    address: "Shop No 169, Street Jamia Marekazi, Masjid, Toba Tek Singh",
    phone: "0301-7278797",
    website: "www.tinytotsofficial.com",
  },

  // Used by the POS screen to compute tax on checkout.
  taxRatePercent: 5,

  toggles: {
    showSubtitle: true,
    showAddress: true,
    showPhone: true,
    showWebsite: true,

    showTax: true,
    showDiscount: true,

    showFooterMessage: true,
    showSocials: true,
  },

  footer: {
    thankYou: "Thank you for shopping!",
    policy: "Exchange within 7 days with original receipt.",
    socials: "Facebook • Instagram",
  },

  layout: {
    widthPx: 302, // 80mm thermal
    fontSize: 11,
  },
};