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

/**
 * Send ONE copy of the report to ONE destination. Throws on failure so the
 * caller can mark that delivery row 'failed' and retry it later. One
 * destination is never exposed to another (single-recipient `to`).
 *
 * @param {string} to        destination email
 * @param {string} filePath  absolute path of the CSV
 * @param {string} fileName  attachment filename
 */
export async function deliverReportTo(to, filePath, fileName) {
  const info = await transporter.sendMail({
    from: reportFromHeader(),
    to,
    subject: "Daily Sales Report",
    text: "Attached is your daily sales report.",
    attachments: [{ filename: fileName, path: filePath }],
  });
  return info;
}
