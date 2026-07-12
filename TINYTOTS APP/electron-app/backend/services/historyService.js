import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Returns true ONLY if the report was successfully sent.
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
 * Save a successful report.
 */
export async function saveSuccessfulReport(reportDate) {
  const { error } = await supabase
    .from("report_history")
    .upsert({
      report_date: reportDate,
      emailed_at: new Date().toISOString(),
      status: "sent",
      error_message: null,
    },
    {
      onConflict: "report_date",
    }
  );

  if (error) throw error;
}

/**
 * Save a failed report.
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
      {
        onConflict: "report_date",
      }
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
    .insert({
      report_date: reportDate,
      status: "pending",
    });

  if (!error) {
    return true;
  }

  // Duplicate key means another process already claimed it.
  if (error.code === "23505") {
    return false;
  }

  throw error;
}
/**
 * Get the current status of a report.
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