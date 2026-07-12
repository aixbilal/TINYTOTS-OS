import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

// Returns a PNG data URL for a QR preview.
export async function generateQrPreview(value) {
  if (!value) return null;
  return QRCode.toDataURL(value, { margin: 1, width: 220 });
}

// Draws a barcode onto the given canvas element and returns a PNG data URL.
// (JsBarcode's browser API renders onto a canvas/SVG node directly rather
// than returning a string, so the caller passes a ref to an offscreen canvas.)
export function generateBarcodePreview(canvasEl, value) {
  if (!canvasEl || !value) return null;
  JsBarcode(canvasEl, value, {
    format: "CODE128",
    displayValue: true,
    fontSize: 14,
    height: 60,
    margin: 6,
  });
  return canvasEl.toDataURL("image/png");
}