import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Shared business rules for public.daily_report_recipients, used by the
 * website Admin API. The Electron POS backend enforces the identical rules
 * against the same table (backend/server.js), and the DB trigger
 * enforce_max_active_report_recipients() is the race-safe backstop.
 *
 * A report recipient is a DESTINATION ONLY — name + email + is_active.
 * Never a credential, never an app-login identity.
 */

export const MAX_ACTIVE_REPORT_RECIPIENTS = 5;
export const MAX_ACTIVE_RECIPIENTS_MESSAGE = `Maximum ${MAX_ACTIVE_REPORT_RECIPIENTS} active daily report recipients are allowed.`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 120;
const EMAIL_MAX = 200;

export function normalizeEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export function normalizeName(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

/** Returns an error message, or null if valid. */
export function validateName(name: string): string | null {
  if (!name) return "A name is required.";
  if (name.length > NAME_MAX) return `Name must be ${NAME_MAX} characters or fewer.`;
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) return "An email address is required.";
  if (email.length > EMAIL_MAX) return "That email address is too long.";
  if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
  return null;
}

/**
 * Map a Supabase/Postgres error from a recipient mutation to a clean
 * `{ status, message }`, or null if it isn't one we recognise (caller should
 * treat that as a 500 and NOT echo the raw error).
 */
export function mapRecipientDbError(
  err: { code?: string; message?: string } | null | undefined
): { status: number; message: string } | null {
  if (!err) return null;
  if (err.code === "23505") {
    return { status: 409, message: "That email is already on the list." };
  }
  // enforce_max_active_report_recipients(): errcode check_violation (23514)
  // with this exact message.
  if (
    err.code === "23514" ||
    /maximum 5 active daily report recipients/i.test(err.message || "")
  ) {
    return { status: 409, message: MAX_ACTIVE_RECIPIENTS_MESSAGE };
  }
  return null;
}

export async function countActiveRecipients(excludeId?: number): Promise<number> {
  let q = supabaseAdmin
    .from("daily_report_recipients")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  if (excludeId != null) q = q.neq("id", excludeId);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}
