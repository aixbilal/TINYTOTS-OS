import {
  reportExists,
  claimReport,
  getReportStatus,
} from "./historyService.js";
import { generateDailyReport } from "./reportService.js";

export async function recoverMissedReport() {
  try {
    // Yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const reportDate = yesterday.toISOString().split("T")[0];

    console.log(`🔍 Checking report recovery for ${reportDate}...`);

    const sent = await reportExists(reportDate);

    if (sent) {
      console.log("✅ Yesterday's report already sent.");
      return;
    }
    
    const claimed = await claimReport(reportDate);
    
    if (claimed) {
      console.log("📧 Recovering missed report...");
      await generateDailyReport(reportDate);
      return;
    }
    
    const status = await getReportStatus(reportDate);
    
    switch (status) {
      case "pending":
        console.log("⏳ Report recovery is already in progress.");
        return;
    
      case "failed":
        console.log("⚠️ Previous recovery failed.");
        console.log("📧 Retrying report generation...");
        await generateDailyReport(reportDate);
        return;
    
      default:
        console.log("ℹ️ No recovery action needed.");
    }

    console.log("✅ Missed report recovered successfully.");
  } catch (err) {
    console.error("❌ Report recovery failed.");
    console.error(err);
  }
}