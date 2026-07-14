import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

function money(value) {
  return Number(value || 0).toFixed(2);
}

/**
 * Builds an 80mm receipt PDF from a sale object (the same shape
 * produced by src/receipts/buildSale.js) and writes it to disk.
 * Returns the file path of the generated PDF.
 */
export async function generateReceiptPDF(sale) {
  const pdfDoc = await PDFDocument.create();

  const pageWidth = 226;   // 80mm
  const pageHeight = 900;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.45, 0.45, 0.45);

  let y = pageHeight - 28;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  const center = (text, size, useBold = false) => {
    const f = useBold ? fontBold : font;
    const width = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (pageWidth - width) / 2, y, size, font: f, color: black });
    y -= size + 6;
  };

  const divider = (thickness = 0.7) => {
    page.drawLine({
      start: { x: marginX, y },
      end: { x: pageWidth - marginX, y },
      thickness,
      color: black,
    });
    y -= 12;
  };

  const row = (left, right, size = 8, useBold = false) => {
    const f = useBold ? fontBold : font;
    page.drawText(left, { x: marginX, y, size, font: f, color: black });
    const rightWidth = f.widthOfTextAtSize(right, size);
    page.drawText(right, { x: pageWidth - marginX - rightWidth, y, size, font: f, color: black });
    y -= size + 6;
  };

  // ---- header ----
  center("TINY TOTS", 16, true);
  center("Toddler-to-Tween Outfitters", 8);
  center("Shop No 169 Street Markazi Jamia", 7);
  center("Masjid Toba Tek Singh", 7);
  center("0301-7278797", 7);

  y -= 4;
  divider(1.2);

  // ---- meta ----
  row("Receipt", sale.receiptNumber || "-", 8, true);
  row("Cashier", sale.cashier || "—", 8);
  row("Date", new Date(sale.created_at).toLocaleString(), 7);

  divider();

  // ---- items ----
  for (const item of sale.items || []) {
    row(`${item.qty} x ${item.name}`, money(item.lineTotal), 8);

    if (item.variant) {
      page.drawText(item.variant, { x: marginX + 6, y: y + 4, size: 6.5, font, color: gray });
      y -= 6;
    }
  }

  divider();

  // ---- totals ----
  row("Subtotal", money(sale.subtotal), 8);
  row("Discount", `-${money(sale.discount)}`, 8);
  row("Tax", money(sale.tax), 8);

  divider(1.2);

  // ---- boxed total ----
  const boxHeight = 26;
  page.drawRectangle({
    x: marginX,
    y: y - boxHeight + 10,
    width: contentWidth,
    height: boxHeight,
    borderColor: black,
    borderWidth: 1,
  });
  const totalLabel = "TOTAL";
  const totalValue = `Rs. ${money(sale.total)}`;
  page.drawText(totalLabel, { x: marginX + 8, y: y - 8, size: 11, font: fontBold, color: black });
  const totalValueWidth = fontBold.widthOfTextAtSize(totalValue, 11);
  page.drawText(totalValue, {
    x: pageWidth - marginX - 8 - totalValueWidth,
    y: y - 8,
    size: 11,
    font: fontBold,
    color: black,
  });
  y -= boxHeight + 10;

  row("Paid via", (sale.paymentMethod || "Cash").toUpperCase(), 8);

  y -= 6;
  divider(1.2);

  center("Thanks for coming!", 9, true);
  center("We love watching them grow.", 8);

  // ---------------- SAVE TO DISK ----------------
  const pdfBytes = await pdfDoc.save();

  const receiptsFolder = path.join(app.getPath("userData"), "receipts");

  if (!fs.existsSync(receiptsFolder)) {
    fs.mkdirSync(receiptsFolder, { recursive: true });
  }

  const safeName = String(sale.receiptNumber || Date.now()).replace(/[^a-zA-Z0-9-_]/g, "_");
  const pdfPath = path.join(receiptsFolder, `${safeName}.pdf`);

  fs.writeFileSync(pdfPath, pdfBytes);

  return pdfPath;
}