import 'dotenv/config';
import { createNotification } from "./services/notifications.js";
import { recoverMissedReport } from "./services/recoveryService.js";
import { startCronJobs } from "./services/cronService.js";
import { generateDailyReport } from "./services/reportService.js";
import bcrypt from "bcryptjs";
process.on("exit", (code) => {
  console.log(`>>> PROCESS EXITING with code: ${code}`);
});
process.on("unhandledRejection", (reason) => {
  console.error(">>> UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error(">>> UNCAUGHT EXCEPTION:", err);
});
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import bwipjs from "bwip-js";
import pdfPrinterPkg from "pdf-to-printer";
const { print } = pdfPrinterPkg;
import { execFile } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeReceiptPdf } from "./lib/receiptPdf.js";
import { generateProductDescription } from "./lib/ai/productDescription.js";

dotenv.config();

const app = express();

// Local POS only — not internet-facing. POS_API_SECRET must match VITE_POS_API_SECRET.
const DEV_POS_FALLBACK_SECRET = "tinytots-local-pos-dev-token";
const FORBIDDEN_SECRETS = new Set([
  DEV_POS_FALLBACK_SECRET,
  "change-me-to-a-long-random-string",
]);
const isProd = process.env.NODE_ENV === "production";
const isEmbedded = process.env.POS_EMBEDDED === "1";
const requireRealSecret = isProd || isEmbedded;

const configuredSecret = (process.env.POS_API_SECRET || "").trim();

if (!configuredSecret) {
  if (requireRealSecret) {
    console.error(
      "FATAL: POS_API_SECRET is not set. Refusing to start without a shared secret " +
        "(production / embedded Electron)."
    );
    process.exit(1);
  }
  console.warn(
    "WARNING: POS_API_SECRET is unset — using the well-known dev default. " +
      "Set POS_API_SECRET in backend/.env (and matching VITE_POS_API_SECRET in the Electron root .env)."
  );
} else if (requireRealSecret && FORBIDDEN_SECRETS.has(configuredSecret)) {
  console.error(
    "FATAL: POS_API_SECRET is set to a known local-dev fallback. " +
      "Use a real secret that matches VITE_POS_API_SECRET."
  );
  process.exit(1);
}

const POS_API_SECRET = configuredSecret || DEV_POS_FALLBACK_SECRET;
const POS_TAX_RATE = Number(process.env.POS_TAX_RATE ?? 0);

app.use(
  cors({
    // Local POS only. Allow Vite dev, and packaged Electron (file:// / null origin).
    origin(origin, callback) {
      if (
        !origin ||
        origin === "null" ||
        origin.startsWith("file://") ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    allowedHeaders: ["Content-Type", "X-POS-Token"],
  })
);
app.use(express.json());

// Shared-secret gate on every mutating /api route so other local processes
// cannot call the service-role-backed endpoints even on the same machine.
app.use("/api", (req, res, next) => {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }
  const token = req.get("X-POS-Token") || "";
  if (!token || token !== POS_API_SECRET) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }
  return next();
});



// ----------------------------------------------------
// PATHS
// ----------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// When spawned by Electron, write under userData (extraResources / asar are not writable).
const DATA_ROOT = process.env.POS_DATA_DIR
  ? path.resolve(process.env.POS_DATA_DIR)
  : __dirname;

const RECEIPT_FOLDER = path.join(DATA_ROOT, "receipts");

if (!fs.existsSync(RECEIPT_FOLDER)) {
  fs.mkdirSync(RECEIPT_FOLDER, { recursive: true });
}

// Machine-local receipt-printer preference. Written by the Electron main
// process (Printer Settings screen) into userData/printer-config.json and
// read here so backend-side prints (receipt reprint) use the same printer
// the operator selected. There is NO fallback: if nothing is configured
// the caller must surface a clear error instead of guessing a printer.
const PRINTER_CONFIG_PATH = path.join(DATA_ROOT, "printer-config.json");

function resolveReceiptPrinter() {
  try {
    if (fs.existsSync(PRINTER_CONFIG_PATH)) {
      const cfg = JSON.parse(fs.readFileSync(PRINTER_CONFIG_PATH, "utf-8"));
      return (cfg?.receiptPrinter || "").trim();
    }
  } catch (err) {
    console.error("Failed to read printer-config.json:", err.message);
  }
  return "";
}

// Enumerate installed Windows printers. Uses PowerShell + compact JSON over
// scalar fields — deliberately NOT pdf-to-printer.getPrinters(), whose
// text parser throws on drivers whose long PrinterPaperNames list wraps the
// CIM output (the POS-80C receipt driver triggers exactly this).
function listSystemPrinters() {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        "Get-CimInstance Win32_Printer | Select-Object Name,Default | ConvertTo-Json -Compress",
      ],
      { windowsHide: true, maxBuffer: 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(err);
        try {
          const parsed = JSON.parse((stdout || "").trim() || "[]");
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          resolve(
            arr
              .filter((p) => p && p.Name)
              .map((p) => ({ name: p.Name, isDefault: !!p.Default }))
          );
        } catch (parseErr) {
          reject(parseErr);
        }
      }
    );
  });
}

// ----------------------------------------------------
// SUPABASE
// ----------------------------------------------------

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


// ----------------------------------------------------
// TEST CONNECTION
// ----------------------------------------------------

app.get("/api/test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("variants")
      .select(`
        id,
        product_id,
        price,
        stock,
        product:products(
          id,
          name,
          sku
        )
      `)
      .limit(5);

    if (error) throw error;

    res.json({
      success: true,
      message: "Connected to Supabase!",
      sample: data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true });
});

// ----------------------------------------------------
// GET PRODUCTS
// ----------------------------------------------------

app.get("/api/products", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("variants")
      .select(`
        id,
        product_id,
        color,
        size,
        price,
        stock,
        sku,
        public_code,
        discount_percent,
        product:products(
          id,
          name,
          sku,
          image_url
        )
      `);

    if (error) throw error;

    const products = data.map((item) => ({
      variant_id: item.id,
      product_id: item.product_id,
      sku: item.sku || item.product?.sku,
      public_code: item.public_code,
      base_sku: item.product?.sku,
      name: item.product?.name,
      image_url: item.product?.image_url || null,
      color: item.color,
      size: item.size,
      price: item.price,
      stock: item.stock,
      discount_percent: item.discount_percent !== undefined ? item.discount_percent : 0,
    }));

    res.json(products);
  } catch (err) {
    console.error("GET /api/products error:", err); // This prints the real error to your terminal!
    res.status(500).json({ success: false, error: err.message });
  }
});
// ---------------- SEARCH PRODUCTS ----------------
app.get("/api/products/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    const selectClause = `
      id, product_id, color, size, price, stock, sku,
      product:products!inner(id, name, sku, image_url)
    `;

    // Search 1: match on the variant's own SKU
    const bySku = await supabase
      .from("variants")
      .select(selectClause)
      .ilike("sku", `%${q}%`)
      .limit(20);
      const byPublicCode = await supabase
      .from("variants")
      .select(selectClause)
      .ilike("public_code", `%${q}%`)
      .limit(20);
    if (byPublicCode.error) throw byPublicCode.error;
    if (bySku.error) throw bySku.error;

    // Search 2: match on the parent product's name
    const byName = await supabase
      .from("variants")
      .select(selectClause)
      .ilike("product.name", `%${q}%`)
      .limit(20);
    if (byName.error) throw byName.error;

    // Merge + de-duplicate by variant id
    const merged = new Map();
    [...bySku.data, ...byName.data, ...byPublicCode.data].forEach((item) => {
      merged.set(item.id, item);
    });

    const results = Array.from(merged.values())
      .slice(0, 20)
      .map((item) => ({
        variant_id: item.id,
        product_id: item.product_id,
        sku: item.sku || item.product?.sku,
        name: item.product?.name,
        image_url: item.product?.image_url || null,
        color: item.color,
        size: item.size,
        price: item.price,
        stock: item.stock,
        discount_percent: item.discount_percent || 0,
      }));

    res.json(results);
  } catch (err) {
    console.error("Product search error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// HELPER
// ----------------------------------------------------

function money(value) {
  return Number(value).toFixed(2);
}

// ----------------------------------------------------
// CHECKOUT
// ----------------------------------------------------

app.post("/api/checkout", async (req, res) => {
  try {
    const {
      cart,
      cashier,
      paymentMethod = "cash",
      notes = "",
      client_sale_id,
      // Cashier-applied discount only — never trust client line prices / totals.
      manual_discount = 0,
      manual_discount_type = "flat",
    } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }
    if (!cashier || !cashier.trim()) {
      return res.status(400).json({ success: false, message: "Cashier name is required." });
    }
    if (!client_sale_id) {
      return res.status(400).json({ success: false, message: "client_sale_id is required." });
    }

    // Idempotency check — if this exact sale attempt already went through
    // (e.g. the response got lost on a flaky connection and the client
    // retried), return the original result instead of creating a duplicate.
    const { data: existingSale, error: existingErr } = await supabase
      .from("sales")
      .select("id, receipt_number, subtotal, discount, tax, total")
      .eq("client_sale_id", client_sale_id)
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (existingSale) {
      return res.json({
        success: true,
        sale_id: existingSale.id,
        receipt_number: existingSale.receipt_number,
        subtotal: Number(existingSale.subtotal),
        discount: Number(existingSale.discount),
        tax: Number(existingSale.tax),
        total: Number(existingSale.total),
        deduped: true,
      });
    }

    // Load authoritative prices + stock from DB (ignore client price fields).
    const variantIds = [...new Set(cart.map((item) => item.variant_id))];
    const { data: variants, error: variantsError } = await supabase
      .from("variants")
      .select(`
        id,
        price,
        stock,
        discount_percent,
        color,
        size,
        product:products(name)
      `)
      .in("id", variantIds);

    if (variantsError) throw variantsError;

    const variantById = Object.fromEntries((variants || []).map((v) => [v.id, v]));
    const pricedLines = [];

    for (const item of cart) {
      const qty = Number(item.qty);
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: "Invalid cart quantity." });
      }

      const variant = variantById[item.variant_id];
      if (!variant) {
        return res.status(400).json({ success: false, message: `Variant ${item.variant_id} not found.` });
      }

      const name = variant.product?.name || item.name || `Variant ${variant.id}`;
      if (variant.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `${name} (${variant.color} / ${variant.size}) has only ${variant.stock} item(s) left in stock.`,
        });
      }

      const unitPrice = Number(variant.price);
      const discountPercent = Number(variant.discount_percent) || 0;
      pricedLines.push({
        variant_id: variant.id,
        qty,
        unit_price: unitPrice,
        line_total: unitPrice * qty,
        discount_percent: discountPercent,
        name,
        color: variant.color,
        size: variant.size,
        stock: variant.stock,
      });
    }

    const subtotal = pricedLines.reduce((sum, line) => sum + line.line_total, 0);
    const autoDiscountAmount = pricedLines.reduce(
      (sum, line) => sum + line.line_total * (line.discount_percent / 100),
      0
    );
    const manualDiscountAmount =
      manual_discount_type === "percent"
        ? (subtotal * (Number(manual_discount) || 0)) / 100
        : Number(manual_discount) || 0;
    const discount = autoDiscountAmount + manualDiscountAmount;
    const taxableAmount = Math.max(subtotal - discount, 0);
    const tax = taxableAmount * POS_TAX_RATE;
    const total = taxableAmount + tax;

    // ---- NOTIFICATIONS: low stock / out of stock, based on what will
    //      remain after this sale goes through ----
    for (const line of pricedLines) {
      const remaining = line.stock - line.qty;
      if (remaining <= 0) {
        await createNotification({
          category: "inventory",
          priority: "critical",
          title: "Out of Stock",
          description: `${line.name} (${line.color || ""} ${line.size || ""}) just sold out.`,
          target_role: "admin",
          action_label: "View Product",
          action_type: "view_product",
          action_payload: { variantId: line.variant_id },
        });
      } else if (remaining <= 5) {
        await createNotification({
          category: "inventory",
          priority: "warning",
          title: "Low Stock",
          description: `${line.name} (${line.color || ""} ${line.size || ""}) has only ${remaining} unit(s) remaining.`,
          target_role: "admin",
          action_label: "View Product",
          action_type: "view_product",
          action_payload: { variantId: line.variant_id },
        });
      }
    }

    const receiptNumber = `TT-${Date.now()}`;

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([{
        receipt_number: receiptNumber,
        subtotal,
        discount,
        tax,
        total,
        status: "completed",
        cashier: cashier.trim(),
        payment_method: paymentMethod,
        notes,
        client_sale_id,
      }])
      .select()
      .single();

    if (saleError?.code === "23505") {
      // Race: another request with the same client_sale_id beat us to it
      // between our check above and this insert. Treat it the same way.
      const { data: raceSale } = await supabase
        .from("sales")
        .select("id, receipt_number, subtotal, discount, tax, total")
        .eq("client_sale_id", client_sale_id)
        .single();
      if (raceSale) {
        return res.json({
          success: true,
          sale_id: raceSale.id,
          receipt_number: raceSale.receipt_number,
          subtotal: Number(raceSale.subtotal),
          discount: Number(raceSale.discount),
          tax: Number(raceSale.tax),
          total: Number(raceSale.total),
          deduped: true,
        });
      }
    }
    if (saleError) throw saleError;

    const saleItems = pricedLines.map((line) => ({
      sale_id: sale.id,
      variant_id: line.variant_id,
      quantity: line.qty,
      unit_price: line.unit_price,
      line_total: line.line_total,
    }));

    // Stock is decremented once by the sale_items deduct_stock trigger — do not update variants here.
    const { error: itemError } = await supabase.from("sale_items").insert(saleItems);
    if (itemError) throw itemError;

    // ---- NOTIFICATIONS: sale completed, high-value sale, discount limit ----
    await createNotification({
      category: "sales",
      priority: "success",
      title: "Sale Completed",
      description: `Invoice #${receiptNumber} — Rs. ${Number(total).toFixed(0)} by ${cashier}.`,
      action_label: "View Receipt",
      action_type: "view_receipt",
      action_payload: { saleId: sale.id },
    });

    // High-value sale — tune this threshold to whatever counts as "high value" for your store
    const HIGH_VALUE_THRESHOLD = 10000;
    if (Number(total) >= HIGH_VALUE_THRESHOLD) {
      await createNotification({
        category: "sales",
        priority: "info",
        title: "High-Value Sale",
        description: `Invoice #${receiptNumber} — Rs. ${Number(total).toFixed(0)}.`,
        target_role: "admin",
        action_label: "View Receipt",
        action_type: "view_receipt",
        action_payload: { saleId: sale.id },
      });
    }

    // Discount exceeds allowed percentage (admin-only alert)
    const MAX_ALLOWED_DISCOUNT_PERCENT = 20;
    const discountPercent = subtotal > 0 ? (Number(discount) / subtotal) * 100 : 0;
    if (discountPercent > MAX_ALLOWED_DISCOUNT_PERCENT) {
      await createNotification({
        category: "sales",
        priority: "warning",
        title: "Discount Limit Exceeded",
        description: `Invoice #${receiptNumber} used a ${discountPercent.toFixed(0)}% discount (limit is ${MAX_ALLOWED_DISCOUNT_PERCENT}%).`,
        target_role: "admin",
        action_label: "View Receipt",
        action_type: "view_receipt",
        action_payload: { saleId: sale.id },
      });
    }

    res.json({
      success: true,
      sale_id: sale.id,
      receipt_number: receiptNumber,
      subtotal,
      discount,
      tax,
      total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// GENERATE 80MM RECEIPT PDF
// (kept as a downloadable/printable-on-demand PDF, e.g. for admin
// review or emailing a copy — NOT used by the checkout flow anymore.
// The checkout receipt is printed by Electron directly, which works
// with or without a network connection.)
// ----------------------------------------------------

async function generateReceiptPDF(sale_id) {
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("*")
    .eq("id", sale_id)
    .single();

  if (saleError) throw saleError;

  const { data: items, error: itemsError } = await supabase
    .from("sale_items")
    .select(`
      quantity,
      unit_price,
      variants (
        color,
        size,
        product:products (
          name
        )
      )
    `)
    .eq("sale_id", sale_id);

  if (itemsError) throw itemsError;

  let subtotal = 0;
  const mappedItems = (items || []).map((item) => {
    const qty = item.quantity;
    const price = item.unit_price;
    const lineTotal = qty * price;
    subtotal += lineTotal;
    const name = item.variants?.product?.name || "Item";
    const variant = [item.variants?.color, item.variants?.size].filter(Boolean).join(" / ");
    return { qty, name, lineTotal, variant };
  });

  return writeReceiptPdf(
    {
      id: sale.id,
      receiptNumber: sale.receipt_number,
      cashier: sale.cashier,
      created_at: sale.created_at,
      subtotal,
      discount: sale.discount || 0,
      tax: sale.tax,
      total: sale.total,
      paymentMethod: sale.payment_method || "cash",
      items: mappedItems,
    },
    RECEIPT_FOLDER
  );
}

// ----------------------------------------------------
// DOWNLOAD RECEIPT PDF
// ----------------------------------------------------

app.get("/api/receipt/:sale_id", async (req, res) => {

  try {

    const pdfPath = await generateReceiptPDF(
      req.params.sale_id
    );

    res.download(pdfPath);

  } catch (err) {

    console.error("Receipt Error:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

});
// ----------------------
// START SERVER
// ----------------------
const PORT = process.env.PORT || 3000;
// ----------------------------------------------------
// DASHBOARD SUMMARY
// Powers the "Today's Snapshot" bar on the main menu.
// ----------------------------------------------------

// ----------------------------------------------------
// DASHBOARD SUMMARY
// Powers the "Today's Snapshot" bar on the main menu.
// ----------------------------------------------------
app.get("/api/dashboard-summary", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Today's sales + transaction count
    const { data: todaysSales, error: salesError } = await supabase
      .from("sales")
      .select("total")
      .gte("created_at", startOfDay.toISOString());

    if (salesError) throw salesError;

    const totalSales = todaysSales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    );
    const transactions = todaysSales.length;

    // Low stock: variants at or below the threshold (default 5, adjustable)
    const LOW_STOCK_THRESHOLD = 5;
    const { data: lowStockRows, error: stockError } = await supabase
      .from("variants")
      .select("id", { count: "exact" })
      .lte("stock", LOW_STOCK_THRESHOLD);

    if (stockError) throw stockError;

    // Current month goal progress
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthGoal, error: goalError } = await supabase
      .from("goals")
      .select("target_amount")
      .eq("goal_type", "monthly_sales")
      .lte("period_start", monthStart.toISOString())
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    let goalProgressPct = null;
    if (!goalError && monthGoal?.target_amount) {
      const { data: monthSales, error: monthSalesError } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", monthStart.toISOString());

      if (!monthSalesError) {
        const monthTotal = monthSales.reduce(
          (sum, sale) => sum + Number(sale.total || 0),
          0
        );
        goalProgressPct = Math.min(
          100,
          Math.round((monthTotal / monthGoal.target_amount) * 100)
        );
      }
    }

    res.json({
      success: true,
      totalSalesToday: totalSales,
      transactionsToday: transactions,
      lowStockCount: lowStockRows?.length ?? 0,
      goalProgressPct,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// LOW STOCK LIST
// Powers the dedicated Low Stock page
// ----------------------------------------------------
app.get("/api/low-stock", async (req, res) => {
  try {
    const LOW_STOCK_THRESHOLD = 5;

    const { data, error } = await supabase
      .from("variants")
      .select(`
        id,
        size,
        color,
        stock,
        public_code,
        product:products(name, supplier_id, image_url)
      `)
      .lte("stock", LOW_STOCK_THRESHOLD)
      .order("stock", { ascending: true });

    if (error) throw error;

    const items = data.map((v) => ({
      variantId: v.id,
      name: v.product?.name || "Unknown item",
      size: v.size,
      color: v.color,
      stock: v.stock,
      publicCode: v.public_code,
      supplierId: v.product?.supplier_id || null,
      // Real primary product photo (products.image_url is kept in sync with the
      // primary product_images row). Additive: the Low Stock page ignores it;
      // the Dashboard low-stock list uses it as a thumbnail when present.
      imageUrl: v.product?.image_url || null,
    }));

    res.json({ success: true, items });
  } catch (err) {
    console.error("GET /api/low-stock error:", err);
    res.status(500).json({ success: false, message: "Failed to load low stock items." });
  }
});
// ----------------------------------------------------
// DYNAMIC INVENTORY
// ----------------------------------------------------

const LABEL_FOLDER = path.join(DATA_ROOT, "labels");
if (!fs.existsSync(LABEL_FOLDER)) {
  fs.mkdirSync(LABEL_FOLDER, { recursive: true });
}

// Deterministic 3-letter color code for SKUs (Maroon -> MRN, Black -> BLK, etc.)
const COLOR_CODE_OVERRIDES = {
  maroon: "MRN", black: "BLK", white: "WHT", olive: "OLV", sand: "SND",
  navy: "NVY", grey: "GRY", gray: "GRY", red: "RED", blue: "BLU",
  green: "GRN", yellow: "YLW", pink: "PNK", beige: "BEG", brown: "BRN",
};


// ----------------------------------------------------
// GET FULL INVENTORY (products + nested variants)
// ----------------------------------------------------
app.get("/api/inventory", async (req, res) => {
  try {
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (prodErr) throw prodErr;

    const { data: variants, error: varErr } = await supabase
      .from("variants")
      .select("*")
      .order("id", { ascending: true });
    if (varErr) throw varErr;

    // Store-assignment tags (catalog metadata; never stock). Grouped per
    // product so the inventory UI can show a subtle badge and preload the
    // Edit Product picker.
    const { data: locTags, error: tagErr } = await supabase
      .from("product_location_tags")
      .select("product_id, location_id");
    if (tagErr) throw tagErr;
    const tagsByProduct = new Map();
    for (const t of locTags || []) {
      if (!tagsByProduct.has(t.product_id)) tagsByProduct.set(t.product_id, []);
      tagsByProduct.get(t.product_id).push(t.location_id);
    }

    const result = products.map((p) => {
      const productVariants = variants.filter((v) => v.product_id === p.id);

      return {
        ...p,
        variants: productVariants,
        total_variants: productVariants.length,
        total_stock: productVariants.reduce((sum, v) => sum + (v.stock || 0), 0),
        location_ids: tagsByProduct.get(p.id) || [],
      };
    });

    res.json({ success: true, products: result });
  } catch (err) {
    console.error("Inventory fetch error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// STORE ASSIGNMENT (product <-> location tags)
//
// Catalog/operational metadata only. A product may be assigned to zero, one,
// or many rows of public.locations. This is NOT stock: it never reads or
// writes variants.stock, variant_location_stock, sales.location_id or
// orders.location_id. Writes go through this service (service_role); the
// renderer never touches Supabase directly. See migration
// product_location_tags.
// ----------------------------------------------------

// GET /api/locations — active store locations for the Store Assignment picker.
app.get("/api/locations", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("id, name, slug, city, region, is_active, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;

    const locations = (data || []).map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      city: l.city,
      region: l.region,
      // A single display label the UI can show as-is, e.g. "Tiny Tots — Toba Tek Singh".
      label: [l.name, l.city].filter(Boolean).join(" — "),
    }));
    res.json({ success: true, locations });
  } catch (err) {
    console.error("GET /api/locations error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Validate a client-supplied list of location ids for Store Assignment.
 * Returns { ok, ids, message }. `ids` is a de-duplicated array of positive
 * integers that all reference an existing, active public.locations row.
 * An empty input array is valid and means "no store assignment".
 */
async function validateLocationIds(raw) {
  if (raw === undefined || raw === null) return { ok: true, ids: undefined };
  if (!Array.isArray(raw)) {
    return { ok: false, message: "location_ids must be an array of location ids." };
  }
  const ids = [...new Set(raw.map((n) => Number(n)))];
  if (ids.some((n) => !Number.isInteger(n) || n <= 0)) {
    return { ok: false, message: "location_ids must be positive integers." };
  }
  if (ids.length === 0) return { ok: true, ids: [] };

  const { data, error } = await supabase
    .from("locations")
    .select("id")
    .in("id", ids)
    .eq("is_active", true);
  if (error) return { ok: false, message: error.message };

  const found = new Set((data || []).map((r) => r.id));
  const missing = ids.filter((n) => !found.has(n));
  if (missing.length) {
    return { ok: false, message: `Unknown or inactive location id(s): ${missing.join(", ")}.` };
  }
  return { ok: true, ids };
}

/**
 * Replace a product's store-assignment tags with exactly `ids`. Deletes the
 * rows that are no longer selected and inserts the new ones; untouched when
 * `ids` is undefined. Never touches stock, variants, price or images.
 */
async function replaceProductLocationTags(productId, ids) {
  if (ids === undefined) return;
  const { data: current, error: readErr } = await supabase
    .from("product_location_tags")
    .select("location_id")
    .eq("product_id", productId);
  if (readErr) throw readErr;

  const have = new Set((current || []).map((r) => r.location_id));
  const want = new Set(ids);
  const toAdd = [...want].filter((n) => !have.has(n));
  const toRemove = [...have].filter((n) => !want.has(n));

  if (toRemove.length) {
    const { error } = await supabase
      .from("product_location_tags")
      .delete()
      .eq("product_id", productId)
      .in("location_id", toRemove);
    if (error) throw error;
  }
  if (toAdd.length) {
    const { error } = await supabase
      .from("product_location_tags")
      .insert(toAdd.map((location_id) => ({ product_id: productId, location_id })));
    if (error) throw error;
  }
}

// ----------------------------------------------------
// AI PRODUCT DESCRIPTION (Groq primary -> one Gemini fallback)
// ----------------------------------------------------
// Server-side only: provider keys live in backend/.env (GROQ_API_KEY,
// GEMINI_PRODUCT_DESCRIPTION_API_KEY) and never reach the renderer. The
// mutating /api middleware already enforces X-POS-Token on this POST.
// Lightweight in-process limiter — this is a single local terminal, not a
// public API, so no Redis/Upstash.
const AI_DESC_WINDOW_MS = 60_000;
const AI_DESC_MAX_PER_WINDOW = 6;
let aiDescHits = [];

app.post("/api/products/generate-description", async (req, res) => {
  const now = Date.now();
  aiDescHits = aiDescHits.filter((t) => now - t < AI_DESC_WINDOW_MS);
  if (aiDescHits.length >= AI_DESC_MAX_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      message: "Too many description requests. Wait a moment and try again.",
    });
  }
  aiDescHits.push(now);

  try {
    const result = await generateProductDescription(req.body || {});
    if (!result.ok) {
      return res
        .status(result.status || 502)
        .json({ success: false, message: result.message });
    }
    return res.json({ success: true, description: result.description });
  } catch (err) {
    console.error("POST /api/products/generate-description error:", err.message);
    return res.status(502).json({
      success: false,
      message:
        "Description generation is temporarily unavailable. You can write the description manually.",
    });
  }
});

// ----------------------------------------------------
// CREATE PRODUCT + AUTO-GENERATE VARIANT MATRIX
// ----------------------------------------------------
// ----------------------------------------------------
// HELPER FUNCTION (Prevents crashes if colorCode is missing)
// ----------------------------------------------------
function colorCode(color) {
  if (!color) return "GEN";
  // Safe fallback: uses the first 3 letters of the color name safely
  return color.toString().replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
}

// ----------------------------------------------------
// CREATE PRODUCT & VARIANTS
// ----------------------------------------------------
app.post("/api/products", async (req, res) => {
  try {
    const {
      name, brand, category, sku, hsn_code, unit, description, image_url,
      cost_price, selling_price, discount_percent, initialStock, stock, colors = [], sizes = [],
      variantStocks = {}, location_ids,
    } = req.body;

    // 1. Strict validation (No variantGroups references allowed here!)
    if (!name || !sku) {
      return res.status(400).json({ success: false, message: "Product name and SKU are required." });
    }
    if (!colors || !colors.length || !sizes || !sizes.length) {
      return res.status(400).json({ success: false, message: "Add at least one color and one size." });
    }

    // Store Assignment (optional). Validate BEFORE any insert so a bad
    // location id can never leave a half-created product behind.
    const locCheck = await validateLocationIds(location_ids);
    if (!locCheck.ok) {
      return res.status(400).json({ success: false, message: locCheck.message });
    }

    const cleanSku = sku.trim().toUpperCase();

    // 2. Check if base SKU exists
    const { data: existing, error: existingErr } = await supabase
      .from("products")
      .select("id")
      .eq("sku", cleanSku)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `SKU "${cleanSku}" is already used by another product. Choose a different Base SKU.`,
      });
    }

    // 2b. Normalize category to an existing categories.name when there's a
    // case-insensitive match, so a product typed as "shirts" on the POS still
    // lines up with the "Shirts" collection on the website / admin. If there's
    // no match we keep what was typed (POS staff must not be blocked mid-sale).
    let normalizedCategory = category;
    if (category && category.trim()) {
      const { data: cats } = await supabase.from("categories").select("name");
      const hit = (cats || []).find(
        (c) => c.name.toLowerCase() === category.trim().toLowerCase()
      );
      if (hit) normalizedCategory = hit.name;
    }

    // 3. Insert Product safely
    const { data: product, error: prodErr } = await supabase
      .from("products")
      .insert([{
        name, brand, category: normalizedCategory, sku: cleanSku, hsn_code,
        unit: unit || "Pcs", description, image_url, status: "active",
        cost_price: Number(cost_price) || 0,
        selling_price: Number(selling_price) || 0,
      }])
      .select()
      .single();
      
    if (prodErr) {
      if (prodErr.code === "23505") {
        return res.status(409).json({ success: false, message: `SKU "${cleanSku}" is already in use.` });
      }
      throw prodErr;
    }

    // Determine fallback stock
    const fallbackStock = Number(stock !== undefined ? stock : (initialStock !== undefined ? initialStock : 0));

    // Generate variant rows securely
    const basePrice = Number(selling_price) || 0;
    const discountPct = Number(discount_percent) || 0;
    const discountedPrice = Math.round(basePrice * (1 - discountPct / 100) * 100) / 100;

    const variantRows = [];
    for (const color of colors) {
      for (const size of sizes) {
        const key = `${color}__${size}`;
        // Safe check for variant stock
        const stockForThis = variantStocks?.[key] !== undefined ? variantStocks[key] : fallbackStock;
        
        variantRows.push({
          product_id: product.id,
          color,
          size,
          base_price: basePrice,
          discount_percent: discountPct,
          price: discountedPrice,
          cost_price: Number(cost_price) || 0,
          stock: Number(stockForThis) || 0,
          sku: `${cleanSku}-${colorCode(color)}-${size}`.toUpperCase(),
          status: "active",
        });
      }
    }

    // 4. Bulk insert variants
    const { data: variants, error: varErr } = await supabase
      .from("variants")
      .insert(variantRows)
      .select();

    if (varErr || !variants || variants.length !== variantRows.length) {
      // Rollback on failure
      if (variants?.length) {
        await supabase.from("variants").delete().in("id", variants.map(v => v.id));
      }
      await supabase.from("products").delete().eq("id", product.id);
      throw new Error(varErr?.message || "Failed to save all variants. Action rolled back.");
    }

    // 5. Assign unique public codes safely
    await Promise.all(
      variants.map((v) =>
        supabase.from("variants").update({ public_code: `V-${v.id}` }).eq("id", v.id)
      )
    );
    variants.forEach((v) => { v.public_code = `V-${v.id}`; });

    // Store Assignment tags. The product + variants are already committed and
    // correct; a tag write failure here must NOT discard them. Report it so
    // the operator can re-save the assignment from Edit Product.
    let locationIds = locCheck.ids ?? [];
    let locationWarning = null;
    if (locCheck.ids && locCheck.ids.length) {
      try {
        await replaceProductLocationTags(product.id, locCheck.ids);
      } catch (tagErr) {
        console.error("Create product: store-assignment write failed:", tagErr);
        locationIds = [];
        locationWarning =
          "The product was saved, but its store assignment could not be recorded. Re-apply it from Edit Product.";
      }
    }

    res.json({
      success: true,
      product,
      variants,
      location_ids: locationIds,
      ...(locationWarning ? { location_warning: locationWarning } : {}),
    });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// ----------------------------------------------------
// ADD VARIANTS TO AN EXISTING PRODUCT
// ----------------------------------------------------
app.post("/api/products/:id/variants", async (req, res) => {
  try {
    const { id } = req.params;
    const { colors, sizes, cost_price, price, discount_percent, initialStock, variantStocks } = req.body;

    if (!colors?.length || !sizes?.length) {
      return res.status(400).json({ success: false, message: "At least one color and one size are required." });
    }

    const { data: product, error: prodErr } = await supabase
      .from("products")
      .select("id, sku")
      .eq("id", id)
      .single();
    if (prodErr || !product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const basePrice = Number(price) || 0;
    const discountPct = Number(discount_percent) || 0;
    const discountedPrice = Math.round(basePrice * (1 - discountPct / 100) * 100) / 100;

    const variantRows = [];
    for (const color of colors) {
      for (const size of sizes) {
        const key = `${color}__${size}`;
        const stockForThis = variantStocks?.[key] ?? initialStock;
        variantRows.push({
          product_id: product.id,
          color,
          size,
          base_price: basePrice,
          discount_percent: discountPct,
          price: discountedPrice,
          cost_price: Number(cost_price) || 0,
          stock: Number(stockForThis) || 0,
          sku: `${product.sku}-${colorCode(color)}-${size}`.toUpperCase(),
          status: "active",
        });
      }
    }

    const { data: variants, error: varErr } = await supabase
      .from("variants")
      .insert(variantRows)
      .select();

    if (varErr || !variants || variants.length !== variantRows.length) {
      if (variants?.length) {
        await supabase.from("variants").delete().in("id", variants.map((v) => v.id));
      }
      throw new Error(varErr?.message || "Failed to add all variants. Nothing was saved — please try again.");
    }

    await Promise.all(
      variants.map((v) => supabase.from("variants").update({ public_code: `V-${v.id}` }).eq("id", v.id))
    );
    variants.forEach((v) => { v.public_code = `V-${v.id}`; });

    res.json({ success: true, variants });
  } catch (err) {
    console.error("Add variants error:", err);
    if (err.code === "23505" || /duplicate key/i.test(err.message || "")) {
      return res.status(409).json({ success: false, message: "One of those color/size combinations already exists for this product." });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// UPDATE PRODUCT INFO
// ----------------------------------------------------
app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, category, hsn_code, unit, description, image_url, status, cost_price, selling_price, location_ids } = req.body;

    // Store Assignment is optional and independent of every other field:
    // omitting location_ids leaves the existing assignment untouched; sending
    // an array (including []) replaces it. It never affects stock, variants,
    // price, SKU, barcode, images, description or category.
    const locCheck = await validateLocationIds(location_ids);
    if (!locCheck.ok) {
      return res.status(400).json({ success: false, message: locCheck.message });
    }

    const fieldsToUpdate = {
      name, brand, category, hsn_code, unit, description, image_url, status,
      cost_price: cost_price !== undefined ? Number(cost_price) : undefined,
      selling_price: selling_price !== undefined ? Number(selling_price) : undefined,
    };
    Object.keys(fieldsToUpdate).forEach((k) => fieldsToUpdate[k] === undefined && delete fieldsToUpdate[k]);

    let product = null;
    if (Object.keys(fieldsToUpdate).length) {
      const { data, error } = await supabase
        .from("products")
        .update(fieldsToUpdate)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      product = data;
    } else {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) throw error;
      product = data;
    }

    if (locCheck.ids !== undefined) {
      await replaceProductLocationTags(Number(id), locCheck.ids);
    }

    const { data: tags } = await supabase
      .from("product_location_tags")
      .select("location_id")
      .eq("product_id", id);

    res.json({
      success: true,
      product,
      location_ids: (tags || []).map((t) => t.location_id),
    });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// DELETE PRODUCT
// ----------------------------------------------------
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from("variants").delete().eq("product_id", id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// PRODUCT IMAGES (upload / delete / set-primary / list)
// Shared with the web storefront — same Supabase project, same
// 'product_images' table and 'product-images' Storage bucket, so photos
// added here from the POS show up on the website immediately, and photos
// added from the admin website show up here too.
//
// NOTE: add `import multer from "multer";` to the top of server.js
// alongside the other imports — ES module imports can't live mid-file.
// ----------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matches the Storage bucket's own limit
});

const IMAGE_BUCKET = "product-images";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function publicUrlForImage(storagePath) {
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// Keeps products.image_url pointing at whichever image is currently primary,
// exactly matching the web admin's sync logic — this is what makes the
// storefront (which just reads products.image_url as a fallback) always
// show something reasonable even before its own gallery loads.
async function syncPrimaryImageUrl(productId) {
  const { data: primary } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId)
    .eq("is_primary", true)
    .maybeSingle();

  const imageUrl = primary ? publicUrlForImage(primary.storage_path) : null;

  const { error } = await supabase
    .from("products")
    .update({ image_url: imageUrl })
    .eq("id", productId);

  if (error) {
    console.error(`syncPrimaryImageUrl FAILED for product ${productId}:`, error);
  }
}

// GET /api/products/:id/images — list all images for a product
app.get("/api/products/:id/images", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("product_images")
    .select("id, storage_path, is_primary, sort_order, created_at")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  if (error) return res.status(500).json({ success: false, error: error.message });

  const withUrls = (data || []).map((img) => ({
    ...img,
    url: publicUrlForImage(img.storage_path),
  }));

  res.json({ success: true, data: withUrls });
});

// POST /api/products/:id/images — upload a new image
// multipart/form-data: "file" field (required), "is_primary" ("true"/"false", optional)
app.post("/api/products/:id/images", upload.single("file"), async (req, res) => {
  const { id: productId } = req.params;

  try {
    const file = req.file;
    const makePrimary = req.body.is_primary === "true";

    if (!file) {
      return res.status(400).json({ success: false, error: "No file provided" });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ success: false, error: "Only JPEG, PNG, or WebP images are allowed" });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const ext = file.mimetype === "image/png" ? "png" : file.mimetype === "image/webp" ? "webp" : "jpg";
    const storagePath = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) {
      return res.status(500).json({ success: false, error: uploadError.message });
    }

    const { count: existingCount } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    const shouldBePrimary = makePrimary || !existingCount;

    if (shouldBePrimary) {
      await supabase
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId)
        .eq("is_primary", true);
    }

    const { data: inserted, error: insertError } = await supabase
      .from("product_images")
      .insert([
        {
          product_id: productId,
          storage_path: storagePath,
          is_primary: shouldBePrimary,
          sort_order: existingCount ?? 0,
        },
      ])
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from(IMAGE_BUCKET).remove([storagePath]);
      return res.status(500).json({ success: false, error: insertError.message });
    }

    if (shouldBePrimary) {
      await syncPrimaryImageUrl(productId);
    }

    res.status(201).json({
      success: true,
      data: { ...inserted, url: publicUrlForImage(storagePath) },
    });
  } catch (err) {
    console.error("POST /api/products/:id/images crashed:", err);
    res.status(500).json({ success: false, error: err.message || "Unexpected server error" });
  }
});

// PATCH /api/products/:id/images — set primary, or reorder
// Body: { image_id, action: "set_primary" } OR { order: [image_id, ...] }
app.patch("/api/products/:id/images", async (req, res) => {
  const { id: productId } = req.params;
  const { action, image_id, order } = req.body;

  try {
    if (action === "set_primary" && image_id) {
      await supabase
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId)
        .eq("is_primary", true);

      const { error } = await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", image_id)
        .eq("product_id", productId);

      if (error) return res.status(500).json({ success: false, error: error.message });

      await syncPrimaryImageUrl(productId);
      return res.json({ success: true });
    }

    if (Array.isArray(order)) {
      for (let i = 0; i < order.length; i++) {
        await supabase
          .from("product_images")
          .update({ sort_order: i })
          .eq("id", order[i])
          .eq("product_id", productId);
      }
      return res.json({ success: true });
    }

    res.status(400).json({
      success: false,
      error: "Provide either { action: 'set_primary', image_id } or { order: [...] }",
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || "Invalid request body" });
  }
});

// DELETE /api/products/:id/images?image_id=123
app.delete("/api/products/:id/images", async (req, res) => {
  const { id: productId } = req.params;
  const { image_id: imageId } = req.query;

  if (!imageId) {
    return res.status(400).json({ success: false, error: "image_id query param is required" });
  }

  const { data: image, error: fetchError } = await supabase
    .from("product_images")
    .select("id, storage_path, is_primary")
    .eq("id", imageId)
    .eq("product_id", productId)
    .single();

  if (fetchError || !image) {
    return res.status(404).json({ success: false, error: "Image not found" });
  }

  const { error: deleteRowError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (deleteRowError) {
    return res.status(500).json({ success: false, error: deleteRowError.message });
  }

  await supabase.storage.from(IMAGE_BUCKET).remove([image.storage_path]);

  if (image.is_primary) {
    const { data: nextImage } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextImage) {
      await supabase.from("product_images").update({ is_primary: true }).eq("id", nextImage.id);
    }

    await syncPrimaryImageUrl(productId);
  }

  res.json({ success: true });
});

// ----------------------------------------------------
// UPDATE A SINGLE VARIANT (stock, price, status)
// ----------------------------------------------------
app.put("/api/variants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, price, cost_price, status, base_price, discount_percent } = req.body;

    const update = { status };

    if (stock !== undefined) {
      const stockNum = Number(stock);
      if (!Number.isFinite(stockNum) || stockNum < 0) {
        return res.status(400).json({
          success: false,
          error: "stock must be a non-negative number",
        });
      }
      update.stock = stockNum;
    }

    if (cost_price !== undefined) {
      const costNum = Number(cost_price);
      if (!Number.isFinite(costNum) || costNum < 0) {
        return res.status(400).json({
          success: false,
          error: "cost_price must be a non-negative number",
        });
      }
      update.cost_price = costNum;
    }

    if (base_price !== undefined || discount_percent !== undefined) {
      const { data: current } = await supabase.from("variants").select("base_price").eq("id", id).single();
      const bp = base_price !== undefined ? Number(base_price) : Number(current?.base_price || 0);
      const dp = discount_percent !== undefined ? Number(discount_percent) : 0;
      if (!Number.isFinite(bp) || bp < 0 || !Number.isFinite(dp) || dp < 0) {
        return res.status(400).json({
          success: false,
          error: "base_price and discount_percent must be non-negative numbers",
        });
      }
      update.base_price = bp;
      update.discount_percent = dp;
      update.price = Math.round(bp * (1 - dp / 100) * 100) / 100;
    } else if (price !== undefined) {
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        return res.status(400).json({
          success: false,
          error: "price must be a non-negative number",
        });
      }
      update.price = priceNum;
      update.base_price = priceNum;
      update.discount_percent = 0;
    }

    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const { data, error } = await supabase
      .from("variants")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, variant: data });
  } catch (err) {
    console.error("Update variant error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// DELETE A SINGLE VARIANT
// ----------------------------------------------------
app.delete("/api/variants/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("variants").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// LIST INSTALLED PRINTERS
// ----------------------------------------------------
app.get("/api/printers", async (req, res) => {
  try {
    console.log("Attempting to fetch system printers...");

    // Real installed printers only — never fabricate entries. An empty
    // list is a valid answer (no printers installed).
    const printers = await listSystemPrinters();

    res.json({ success: true, printers });
  } catch (err) {
    console.error("Printer list error:", err);
    res.status(500).json({
      success: false,
      message: "Couldn't read the installed printers on this machine.",
      printers: [],
    });
  }
});
// ----------------------------------------------------
// GENERATE + PRINT (or download) VARIANT LABELS
// ----------------------------------------------------
app.post("/api/print-labels", async (req, res) => {
  try {
    const {
      variantIds, codeType = "qr", printerName,
      labelWidthMm = 46, // Reduced from 50 to 46 to create a safety margin for the printer alignment
      labelHeightMm = 30,
      quantities = {},
    } = req.body;

    const truncateText = (text, font, size, maxWidth) => {
      let width = font.widthOfTextAtSize(text, size);
      if (width <= maxWidth) return text;

      let truncated = text;
      while (truncated.length > 0 && width > maxWidth) {
        truncated = truncated.slice(0, -1);
        width = font.widthOfTextAtSize(truncated + "...", size);
      }
      return truncated + "...";
    };

    if (!variantIds?.length) {
      return res.status(400).json({ success: false, message: "No variants selected." });
    }

    const { data: variants, error } = await supabase
    .from("variants")
    .select(`id, color, size, price, sku, public_code, stock, product:products(name, sku)`)
    .in("id", variantIds);
    if (error) throw error;

    // mm -> pt (72 pt per inch, 25.4mm per inch)
    const mmToPt = (mm) => (mm / 25.4) * 72;
    const pageW = mmToPt(labelWidthMm);
    const pageH = mmToPt(labelHeightMm);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const v of variants) {
      const override = quantities[v.id];
      const copies = override != null
        ? Math.max(0, parseInt(override, 10) || 0)
        : Math.max(0, v.stock ?? 0);

      for (let i = 0; i < copies; i++) {
        const page = pdfDoc.addPage([pageW, pageH]);
        const codeValue = v.public_code || `V-${v.id}`;

   // ---- generate the code image as PNG bytes ----
   let codeImage;
   let codeIsSquare = codeType === "qr";

   if (codeType === "qr") {
     // Generate the base64 Data URL
     const dataUrl = await QRCode.toDataURL(codeValue, { margin: 0, width: 300 });
     
     // Clean the string so it is pure Base64
     const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
     
     // Let pdf-lib natively decode the Base64 string (avoids buffer corruption)
     codeImage = await pdfDoc.embedPng(base64Data);
   } else {
     const barcodeBuffer = await bwipjs.toBuffer({
       bcid: "code128",
       text: codeValue,
       scale: 3,
       height: 10,
       includetext: false,
     });
     
     // Embed the raw barcode buffer
     codeImage = await pdfDoc.embedPng(barcodeBuffer);
   }

   const codeSize = codeIsSquare
     ? Math.min(pageW * 0.55, pageH * 0.65)
     : pageW * 0.8;
   const codeH = codeIsSquare ? codeSize : pageH * 0.35;
   const codeX = (pageW - codeSize) / 2;
   const codeY = pageH - codeH - mmToPt(3);

   // Draw the safely embedded image
   page.drawImage(codeImage, {
     x: codeX,
     y: codeY,
     width: codeIsSquare ? codeSize : codeSize,
     height: codeH,
   });

   const rawProductName = v.product?.name || "Product";
   const maxTextWidth = pageW - 8; 
   
   // Dynamic Font Scaling: Start at size 7.5, shrink down to 5 if needed to fit the text
   let nameSize = 7.5;
   let nameWidth = fontBold.widthOfTextAtSize(rawProductName, nameSize);
   
   while (nameWidth > maxTextWidth && nameSize > 5.2) {
     nameSize -= 0.3;
     nameWidth = fontBold.widthOfTextAtSize(rawProductName, nameSize);
   }

   // Truncate only if it STILL doesn't fit at the smallest readable size (5.2)
   const productName = truncateText(rawProductName, fontBold, nameSize, maxTextWidth);
   const finalNameWidth = fontBold.widthOfTextAtSize(productName, nameSize);

   page.drawText(productName, {
     x: (pageW - finalNameWidth) / 2, // Centered perfectly
     y: codeY - 9, // Slightly adjusted height for smaller fonts
     size: nameSize,
     font: fontBold,
   });

   const variantLine = `${v.size || ""} / ${v.color || ""}`.trim();
   const variantWidth = font.widthOfTextAtSize(variantLine, 6);
   page.drawText(variantLine, {
     x: (pageW - variantWidth) / 2,
     y: codeY - 20,
     size: 6,
     font,
   });

   const priceLine = `Rs. ${Number(v.price || 0).toFixed(0)}`;
   const priceWidth = fontBold.widthOfTextAtSize(priceLine, 7);
   page.drawText(priceLine, {
     x: (pageW - priceWidth) / 2,
     y: mmToPt(2),
     size: 7,
     font: fontBold,
   });
 }
}

const pdfBytes = await pdfDoc.save();
const fileName = `labels-${Date.now()}.pdf`;
const filePath = path.join(LABEL_FOLDER, fileName);
fs.writeFileSync(filePath, pdfBytes);

if (printerName) {
 await print(filePath, {
   printer: printerName,
   scale: "noscale",
 });
 return res.json({ success: true, printed: true, file: fileName });
}

// No printer specified — return it for download instead
res.download(filePath);
} catch (err) {
console.error("Label print error:", err);
res.status(500).json({ success: false, error: err.message });
}
});

// ============================================================
// Old Receipts + Performance & Goals routes
// ============================================================

// ---------- helpers ----------
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}
function dayLabel(d) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// ============================================================
// OLD RECEIPTS
// ============================================================

// ---------- GET /api/receipts?query=&from=&to=&page=1&pageSize=8 ----------
app.get("/api/receipts", async (req, res) => {
  try {
    const { query = "", from, to, page = 1, pageSize = 8 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const size = Math.max(parseInt(pageSize, 10) || 8, 1);
    const start = (pageNum - 1) * size;

    let q = supabase
      .from("sales")
      .select(
        "id, receipt_number, created_at, cashier, payment_method, total, sale_items(quantity)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (query) {
      q = q.or(`receipt_number.ilike.%${query}%,cashier.ilike.%${query}%`);
    }
    if (from) q = q.gte("created_at", new Date(from).toISOString());
    if (to) q = q.lte("created_at", new Date(to + "T23:59:59").toISOString());

    const { data, error, count } = await q.range(start, start + size - 1);
    if (error) throw error;

    const receipts = (data || []).map((r) => ({
      id: r.id,
      receiptId: r.receipt_number,
      dateTime: r.created_at,
      cashier: r.cashier,
      items: (r.sale_items || []).reduce((s, i) => s + Number(i.quantity || 0), 0),
      totalAmount: Number(r.total || 0),
      paymentMethod: r.payment_method,
    }));

    res.json({ success: true, receipts, total: count || 0, page: pageNum, pageSize: size });
  } catch (err) {
    console.error("GET /api/receipts error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- GET /api/receipts/:id ----------
app.get("/api/receipts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data: sale, error } = await supabase
      .from("sales")
      .select(
        `id, receipt_number, created_at, cashier, payment_method, subtotal, discount, tax, total,
         sale_items(quantity, unit_price, variants(sku, size, color, product:products(name)))`
      )
      .eq("id", id)
      .single();
    if (error) throw error;

    const items = (sale.sale_items || []).map((i) => ({
      name: `${i.variants?.product?.name || "Item"} - ${i.variants?.color || ""} (${i.variants?.size || ""})`,
      sku: i.variants?.sku,
      qty: i.quantity,
      price: Number(i.unit_price || 0),
      total: Number(i.unit_price || 0) * Number(i.quantity || 0),
    }));

    res.json({
      success: true,
      receipt: {
        id: sale.id,
        receiptId: sale.receipt_number,
        dateTime: sale.created_at,
        cashier: sale.cashier,
        paymentMethod: sale.payment_method,
        subtotal: Number(sale.subtotal || 0),
        discount: Number(sale.discount || 0),
        tax: Number(sale.tax || 0),
        total: Number(sale.total || 0),
        items,
      },
    });
  } catch (err) {
    console.error("GET /api/receipts/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- POST /api/receipts/:id/reprint ----------
app.post("/api/receipts/:id/reprint", async (req, res) => {
  try {
    const { id } = req.params;

    const printerName = resolveReceiptPrinter();
    if (!printerName) {
      return res.status(409).json({
        success: false,
        message:
          "No receipt printer is configured. Open Printer Settings and select your receipt printer.",
      });
    }
    let installedNames = null;
    try {
      installedNames = (await listSystemPrinters()).map((p) => p.name);
    } catch {
      installedNames = null; // discovery failed — don't block on availability
    }
    if (installedNames && !installedNames.includes(printerName)) {
      return res.status(409).json({
        success: false,
        message:
          "The configured receipt printer is not available. Open Printer Settings and select an installed printer.",
      });
    }

    const { data: sale, error } = await supabase.from("sales").select("*").eq("id", id).single();
    if (error) throw error;

    const pdfPath = path.join(RECEIPT_FOLDER, `${sale.receipt_number}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      // Fall back to regenerating it on demand instead of failing
      await generateReceiptPDF(sale.id);
    }
    await print(pdfPath, { printer: printerName, scale: "noscale" });
    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/receipts/:id/reprint error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- GET /api/receipts/:id/download ----------
app.get("/api/receipts/:id/download", async (req, res) => {
  try {
    const { id } = req.params;
    const { data: sale, error } = await supabase
      .from("sales")
      .select("id, receipt_number")
      .eq("id", id)
      .single();
    if (error) throw error;

    let pdfPath = path.join(RECEIPT_FOLDER, `${sale.receipt_number}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      pdfPath = await generateReceiptPDF(sale.id);
    }
    res.download(pdfPath, `${sale.receipt_number}.pdf`);
  } catch (err) {
    console.error("GET /api/receipts/:id/download error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// PERFORMANCE & GOALS
// ============================================================

app.get("/api/performance/summary", async (req, res) => {
  try {
    const range = req.query.range || "month";
    const now = new Date();

    let rangeStart, rangeEnd;
    if (range === "month") {
      rangeStart = startOfMonth(now);
      rangeEnd = endOfMonth(now);
    } else if (range === "3month") {
      rangeStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      rangeEnd = now;
    } else if (range === "6month") {
      rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      rangeEnd = now;
    } else if (range === "12month") {
      rangeStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      rangeEnd = now;
    } else if (range === "all") {
      const { data: firstSale, error: firstErr } = await supabase
        .from("sales")
        .select("created_at")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (firstErr) throw firstErr;
      rangeStart = firstSale ? new Date(firstSale.created_at) : startOfMonth(now);
      rangeEnd = now;
    } else {
      // fallback (old "week" behavior, kept for safety)
      rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      rangeEnd = now;
    }

    const lengthMs = rangeEnd - rangeStart;
    const prevEnd = new Date(rangeStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - lengthMs);

    // pull sales + nested items + nested category in ONE query — avoids
    // needing created_at on sale_items, which doesn't exist on that table
    const { data: currentSales, error: err1 } = await supabase
      .from("sales")
      .select(
        `id, total, created_at,
         sale_items(quantity, unit_price, variants(product_id, cost_price, product:products(category)))`
      )
      .gte("created_at", rangeStart.toISOString())
      .lte("created_at", rangeEnd.toISOString());
    if (err1) throw err1;

    const { data: prevSales, error: err2 } = await supabase
      .from("sales")
      .select("id, total, created_at")
      .gte("created_at", prevStart.toISOString())
      .lte("created_at", prevEnd.toISOString());
    if (err2) throw err2;

    const totalSales = (currentSales || []).reduce((s, r) => s + Number(r.total || 0), 0);
    const orders = (currentSales || []).length;
    const unitsSold = (currentSales || []).reduce(
      (s, r) => s + (r.sale_items || []).reduce((u, i) => u + Number(i.quantity || 0), 0),
      0
    );
    const aov = orders ? totalSales / orders : 0;
    const grossProfit = (currentSales || []).reduce((s, r) => {
      const itemsProfit = (r.sale_items || []).reduce((u, i) => {
        const costPrice = Number(i.variants?.cost_price ?? i.unit_price); // no negative-profit assumption if cost is missing
        return u + Number(i.quantity || 0) * (Number(i.unit_price || 0) - costPrice);
      }, 0);
      return s + itemsProfit;
    }, 0);

    const prevTotalSales = (prevSales || []).reduce((s, r) => s + Number(r.total || 0), 0);
    const prevOrders = (prevSales || []).length;
    const prevAov = prevOrders ? prevTotalSales / prevOrders : 0;

    const pctDelta = (curr, prev) => (prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0);

    const goalRow = await getActiveGoal(rangeStart, rangeEnd);
    const daysInRange = Math.round(lengthMs / (1000 * 60 * 60 * 24)) + 1;
    const dailyTarget = goalRow ? Number(goalRow.target_amount) / daysInRange : 0;

    const seriesMap = {};
    for (let i = 0; i < daysInRange; i++) {
      const d = new Date(rangeStart.getTime() + i * 86400000);
      seriesMap[fmtDate(d)] = { date: dayLabel(d), sales: 0, goal: Math.round(dailyTarget * (i + 1)) };
    }
    (currentSales || []).forEach((r) => {
      const key = r.created_at.slice(0, 10);
      if (seriesMap[key]) seriesMap[key].sales += Number(r.total || 0);
    });
    let running = 0;
    Object.keys(seriesMap)
      .sort()
      .forEach((k) => {
        running += seriesMap[k].sales;
        seriesMap[k].sales = Math.round(running);
      });
    const dailySeries = Object.keys(seriesMap)
      .sort()
      .map((k) => seriesMap[k]);

    // category breakdown — flatten from the already-fetched currentSales
    const catTotals = {};
    (currentSales || []).forEach((sale) => {
      (sale.sale_items || []).forEach((i) => {
        const cat = i.variants?.product?.category || "Others";
        catTotals[cat] = (catTotals[cat] || 0) + Number(i.quantity || 0) * Number(i.unit_price || 0);
      });
    });
    const catSum = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1;
    const categoryBreakdown = Object.entries(catTotals)
      .map(([name, value]) => ({ name, value: Math.round((value / catSum) * 1000) / 10 }))
      .sort((a, b) => b.value - a.value);

    // weekly heatmap
    const heatStart = startOfMonth(now);
    const heatmap = [];
    for (let w = 0; w < 5; w++) {
      const row = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(heatStart.getTime() + (w * 7 + d) * 86400000);
        if (day.getMonth() !== now.getMonth()) {
          row.push(null);
          continue;
        }
        const key = fmtDate(day);
        const daySales = (currentSales || [])
          .filter((r) => r.created_at.slice(0, 10) === key)
          .reduce((s, r) => s + Number(r.total || 0), 0);
        row.push(daySales);
      }
      heatmap.push(row);
    }

    res.json({
      success: true,
      kpis: {
        totalSales,
        orders,
        aov,
        unitsSold,
        grossProfit,
        deltas: {
          totalSales: pctDelta(totalSales, prevTotalSales),
          orders: pctDelta(orders, prevOrders),
          aov: pctDelta(aov, prevAov),
          unitsSold: pctDelta(unitsSold, 0),
          grossProfit: pctDelta(grossProfit, 0),
        },
      },
      dailySeries,
      categoryBreakdown,
      heatmap,
      goal: goalRow
        ? {
            target: Number(goalRow.target_amount),
            achieved: totalSales,
            remaining: Math.max(Number(goalRow.target_amount) - totalSales, 0),
            percent: Math.min(Math.round((totalSales / Number(goalRow.target_amount)) * 100), 999),
          }
        : null,
    });
  } catch (err) {
    console.error("performance/summary error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

async function getActiveGoal(rangeStart, rangeEnd) {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .lte("period_start", fmtDate(rangeEnd))
    .gte("period_end", fmtDate(rangeStart))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("getActiveGoal error:", error);
    return null;
  }
  return data;
}

// ---------- POST /api/goals ----------
app.post("/api/goals", async (req, res) => {
  try {
    const { goalType, targetAmount, month } = req.body;
    if (!targetAmount || !month) {
      return res.status(400).json({ success: false, error: "targetAmount and month are required" });
    }
    const [y, m] = month.split("-").map(Number);
    const periodStart = fmtDate(new Date(y, m - 1, 1));
    const periodEnd = fmtDate(new Date(y, m, 0));

    const { data, error } = await supabase
      .from("goals")
      .insert([
        {
          goal_type: goalType || "monthly_sales",
          target_amount: targetAmount,
          period_start: periodStart,
          period_end: periodEnd,
        },
      ])
      .select()
      .single();
    if (error) throw error;

    res.json({ success: true, goal: data });
  } catch (err) {
    console.error("POST /api/goals error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// AUTH ROUTES
// ============================================================

// ---------- POST /api/login ----------
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, username, password_hash, role")
      .eq("username", username.trim())
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    const passwordMatches = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    // ---- NOTIFICATIONS: employee login (admin feed) + personal login ----
    await createNotification({
      category: "employee",
      priority: "info",
      title: "Employee Login",
      description: `${user.name} logged in.`,
      target_role: "admin",
      action_label: "View Activity",
      action_type: "view_activity",
      action_payload: { username: user.username },
    });

    await createNotification({
      category: "employee",
      priority: "info",
      title: "You Logged In",
      description: `Welcome back, ${user.name}.`,
      target_username: user.username,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      // Sent to the renderer so it can cache a hash locally for offline
      // login. We never store the raw password anywhere.
      passwordHash: user.password_hash,
    });
  } catch (err) {
    console.error("POST /api/login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- POST /api/users (admin creates a new employee login) ----------
app.post("/api/users", async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password || !role) {
      return res.status(400).json({ success: false, message: "Name, username, password, and role are required." });
    }
    if (!["admin", "cashier"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'admin' or 'cashier'." });
    }

    const password_hash = bcrypt.hashSync(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([{ name, username: username.trim(), password_hash, role }])
      .select("id, name, username, role")
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ success: false, message: "That username is already taken." });
      }
      throw error;
    }

    // ---- NOTIFICATION: new employee account created ----
    await createNotification({
      category: "employee",
      priority: "info",
      title: "New Employee Account Created",
      description: `${data.name} (${data.role}) was added as an employee.`,
      target_role: "admin",
    });

    res.json({ success: true, user: data });
  } catch (err) {
    console.error("POST /api/users error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- GET /api/users (list employees, for an admin settings screen) ----------
app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, username, role, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, users: data });
  } catch (err) {
    console.error("GET /api/users error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- DELETE /api/users/:id (admin removes an employee) ----------
// Safety guards (server-authoritative — never rely on client confirmation):
//   1. The final remaining admin account can never be deleted.
//   2. Best-effort self-deletion block when the client cooperatively sends
//      acting_user_id (the current session model has no server-side user
//      identity, so this is a UX safety net, not a security boundary).
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const actingUserId =
      req.body?.acting_user_id ?? req.query?.acting_user_id ?? null;

    const { data: target, error: targetErr } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();
    if (targetErr) throw targetErr;
    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "That user no longer exists." });
    }

    if (
      actingUserId != null &&
      String(actingUserId) === String(target.id)
    ) {
      return res.status(400).json({
        success: false,
        message: "You can't delete your own account while signed in.",
      });
    }

    if (target.role === "admin") {
      const { count, error: countErr } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if (countErr) throw countErr;
      if ((count ?? 0) <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "Can't delete the last admin account. Create another admin first.",
        });
      }
    }

    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/users/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// DAILY REPORT RECIPIENTS
// ------------------------------------------------------------
// The daily sales report (backend/services/reportService.js) is generated
// once per day; delivery fans out to every is_active row in
// public.daily_report_recipients (see emailService.resolveReportRecipients).
// An empty list falls back to OWNER_EMAIL, so these endpoints are purely
// additive config — the report keeps working with zero rows.
// Mutations are already gated by the X-POS-Token middleware above.
// ============================================================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- GET /api/report-recipients ----------
app.get("/api/report-recipients", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("daily_report_recipients")
      .select("id, name, email, is_active, created_at, updated_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    res.json({ success: true, recipients: data, fallbackEmail: process.env.OWNER_EMAIL || null });
  } catch (err) {
    console.error("GET /api/report-recipients error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- POST /api/report-recipients ----------
app.post("/api/report-recipients", async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!email || !EMAIL_RE.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid email address is required." });
    }

    const { data, error } = await supabase
      .from("daily_report_recipients")
      .insert([{ name: name || null, email }])
      .select("id, name, email, is_active, created_at, updated_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ success: false, message: "That email is already on the list." });
      }
      throw error;
    }
    res.json({ success: true, recipient: data });
  } catch (err) {
    console.error("POST /api/report-recipients error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- PATCH /api/report-recipients/:id  (toggle active / rename) ----------
app.patch("/api/report-recipients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {};
    if (typeof req.body?.is_active === "boolean") patch.is_active = req.body.is_active;
    if (typeof req.body?.name === "string") patch.name = req.body.name.trim() || null;

    if (Object.keys(patch).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Nothing to update (is_active or name)." });
    }

    const { data, error } = await supabase
      .from("daily_report_recipients")
      .update(patch)
      .eq("id", id)
      .select("id, name, email, is_active, created_at, updated_at")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, message: "Recipient not found." });
    }
    res.json({ success: true, recipient: data });
  } catch (err) {
    console.error("PATCH /api/report-recipients/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- DELETE /api/report-recipients/:id ----------
app.delete("/api/report-recipients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("daily_report_recipients")
      .delete()
      .eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/report-recipients/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// CUSTOMERS (read-only)
// ------------------------------------------------------------
// Reuses the website's canonical `public.customers` table — the same
// identity the storefront populates via Supabase Auth signup. The POS
// never creates/edits/deletes customers; it only needs to see them and
// (later) associate a sale. auth_user_id is intentionally not exposed.
// ============================================================

// ---------- GET /api/customers?search=&limit= ----------
app.get("/api/customers", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const limit = Math.min(Number(req.query.limit) || 200, 500);

    let q = supabase
      .from("customers")
      .select("id, full_name, phone, email, orders_count, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (search) {
      const safe = search.replace(/[%,()]/g, " ");
      q = q.or(
        `full_name.ilike.%${safe}%,phone.ilike.%${safe}%,email.ilike.%${safe}%`
      );
    }

    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, customers: data || [] });
  } catch (err) {
    console.error("GET /api/customers error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- GET /api/customers/:id ----------
app.get("/api/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: customer, error } = await supabase
      .from("customers")
      .select("id, full_name, phone, email, orders_count, created_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }

    // Best-effort online order history from the canonical web `orders`
    // table. POS `sales` have no customer relationship yet, so only the
    // storefront orders are shown. Never fails the request.
    let recentOrders = [];
    try {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false })
        .limit(20);
      recentOrders = orders || [];
    } catch (histErr) {
      console.error("customer order history lookup failed:", histErr);
    }

    res.json({ success: true, customer, recentOrders });
  } catch (err) {
    console.error("GET /api/customers/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// NOTIFICATIONS
// ============================================================

// ---------- GET /api/notifications?role=admin&username=ahmed&limit=50 ----------
app.get("/api/notifications", async (req, res) => {
  try {
    const { role, username, limit = 50 } = req.query;
    if (!role) {
      return res.status(400).json({ success: false, message: "role is required" });
    }

    let q = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Number(limit));

    const orParts = [`target_role.is.null`, `target_role.eq.${role}`];
    if (username) orParts.push(`target_username.eq.${username}`);
    q = q.or(orParts.join(","));

    const { data, error } = await q;
    if (error) throw error;

    const unreadCount = data.filter((n) => !n.read).length;
    res.json({ success: true, notifications: data, unreadCount });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- PATCH /api/notifications/:id/read ----------
app.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- POST /api/notifications/mark-all-read ----------
app.post("/api/notifications/mark-all-read", async (req, res) => {
  try {
    const { role, username } = req.body;
    let q = supabase.from("notifications").update({ read: true });

    const orParts = [`target_role.is.null`, `target_role.eq.${role}`];
    if (username) orParts.push(`target_username.eq.${username}`);
    q = q.or(orParts.join(","));

    const { error } = await q;
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- DELETE /api/notifications (clear all visible to this user) ----------
app.delete("/api/notifications", async (req, res) => {
  try {
    const { role, username } = req.body;
    let q = supabase.from("notifications").delete();

    const orParts = [`target_role.is.null`, `target_role.eq.${role}`];
    if (username) orParts.push(`target_username.eq.${username}`);
    q = q.or(orParts.join(","));

    const { error } = await q;
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cron stays off in embedded mode (no 23:59 job inside the POS till).
// Standalone backend: recover then schedule crons as before.
if (!isEmbedded) {
  await recoverMissedReport();
  startCronJobs();
} else {
  console.log(
    "[POS] Embedded mode: WhatsApp webhook + cron jobs disabled; " +
      "missed daily report will be checked asynchronously after listen."
  );
}

// Start Express server — localhost only (not reachable from the LAN/internet)
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);

  // Packaged POS: on every launch, reuse recoverMissedReport() (report_history
  // gated — no duplicate emails). Fire-and-forget so /api/health and the UI
  // are not blocked while SMTP runs.
  if (isEmbedded) {
    void recoverMissedReport()
      .then(() => {
        console.log("[POS] Embedded missed-report check finished.");
      })
      .catch((err) => {
        console.error("[POS] Embedded missed-report check failed (UI unaffected):");
        console.error(err);
      });
  }
});