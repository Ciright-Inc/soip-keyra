import { NextResponse } from "next/server";
import { angelAgentAuditEntry, angelAgentRespond, createAngelAgentGreeting } from "@/lib/agents/angelAgent";
import { resolveAccessContext } from "@/lib/access/resolution";
import { getWidgetByKey } from "@/lib/widgets/registry";
import type { OperationalMode } from "@/lib/types/soip";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    widgetKey: string;
    message?: string;
    eidKey?: string;
    mode?: OperationalMode;
    countryCode?: string;
  };

  const widget = getWidgetByKey(body.widgetKey);
  if (!widget) {
    return NextResponse.json({ error: "Widget not found" }, { status: 404 });
  }

  const access = resolveAccessContext({
    eidKey: body.eidKey,
    mode: body.mode,
  });

  const ctx = { widget, access, countryCode: body.countryCode };

  if (!body.message) {
    return NextResponse.json({
      greeting: createAngelAgentGreeting(ctx),
      audit: angelAgentAuditEntry("session_open", ctx),
    });
  }

  return NextResponse.json({
    response: angelAgentRespond(ctx, body.message),
    audit: angelAgentAuditEntry("agent_interaction", ctx),
  });
}
