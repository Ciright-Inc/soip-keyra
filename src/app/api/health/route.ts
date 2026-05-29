import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Liveness probe for Railway — no auth, no database. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "soip-keyra",
    time: new Date().toISOString(),
  });
}
