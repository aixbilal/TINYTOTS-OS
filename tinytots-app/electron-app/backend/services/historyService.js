import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =======================================================
   REPORT-LEVEL RECORD  (public.report_history)
   One row per report_date. status: pending | sent | failed.
   "sent" now means EVERY intended delivery for that date
   succeeded (see reportService.generateDailyReport).
======================================================= */

/**
 * Returns true ONLY if the report was fully sent (every recipient).
 */
export async function reportExists(reportDate) {
  const { data, error } = await supabase
    .from("report_history")
    .select("status")
    .eq("report_date", reportDate)
    .maybeSingle();

  if (error) throw error;

  return data?.status === "sent";
}

/**
 * Save a fully-delivered report.
 */
export async function saveSuccessfulReport(reportDate) {
  const { error } = await supabase
    .from("report_history")
    .upsert(
      {
        report_date: reportDate,
        emailed_at: new Date().toISOString(),
        status: "sent",
        error_message: null,
      },
      { onConflict: "report_date" }
    );

  if (error) throw error;
}

/**
 * Save a not-fully-delivered report (one or more recipients still failed /
 * pending). `message` is a short human summary, never a raw stack.
 */
export async function saveFailedReport(reportDate, message) {
  const { error } = await supabase
    .from("report_history")
    .upsert(
      {
        report_date: reportDate,
        status: "failed",
        error_message: message,
        emailed_at: new Date().toISOString(),
      },
      { onConflict: "report_date" }
    );

  if (error) throw error;
}

/**
 * Claim a report before generating it.
 * Returns true if this process successfully claimed it.
 * Returns false if another process already owns it.
 */
export async function claimReport(reportDate) {
  const { error } = await supabase
    .from("report_history")
    .insert({ report_date: reportDate, status: "pending" });

  if (!error) return true;
  if (error.code === "23505") return false; // someone else claimed it
  throw error;
}

/**
 * Current status of a report row, or null if none.
 */
export async function getReportStatus(reportDate) {
  const { data, error } = await supabase
    .from("report_history")
    .select("status")
    .eq("report_date", reportDate)
    .maybeSingle();

  if (error) throw error;

  return data?.status ?? null;
}

/* =======================================================
   PER-RECIPIENT DELIVERY  (public.daily_report_deliveries)
   One row per (report_date, destination). The recipient's
   name/email are SNAPSHOT here the first time a report's
   delivery set is created, so later add / disable / remove
   of a recipient never rewrites a historical report.
======================================================= */

/**
 * Create the delivery set for `reportDate` from `recipients` — but ONLY if
 * no delivery rows exist yet for that date. Once a set exists it is frozen:
 * recovery works from those rows, never from today's recipient config.
 *
 * @param {string} reportDate  YYYY-MM-DD
 * @param {{recipient_id: number|null, email: string, name: string|null}[]} recipients
 * @returns {Promise<{created: number}>}
 */
export async function ensureDeliverySet(reportDate, recipients) {
  const { count, error: countErr } = await supabase
    .from("daily_report_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("report_date", reportDate);
  if (countErr) throw countErr;

  if ((count ?? 0) > 0) return { created: 0 }; // already snapshotted — frozen
  if (!recipients || recipients.length === 0) return { created: 0 };

  const rows = recipients.map((r) => ({
    report_date: reportDate,
    recipient_id: r.recipient_id ?? null,
    recipient_email_snapshot: (r.email || "").trim().toLowerCase(),
    recipient_name_snapshot: r.name || null,
    status: "pending",
  }));

  const { data, error } = await supabase
    .from("daily_report_deliveries")
    .insert(rows)
    .select("id");

  // A concurrent generator won the race and inserted first — harmless.
  if (error && error.code !== "23505") throw error;

  return { created: error ? 0 : (data?.length ?? 0) };
}

/**
 * Delivery rows for `reportDate` that still need an attempt
 * (status pending or failed). 'sent' rows are excluded so they are never
 * re-emailed.
 */
export async function getDeliveriesToAttempt(reportDate) {
  const { data, error } = await supabase
    .from("daily_report_deliveries")
    .select("id, recipient_email_snapshot, recipient_name_snapshot, status, attempt_count")
    .eq("report_date", reportDate)
    .in("status", ["pending", "failed"])
    .order("id", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Every delivery row for `reportDate` (any status) — for roll-up / reporting.
 */
export async function getAllDeliveries(reportDate) {
  const { data, error } = await supabase
    .from("daily_report_deliveries")
    .select("id, recipient_email_snapshot, recipient_name_snapshot, status, attempt_count, sent_at, last_error")
    .eq("report_date", reportDate)
    .order("id", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function markDeliverySent(id, attemptCount) {
  const { error } = await supabase
    .from("daily_report_deliveries")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      last_attempt_at: new Date().toISOString(),
      attempt_count: (attemptCount ?? 0) + 1,
      last_error: null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function markDeliveryFailed(id, message, attemptCount) {
  const { error } = await supabase
    .from("daily_report_deliveries")
    .update({
      status: "failed",
      last_attempt_at: new Date().toISOString(),
      attempt_count: (attemptCount ?? 0) + 1,
      last_error: (message || "Unknown error").slice(0, 500),
    })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Count delivery rows for `reportDate` that are NOT yet 'sent'.
 * 0 => the whole report is delivered.
 */
export async function countUnsentDeliveries(reportDate) {
  const { count, error } = await supabase
    .from("daily_report_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("report_date", reportDate)
    .neq("status", "sent");
  if (error) throw error;
  return count ?? 0;
}
