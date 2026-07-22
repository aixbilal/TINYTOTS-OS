// ReceiptTemplate.jsx
import "./receipt.css";
import { receiptConfig } from "./receiptConfig";

const WIDTH = 40; // characters per line, matches 80mm thermal printers

// ---- column widths for the item table (must sum to WIDTH) ----
const COL_QTY = 4;
const COL_ITEM = 16;
const COL_PRICE = 10;
const COL_TOTAL = 10;

function padRight(str, len) {
  str = String(str ?? "");
  return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}

function padLeft(str, len) {
  str = String(str ?? "");
  return str.length >= len ? str.slice(0, len) : " ".repeat(len - str.length) + str;
}

function center(str, width = WIDTH) {
  str = String(str ?? "");
  if (str.length >= width) return str.slice(0, width);
  const totalPad = width - str.length;
  const left = Math.floor(totalPad / 2);
  const right = totalPad - left;
  return " ".repeat(left) + str + " ".repeat(right);
}

function bar(char = "=", width = WIDTH) {
  return char.repeat(width);
}

function money(value) {
  return `Rs.${Number(value || 0).toFixed(2)}`;
}

function twoColumnRow(label, value, width = WIDTH) {
  const spacer = Math.max(width - label.length - value.length, 1);
  return label + " ".repeat(spacer) + value;
}

function itemHeaderRow() {
  return (
    padRight("QTY", COL_QTY) +
    padRight("ITEM", COL_ITEM) +
    padLeft("PRICE", COL_PRICE) +
    padLeft("TOTAL", COL_TOTAL)
  );
}

function itemRow(item) {
  const priceStr = money(item.price);
  const totalStr = money(item.lineTotal ?? item.price * item.qty);
  return (
    padRight(item.qty, COL_QTY) +
    padRight(item.name, COL_ITEM) +
    padLeft(priceStr, COL_PRICE) +
    padLeft(totalStr, COL_TOTAL)
  );
}

function itemDetailLine(item) {
  const detail = [item.variant, item.barcode].filter(Boolean).join(", ");
  if (!detail) return null;
  return "  (" + detail + ")";
}

export default function ReceiptTemplate({ sale }) {
  if (!sale) return null;

  const { store, toggles, footer } = receiptConfig;
  const receiptDate = sale.created_at || sale.createdAt || new Date();

  const dateStr = new Date(receiptDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = new Date(receiptDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const lines = [];

  // ================= HEADER =================
  lines.push(bar("="));
  lines.push(center(store.name.toUpperCase()));
  if (toggles.showSubtitle && store.subtitle) lines.push(center(store.subtitle));
  if (toggles.showAddress && store.address) lines.push(center(store.address));
  if (toggles.showPhone && store.phone) lines.push(center(`Tel: ${store.phone}`));
  if (toggles.showWebsite && store.website) lines.push(center(store.website));
  lines.push(bar("="));
  lines.push("");

  // ================= SALE INFO =================
  lines.push(twoColumnRow(`Date: ${dateStr}`, `Time: ${timeStr}`));
  lines.push(`Receipt #: ${sale.receiptNumber || "-"}`);
  lines.push(`Cashier: ${sale.cashier || "Admin"}`);
  lines.push("");

  // ================= ITEMS =================
  lines.push(bar("-"));
  lines.push(itemHeaderRow());
  lines.push(bar("-"));
  (sale.items || []).forEach((item) => {
    lines.push(itemRow(item));
    const detail = itemDetailLine(item);
    if (detail) lines.push(detail);
  });
  lines.push(bar("-"));
  lines.push("");

  // ================= TOTALS =================
  lines.push(twoColumnRow("SUBTOTAL:", money(sale.subtotal)));
  if (toggles.showDiscount && sale.discount) {
    lines.push(twoColumnRow("Discount:", `-${money(sale.discount)}`));
  }
  if (toggles.showTax) {
    lines.push(twoColumnRow(`Tax (${receiptConfig.taxRatePercent}%):`, money(sale.tax)));
  }
  lines.push(bar("="));
  lines.push(twoColumnRow("TOTAL:", money(sale.total)));
  lines.push(bar("="));
  lines.push("");

  // ================= PAYMENT =================
  lines.push("PAYMENT METHOD:");
  lines.push(twoColumnRow(String(sale.paymentMethod || "Cash").toUpperCase(), money(sale.total)));
  if (sale.cashReceived != null) {
    lines.push(twoColumnRow("Received:", money(sale.cashReceived)));
    lines.push(twoColumnRow("Change:", money(sale.change)));
  }
  lines.push("");

  // ================= FOOTER =================
  if (footer.policy) {
    lines.push(bar("-"));
    lines.push(center("EXCHANGE & RETURN POLICY"));
    // wrap policy text at WIDTH, centered per line
    const words = footer.policy.split(" ");
    let current = "";
    const wrapped = [];
    words.forEach((word) => {
      if ((current + " " + word).trim().length > WIDTH - 4) {
        wrapped.push(current.trim());
        current = word;
      } else {
        current = (current + " " + word).trim();
      }
    });
    if (current) wrapped.push(current.trim());
    wrapped.forEach((line) => lines.push(center(line)));
    lines.push(bar("-"));
  }

  if (toggles.showFooterMessage && footer.thankYou) {
    lines.push(center(footer.thankYou));
  }
  if (toggles.showSocials && footer.socials) {
    lines.push(center(footer.socials));
  }
  lines.push(bar("="));

  return <pre className="receipt receipt-mono">{lines.join("\n")}</pre>;
}