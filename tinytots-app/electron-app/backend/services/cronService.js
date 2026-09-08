import "dotenv/config";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import { generateDailyReport } from "./reportService.js";
import { reportDateInKarachi } from "./historyService.js";
import { createNotification } from "./notifications.js";
import { sendMessage } from "../lib/sendMessage.js";
import { OWNER_PHONE, restoreStockForSale } from "../lib/stockRestore.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REPORT_TZ = "Asia/Karachi";
const DAILY_REPORT_TASK_NAME = "tinytots-daily-report";

// Registered-once guard for THIS backend process, doubling as the cached task
// handle. startDailyReportCron() may be called directly (embedded POS) and
// again via startCronJobs() (standalone) — the cron must still be scheduled
// exactly once.
let dailyReportTask = null;

/**
 * The daily sales report scheduler — "0 10 * * *" in Asia/Karachi (10:00 AM),
 * covering the PREVIOUS day's activity (e.g. Monday's report sends Tuesday
 * 10:00 AM).
 *
 * Runs in EVERY backend mode:
 *   - embedded packaged POS (POS_EMBEDDED=1): this IS the primary live
 *     scheduler while the till stays open.
 *   - standalone backend: same cron (plus the operational crons below).
 *
 * Idempotent to call (guarded). Duplicate FIRINGS are safe too:
 * generateDailyReport() claims report_history for the date and works from
 * per-recipient daily_report_deliveries rows, so a cron firing that races a
 * startup recovery (or a second till) never double-sends.
 */
export function startDailyReportCron() {
  if (dailyReportTask) {
    console.log("[cron] Daily report cron already registered for this process — skipping.");
    return dailyReportTask;
  }

  dailyReportTask = cron.schedule(
    "0 10 * * *",
    async () => {
      const reportDate = reportDateInKarachi(1); // YESTERDAY on the Asia/Karachi clock
      console.log(`🕙 Daily report cron firing (10:00 ${REPORT_TZ}) for ${reportDate}...`);
      try {
        const result = await generateDailyReport(reportDate);
        console.log(
          result.skipped
            ? `ℹ️  Daily report ${reportDate}: ${result.skipped}.`
            : `✅ Daily report ${reportDate}: ${result.sent} sent, ${result.failed} failed, ${result.unsent} unsent.`
        );
      } catch (err) {
        console.error(`❌ Daily report job failed for ${reportDate}.`);
        console.error(err);
      }
    },
    { timezone: REPORT_TZ, name: DAILY_REPORT_TASK_NAME, noOverlap: true }
  );

  console.log(`✅ Daily report cron scheduled — 10:00 ${REPORT_TZ} (prev-day report; once per process).`);
  return dailyReportTask;
}

export function startCronJobs() {
  // Daily report via the shared, guarded registration so standalone doesn't
  // double-register it if startDailyReportCron() was also called.
  startDailyReportCron();

  // ---------------- Aging Stock / Dead Capital — daily 9:00 AM ----------------
  // NOTE: the crons below push WhatsApp messages / flip non-idempotent flags
  // and are NOT safe to run from multiple POS tills — they stay standalone
  // only (this function is only called in non-embedded mode). Unchanged.
  cron.schedule("0 9 * * *", async () => {
    console.log("📦 Running aging stock check...");
    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data: agingProducts, error } = await supabase
        .from("products")
        .select("id, name, created_at, aging_flagged")
        .lte("created_at", sixtyDaysAgo.toISOString())
        .or("aging_flagged.is.null,aging_flagged.eq.false");

      if (error) throw error;

      for (const product of agingProducts) {
        const daysOld = Math.floor(
          (Date.now() - new Date(product.created_at).getTime()) / 86400000
        );

        await createNotification({
          category: "inventory",
          priority: "warning",
          title: "Aging Stock",
          description: `${product.name} has been unsold for ${daysOld} days. Consider clearance pricing.`,
          target_role: "admin",
          action_label: "View Product",
          action_type: "view_product",
          action_payload: { productId: product.id },
        });

        await sendMessage(
          OWNER_PHONE,
          `📦 Aging stock alert: "${product.name}" has been sitting unsold for ${daysOld} days.`
        );

        await supabase.from("products").update({ aging_flagged: true }).eq("id", product.id);
      }

      console.log(`✅ Aging stock check complete — ${agingProducts.length} flagged.`);
    } catch (err) {
      console.error("❌ Aging stock cron error:", err);
    }
  });
  console.log("✅ Aging stock cron scheduled (09:00 daily)");

  // ---------------- Goal Tracking — daily 9:05 AM ----------------
// Change it to this temporarily:
cron.schedule("5 9 * * *", async () => {

    console.log("🎯 Running goal progress check...");
    try {
      const today = new Date().toISOString().slice(0, 10);

      const { data: activeGoal, error: goalError } = await supabase
        .from("goals")
        .select("*")
        .lte("period_start", today)
        .gte("period_end", today)
        .eq("notified", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (goalError) throw goalError;
      if (!activeGoal) {
        console.log("No active un-notified goal for today — skipping.");
        return;
      }

      const { data: periodSales, error: salesError } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", `${activeGoal.period_start}T00:00:00`)
        .lte("created_at", `${activeGoal.period_end}T23:59:59`);

      if (salesError) throw salesError;

      const totalSoFar = periodSales.reduce((sum, s) => sum + Number(s.total || 0), 0);

      if (totalSoFar >= Number(activeGoal.target_amount)) {
        await createNotification({
          category: "sales",
          priority: "success",
          title: "🎉 Goal Achieved!",
          description: `Monthly sales goal of Rs. ${Number(activeGoal.target_amount).toLocaleString()} has been reached (Rs. ${totalSoFar.toLocaleString()} so far).`,
          target_role: "admin",
          action_label: "View Performance",
          action_type: "view_performance",
        });

        await sendMessage(
          OWNER_PHONE,
          `🎉 Goal achieved! Your monthly sales target of Rs. ${Number(activeGoal.target_amount).toLocaleString()} has been hit — currently at Rs. ${totalSoFar.toLocaleString()}. Great work!`
        );

        await supabase.from("goals").update({ notified: true }).eq("id", activeGoal.id);
        console.log("✅ Goal achieved notification sent.");
      } else {
        console.log(`Goal not yet reached: Rs. ${totalSoFar.toLocaleString()} / Rs. ${Number(activeGoal.target_amount).toLocaleString()}`);
      }
    } catch (err) {
      console.error("❌ Goal tracking cron error:", err);
    }
  });
  console.log("✅ Goal tracking cron scheduled (09:05 daily)");

  // ---------------- Pickup Expiry Auto-Cancel — daily 9:10 AM ----------------
  cron.schedule("10 9 * * *", async () => {
    console.log("⏰ Running pickup expiry check...");
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: expiredOrders, error } = await supabase
        .from("sales")
        .select("id, receipt_number, customer_phone, total, created_at")
        .eq("status", "reserved")
        .eq("fulfillment_type", "pickup")
        .lte("created_at", threeDaysAgo.toISOString());

      if (error) throw error;

      if (!expiredOrders || expiredOrders.length === 0) {
        console.log("No expired pickup reservations found.");
      } else {
        for (const order of expiredOrders) {
          try {
            // Restore stock for every item on this sale (same logic as manual CANCEL)
            await restoreStockForSale(order.id);

            const { error: cancelError } = await supabase
              .from("sales")
              .update({ status: "cancelled" })
              .eq("id", order.id);

            if (cancelError) {
              console.error(`❌ Failed to auto-cancel order ${order.receipt_number}:`, cancelError);
              continue;
            }

            // Notify the customer, best-effort
            try {
              await sendMessage(
                order.customer_phone,
                `⏰ Your reservation for order ${order.receipt_number} has expired after 3 days and has been cancelled. If you'd still like these items, please place a new order. We're sorry for the inconvenience!`
              );
            } catch (notifyErr) {
              console.error(`Failed to notify customer for ${order.receipt_number}:`, notifyErr);
            }

            // Notify the owner too
            await createNotification({
              category: "sales",
              priority: "warning",
              title: "Pickup Reservation Expired",
              description: `Order ${order.receipt_number} (Rs. ${Number(order.total).toFixed(2)}) was auto-cancelled after 3 days unclaimed.`,
              target_role: "admin",
              action_label: "View Order",
              action_type: "view_order",
              action_payload: { saleId: order.id },
            });

            console.log(`✅ Auto-cancelled expired pickup order ${order.receipt_number}`);
          } catch (orderErr) {
            console.error(`❌ Error processing expired order ${order.receipt_number}:`, orderErr);
          }
        }

        console.log(`✅ Pickup expiry check complete — ${expiredOrders.length} order(s) processed.`);
      }
    } catch (err) {
      console.error("❌ Pickup expiry cron error:", err);
    }
  });
  console.log("✅ Pickup expiry cron scheduled (09:10 daily)");
}