import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const patchSchema = z.object({
  voucher_id: z.union([z.string(), z.number()]),
  is_used: z.boolean(),
});

// GET /api/admin/vouchers - all vouchers, any source (referral, signup,
// return_refund). The Referrals page covers referral-only vouchers;
// this page is the full picture for support/finance.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageReferrals");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("vouchers")
    .select("*, customer:customers(id, full_name, phone)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ vouchers: data });
}

// PATCH /api/admin/vouchers - void/restore a voucher
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageReferrals");
  if (denied) return denied;

  try {
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const { data: voucher, error } = await supabaseAdmin
      .from("vouchers")
      .update({ is_used: parsed.data.is_used })
      .eq("id", parsed.data.voucher_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ voucher });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update voucher" }, { status: 500 });
  }
}
