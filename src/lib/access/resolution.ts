import type { AccessContext, EidContext, OperationalMode } from "@/lib/types/soip";

/** Demo EID contexts — production resolves from Ciright MySQL via Team ID. */
export const DEMO_EIDS: EidContext[] = [
  { eid: "eid-keyra-exec", label: "Keyra Executive", personaType: "EXECUTIVE", territoryScope: "Global" },
  { eid: "eid-namibia-president", label: "President of Namibia", personaType: "EXECUTIVE", territoryScope: "Namibia" },
  { eid: "eid-ireland-regulator", label: "Irish Regulator", personaType: "REGULATOR", territoryScope: "Ireland" },
  { eid: "eid-telco-exec", label: "Telco Executive", personaType: "OPERATOR", territoryScope: "Multi-territory" },
  { eid: "eid-embassy-official", label: "Embassy Official", personaType: "EMBASSY", territoryScope: "Diplomatic" },
];

export function resolveAccessContext(params: {
  uid?: string;
  teamId?: string;
  eidKey?: string;
  mode?: OperationalMode;
}): AccessContext {
  const eid =
    DEMO_EIDS.find((e) => e.eid === params.eidKey) ??
    DEMO_EIDS[0];

  return {
    uid: params.uid ?? "uid-demo-operator",
    verifiedHuman: true,
    verifiedDevice: true,
    teamId: params.teamId ?? "team-soip-global",
    eid,
    operationalMode: params.mode ?? "SIMULATION",
    territoryPath: buildTerritoryPath(eid.territoryScope ?? "Global"),
  };
}

function buildTerritoryPath(scope: string): string[] {
  if (scope === "Namibia") {
    return ["World", "Africa", "Southern Africa", "Namibia"];
  }
  if (scope === "Ireland") {
    return ["World", "Europe", "Northern Europe", "Ireland"];
  }
  return ["World", scope];
}

export const ACCESS_RESOLUTION_CHAIN = [
  "UID",
  "Persona",
  "Team ID",
  "Organization ID",
  "Office ID",
  "Territory Scope",
  "Subscription ID",
  "EID Context",
  "Operational Rights",
] as const;
