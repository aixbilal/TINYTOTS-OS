// Temporary read-only QA proxy. Serves the real dev server, but injects mock
// featured products / testimonials so signage layout can be measured against
// the reference composition. Delete after QA.
import http from "node:http";

const TARGET = "http://localhost:3001";
const PORT = 4020;

const svg = (body, w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

const denim = (index) => {
  const shades = ["#8fa7c4", "#243352", "#5d6a4a", "#b9a display", "#7c97b8", "#1c1c1c", "#4a5238", "#a8bdd6"];
  const fill = ["#8fa7c4", "#243352", "#5d6a4a", "#bcae8f", "#7c97b8", "#1c1c1c", "#4a5238", "#a8bdd6"][index % 8];
  void shades;
  return svg(
    `<rect width="300" height="400" fill="none"/>
     <path d="M95 30 h110 l14 250 h-52 l-17 -150 -17 150 h-52z" fill="${fill}"/>
     <rect x="95" y="30" width="110" height="18" fill="rgba(0,0,0,0.18)"/>`,
    300,
    400
  );
};

const avatar = (index) =>
  svg(
    `<rect width="200" height="200" fill="${index % 2 ? "#c9d3de" : "#e2d6c8"}"/>
     <circle cx="100" cy="78" r="34" fill="#8a7663"/>
     <path d="M28 200 c8 -52 40 -74 72 -74 s64 22 72 74z" fill="#6f5c4a"/>`,
    200,
    200
  );

const mockProducts = [
  "Relaxed Light Denim",
  "Dark Wash Straight",
  "Olive Cargo Pant",
  "Khaki Utility Pant",
  "Mid Blue Jogger",
  "Black Wide Leg",
  "Camo Cargo Pant",
  "Vintage Blue Jean",
].map((name, index) => ({
  id: index + 1,
  name,
  image_url: `/qa/product-${index}.svg`,
  category: "Denim",
}));

const mockTestimonials = [
  {
    name: "Ayesha M.",
    image_url: "/qa/avatar-0.svg",
    rating: 5,
    quote: "Amazing quality and perfect fit for my son. The fabric is so soft and comfortable!",
  },
  {
    name: "Zain R.",
    image_url: "/qa/avatar-1.svg",
    rating: 5,
    quote: "TinyTots never disappoints! Stylish, durable and my kids love wearing them.",
  },
];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (!url.pathname.startsWith("/_next/static")) console.log(req.method, url.pathname + url.search);

  const product = url.pathname.match(/^\/qa\/product-(\d+)\.svg$/);
  if (product) {
    res.writeHead(200, { "content-type": "image/svg+xml" });
    res.end(denim(Number(product[1])));
    return;
  }
  const av = url.pathname.match(/^\/qa\/avatar-(\d+)\.svg$/);
  if (av) {
    res.writeHead(200, { "content-type": "image/svg+xml" });
    res.end(avatar(Number(av[1])));
    return;
  }

  if (url.pathname === "/api/campaign/active") {
    const upstream = await fetch(`${TARGET}${url.pathname}${url.search}`, { headers: { accept: "application/json" } });
    const payload = await upstream.json();
    payload.featured_products = mockProducts;
    payload.testimonials = mockTestimonials;
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify(payload));
    return;
  }

  const headers = { ...req.headers };
  delete headers.host;
  delete headers["accept-encoding"];
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await new Promise((resolve) => {
          const chunks = [];
          req.on("data", (chunk) => chunks.push(chunk));
          req.on("end", () => resolve(Buffer.concat(chunks)));
        });

  try {
    const upstream = await fetch(`${TARGET}${url.pathname}${url.search}`, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });
    const out = Object.fromEntries(upstream.headers.entries());
    delete out["content-encoding"];
    delete out["content-length"];
    delete out["transfer-encoding"];
    res.writeHead(upstream.status, out);
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    res.writeHead(502, { "content-type": "text/plain" });
    res.end(String(error));
  }
});

server.listen(PORT, () => console.log(`QA proxy on http://localhost:${PORT}`));
