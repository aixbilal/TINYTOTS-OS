import { NextResponse } from "next/server";
import { getStoreContact } from "@/lib/get-store-contact";

export const dynamic = "force-dynamic";

// Public, read-only, whitelisted subset of app_settings - only the fields
// safe to show on customer-facing Contact/Track Order/Shipping pages.
// app_settings itself has no public RLS grant (holds unrelated admin config
// too), so this scopes exactly which keys ever leave the server.
export async function GET() {
  const data = await getStoreContact();
  return NextResponse.json({ data });
}
