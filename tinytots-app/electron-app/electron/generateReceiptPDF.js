import path from "node:path";
import { app } from "electron";
import { writeReceiptPdf } from "../backend/lib/receiptPdf.js";

/**
 * Builds a thermal receipt PDF from a sale object (same shape as
 * src/receipts/buildSale.js) via the single shared module and writes it
 * under Electron userData/receipts.
 *
 * Printable width is PENDING physical confirmation — see RECEIPT_PAGE_WIDTH_PT
 * in backend/lib/receiptPdf.js (POS-80C / 80mm class).
 */
export async function generateReceiptPDF(sale) {
  const receiptsFolder = path.join(app.getPath("userData"), "receipts");
  return writeReceiptPdf(sale, receiptsFolder);
}
