import type { OperationalMode } from "@/lib/types/soip";
import { COUNTRY_MODELS, scaleMetric } from "@/lib/simulation/countries";

export type SimulationPulse = {
  countryCode: string;
  authenticatedHumans: number;
  trustTps: number;
  activeSessions: number;
  roamingHumans: number;
  embassyActivity: number;
  telcoAuthEvents: number;
  timestamp: string;
};

export function generateCountryPulse(
  isoAlpha2: string,
  mode: OperationalMode = "SIMULATION",
): SimulationPulse | null {
  const model = COUNTRY_MODELS[isoAlpha2.toUpperCase()];
  if (!model) return null;

  const q = model.simulationQuality;
  const pop = model.population;
  const authRate = isoAlpha2 === "IE" ? 0.42 : 0.18;
  const telecom = model.telecom as { operators: { subscribers: number }[] };
  const movement = model.humanMovement as { roamingHumansDaily: number; citizensAbroad: number };
  const gov = model.government as { embassiesAbroad: number };
  const banking = model.banking as { authTransactionsDaily: number };

  const jitter = 0.97 + Math.random() * 0.06;

  return {
    countryCode: isoAlpha2.toUpperCase(),
    authenticatedHumans: scaleMetric(Math.round(pop * authRate), mode, q),
    trustTps: Math.round((banking.authTransactionsDaily / 86400) * jitter * (mode === "LIVE" ? 1 : 0.6)),
    activeSessions: scaleMetric(Math.round(pop * authRate * 0.04), mode, q),
    roamingHumans: scaleMetric(movement.roamingHumansDaily, mode, q),
    embassyActivity: scaleMetric(gov.embassiesAbroad * 120, mode, q),
    telcoAuthEvents: scaleMetric(
      telecom.operators.reduce((s, o) => s + o.subscribers, 0) * 0.002,
      mode,
      q,
    ),
    timestamp: new Date().toISOString(),
  };
}

export function aggregateGlobalFromCountries(mode: OperationalMode): {
  authenticatedHumans: number;
  trustTps: number;
  activeSessions: number;
} {
  let authenticatedHumans = 0;
  let trustTps = 0;
  let activeSessions = 0;

  for (const code of Object.keys(COUNTRY_MODELS)) {
    const pulse = generateCountryPulse(code, mode);
    if (!pulse) continue;
    authenticatedHumans += pulse.authenticatedHumans;
    trustTps += pulse.trustTps;
    activeSessions += pulse.activeSessions;
  }

  // Extrapolate from launch countries to planetary scale (simulation factor)
  const planetaryFactor = mode === "LIVE" ? 842 : mode === "HYBRID" ? 612 : 480;

  return {
    authenticatedHumans: authenticatedHumans * planetaryFactor,
    trustTps: Math.round(trustTps * planetaryFactor * 0.001),
    activeSessions: activeSessions * planetaryFactor,
  };
}
