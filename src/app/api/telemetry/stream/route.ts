import { NextResponse } from "next/server";
import { computeGlobalMetrics } from "@/lib/metrics/globalMetrics";
import { generateCountryPulse } from "@/lib/simulation/engine";
import type { OperationalMode } from "@/lib/types/soip";

export const dynamic = "force-dynamic";

/** Server-Sent Events stream for live operational telemetry. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode")?.toUpperCase() ?? "SIMULATION") as OperationalMode;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        const metrics = computeGlobalMetrics(mode);
        const naPulse = generateCountryPulse("NA", mode);
        const iePulse = generateCountryPulse("IE", mode);
        const payload = JSON.stringify({
          type: "telemetry",
          metrics,
          countries: { NA: naPulse, IE: iePulse },
          at: new Date().toISOString(),
        });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      send();
      const interval = setInterval(send, 5000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
