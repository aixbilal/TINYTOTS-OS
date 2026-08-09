import { NextRequest, NextResponse } from "next/server";

/**
 * Verifies the Authorization: Bearer <token> header on incoming requests
 * to the Meta Agent APIs (Inventory, Order Status, Promotions, Store Info).
 *
 * Returns null if the request is authorized.
 * Returns a NextResponse (401) if the request should be rejected.
 */
export function verifyMetaAgentAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.META_AGENT_SECRET;

  if (!expectedSecret) {
    // Server misconfiguration - never reveal details to the caller
    console.error("META_AGENT_SECRET is not set in environment variables");
    return NextResponse.json(
      { success: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (token !== expectedSecret) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}   