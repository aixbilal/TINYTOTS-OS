import { NextResponse } from "next/server";
import { getPushConfig } from "@/lib/push";

// Public: the browser needs the VAPID *public* key to create a
// PushSubscription. The private key never leaves the server (lib/push.ts).
// Returns 503 when push isn't configured so the admin UI can show a clear
// "not available" state instead of failing silently.
export async function GET() {
  const config = getPushConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Push notifications are not configured on this deployment." },
      { status: 503 }
    );
  }
  return NextResponse.json({ publicKey: config.publicKey });
}
