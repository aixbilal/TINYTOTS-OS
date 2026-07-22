import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Shared notification writer — used by both in-store checkout (server.js)
// and WhatsApp fast-lane checkout (fastLaneHandler.js) so low/out-of-stock
// alerts fire the same way regardless of sale channel.
export async function createNotification({
  category,
  priority,
  title,
  description,
  target_role = "admin",
  action_label = null,
  action_type = null,
  action_payload = null,
}) {
  const { error } = await supabase.from("notifications").insert([{
    category,
    priority,
    title,
    description,
    target_role,
    action_label,
    action_type,
    action_payload,
  }]);

  if (error) {
    console.error("createNotification insert error:", error);
  }
}