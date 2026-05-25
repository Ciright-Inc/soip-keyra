"use client";

import type { GlobalMetrics } from "@/lib/types/soip";
import { formatMetric } from "@/lib/metrics/globalMetrics";
import { soipNumeric } from "@/lib/uiClasses";

type Props = {
  metrics: GlobalMetrics;
};

const METRIC_ITEMS: { key: keyof GlobalMetrics; label: string; shortLabel?: string; primary?: boolean }[] = [
  { key: "authenticatedHumans", label: "Authenticated Humans", shortLabel: "Auth. Humans", primary: true },
  { key: "worldHumanPopulation", label: "World Population", shortLabel: "World Pop." },
  { key: "trustedHumanRelationships", label: "Trusted Relationships", shortLabel: "Trusted Rel." },
  { key: "authenticatedAiAgents", label: "AI Agents" },
  { key: "humanLinkedAiAgents", label: "Human-Linked AI", shortLabel: "Linked AI" },
  { key: "authenticatedAndroids", label: "Androids" },
  { key: "authenticatedThings", label: "Things" },
  { key: "trustTps", label: "Trust TPS" },
  { key: "operationalSovereignNodes", label: "Sovereign Nodes", shortLabel: "Sov. Nodes" },
  { key: "activeSecureSessions", label: "Secure Sessions", shortLabel: "Sessions" },
];

export function GlobalMetricsBar({ metrics }: Props) {
  return (
    <section aria-label="Global sovereign metrics" className="soip-metrics-grid">
      {METRIC_ITEMS.map(({ key, label, shortLabel, primary }) => {
        const raw = metrics[key];
        const value = typeof raw === "number" ? formatMetric(raw) : String(raw);
        return (
          <div
            key={key}
            className={`ds-catalog-stat-box soip-metrics-grid__cell${primary ? " is-primary" : ""}`}
          >
            <p className="ds-catalog-stat-box__label">
              <span className="soip-metrics-grid__label-full">{label}</span>
              <span className="soip-metrics-grid__label-short">{shortLabel ?? label}</span>
            </p>
            <p className={`ds-catalog-stat-box__value ${soipNumeric}`} title={value}>
              {value}
            </p>
          </div>
        );
      })}
    </section>
  );
}
