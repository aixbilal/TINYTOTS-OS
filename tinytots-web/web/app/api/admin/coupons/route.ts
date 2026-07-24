import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const couponCreateSchema = z.object({
  code: z.string().trim().min(1).max(50),
  discount_type: z.enum(["percentage", "flat"]),
  value: z.coerce.number().positive(),
  min_spend: z.coerce.number().min(0).optional(),
  max_uses: z.coerce.number().int().positive().optional().nullable(),
  is_active: z.boolean().optional(),
  expires_at: z.string().datetime().optional().nullable(),
});

const couponPatchSchema = z.object({
  id: z.union([z.string(), z.number()]),
  is_active: z.boolean(),
});

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
    const rawBody = await req.json();
    const parsed = couponCreateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues.map((issue) => issue.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { code, discount_type, value, min_spend, max_uses, is_active, expires_at } =
      parsed.data;

    const uppercaseCode = code.toUpperCase();

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .insert({
        code: uppercaseCode,
        discount_type,
        value,
        min_spend: min_spend ?? 0,
        max_uses: max_uses ?? null,
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
    const rawBody = await req.json();
    const parsed = couponPatchSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues.map((issue) => issue.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { id, is_active } = parsed.data;

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