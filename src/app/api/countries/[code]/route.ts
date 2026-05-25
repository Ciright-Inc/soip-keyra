import { NextResponse } from "next/server";
import { getCountryModel } from "@/lib/simulation/countries";
import { generateCountryPulse } from "@/lib/simulation/engine";
import type { OperationalMode } from "@/lib/types/soip";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function GET(req: Request, { params }: Params) {
  const { code } = await params;
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode")?.toUpperCase() ?? "SIMULATION") as OperationalMode;

  const model = getCountryModel(code);
  if (!model) {
    return NextResponse.json({ error: "Country not found" }, { status: 404 });
  }

  const pulse = generateCountryPulse(code, mode);

  return NextResponse.json({
    ...model,
    operationalMode: mode,
    pulse,
  });
}
