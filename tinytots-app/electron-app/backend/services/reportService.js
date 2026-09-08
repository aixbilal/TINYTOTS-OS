import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { Parser } from "json2csv";
import fs from "fs";
import path from "path";
import { resolveReportRecipients, deliverReportTo } from "./emailService.js";
import {
  saveSuccessfulReport,
  saveFailedReport,
  claimReport,
  getReportStatus,
  claimReportForRetry,
  reclaimStalePendingReport,
  ensureDeliverySet,
  getDeliveriesToAttempt,
  markDeliverySent,
  markDeliveryFailed,
  countUnsentDeliveries,
} from "./historyService.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate + deliver the daily sales report for `reportDate`.
 *
 * ONE report is generated. Delivery is per-recipient and idempotent:
 *
 *   1. resolve the ACTIVE recipient set (or OWNER_EMAIL fallback)
 *   2. snapshot it into public.daily_report_deliveries — ONLY if no rows
 *      exist yet for this date (frozen audience; recovery never rebuilds it
 *      from today's config)
 *   3. build the CSV once
 *   4. attempt every delivery row whose status is pending/failed — 'sent'
 *      rows are skipped, so a recovery run never emails A/C twice while
 *      retrying B
 *   5. report_history is 'sent' only when EVERY delivery for the date is
 *      'sent'; otherwise 'failed' (recovery will retry the rest)
 *
 * Throws only on a genuine generation failure (no summary data, disk, etc.).
 * A partial-delivery outcome is NOT thrown — report_history carries it.
 *
 * DUPLICATE SAFETY: the packaged POS cron, startup recovery, and a second
 * till can all invoke this for the same date at once. report_history is the
 * report-level lock — this function claims it before doing any work:
 *   - won the INSERT ('pending')           -> this run owns generation
 *   - lost, existing row is 'sent'         -> nothing to do, return
 *   - lost, existing row is 'pending'      -> another run is generating now;
 *                                             skip (unless its lease is stale)
 *   - lost, existing row is 'failed'       -> claim the retry atomically;
 *                                             skip if another run claimed it
 * Combined with the per-recipient daily_report_deliveries rows (frozen
 * audience + 'sent' rows never retried), no concurrent run double-sends.
 */
export async function generateDailyReport(reportDate) {
  // 0: acquire the report-level lock for reportDate.
  const claimed = await claimReport(reportDate);
  if (!claimed) {
    const status = await getReportStatus(reportDate);
    if (status === "sent") {
      console.log(`ℹ️  Report ${reportDate} already fully delivered — nothing to do.`);
      return { success: true, reportDate, skipped: "already-sent", attempted: 0, sent: 0, failed: 0, unsent: 0 };
    }
    if (status === "pending") {
      const reclaimed = await reclaimStalePendingReport(reportDate);
      if (!reclaimed) {
        console.log(`ℹ️  Report ${reportDate} generation already in progress — skipping this run.`);
        return { success: false, reportDate, skipped: "in-progress", attempted: 0, sent: 0, failed: 0, unsent: null };
      }
      console.warn(`⚠️  Report ${reportDate} had a stale 'pending' lease — reclaiming.`);
    } else if (status === "failed") {
      const gotRetry = await claimReportForRetry(reportDate);
      if (!gotRetry) {
        console.log(`ℹ️  Report ${reportDate} retry already claimed by another run — skipping.`);
        return { success: false, reportDate, skipped: "retry-claimed", attempted: 0, sent: 0, failed: 0, unsent: null };
      }
    }
    // status null (row vanished between calls) — fall through; the roll-up
    // below re-establishes report_history.
  }

  // 1 + 2: freeze the audience for this report_date.
  const recipients = await resolveReportRecipients();
  await ensureDeliverySet(reportDate, recipients);

  let filePath;
  let fileName;
  try {
    // 3: build the CSV once.
    const { data, error } = await supabase.rpc("get_daily_summary", {
      p_report_date: reportDate,
    });
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("No report data returned.");

    const csv = new Parser().parse(data);

    const reportsDir = process.env.POS_DATA_DIR
      ? path.join(path.resolve(process.env.POS_DATA_DIR), "reports")
      : path.resolve("reports");
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    fileName = `report-${reportDate}.csv`;
    filePath = path.join(reportsDir, fileName);
    fs.writeFileSync(filePath, csv);
    console.log(`✅ CSV generated: ${filePath}`);
  } catch (err) {
    // Generation itself failed — nothing to deliver. Record + rethrow.
    try {
      await saveFailedReport(reportDate, `Report generation failed: ${err.message}`);
    } catch (historyErr) {
      console.error("❌ Failed to save report failure history.", historyErr);
    }
    console.error(`❌ Daily report generation failed for ${reportDate}`);
    console.error(err);
    throw err;
  }

  // 4: attempt each still-unsent delivery independently.
  const pending = await getDeliveriesToAttempt(reportDate);
  let sent = 0;
  let failed = 0;

  for (const d of pending) {
    try {
      const info = await deliverReportTo(d.recipient_email_snapshot, filePath, fileName);
      await markDeliverySent(d.id, d.attempt_count);
      sent += 1;
      console.log(`✅ Report delivered to ${d.recipient_email_snapshot}:`, info.messageId);
    } catch (err) {
      await markDeliveryFailed(d.id, err.message, d.attempt_count);
      failed += 1;
      console.error(`❌ Report delivery failed for ${d.recipient_email_snapshot}: ${err.message}`);
    }
  }

  // 5: roll up to the report-level record. 'sent' ONLY when every delivery
  // row for this date is 'sent'.
  const unsent = await countUnsentDeliveries(reportDate);

  if (recipients.length === 0) {
    await saveFailedReport(
      reportDate,
      "No daily report recipients configured (daily_report_recipients empty and no REPORT_FALLBACK_EMAIL / OWNER_EMAIL set)."
    );
    console.warn(`⚠️  Report ${reportDate}: nobody to deliver to.`);
  } else if (unsent === 0) {
    await saveSuccessfulReport(reportDate);
    console.log(`✅ Report ${reportDate} fully delivered.`);
  } else {
    await saveFailedReport(
      reportDate,
      `${unsent} recipient delivery(ies) not yet sent (this run: ${sent} sent, ${failed} failed).`
    );
    console.warn(
      `⚠️  Report ${reportDate}: ${unsent} delivery(ies) still unsent; recovery will retry.`
    );
  }

  return {
    success: recipients.length > 0 && unsent === 0,
    reportDate,
    attempted: pending.length,
    sent,
    failed,
    unsent,
    filePath,
  };
}
