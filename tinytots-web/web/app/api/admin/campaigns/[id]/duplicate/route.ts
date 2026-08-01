import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

/** Legacy nested path — forwards to /api/admin/campaigns/duplicate. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  const auth = req.headers.get("authorization") || "";
  const origin = req.nextUrl.origin;
  const upstream = await fetch(`${origin}/api/admin/campaigns/duplicate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify({ id: Number(id) }),
  });

  const text = await upstream.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: text || `Upstream duplicate failed (HTTP ${upstream.status})` },
      { status: upstream.status || 500 }
    );
  }
}
