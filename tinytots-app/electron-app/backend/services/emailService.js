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

/**
 * Resolve who should receive the daily report.
 *
 * Source of truth is public.daily_report_recipients (is_active rows). If that
 * table is empty / has no active rows / can't be read, we fall back to the
 * single legacy address in process.env.OWNER_EMAIL so behaviour never
 * regresses from "the owner gets the report".
 *
 * Returns a de-duplicated list of lower-cased email strings.
 */
export async function resolveReportRecipients() {
  const fallback = (process.env.OWNER_EMAIL || "").trim().toLowerCase();

  let configured = [];
  try {
    const { data, error } = await supabase
      .from("daily_report_recipients")
      .select("email")
      .eq("is_active", true);
    if (error) throw error;
    configured = (data || [])
      .map((r) => (r.email || "").trim().toLowerCase())
      .filter(Boolean);
  } catch (err) {
    console.error(
      "⚠️  Could not read daily_report_recipients — falling back to OWNER_EMAIL:",
      err.message
    );
    return fallback ? [fallback] : [];
  }

  const list = configured.length > 0 ? configured : fallback ? [fallback] : [];

  // De-dupe defensively (the unique index already prevents this at write time).
  return [...new Set(list)];
}

/**
 * Sends the daily sales report email to every configured active recipient.
 *
 * ONE report file is generated (by reportService); this only fans out
 * delivery. Each recipient is a SEPARATE sendMail call — one address is never
 * exposed to another, and one failed send does not stop the rest.
 *
 * Resolves with a per-recipient summary when AT LEAST ONE send succeeds.
 * Throws only when there are recipients and every send failed (so
 * reportService records the report as "failed" and can retry), or when no
 * recipient is configured at all.
 *
 * @param {string} filePath - Absolute path of the CSV file.
 * @param {string} fileName - Name shown in the email attachment.
 */
export async function sendReportEmail(filePath, fileName) {
  const recipients = await resolveReportRecipients();

  if (recipients.length === 0) {
    throw new Error(
      "No daily report recipients configured (daily_report_recipients is empty and OWNER_EMAIL is unset)."
    );
  }

  const results = [];
  for (const to of recipients) {
    try {
      const info = await transporter.sendMail({
        from: `"Tiny Tots POS" <${process.env.SMTP_USER}>`,
        to,
        subject: "Daily Sales Report",
        text: "Attached is your daily sales report.",
        attachments: [{ filename: fileName, path: filePath }],
      });
      console.log(`✅ Report email sent to ${to}:`, info.messageId);
      results.push({ email: to, ok: true, messageId: info.messageId });
    } catch (error) {
      console.error(`❌ Failed to send report email to ${to}`);
      console.error(error);
      results.push({ email: to, ok: false, error: error.message });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;

  if (sent === 0) {
    throw new Error(
      `Daily report could not be delivered to any of ${results.length} recipient(s).`
    );
  }
  if (failed > 0) {
    console.warn(
      `⚠️  Daily report delivered to ${sent}/${results.length} recipient(s); ${failed} failed.`
    );
  }

  return { total: results.length, sent, failed, results };
}
