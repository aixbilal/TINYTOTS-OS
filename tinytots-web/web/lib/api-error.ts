import { NextResponse } from "next/server";

/** Log full error server-side; return opaque message + short ref to client. */
export function apiErrorResponse(
  err: unknown,
  status: number = 500,
  logLabel: string = "API error"
): NextResponse {
  const ref = crypto.randomUUID().slice(0, 8);
  const detail =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);
  console.error(`[${logLabel}] ref=${ref}`, detail, err);
  return NextResponse.json(
    {
      error: "Something went wrong. Please try again.",
      ref,
    },
    { status }
  );
}
