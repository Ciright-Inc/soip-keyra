import { NextResponse } from "next/server";
import { computeGlobalMetrics } from "@/lib/metrics/globalMetrics";
import type { OperationalMode } from "@/lib/types/soip";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode")?.toUpperCase() ?? "SIMULATION") as OperationalMode;
  const validModes: OperationalMode[] = ["SIMULATION", "HYBRID", "LIVE"];
  const resolved = validModes.includes(mode) ? mode : "SIMULATION";

  return NextResponse.json(computeGlobalMetrics(resolved));
}
