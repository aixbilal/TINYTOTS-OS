import { generateDailyReport } from "./reportService.js";
import { reportDateInKarachi } from "./historyService.js";

/**
 * On backend startup, make sure YESTERDAY's report (Asia/Karachi) went out.
 *
 * All the gating lives in generateDailyReport(): it claims report_history for
 * the date, returns immediately if it's already fully sent or another run is
 * generating it right now, and otherwise retries only the delivery rows that
 * aren't 'sent'. So this is safe to run on every launch, and safe to run
 * alongside the live 23:59 cron.
 */
export async function recoverMissedReport() {
  const reportDate = reportDateInKarachi(1); // yesterday, Asia/Karachi
  console.log(`🔍 Checking report recovery for ${reportDate}...`);

  try {
    const result = await generateDailyReport(reportDate);

    if (result.skipped === "already-sent") {
      console.log("✅ Yesterday's report was already fully delivered.");
    } else if (result.skipped) {
      console.log(`ℹ️  Recovery deferred (${result.skipped}) — will re-check next launch.`);
    } else if (result.unsent === 0) {
      console.log("✅ Missed report recovered — all recipients delivered.");
    } else {
      console.log(
        `⚠️  Recovery ran: ${result.unsent} recipient delivery(ies) still unsent; ` +
          "the 23:59 cron / next launch will retry them."
      );
    }
  } catch (err) {
    console.error("❌ Report recovery failed.");
    console.error(err);
  }
}
