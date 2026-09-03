// One PKR formatter for the whole Admin. Never mutates stored values — display
// only. `Rs. 1,900` (grouped, no decimals for whole rupees).
const pkr = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 });

export function formatPkr(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n == null || !Number.isFinite(n)) return "Rs. 0";
  const rounded = Math.round(n * 100) / 100;
  return `Rs. ${pkr.format(rounded)}`;
}

// Short, locale-stable date for Admin tables ("3 Sep 2026"). UTC so
// server-render and client-hydrate always match.
export function formatAdminDate(value: string | number | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
