import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/admin/coupons - Fetch all coupons and referrals overview
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageCoupons");
  if (denied) return denied;

  try {
    const { data: coupons, error: couponsError } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (couponsError) {
      return NextResponse.json({ error: couponsError.message }, { status: 500 });
    }

    const { data: referrals, error: referralsError } = await supabaseAdmin
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false });

    if (referralsError) {
      // If referrals table query fails, fallback safely
      return NextResponse.json({ coupons, referrals: [] });
    }

    return NextResponse.json({ coupons, referrals });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Create a new coupon code
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageCoupons");
  if (denied) return denied;

  try {
    const body = await req.json();
    const {
      code,
      discount_type,
      value,
      min_spend,
      max_uses,
      is_active,
      expires_at,
    } = body;

    if (!code || !discount_type || value === undefined) {
      return NextResponse.json(
        { error: "Code, discount type, and value are required" },
        { status: 400 }
      );
    }

    if (!["percentage", "flat"].includes(discount_type)) {
      return NextResponse.json(
        { error: "discount_type must be 'percentage' or 'flat'" },
        { status: 400 }
      );
    }

    const uppercaseCode = code.trim().toUpperCase();

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .insert({
        code: uppercaseCode,
        discount_type, // 'percentage' | 'flat'
        value: parseFloat(value),
        min_spend: min_spend ? parseFloat(min_spend) : 0,
        max_uses: max_uses ? parseInt(max_uses, 10) : null,
        is_active: is_active ?? true,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coupon });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/coupons - Toggle status or update coupon
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageCoupons");
  if (denied) return denied;

  try {
    const body = await req.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing coupon ID" }, { status: 400 });
    }

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coupon });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update coupon" },
      { status: 500 }
    );
  }
}