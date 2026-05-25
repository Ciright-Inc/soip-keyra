"use client";

import { useMemo } from "react";
import type { AccessContext, WidgetDefinition } from "@/lib/types/soip";
import { generateCountryPulse } from "@/lib/simulation/engine";
import { AngelAgentPanel } from "@/components/widgets/AngelAgentPanel";
import { soipBadge, soipBody, soipNumeric, soipPanel, soipSectionTitle } from "@/lib/uiClasses";

type Props = {
  widget: WidgetDefinition;
  access: AccessContext;
  countryCode?: string;
  expanded: boolean;
  onToggle: () => void;
};

const SIGNAL_CLASS: Record<WidgetDefinition["signal"], string> = {
  critical: "soip-signal-critical",
  elevated: "soip-signal-elevated",
  nominal: "soip-signal-nominal",
  quiet: "soip-signal-quiet",
};

export function WidgetFrame({ widget, access, countryCode, expanded, onToggle }: Props) {
  const pulse = useMemo(() => {
    const code = countryCode || "NA";
    return generateCountryPulse(code, access.operationalMode);
  }, [countryCode, access.operationalMode]);

  const signalValue = useMemo(() => deriveSignalValue(widget, pulse), [widget, pulse]);

  return (
    <article className={`${soipPanel} soip-widget-card${expanded ? " is-expanded" : ""}`}>
      <button type="button" onClick={onToggle} className="soip-widget-card__toggle">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`${soipBadge} ${SIGNAL_CLASS[widget.signal]}`}>{widget.signal}</span>
            <span className="ds-caption-uppercase">{widget.category}</span>
          </div>
          <h3 className={soipSectionTitle}>{widget.title}</h3>
          <p className={`${soipBody} mt-1 line-clamp-2`}>{widget.description}</p>
        </div>
        <span className={`${soipNumeric} shrink-0 text-[1.75rem] font-semibold leading-none text-[var(--ds-ink)]`}>
          {signalValue}
        </span>
      </button>

      {expanded && (
        <div className="soip-widget-card__body">
          <WidgetDetail widget={widget} pulse={pulse} access={access} countryCode={countryCode} />
          <AngelAgentPanel widget={widget} access={access} countryCode={countryCode} />
        </div>
      )}
    </article>
  );
}

function WidgetDetail({
  widget,
  pulse,
  access,
  countryCode,
}: {
  widget: WidgetDefinition;
  pulse: ReturnType<typeof generateCountryPulse>;
  access: AccessContext;
  countryCode?: string;
}) {
  const rows = getDetailRows(widget.key, pulse, access, countryCode);
  return (
    <dl className="mb-0 grid grid-cols-2 gap-3">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="ds-caption-uppercase">{label}</dt>
          <dd className={`${soipNumeric} mt-0.5 text-sm text-[var(--ds-ink)]`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function deriveSignalValue(
  widget: WidgetDefinition,
  pulse: ReturnType<typeof generateCountryPulse>,
): string {
  if (!pulse) return "—";
  switch (widget.key) {
    case "human-authentication":
      return formatCompact(pulse.authenticatedHumans);
    case "telecom-intelligence":
      return formatCompact(pulse.telcoAuthEvents);
    case "auth-heatmaps":
      return formatCompact(pulse.activeSessions);
    case "embassy-intelligence":
    case "citizen-abroad":
      return formatCompact(pulse.embassyActivity);
    case "revenue-intelligence":
      return `€${formatCompact(Math.round(pulse.trustTps * 0.42))}`;
    default:
      return formatCompact(pulse.trustTps);
  }
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getDetailRows(
  key: string,
  pulse: ReturnType<typeof generateCountryPulse>,
  access: AccessContext,
  countryCode?: string,
): [string, string][] {
  const territory = countryCode || access.eid.territoryScope || "Global";
  const base: [string, string][] = [
    ["Territory", territory],
    ["Mode", access.operationalMode],
    ["Persona", access.eid.personaType],
  ];

  if (!pulse) return base;

  const extra: Record<string, [string, string][]> = {
    "human-authentication": [
      ["Authenticated", formatCompact(pulse.authenticatedHumans)],
      ["Active Sessions", formatCompact(pulse.activeSessions)],
    ],
    "telecom-intelligence": [
      ["Telco Auth Events", formatCompact(pulse.telcoAuthEvents)],
      ["Roaming Humans", formatCompact(pulse.roamingHumans)],
    ],
    "marine-protection": [
      ["SAT-NAMS Link", "Partial sync · 71%"],
      ["Marine Tracks", "Active"],
    ],
    "forestry-intelligence": [
      ["PFTL Zones", "12 monitored"],
      ["Carbon Sensitive", "4 regions"],
    ],
  };

  return [...base, ...(extra[key] ?? [["Trust TPS", String(pulse.trustTps)]])];
}
