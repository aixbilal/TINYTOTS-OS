import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import {
  MAX_ACTIVE_REPORT_RECIPIENTS,
  MAX_ACTIVE_RECIPIENTS_MESSAGE,
  normalizeName,
  validateName,
  mapRecipientDbError,
  countActiveRecipients,
} from "@/lib/report-recipients";

const SELECT = "id, name, email, is_active, created_at, updated_at";

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// PATCH — rename and/or enable/disable. Email is immutable (identity of the
// destination; changing it would be "remove + add" and would orphan history).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  let body: { name?: unknown; is_active?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const patch: { name?: string; is_active?: boolean } = {};
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (body.name !== undefined) {
    const name = normalizeName(body.name);
    const nameErr = validateName(name);
    if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });
    patch.name = name;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update — send name and/or is_active." },
      { status: 400 }
    );
  }

  // Friendly pre-check when enabling (DB trigger is the real invariant).
  if (patch.is_active === true) {
    if ((await countActiveRecipients(id)) >= MAX_ACTIVE_REPORT_RECIPIENTS) {
      return NextResponse.json({ error: MAX_ACTIVE_RECIPIENTS_MESSAGE }, { status: 409 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("daily_report_recipients")
    .update(patch)
    .eq("id", id)
    .select(SELECT)
    .maybeSingle();

  const mapped = mapRecipientDbError(error);
  if (mapped) return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  if (error) return apiErrorResponse(error, 500, "admin/report-recipients");
  if (!data) return NextResponse.json({ error: "Recipient not found." }, { status: 404 });

  return NextResponse.json({ recipient: data });
}

// DELETE — permanent removal. Delivery history is preserved:
// daily_report_deliveries snapshots name/email and its FK is ON DELETE SET NULL.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("daily_report_recipients")
    .delete()
    .eq("id", id);

  if (error) return apiErrorResponse(error, 500, "admin/report-recipients");
  return NextResponse.json({ success: true });
}
