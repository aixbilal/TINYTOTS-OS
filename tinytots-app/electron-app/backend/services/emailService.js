import "dotenv/config";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

// TinyTots has ONE trusted report sender, configured entirely from server-side
// env. Recipients supply only a destination email — never any credential. The
// admin surfaces that manage public.daily_report_recipients store name + email
// + is_active and nothing else.
//
// Env contract (see backend/.env.example):
//   SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS   required — the mailbox
//   REPORT_FROM_EMAIL   optional — visible From address (default: SMTP_USER)
//   REPORT_FROM_NAME    optional — visible From name    (default: "TinyTots")
//   REPORT_FALLBACK_EMAIL  optional — only used when ZERO active recipients
//                                     are configured (default: OWNER_EMAIL,
//                                     kept for backward compatibility)
//
// Implicit TLS: port 465 is SSL-on-connect (secure), 587/25 use STARTTLS
// (secure:false, upgraded during the SMTP session). Derive it from the port
// so switching mailboxes never needs a code change. Certificate verification
// is left ON (nodemailer default) — never disabled.

const SMTP_PORT = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // implicit TLS on 465; STARTTLS on 587/25
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_ACTIVE_RECIPIENTS = 5;

/** The visible sender identity, e.g. `"TinyTots" <support@tinytotsofficial.com>`. */
function reportFromHeader() {
  const fromEmail = (process.env.REPORT_FROM_EMAIL || process.env.SMTP_USER || "").trim();
  const fromName = (process.env.REPORT_FROM_NAME || "TinyTots").trim();
  return `"${fromName}" <${fromEmail}>`;
}

/**
 * Non-secret snapshot of the mail configuration for diagnostics.
 * NEVER includes the password value — only whether it is present.
 */
export function reportEmailConfigSummary() {
  return {
    host: process.env.SMTP_HOST || null,
    port: SMTP_PORT,
    user: process.env.SMTP_USER || null,
    passwordConfigured: Boolean((process.env.SMTP_PASS || "").length),
    tlsMode: SMTP_PORT === 465 ? "secure (implicit TLS)" : "starttls",
    from: reportFromHeader(),
    fallbackEmail:
      (process.env.REPORT_FALLBACK_EMAIL || process.env.OWNER_EMAIL || "").trim() || null,
  };
}

/**
 * Safe connection + authentication check against the SMTP server. Sends no
 * mail. Resolves true on success; rejects with the transport error otherwise.
 */
export async function verifyReportTransport() {
  return transporter.verify();
}

/**
 * Resolve who should receive the daily report, as snapshot-ready objects.
 *
 * Source of truth: ACTIVE rows in public.daily_report_recipients. If there
 * are none (or the table can't be read), fall back to a SINGLE address:
 * REPORT_FALLBACK_EMAIL, or the legacy OWNER_EMAIL if that isn't set — so
 * "someone still gets the report" never regresses. Neither fallback var is
 * required to appear in the table.
 *
 * @returns {Promise<{recipient_id: number|null, email: string, name: string|null}[]>}
 */
export async function resolveReportRecipients() {
  try {
    const { data, error } = await supabase
      .from("daily_report_recipients")
      .select("id, name, email")
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const seen = new Set();
    const active = [];
    for (const r of data || []) {
      const email = (r.email || "").trim().toLowerCase();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      active.push({ recipient_id: r.id, email, name: r.name || null });
    }

    if (active.length > 0) {
      // Defensive: the DB trigger already caps active rows at 5.
      return active.slice(0, MAX_ACTIVE_RECIPIENTS);
    }
  } catch (err) {
    console.error(
      "⚠️  Could not read daily_report_recipients — using the fallback address:",
      err.message
    );
  }

  const fallback = (process.env.REPORT_FALLBACK_EMAIL || process.env.OWNER_EMAIL || "")
    .trim()
    .toLowerCase();
  return fallback
    ? [{ recipient_id: null, email: fallback, name: "Fallback recipient" }]
    : [];
}

/* =======================================================
   EMAIL BODY — built from the SAME summary row the CSV uses
   (public.get_daily_summary). Never invents a metric.
======================================================= */

/** "Rs. 42,500" — PKR, whole rupees, thousands-separated. */
function pkr(value) {
  const n = Math.round(Number(value) || 0);
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

/** Plain integer string for counts. */
function intStr(value) {
  return String(Math.trunc(Number(value) || 0));
}

/**
 * Format a "YYYY-MM-DD" report date for humans, e.g.
 *   withWeekday=false -> "7 September 2026"
 *   withWeekday=true  -> "Monday, 7 September 2026"
 * Parsed at UTC noon so the calendar date can't shift.
 */
export function formatReportDate(reportDate, withWeekday = false) {
  const d = new Date(`${reportDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return reportDate;
  return d.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    ...(withWeekday ? { weekday: "long" } : {}),
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Build the subject + plain-text + HTML for the daily report email from the
 * real summary object. A zero-sales day renders normally (Rs. 0 / 0), with no
 * error language.
 *
 * @param {string} reportDate  "YYYY-MM-DD"
 * @param {{gross_revenue,net_profit,atv,total_items_sold,total_transactions}|null|undefined} summary
 */
export function buildReportEmail(reportDate, summary) {
  const s = summary || {};
  const longDate = formatReportDate(reportDate, true);
  const shortDate = formatReportDate(reportDate, false);

  // label -> display value. Only the five metrics get_daily_summary provides.
  const rows = [
    ["Gross Revenue", pkr(s.gross_revenue)],
    ["Net Profit", pkr(s.net_profit)],
    ["Transactions", intStr(s.total_transactions)],
    ["Items Sold", intStr(s.total_items_sold)],
    ["Average Order Value", pkr(s.atv)],
  ];

  const subject = `TinyTots Daily Sales Report — ${shortDate}`;

  const pad = Math.max(...rows.map(([l]) => l.length));
  const text = [
    "TinyTots",
    "Daily Sales Summary",
    longDate,
    "",
    ...rows.map(([l, v]) => `${l.padEnd(pad)}  ${v}`),
    "",
    "The detailed CSV report is attached for your records.",
    "",
    "This is an automated daily report from TinyTots OS.",
  ].join("\n");

  const rowHtml = rows
    .map(
      ([l, v], i) => `
      <tr>
        <td style="padding:9px 0;${i < rows.length - 1 ? "border-bottom:1px solid #ece5d9;" : ""}color:#675949;">${l}</td>
        <td style="padding:9px 0;${i < rows.length - 1 ? "border-bottom:1px solid #ece5d9;" : ""}text-align:right;font-weight:600;color:#2a2621;">${v}</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px 16px;background:#f6f1e8;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #ece5d9;border-radius:10px;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <h1 style="margin:0 0 2px;font-size:20px;color:#2a2621;">TinyTots</h1>
    <p style="margin:0;font-size:15px;color:#675949;">Daily Sales Summary</p>
    <p style="margin:2px 0 18px;font-size:13px;color:#8a7c6a;">${longDate}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${rowHtml}
    </table>
    <p style="margin:18px 0 4px;font-size:13px;color:#675949;">The detailed CSV report is attached for your records.</p>
    <p style="margin:0;font-size:12px;color:#8a7c6a;">This is an automated daily report from TinyTots OS.</p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

/**
 * Send ONE copy of the report to ONE destination. Throws on failure so the
 * caller can mark that delivery row 'failed' and retry it later. One
 * destination is never exposed to another (single-recipient `to`).
 *
 * @param {string} to  destination email
 * @param {{filePath: string, fileName: string, reportDate: string, summary?: object}} report
 */
export async function deliverReportTo(to, report) {
  const { filePath, fileName, reportDate, summary } = report;
  const { subject, text, html } = buildReportEmail(reportDate, summary);

  const info = await transporter.sendMail({
    from: reportFromHeader(),
    to,
    subject,
    text,
    html,
    attachments: [{ filename: fileName, path: filePath }],
  });
  return info;
}
