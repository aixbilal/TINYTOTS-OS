import { createNotification } from "./services/notifications.js";
import whatsappWebhook from "./routes/whatsappWebhook.js";
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
const { getPrinters, print } = pdfPrinterPkg;
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts } from "pdf-lib";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/webhook", whatsappWebhook);

// ----------------------------------------------------
// PATHS
// ----------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RECEIPT_FOLDER = path.join(__dirname, "receipts");

if (!fs.existsSync(RECEIPT_FOLDER)) {
  fs.mkdirSync(RECEIPT_FOLDER, { recursive: true });
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
    }));

    res.json(products);
  } catch (err) {
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
      subtotal,
      discount = 0,
      tax,
      total,
      cashier,
      paymentMethod = "cash",
      notes = "",
      client_sale_id,
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
      .select("id, receipt_number")
      .eq("client_sale_id", client_sale_id)
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (existingSale) {
      return res.json({
        success: true,
        sale_id: existingSale.id,
        receipt_number: existingSale.receipt_number,
        deduped: true,
      });
    }

    // Validate stock (see original note: read-then-write race window
    // is acceptable for a single-till setup)
    const variantStocks = {};
    for (const item of cart) {
      const { data: variant, error } = await supabase
        .from("variants")
        .select("stock")
        .eq("id", item.variant_id)
        .single();

      if (error) throw error;
      if (!variant) {
        return res.status(400).json({ success: false, message: `Variant ${item.variant_id} not found.` });
      }
      if (variant.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `${item.name} (${item.color} / ${item.size}) has only ${variant.stock} item(s) left in stock.`,
        });
      }
      variantStocks[item.variant_id] = variant.stock;
    }

    // ---- NOTIFICATIONS: low stock / out of stock, based on what will
    //      remain after this sale goes through ----
    for (const item of cart) {
      const remaining = variantStocks[item.variant_id] - item.qty;
      if (remaining <= 0) {
        await createNotification({
          category: "inventory",
          priority: "critical",
          title: "Out of Stock",
          description: `${item.name} (${item.color || ""} ${item.size || ""}) just sold out.`,
          target_role: "admin",
          action_label: "View Product",
          action_type: "view_product",
          action_payload: { variantId: item.variant_id },
        });
      } else if (remaining <= 5) {
        await createNotification({
          category: "inventory",
          priority: "warning",
          title: "Low Stock",
          description: `${item.name} (${item.color || ""} ${item.size || ""}) has only ${remaining} unit(s) remaining.`,
          target_role: "admin",
          action_label: "View Product",
          action_type: "view_product",
          action_payload: { variantId: item.variant_id },
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
      .select("id, receipt_number")
      .eq("client_sale_id", client_sale_id)
      .single();
    if (raceSale) {
      return res.json({ success: true, sale_id: raceSale.id, receipt_number: raceSale.receipt_number, deduped: true });
    }
  }
    if (saleError) throw saleError;

    const saleItems = cart.map((item) => ({
      sale_id: sale.id,
      variant_id: item.variant_id,
      quantity: item.qty,
      unit_price: item.price,
      line_total: item.price * item.qty,
    }));

    const { error: itemError } = await supabase.from("sale_items").insert(saleItems);
    if (itemError) throw itemError;

    for (const item of cart) {
      const newStock = Math.max(variantStocks[item.variant_id] - item.qty, 0);
      const { error: stockError } = await supabase
        .from("variants")
        .update({ stock: newStock })
        .eq("id", item.variant_id);
      if (stockError) throw stockError;
    }

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

    res.json({ success: true, sale_id: sale.id, receipt_number: receiptNumber });
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

  // ---------------- SALE ----------------

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("*")
    .eq("id", sale_id)
    .single();

  if (saleError) throw saleError;

  // ---------------- ITEMS ----------------

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

  // ---------------- PDF ----------------

  const pdfDoc = await PDFDocument.create();

  const pageWidth = 226;      // 80mm

  const pageHeight = 900;

  const page = pdfDoc.addPage([
    pageWidth,
    pageHeight
  ]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = pageHeight - 25;

  const center = (text, size) => {

    const width = font.widthOfTextAtSize(text, size);

    page.drawText(text,{
      x:(pageWidth-width)/2,
      y,
      size,
      font
    });

    y-=16;

  };

  // ---------------- HEADER ----------------

  center("TINY TOTS",14);

  center("Toddler-to-Tween Outfitters",8);

  center("Shop No 169 Street Markazi Jamia",7);

  center("Masjid Toba Tek Singh",7);

  center("0301-7278797",7);

  center("www.tinytotsofficial.com",7);

  y-=8;

  page.drawText("--------------------------------",{
    x:10,
    y,
    size:8,
    font
  });

  y-=15;

  page.drawText(
    `Receipt : ${sale.receipt_number}`,
    {
      x:10,
      y,
      size:8,
      font
    }
  );

  y-=12;

  page.drawText(
    `Date : ${new Date(sale.created_at).toLocaleString()}`,
    {
      x:10,
      y,
      size:8,
      font
    }
  );

  y-=18;

  page.drawText(
    "Qty Item",
    {
      x:10,
      y,
      size:8,
      font
    }
  );

  page.drawText(
    "Total",
    {
      x:175,
      y,
      size:8,
      font
    }
  );

  y-=10;

  page.drawText("--------------------------------",{
    x:10,
    y,
    size:8,
    font
  });

  y-=16;

  let subtotal=0;

  for(const item of items){

    const qty=item.quantity;

    const price=item.unit_price;

    const total=qty*price;

    subtotal+=total;

    const name=item.variants?.product?.name || "Item";

    page.drawText(
      `${qty} x ${name}`,
      {
        x:10,
        y,
        size:8,
        font
      }
    );

    page.drawText(
      money(total),
      {
        x:175,
        y,
        size:8,
        font
      }
    );

    y-=11;

    const variant=`${item.variants?.size || ""} ${item.variants?.color || ""}`;

    if(variant.trim()){

      page.drawText(
        variant,
        {
          x:20,
          y,
          size:7,
          font
        }
      );

      y-=10;

    }

  }

  y-=6;

  page.drawText("--------------------------------",{
    x:10,
    y,
    size:8,
    font
  });

  y-=15;

  page.drawText(
    `Subtotal : ${money(subtotal)}`,
    {
      x:10,
      y,
      size:8,
      font
    }
  );

  y-=12;

  page.drawText(
    `Tax : ${money(sale.tax)}`,
    {
      x:10,
      y,
      size:8,
      font
    }
  );

  y-=12;

  page.drawText(
    `TOTAL : ${money(sale.total)}`,
    {
      x:10,
      y,
      size:10,
      font
    }
  );

  y-=20;

  center("Thank you for shopping!",9);

  center("Tiny Tots",10);

  center("We love watching them grow.",8);

  const pdfBytes=await pdfDoc.save();

  const pdfPath=path.join(
    RECEIPT_FOLDER,
    `${sale.receipt_number}.pdf`
  );

  fs.writeFileSync(
    pdfPath,
    pdfBytes
  );

  return pdfPath;

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

    // Current month goal progress (falls back to null if no goal is set yet —
    // the Performance & Goals module owns writing to this table)
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

    // If the goals table doesn't exist yet, don't fail the whole dashboard —
    // just report no goal set. (Table gets created in the Performance & Goals phase.)
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
// ----------------------------------------------------
// LOW STOCK LIST
// Powers the dedicated Low Stock page (linked from
// the "View Now" action on the dashboard snapshot).
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
        product:products(name, supplier_id)
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
    }));

    res.json({ success: true, items });
  } catch (err) {
    console.error("GET /api/low-stock error:", err);
    res.status(500).json({ success: false, message: "Failed to load low stock items." });
  }
});
    res.json({
      success: true,
      totalSalesToday: totalSales,
      transactionsToday: transactions,
      lowStockCount: lowStockRows?.length ?? 0,
      goalProgressPct, // null if no goal configured yet
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// ----------------------------------------------------
// DYNAMIC INVENTORY
// ----------------------------------------------------

const LABEL_FOLDER = path.join(__dirname, "labels");
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

    const result = products.map((p) => {
      const productVariants = variants.filter((v) => v.product_id === p.id);

      return {
        ...p,
        variants: productVariants,
        total_variants: productVariants.length,
        total_stock: productVariants.reduce((sum, v) => sum + (v.stock || 0), 0),
      };
    });

    res.json({ success: true, products: result });
  } catch (err) {
    console.error("Inventory fetch error:", err);
    res.status(500).json({ success: false, error: err.message });
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
      cost_price, selling_price, initialStock, colors, sizes,
    } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ success: false, message: "Product name and SKU are required." });
    }
    if (!colors?.length || !sizes?.length) {
      return res.status(400).json({ success: false, message: "At least one color and one size are required." });
    }

    const cleanSku = sku.trim().toUpperCase();
    
    // Check if base SKU exists
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

    // Insert Product safely
    const { data: product, error: prodErr } = await supabase
      .from("products")
      .insert([{
        name, brand, category, sku: cleanSku, hsn_code,
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

    // Generate variant rows securely
    const variantRows = [];
    for (const color of colors) {
      for (const size of sizes) {
        variantRows.push({
          product_id: product.id,
          color,
          size,
          price: Number(selling_price) || 0,
          cost_price: Number(cost_price) || 0,
          stock: Number(initialStock) || 0,
          sku: `${cleanSku}-${colorCode(color)}-${size}`.toUpperCase(),
          status: "active",
        });
      }
    }

    // Bulk insert variants
   // Bulk insert variants
   const { data: variants, error: varErr } = await supabase
   .from("variants")
   .insert(variantRows)
   .select();

 if (varErr || !variants || variants.length !== variantRows.length) {
   // Variant creation failed or was incomplete — don't leave an orphan
   // product with missing/partial variants sitting in the DB.
   await supabase.from("variants").delete().eq("product_id", product.id);
   await supabase.from("products").delete().eq("id", product.id);
   throw new Error(
     varErr?.message ||
     `Only ${variants?.length || 0} of ${variantRows.length} variants were created. Product creation rolled back — please try again.`
   );
 }

    // Follow-up: Assign unique public codes safely
    if (variants && variants.length > 0) {
      await Promise.all(
        variants.map((v) =>
          supabase.from("variants").update({ public_code: `V-${v.id}` }).eq("id", v.id)
        )
      );
      variants.forEach((v) => { v.public_code = `V-${v.id}`; });
    }

    res.json({ success: true, product, variants });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// UPDATE PRODUCT INFO
// ----------------------------------------------------
app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, category, hsn_code, unit, description, image_url, status, cost_price, selling_price } = req.body;
    
    const fieldsToUpdate = {
      name, brand, category, hsn_code, unit, description, image_url, status,
      cost_price: cost_price !== undefined ? Number(cost_price) : undefined,
      selling_price: selling_price !== undefined ? Number(selling_price) : undefined,
    };
    Object.keys(fieldsToUpdate).forEach((k) => fieldsToUpdate[k] === undefined && delete fieldsToUpdate[k]);

    const { data, error } = await supabase
      .from("products")
      .update(fieldsToUpdate)
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;

    res.json({ success: true, product: data });
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
// UPDATE A SINGLE VARIANT (stock, price, status)
// ----------------------------------------------------
app.put("/api/variants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, price, status } = req.body;

    const { data, error } = await supabase
      .from("variants")
      .update({ stock, price, status })
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

    const printers = await getPrinters();

    if (!printers || printers.length === 0) {
      return res.json({
        success: true,
        printers: [{ name: "EML-200L (2inch)", isDefault: true }]
      });
    }

    res.json({
      success: true,
      printers: printers.map((p) => ({ name: p.name, isDefault: !!p.isDefault })),
    });
  } catch (err) {
    console.error("Printer list error caught, using hardcoded fallback:", err);

    res.json({
      success: true,
      printers: [
        { name: "EML-200L (2inch)", isDefault: true },
        { name: "POS-80C", isDefault: false }
      ]
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
      labelWidthMm = 50, labelHeightMm = 30,
    } = req.body;

    if (!variantIds?.length) {
      return res.status(400).json({ success: false, message: "No variants selected." });
    }

    const { data: variants, error } = await supabase
    .from("variants")
    .select(`id, color, size, price, sku, public_code, product:products(name, sku)`)
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
      const page = pdfDoc.addPage([pageW, pageH]);
      const codeValue = v.public_code || `V-${v.id}`;

      // ---- generate the code image as PNG bytes ----
      let codeImageBytes;
      let codeIsSquare = codeType === "qr";
      if (codeType === "qr") {
        const dataUrl = await QRCode.toDataURL(codeValue, { margin: 0, width: 300 });
        codeImageBytes = Buffer.from(dataUrl.split(",")[1], "base64");
      } else {
        codeImageBytes = await bwipjs.toBuffer({
          bcid: "code128",
          text: codeValue,
          scale: 3,
          height: 10,
          includetext: false,
        });
      }

      const codeImage = codeIsSquare
        ? await pdfDoc.embedPng(codeImageBytes)
        : await pdfDoc.embedPng(codeImageBytes);

      const codeSize = codeIsSquare
        ? Math.min(pageW * 0.55, pageH * 0.65)
        : pageW * 0.8;
      const codeH = codeIsSquare ? codeSize : pageH * 0.35;
      const codeX = (pageW - codeSize) / 2;
      const codeY = pageH - codeH - mmToPt(3);

      page.drawImage(codeImage, {
        x: codeX,
        y: codeY,
        width: codeIsSquare ? codeSize : codeSize,
        height: codeH,
      });

      // ---- text: product name, variant, price ----
      const productName = v.product?.name || "Product";
      const nameSize = 7;
      const nameWidth = fontBold.widthOfTextAtSize(productName, nameSize);
      page.drawText(productName, {
        x: (pageW - nameWidth) / 2,
        y: codeY - 10,
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
    const { data: sale, error } = await supabase.from("sales").select("*").eq("id", id).single();
    if (error) throw error;

    const pdfPath = path.join(RECEIPT_FOLDER, `${sale.receipt_number}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      // Fall back to regenerating it on demand instead of failing
      await generateReceiptPDF(sale.id);
    }
    await print(pdfPath, { printer: "POS-80C" });
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
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/users/:id error:", err);
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

// Check for any missed report
await recoverMissedReport();

// Start scheduled jobs
startCronJobs();

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});