import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { Parser } from "json2csv";
import fs from "fs";
import path from "path";
import { sendReportEmail } from "./emailService.js";
import {
  saveSuccessfulReport,
  saveFailedReport,
} from "./historyService.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function generateDailyReport(reportDate) {
  try {
    // Fetch report data from PostgreSQL
    const { data, error } = await supabase.rpc("get_daily_summary", {
      p_report_date: reportDate,
    });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error("No report data returned.");
    }

    // Convert JSON to CSV
    const parser = new Parser();
    const csv = parser.parse(data);

    // Ensure reports directory exists
    const reportsDir = path.resolve("reports");

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Create file
    const fileName = `report-${reportDate}.csv`;
    const filePath = path.join(reportsDir, fileName);

    fs.writeFileSync(filePath, csv);

    console.log(`✅ CSV generated: ${filePath}`);

    // Send email
    await sendReportEmail(filePath, fileName);

    // Mark report as successfully sent
    await saveSuccessfulReport(reportDate);

    console.log(`✅ Report history saved for ${reportDate}`);

    return {
      success: true,
      filePath,
      data,
    };
  } catch (err) {
    // Record failure in report history
    try {
      await saveFailedReport(reportDate, err.message);
    } catch (historyError) {
      console.error("❌ Failed to save report failure history.");
      console.error(historyError);
    }

    console.error(`❌ Daily report generation failed for ${reportDate}`);
    console.error(err);

    throw err;
  }
}