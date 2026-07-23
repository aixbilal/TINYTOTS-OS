import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
// TODO: import { requireAdmin } from "@/lib/require-admin";

const VOUCHER_AMOUNT = 100;
const VOUCHER_VALID_DAYS = 30;

// POST /api/admin/referrals/issue-reward - Manually issue the referral voucher
export async function POST(req: NextRequest) {
  try {
    // TODO: const authError = await requireAdmin(req);
    // TODO: if (authError) return authError;

    const { referral_id } = await req.json();

    if (!referral_id) {
      return NextResponse.json({ error: "Missing referral_id" }, { status: 400 });
    }

    const { data: referral, error: referralError } = await supabaseAdmin
      .from("referrals")
      .select("*")
      .eq("id", referral_id)
      .single();

    if (referralError || !referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    if (referral.reward_triggered) {
      return NextResponse.json(
        { error: "Reward already issued for this referral" },
        { status: 400 }
      );
    }

    if (!referral.referee_customer_id) {
      return NextResponse.json(
        { error: "This referral has no completed referee yet — cannot issue reward" },
        { status: 400 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + VOUCHER_VALID_DAYS);

    // 1. Create the voucher for the referrer
    const { data: voucher, error: voucherError } = await supabaseAdmin
      .from("vouchers")
      .insert({
        customer_id: referral.referrer_customer_id,
        amount: VOUCHER_AMOUNT,
        is_used: false,
        source: "referral",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (voucherError) {
      return NextResponse.json({ error: voucherError.message }, { status: 500 });
    }

    // 2. Mark the referral as rewarded
    const { error: updateError } = await supabaseAdmin
      .from("referrals")
      .update({ reward_triggered: true })
      .eq("id", referral_id);

    if (updateError) {
      // Voucher exists but the flag update failed — surfaced clearly, not swallowed
      return NextResponse.json(
        {
          error: `Voucher created (id ${voucher.id}) but failed to flag referral as rewarded: ${updateError.message}. Needs manual fix.`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ voucher });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to issue reward" },
      { status: 500 }
    );
  }
}