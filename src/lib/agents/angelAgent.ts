import type { AccessContext, AngelAgentMessage, WidgetDefinition } from "@/lib/types/soip";

export type AngelAgentContext = {
  widget: WidgetDefinition;
  access: AccessContext;
  countryCode?: string;
};

export function createAngelAgentGreeting(ctx: AngelAgentContext): AngelAgentMessage {
  const territory = ctx.access.eid.territoryScope ?? "Global";
  const mode = ctx.access.operationalMode.toLowerCase();

  return {
    role: "agent",
    content: `${ctx.widget.title} Angel online. Operating in ${mode} mode under ${ctx.access.eid.label} (${territory}). I monitor ${ctx.widget.description.split(".")[0].toLowerCase()}. How may I assist?`,
    timestamp: new Date().toISOString(),
  };
}

export function angelAgentRespond(
  ctx: AngelAgentContext,
  userMessage: string,
): AngelAgentMessage {
  const lower = userMessage.toLowerCase();
  let content: string;

  if (lower.includes("summar") || lower.includes("status")) {
    content = buildStatusSummary(ctx);
  } else if (lower.includes("escalat")) {
    content = `Escalation queued for ${ctx.widget.title}. Audit reference SOIP-${Date.now().toString(36).toUpperCase()}. Territory scope: ${ctx.access.eid.territoryScope ?? "Global"}.`;
  } else if (lower.includes("recommend")) {
    content = buildRecommendation(ctx);
  } else if (lower.includes("namibia") || lower.includes("ireland")) {
    const country = lower.includes("namibia") ? "Namibia" : "Ireland";
    content = `${country} sovereign node is active in ${ctx.access.operationalMode} mode. Country intelligence agents are refining simulation quality from public regulatory and telecom sources.`;
  } else {
    content = `Acknowledged. Monitoring ${ctx.widget.title} signals for ${ctx.access.eid.label}. Current operational mode: ${ctx.access.operationalMode}.`;
  }

  return { role: "agent", content, timestamp: new Date().toISOString() };
}

function buildStatusSummary(ctx: AngelAgentContext): string {
  const signals: Record<string, string> = {
    critical: "elevated attention — primary sovereign signal",
    elevated: "active monitoring — secondary signal chain",
    nominal: "within expected parameters",
    quiet: "ambient observability — no immediate action",
  };
  return `${ctx.widget.title}: ${signals[ctx.widget.signal]}. Persona ${ctx.access.eid.personaType}, Team ${ctx.access.teamId}.`;
}

function buildRecommendation(ctx: AngelAgentContext): string {
  if (ctx.widget.key === "human-authentication") {
    return "Recommend reviewing authenticated human growth in Namibia simulation — mobile penetration supports accelerated UID enrollment pilot.";
  }
  if (ctx.widget.key === "telecom-intelligence") {
    return "Recommend eSIM adoption tracking for Ireland — Three and Vodafone show highest esim-capable subscriber bases.";
  }
  if (ctx.widget.key === "regulatory-intelligence") {
    return "Recommend EUDR compliance review for Ireland sovereign node — treaty status pending for forestry supply chain clauses.";
  }
  return `Continue ${ctx.access.operationalMode} observation. Transition to Hybrid when Ciright sync confidence exceeds 0.85 across Team ${ctx.access.teamId}.`;
}

export function angelAgentAuditEntry(action: string, ctx: AngelAgentContext): Record<string, unknown> {
  return {
    action,
    widgetKey: ctx.widget.key,
    uid: ctx.access.uid,
    eid: ctx.access.eid.eid,
    teamId: ctx.access.teamId,
    mode: ctx.access.operationalMode,
    at: new Date().toISOString(),
  };
}
