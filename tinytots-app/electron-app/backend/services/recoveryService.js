import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { generateDailyReport } from "./reportService.js";
import {
  reportDateInKarachi,
  reportHourInKarachi,
  REPORT_SEND_HOUR,
} from "./historyService.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// How far back a startup will try to recover unsent daily reports. Covers a
// POS being closed for up to a week; a longer gap is a manual/admin concern.
const MAX_RECOVERY_LOOKBACK_DAYS = 7;

/**
 * The past report dates (Asia/Karachi) whose 10:00 AM send time has already
 * PASSED and which therefore should have gone out by `nowKarachiHour`.
 *
 * Yesterday (daysAgo = 1) counts as "due" only once the local clock is at or
 * past REPORT_SEND_HOUR — a startup at 08:00 must NOT treat yesterday's
 * report as missed, because the cron hasn't run yet. Day-before-yesterday and
 * older are always due.
 *
 * Returned oldest-first so recovery sends the backlog in order.
 */
export function dueReportDates(nowKarachiHour, maxLookbackDays = MAX_RECOVERY_LOOKBACK_DAYS) {
  const startDaysAgo = nowKarachiHour >= REPORT_SEND_HOUR ? 1 : 2;
  const dates = [];
  for (let d = maxLookbackDays; d >= startDaysAgo; d -= 1) {
    dates.push(reportDateInKarachi(d));
  }
  return dates;
}

/**
 * On backend startup, deliver any daily report whose scheduled 10:00 AM send
 * has already passed but which hasn't fully gone out yet.
 *
 * Schedule-aware: before 10:00 Asia/Karachi, yesterday's report is NOT yet
 * missed and is left for the cron. All duplicate protection lives in
 * generateDailyReport() (report_history claim, retry claim, stale-lease
 * reclaim, frozen per-recipient audience, 'sent' rows never re-sent), so this
 * is safe to run every launch and safe alongside the 10:00 cron.
 *
 * Non-blocking: server.js invokes this fire-and-forget after app.listen.
 */
export async function recoverMissedReport() {
  const nowHour = reportHourInKarachi();
  const candidates = dueReportDates(nowHour);

  if (candidates.length === 0) {
    console.log(`🔍 Report recovery: nothing due yet (before ${REPORT_SEND_HOUR}:00 Asia/Karachi).`);
    return;
  }

  console.log(
    `🔍 Report recovery: checking ${candidates.length} due date(s) ` +
      `[${candidates[0]} … ${candidates[candidates.length - 1]}]`
  );

  // One bulk read of what's already fully delivered, so we only touch dates
  // that still need work.
  let alreadySent = new Set();
  try {
    const { data, error } = await supabase
      .from("report_history")
      .select("report_date")
      .in("report_date", candidates)
      .eq("status", "sent");
    if (error) throw error;
    alreadySent = new Set((data || []).map((r) => r.report_date));
  } catch (err) {
    console.error("⚠️  Report recovery: could not pre-check report_history —", err.message);
    // fall through: generateDailyReport still gates every date individually
  }

  const toRecover = candidates.filter((d) => !alreadySent.has(d));
  if (toRecover.length === 0) {
    console.log("✅ Report recovery: all due reports already delivered.");
    return;
  }

  for (const reportDate of toRecover) {
    try {
      const result = await generateDailyReport(reportDate);
      if (result.skipped === "already-sent") {
        console.log(`✅ Recovery ${reportDate}: already delivered.`);
      } else if (result.skipped) {
        console.log(`ℹ️  Recovery ${reportDate}: ${result.skipped} — will re-check next launch.`);
      } else if (result.unsent === 0) {
        console.log(`✅ Recovery ${reportDate}: delivered to all recipients.`);
      } else {
        console.log(
          `⚠️  Recovery ${reportDate}: ${result.unsent} delivery(ies) still unsent; ` +
            "the 10:00 cron / next launch will retry."
        );
      }
    } catch (err) {
      console.error(`❌ Report recovery failed for ${reportDate}:`, err.message);
      // keep going — one bad date shouldn't block the rest of the backlog
    }
  }
}
