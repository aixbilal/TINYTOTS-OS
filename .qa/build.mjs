// Temporary QA harness builder. Dumps the real rendered signage DOM, then
// injects reference-matching content (8 product cards, 2 testimonials) plus a
// measurement probe so layout can be measured at exactly 1920x1080.
// Read-only with respect to the app: nothing here is imported by the product.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ORIGIN = "http://localhost:3001";

const dom = execFileSync(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--window-size=1920,1080",
    "--virtual-time-budget=15000",
    "--dump-dom",
    `${ORIGIN}/signage`,
  ],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
);

const prefixMatch = dom.match(/([a-zA-Z0-9_-]*signage-module__[A-Za-z0-9_-]+?__)stage/);
if (!prefixMatch) throw new Error("could not find signage css module prefix");
const P = prefixMatch[1];
const c = (name) => `${P}${name}`;

const denimSvg = (index) => {
  const fill = ["#8fa7c4", "#243352", "#5d6a4a", "#bcae8f", "#7c97b8", "#1c1c1c", "#4a5238", "#a8bdd6"][index % 8];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'><path d='M95 30h110l14 250h-52l-17-150-17 150h-52z' fill='${fill}'/><rect x='95' y='30' width='110' height='18' fill='rgba(0,0,0,.18)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const avatarSvg = (index) => {
  const bg = index % 2 ? "#c9d3de" : "#e2d6c8";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='${bg}'/><circle cx='100' cy='78' r='34' fill='#8a7663'/><path d='M28 200c8-52 40-74 72-74s64 22 72 74z' fill='#6f5c4a'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const heart = `<svg class="${c("icon")} ${c("favorite")}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
const arrow = (dir) =>
  `<svg class="${c("icon")}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="${
    dir === "left" ? "M19 12H5M12 19l-7-7 7-7" : "M5 12h14M12 5l7 7-7 7"
  }"/></svg>`;

const productCards = Array.from({ length: 8 })
  .map(
    (_, index) =>
      `<div class="${c("productCard")}"><img src="${denimSvg(index)}" alt="" draggable="false">${heart}</div>`
  )
  .join("");

const testimonialCard = (index, name, quote) =>
  `<article class="${c("testimonialCard")}"><div class="${c("avatar")}"><img src="${avatarSvg(
    index
  )}" alt=""></div><div><div class="${c("stars")}">★★★★★</div><p class="${c(
    "customerName"
  )}">${name}</p><p class="${c("quote")}">${quote}</p></div></article>`;

const testimonials = `<section class="${c("testimonials")}"><h2 class="${c(
  "testimonialTitle"
)}">Loved by Parents</h2><div class="${c("testimonialRow")}"><button class="${c("arrow")}">${arrow(
  "left"
)}</button><div class="${c("testimonialCards")}">${testimonialCard(
  0,
  "Ayesha M.",
  "Amazing quality and perfect fit for my son. The fabric is so soft and comfortable!"
)}${testimonialCard(
  1,
  "Zain R.",
  "TinyTots never disappoints! Stylish, durable and my kids love wearing them."
)}</div><button class="${c("arrow")}">${arrow("right")}</button></div><div class="${c(
  "dots"
)}"><span class="${c("dot")} ${c("activeDot")}"></span><span class="${c("dot")}"></span><span class="${c(
  "dot"
)}"></span></div></section>`;

let html = dom;

// Absolute asset base so the live stylesheet is used.
html = html.replace(/<head>/, `<head><base href="${ORIGIN}/">`);

// Inject product cards into both marquee groups.
const groupRe = new RegExp(`(<div class="${c("marqueeGroup")}"[^>]*>)</div>`, "g");
html = html.replace(groupRe, (_m, open) => `${open}${productCards}</div>`);

// Replace the empty testimonials placeholder with reference content.
html = html.replace(
  new RegExp(`<section class="${c("testimonials")}"[^>]*></section>`),
  testimonials
);

// Content parity with the reference so only layout/typography differences remain.
const setText = (cls, text) => {
  html = html.replace(new RegExp(`(<[a-z0-9]+ class="[^"]*${c(cls)}[^"]*"[^>]*>)([^<]*)(</)`), `$1${text}$3`);
};
setText("eyebrow", "AUTUMN 2026");
setText("subtitle", "Made for Active Kids");
setText("description", "Crafted from the finest fabrics for comfort, durability &amp; style.");
setText("featuredDescription", "Handpicked styles that kids love and parents trust.");
setText("badge", "Best Seller");
html = html.replace(
  new RegExp(`(<h1 class="[^"]*${c("heroHeading")}[^"]*"[^>]*>)[\\s\\S]*?(</h1>)`),
  "$1<span>Premium</span><span>Denim</span>$2"
);
const featureTitles = ["Premium Cotton", "Soft on Skin", "Built to Last"];
let featureIndex = 0;
html = html.replace(
  new RegExp(`(<div class="${c("feature")}">[\\s\\S]*?<span>)([^<]*)(</span>)`, "g"),
  (_m, open, _text, close) => `${open}${featureTitles[featureIndex++] || _text}${close}`
);
const trustCopy = [
  ["Trusted by 50,000+ Parents", "Quality you can rely on"],
  ["Premium Fabrics", "100% organic cotton"],
  ["Fast &amp; Reliable Delivery", "Nationwide shipping"],
  ["Soft on Sensitive Skin", "Gentle &amp; comfortable"],
  ["Easy Returns &amp; Exchanges", "Hassle-free returns"],
];
const trustItems = [...html.matchAll(new RegExp(`<div class="${c("trustItem")}">[\\s\\S]*?</div></div>`, "g"))].map(
  (m) => m[0]
);
if (trustItems.length) {
  const rebuilt = trustCopy
    .map((copy, index) => {
      const source = trustItems[index] || trustItems[0];
      return source
        .replace(new RegExp(`(class="${c("trustHeading")}">)[^<]*`), `$1${copy[0]}`)
        .replace(new RegExp(`(class="${c("trustDescription")}">)[^<]*`), `$1${copy[1]}`);
    })
    .join("");
  html = html.replace(
    new RegExp(`(<section class="${c("trust")}">)[\\s\\S]*?(</section>)`),
    `$1${rebuilt}$2`
  );
}
html = html.replace(/www\.tinytotsofficial\.com/g, "www.tinytots.pk");

// The live campaign has no QR asset; the reference does, so inject one.
if (!html.includes(c("qr"))) {
  const cells = [];
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      const on = finder ? (x % 6 === 0 || y % 6 === 0 || (x > 1 && x < 5 && y > 1 && y < 5)) : (x * 7 + y * 3) % 5 < 2;
      if (on) cells.push(`<rect x='${x}' y='${y}' width='1' height='1'/>`);
    }
  }
  const qr = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-1 -1 23 23'><rect x='-1' y='-1' width='23' height='23' fill='#fff'/><g fill='#000'>${cells.join("")}</g></svg>`
  )}`;
  html = html.replace(
    new RegExp(`(<div class="${c("social")}"[\\s\\S]*?)(</footer>)`),
    `$1<div class="${c("footerGroup")}"><strong>Scan to Shop</strong><div class="${c(
      "qr"
    )}"><img src="${qr}" alt=""></div></div>$2`
  );
}

// Drop dev scripts so the static harness stays inert, keep stylesheets.
html = html.replace(/<script[\s\S]*?<\/script>/g, "");

// Reference targets, measured from reference.png (1022x680 content box) and
// mapped to the 1920x1080 canvas: x by 1920/1022, y by 1080/680, text ink by
// the geometric mean of both (1.7275) so glyphs keep their aspect.
const REF_INK = {
  logo: 205.6,
  brandLine: 190,
  statNumber: 114,
  statDescription: 115.7,
  sectionHeading: 157,
  testimonialTitle: 226,
  customerName: 81.2,
  quote: 299,
  cta: 172.8,
};
const REF_BOX = {
  hero: { y: 0, h: 496.4 },
  featured: { y: 496.4, h: 220 },
  trust: { y: 716.4, h: 100.1, x: 67.6, w: 1785 },
  testimonials: { y: 816.5, h: 192.9 },
  footer: { y: 1009.4, h: 70.6 },
  heroCopy: { w: 535.4 },
  bannerColumn: { x: 535.4, w: 1068.2 },
  stats: { x: 1603.6, w: 316.4 },
  productCard: { w: 182, h: 173.4, y: 524.2 },
  testimonialCard: { x: 324.4, w: 622.6, y: 876, h: 101.6 },
  avatar: { w: 79.5 },
  arrow: { w: 57 },
  qr: { w: 88 },
  badge: { w: 79.5 },
  marquee: { x: 324.4 },
};

const probe = `
<pre id="qa-probe" style="display:none"></pre>
<script>
const REF_INK = ${JSON.stringify(REF_INK)};
const REF_BOX = ${JSON.stringify(REF_BOX)};
const targets = ${JSON.stringify([
  "canvas",
  "hero",
  "heroCopy",
  "logo",
  "brandLine",
  "eyebrow",
  "heroHeading",
  "divider",
  "subtitle",
  "description",
  "cta",
  "bannerColumn",
  "badge",
  "features",
  "feature",
  "stats",
  "stat",
  "statNumber",
  "statDescription",
  "featured",
  "sectionHeading",
  "featuredDescription",
  "featuredLink",
  "marquee",
  "productCard",
  "trust",
  "trustItem",
  "trustHeading",
  "trustDescription",
  "trustIcon",
  "testimonials",
  "testimonialTitle",
  "testimonialRow",
  "testimonialCards",
  "testimonialCard",
  "avatar",
  "stars",
  "customerName",
  "quote",
  "arrow",
  "footer",
  "social",
  "qr",
])};
const P = ${JSON.stringify(P)};
const canvas = document.querySelector("." + CSS.escape(P + "canvas"));
const cb = canvas.getBoundingClientRect();
// The harness may render in a viewport that is not exactly 1920 wide; the whole
// layout is proportional, so normalise every measurement back to 1920x1080.
const k = 1920 / cb.width;
const px = (v) => +(v * k).toFixed(1);
const out = { _viewport: [innerWidth, innerHeight], _canvas: [px(cb.width), px(cb.height)] };
const rows = [];
for (const name of targets) {
  const el = document.querySelector("." + CSS.escape(P + name));
  if (!el) { rows.push(name + ": MISSING"); continue; }
  const r = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  // Flex/grid children are blockified, so range rects return line boxes. Use
  // canvas text metrics instead for a true glyph advance width.
  const measure = (node) => {
    const s2 = getComputedStyle(node);
    let text = (node.textContent || "").trim().replace(/\\s+/g, " ");
    if (s2.textTransform === "uppercase") text = text.toUpperCase();
    const ctx2 = document.createElement("canvas").getContext("2d");
    ctx2.font = s2.fontWeight + " " + s2.fontSize + " " + s2.fontFamily;
    if ("letterSpacing" in ctx2) ctx2.letterSpacing = s2.letterSpacing === "normal" ? "0px" : s2.letterSpacing;
    return ctx2.measureText(text).width;
  };
  const ink = { width: measure(el), height: r.height };
  const parts = [
    name.padEnd(20),
    "x=" + String(px(r.x - cb.x)).padStart(7),
    "y=" + String(px(r.y - cb.y)).padStart(7),
    "w=" + String(px(r.width)).padStart(7),
    "h=" + String(px(r.height)).padStart(7),
    "font=" + px(parseFloat(s.fontSize)),
    "ink=" + px(ink.width) + "x" + px(ink.height),
  ];
  const box = REF_BOX[name];
  if (box) {
    const diffs = [];
    for (const key of ["x", "y", "w", "h"]) {
      if (box[key] === undefined) continue;
      const mine = key === "x" ? px(r.x - cb.x) : key === "y" ? px(r.y - cb.y) : key === "w" ? px(r.width) : px(r.height);
      diffs.push(key + "Δ" + (mine - box[key]).toFixed(1));
    }
    parts.push("BOX[" + diffs.join(" ") + "]");
  }
  if (REF_INK[name]) {
    const target = REF_INK[name];
    const mine = px(ink.width);
    parts.push("INK target=" + target + " ratio=" + (target / mine).toFixed(3) +
      " needFont=" + (px(parseFloat(s.fontSize)) * target / mine).toFixed(1));
  }
  rows.push(parts.join(" "));
}
rows.push("products=" + document.querySelectorAll("." + CSS.escape(P + "productCard")).length);
out._rows = rows;
document.getElementById("qa-probe").textContent = out._rows.join("\\n") +
  "\\nviewport=" + out._viewport.join("x") + " canvasNorm=" + out._canvas.join("x");
</script>`;

html = html.replace(/<\/body>/, `${probe}</body>`);

writeFileSync(new URL("./harness.html", import.meta.url), html);
console.log("harness.html written, css prefix:", P);
