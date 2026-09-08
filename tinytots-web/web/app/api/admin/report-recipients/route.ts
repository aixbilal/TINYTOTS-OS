import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import {
  MAX_ACTIVE_REPORT_RECIPIENTS,
  MAX_ACTIVE_RECIPIENTS_MESSAGE,
  normalizeEmail,
  normalizeName,
  validateName,
  validateEmail,
  mapRecipientDbError,
  countActiveRecipients,
} from "@/lib/report-recipients";

const SELECT = "id, name, email, is_active, created_at, updated_at";

// GET — list all recipients (active + disabled history) for the Admin UI.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("daily_report_recipients")
    .select(SELECT)
    .order("created_at", { ascending: true });

  if (error) return apiErrorResponse(error, 500, "admin/report-recipients");

  const activeCount = (data || []).filter((r) => r.is_active).length;
  return NextResponse.json({
    recipients: data || [],
    activeCount,
    maxActive: MAX_ACTIVE_REPORT_RECIPIENTS,
  });
}

// POST — add a recipient (created active). name + email required.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  let body: { name?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = normalizeName(body.name);
  const email = normalizeEmail(body.email);

  const nameErr = validateName(name);
  if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });
  const emailErr = validateEmail(email);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

  // Friendly pre-check (the DB trigger is the real invariant).
  if ((await countActiveRecipients()) >= MAX_ACTIVE_REPORT_RECIPIENTS) {
    return NextResponse.json({ error: MAX_ACTIVE_RECIPIENTS_MESSAGE }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from("daily_report_recipients")
    .insert([{ name, email }])
    .select(SELECT)
    .single();

  const mapped = mapRecipientDbError(error);
  if (mapped) return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  if (error) return apiErrorResponse(error, 500, "admin/report-recipients");

  return NextResponse.json({ recipient: data }, { status: 201 });
}
