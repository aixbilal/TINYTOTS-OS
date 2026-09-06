import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { getVariantAvailability } from "@/lib/locations/get-variant-availability";

export const dynamic = "force-dynamic";

// GET /api/stores/availability?variantId=123
// Public, read-only: which verified stores currently have this exact
// variant in stock. Never exposes raw quantities — see
// lib/locations/get-variant-availability.ts.
export async function GET(request: NextRequest) {
  const variantIdParam = request.nextUrl.searchParams.get("variantId");
  const variantId = Number(variantIdParam);

  if (!variantIdParam || !Number.isFinite(variantId) || variantId <= 0) {
    return NextResponse.json({ error: "variantId must be a positive integer" }, { status: 400 });
  }

  try {
    const locations = await getVariantAvailability(variantId);
    return NextResponse.json({ locations });
  } catch (err) {
    return apiErrorResponse(err, 500, "stores/availability");
  }
}
