import path from "node:path";
import { app } from "electron";
import { pathToFileURL } from "node:url";

/**
 * Builds a thermal receipt PDF from a sale object via the shared module and writes it
 * under Electron userData/receipts.
 */
export async function generateReceiptPDF(sale) {
  const receiptsFolder = path.join(app.getPath("userData"), "receipts");

  // Dynamically resolve the backend folder path depending on packaged vs dev state
  const backendRoot = app.isPackaged
    ? path.join(process.resourcesPath, "backend")
    : path.join(__dirname, "..", "backend");

  const receiptPdfModulePath = path.join(backendRoot, "lib", "receiptPdf.js");

  // Import dynamically using file URL for robust ESM/asar compatibility
  const { writeReceiptPdf } = await import(pathToFileURL(receiptPdfModulePath).href);

  return writeReceiptPdf(sale, receiptsFolder);
}