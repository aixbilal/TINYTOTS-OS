import "dotenv/config";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// TinyTots has ONE trusted report sender (SMTP_* env, server-side only).
// Recipients supply only a destination email — never any credential. The
// admin surfaces that manage public.daily_report_recipients store name +
// email + is_active and nothing else.

const MAX_ACTIVE_RECIPIENTS = 5;

/**
 * Resolve who should receive the daily report, as snapshot-ready objects.
 *
 * Source of truth: ACTIVE rows in public.daily_report_recipients. If there
 * are none (or the table can't be read), fall back to the single legacy
 * address in process.env.OWNER_EMAIL so "the owner gets the report" never
 * regresses. OWNER_EMAIL is NOT required to appear in the table.
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
      "⚠️  Could not read daily_report_recipients — falling back to OWNER_EMAIL:",
      err.message
    );
  }

  const fallback = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
  return fallback
    ? [{ recipient_id: null, email: fallback, name: "Owner (fallback)" }]
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
    from: `"Tiny Tots POS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Daily Sales Report",
    text: "Attached is your daily sales report.",
    attachments: [{ filename: fileName, path: filePath }],
  });
  return info;
}
