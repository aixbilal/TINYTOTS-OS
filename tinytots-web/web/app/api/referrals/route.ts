import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
// TODO: import your requireAdmin guard here, e.g.:
// import { requireAdmin } from "@/lib/require-admin";

// GET /api/admin/referrals - Fetch all referrals (with referrer/referee names) + all vouchers
export async function GET(req: NextRequest) {
  try {
    // TODO: const authError = await requireAdmin(req);
    // TODO: if (authError) return authError;

    const { data: referrals, error: referralsError } = await supabaseAdmin
      .from("referrals")
      .select(
        `
        id,
        referral_code,
        reward_triggered,
        created_at,
        referrer:customers!referrals_referrer_customer_id_fkey(id, full_name, phone),
        referee:customers!referrals_referee_customer_id_fkey(id, full_name, phone)
      `
      )
      .order("created_at", { ascending: false });

    if (referralsError) {
      return NextResponse.json({ error: referralsError.message }, { status: 500 });
    }

    const { data: vouchers, error: vouchersError } = await supabaseAdmin
      .from("vouchers")
      .select("*, customer:customers(id, full_name, phone)")
      .order("created_at", { ascending: false });

    if (vouchersError) {
      return NextResponse.json({ error: vouchersError.message }, { status: 500 });
    }

    return NextResponse.json({ referrals, vouchers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/referrals - Void/restore a voucher (mark is_used)
export async function PATCH(req: NextRequest) {
  try {
    // TODO: const authError = await requireAdmin(req);
    // TODO: if (authError) return authError;

    const body = await req.json();
    const { voucher_id, is_used } = body;

    if (!voucher_id || typeof is_used !== "boolean") {
      return NextResponse.json(
        { error: "voucher_id and is_used are required" },
        { status: 400 }
      );
    }

    const { data: voucher, error } = await supabaseAdmin
      .from("vouchers")
      .update({ is_used })
      .eq("id", voucher_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ voucher });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update voucher" },
      { status: 500 }
    );
  }
}