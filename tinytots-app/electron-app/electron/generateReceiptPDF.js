import { PDFDocument, StandardFonts } from "pdf-lib";
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

  let y = pageHeight - 25;

  const center = (text, size) => {
    const width = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (pageWidth - width) / 2, y, size, font });
    y -= 16;
  };

  const left = (text, size = 8) => {
    page.drawText(text, { x: 10, y, size, font });
  };

  // ---------------- HEADER ----------------
  center("TINY TOTS", 14);
  center("Toddler-to-Tween Outfitters", 8);
  center("Shop No 169 Street Markazi Jamia", 7);
  center("Masjid Toba Tek Singh", 7);
  center("0301-7278797", 7);
  center("www.tinytotsofficial.com", 7);

  y -= 8;
  left("--------------------------------");
  y -= 15;

  left(`Receipt : ${sale.receiptNumber || "-"}`);
  y -= 12;

  left(`Date : ${new Date(sale.created_at).toLocaleString()}`);
  y -= 18;

  left("Qty Item");
  page.drawText("Total", { x: 175, y, size: 8, font });
  y -= 10;

  left("--------------------------------");
  y -= 16;

  // ---------------- ITEMS ----------------
  for (const item of sale.items || []) {
    left(`${item.qty} x ${item.name}`);
    page.drawText(money(item.lineTotal), { x: 175, y, size: 8, font });
    y -= 11;

    if (item.variant) {
      page.drawText(item.variant, { x: 20, y, size: 7, font });
      y -= 10;
    }
  }

  y -= 6;
  left("--------------------------------");
  y -= 15;

  // ---------------- TOTALS ----------------
  left(`Subtotal : ${money(sale.subtotal)}`);
  y -= 12;

  left(`Tax : ${money(sale.tax)}`);
  y -= 12;

  page.drawText(`TOTAL : ${money(sale.total)}`, { x: 10, y, size: 10, font });
  y -= 20;

  center("Thank you for shopping!", 9);
  center("Tiny Tots", 10);
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