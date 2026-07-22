import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function createNotification({
  category,
  priority,
  title,
  description,
  target_role = "admin",
  target_username = null,
  action_label = null,
  action_type = null,
  action_payload = null,
}) {
  try {
    const payload = {
      category,
      priority,
      title,
      description,
      target_role,
      target_username,
      action_label,
      action_type,
      action_payload,
    };

    // Remove null keys that aren't strictly needed
    Object.keys(payload).forEach(
      (key) => payload[key] === null && delete payload[key]
    );

    const { data, error } = await supabase
      .from("notifications")
      .insert([payload])
      .select();

    if (error) {
      console.error(`❌ [Notification Insert Error] (${category}):`, error.message);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("❌ [Notification Unexpected Error]:", err.message);
    return { success: false, error: err };
  }
}