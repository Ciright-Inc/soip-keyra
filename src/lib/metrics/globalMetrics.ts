import type { GlobalMetrics, OperationalMode } from "@/lib/types/soip";
import { aggregateGlobalFromCountries } from "@/lib/simulation/engine";

const WORLD_POPULATION = 8_092_000_000;

/**
 * Deterministic snapshot for SSR/first paint.
 * The simulation engine includes `Math.random()` jitter, which can cause hydration mismatches when
 * values differ between server render and client hydration. Use this for initial UI, then refresh
 * with `computeGlobalMetrics()` on the client.
 */
export function computeGlobalMetricsSnapshot(mode: OperationalMode = "SIMULATION"): GlobalMetrics {
  const modeScale = mode === "LIVE" ? 1 : mode === "HYBRID" ? 0.74 : 0.58;
  const authRate = mode === "LIVE" ? 0.42 : mode === "HYBRID" ? 0.3 : 0.18;
  const authenticatedHumans = Math.round(WORLD_POPULATION * authRate * modeScale);
  const activeSecureSessions = Math.round(authenticatedHumans * 0.04);
  const trustTps = Math.round((authenticatedHumans / 10_000_000) * (mode === "LIVE" ? 1 : 0.6));

  return {
    worldHumanPopulation: WORLD_POPULATION,
    authenticatedHumans,
    trustedHumanRelationships: Math.round(authenticatedHumans * 3.2 * modeScale),
    authenticatedAiAgents: Math.round(2_840_000 * modeScale),
    humanLinkedAiAgents: Math.round(1_920_000 * modeScale),
    authenticatedAndroids: Math.round(48_200 * modeScale),
    authenticatedThings: Math.round(892_000_000 * modeScale),
    trustTps,
    operationalSovereignNodes: mode === "LIVE" ? 184 : mode === "HYBRID" ? 42 : 28,
    activeSecureSessions: activeSecureSessions,
    operationalMode: mode,
    capturedAt: "",
  };
}

export function computeGlobalMetrics(mode: OperationalMode = "SIMULATION"): GlobalMetrics {
  const countryAgg = aggregateGlobalFromCountries(mode);
  const modeScale = mode === "LIVE" ? 1 : mode === "HYBRID" ? 0.74 : 0.58;

  return {
    worldHumanPopulation: WORLD_POPULATION,
    authenticatedHumans: countryAgg.authenticatedHumans,
    trustedHumanRelationships: Math.round(countryAgg.authenticatedHumans * 3.2 * modeScale),
    authenticatedAiAgents: Math.round(2_840_000 * modeScale),
    humanLinkedAiAgents: Math.round(1_920_000 * modeScale),
    authenticatedAndroids: Math.round(48_200 * modeScale),
    authenticatedThings: Math.round(892_000_000 * modeScale),
    trustTps: countryAgg.trustTps,
    operationalSovereignNodes: mode === "LIVE" ? 184 : mode === "HYBRID" ? 42 : 28,
    activeSecureSessions: countryAgg.activeSessions,
    operationalMode: mode,
    capturedAt: new Date().toISOString(),
  };
}

export function formatMetric(value: number, compact = true): string {
  if (compact) {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString("en-IE");
}
