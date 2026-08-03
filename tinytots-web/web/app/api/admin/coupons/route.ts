import { apiErrorResponse } from "@/lib/api-error";
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
  // HTML date inputs send YYYY-MM-DD; empty string means "no expiry".
  expires_at: z
    .union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v == null ? null : v)),
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
      return apiErrorResponse(couponsError, 500, "admin/coupons");
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
    return apiErrorResponse(err, 500, "admin/coupons");
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

    if (discount_type === "percentage" && value > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100." },
        { status: 400 }
      );
    }

    const uppercaseCode = code.toUpperCase();
    let expiresIso: string | null = null;
    if (expires_at) {
      // Date-only values become end-of-day local-agnostic ISO via Date parse.
      const d = /^\d{4}-\d{2}-\d{2}$/.test(expires_at)
        ? new Date(`${expires_at}T23:59:59.000Z`)
        : new Date(expires_at);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid expiry date." }, { status: 400 });
      }
      expiresIso = d.toISOString();
    }

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .insert({
        code: uppercaseCode,
        discount_type,
        value,
        min_spend: min_spend ?? 0,
        max_uses: max_uses ?? null,
        is_active: is_active ?? true,
        expires_at: expiresIso,
      })
      .select()
      .single();

    if (error) {
      return apiErrorResponse(error, 500, "admin/coupons");
    }

    return NextResponse.json({ coupon });
  } catch (err: any) {
    return apiErrorResponse(err, 500, "admin/coupons");
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
      return apiErrorResponse(error, 500, "admin/coupons");
    }

    return NextResponse.json({ coupon });
  } catch (err: any) {
    return apiErrorResponse(err, 500, "admin/coupons");
  }
}