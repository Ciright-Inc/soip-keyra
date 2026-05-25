import type { WidgetDefinition } from "@/lib/types/soip";

export const CORE_WIDGETS: WidgetDefinition[] = [
  {
    key: "sovereign-operations",
    title: "Sovereign Operations",
    description: "Cross-node operational posture, mode transitions, and sovereign coordination.",
    signal: "critical",
    category: "Operations",
  },
  {
    key: "human-authentication",
    title: "Human Authentication",
    description: "UID verification, session integrity, and authenticated human observability.",
    signal: "critical",
    category: "Identity",
  },
  {
    key: "ai-agents",
    title: "AI Agents",
    description: "Authenticated, human-linked, and orphaned AI agent governance.",
    signal: "elevated",
    category: "Identity",
  },
  {
    key: "telecom-intelligence",
    title: "Telecom Intelligence",
    description: "Carrier auth, eSIM, roaming, and subscriber trust telemetry.",
    signal: "elevated",
    category: "Infrastructure",
  },
  {
    key: "embassy-intelligence",
    title: "Embassy Intelligence",
    description: "Diplomatic authorization flows and citizen-abroad coordination.",
    signal: "nominal",
    category: "Geopolitical",
  },
  {
    key: "citizen-abroad",
    title: "Citizen Abroad",
    description: "Roaming humans, visa activity, and cross-border identity continuity.",
    signal: "nominal",
    category: "Geopolitical",
  },
  {
    key: "regulatory-intelligence",
    title: "Regulatory Intelligence",
    description: "Treaties, compliance posture, and jurisdiction enforcement tracking.",
    signal: "elevated",
    category: "Governance",
  },
  {
    key: "contract-intelligence",
    title: "Contract Intelligence",
    description: "Machine-readable contracts, clause enforcement, and operational rights.",
    signal: "nominal",
    category: "Governance",
  },
  {
    key: "revenue-intelligence",
    title: "Revenue Intelligence",
    description: "Trust utility economy splits across sovereign nodes and operators.",
    signal: "nominal",
    category: "Economy",
  },
  {
    key: "environmental-intelligence",
    title: "Environmental Intelligence",
    description: "PLTL and PFTL environmental stewardship and carbon-sensitive zones.",
    signal: "quiet",
    category: "Planetary",
  },
  {
    key: "marine-protection",
    title: "Marine Protection",
    description: "Whale, dolphin, and marine mammal trust telemetry via SAT-NAMS.",
    signal: "quiet",
    category: "Planetary",
  },
  {
    key: "forestry-intelligence",
    title: "Forestry Intelligence",
    description: "Rainforest, timber provenance, and biodiversity zone observability.",
    signal: "quiet",
    category: "Planetary",
  },
  {
    key: "global-trust-graph",
    title: "Global Trust Graph",
    description: "Relationship graph across humans, AI, things, and sovereign nodes.",
    signal: "critical",
    category: "Graph",
  },
  {
    key: "threat-intelligence",
    title: "Threat Intelligence",
    description: "Sovereign operational risk, telecom instability, and border anomalies.",
    signal: "elevated",
    category: "Security",
  },
  {
    key: "auth-heatmaps",
    title: "Authentication Heatmaps",
    description: "Live territorial authentication density and session concentration.",
    signal: "critical",
    category: "Telemetry",
  },
  {
    key: "geopolitical-intelligence",
    title: "Geopolitical Intelligence",
    description: "Country risk, embassy concerns, and regional instability signals.",
    signal: "elevated",
    category: "Geopolitical",
  },
];

export function getWidgetByKey(key: string): WidgetDefinition | undefined {
  return CORE_WIDGETS.find((w) => w.key === key);
}
