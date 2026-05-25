import type { SovereignNodeType } from "@prisma/client";

export type TerritoryLevel = {
  type: SovereignNodeType;
  label: string;
};

export const TERRITORY_HIERARCHY: TerritoryLevel[] = [
  { type: "WORLD", label: "World" },
  { type: "CONTINENT", label: "Continent" },
  { type: "REGION", label: "Region" },
  { type: "COUNTRY", label: "Country" },
  { type: "STATE", label: "State / Province" },
  { type: "COUNTY", label: "County / City" },
  { type: "ORGANIZATION", label: "Organization" },
  { type: "OFFICE", label: "Office" },
  { type: "TEAM", label: "Team" },
];

export function territoryDepth(type: SovereignNodeType): number {
  return TERRITORY_HIERARCHY.findIndex((t) => t.type === type);
}

export function isAncestor(ancestor: SovereignNodeType, descendant: SovereignNodeType): boolean {
  return territoryDepth(ancestor) < territoryDepth(descendant);
}
