import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "TinyTots Backend Running",
    timestamp: new Date().toISOString(),
  });
}