import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

/** Legacy nested path — forwards to /api/admin/campaigns/activate. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  let active = true;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body === "object" && "active" in body) {
      active = Boolean((body as { active: unknown }).active);
    }
  } catch {
    active = true;
  }

  const auth = req.headers.get("authorization") || "";
  const origin = req.nextUrl.origin;
  const upstream = await fetch(`${origin}/api/admin/campaigns/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify({ id: Number(id), active }),
  });

  const text = await upstream.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: text || `Upstream activate failed (HTTP ${upstream.status})` },
      { status: upstream.status || 500 }
    );
  }
}
