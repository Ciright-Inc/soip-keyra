/** SOIP core glossary — shared types across UI, API, and simulation. */

export type OperationalMode = "SIMULATION" | "HYBRID" | "LIVE";

export type EntityKind = "HUMAN" | "AI_AGENT" | "ANDROID" | "THING";

export type AuthState =
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "HUMAN_LINKED"
  | "ORPHANED"
  | "SOVEREIGN_LINKED";

export type PersonaType =
  | "EXECUTIVE"
  | "OPERATOR"
  | "ANALYST"
  | "REGULATOR"
  | "DEVELOPER"
  | "EMBASSY"
  | "CITIZEN"
  | "SYSTEM";

export type SyncStatus = "SYNCED" | "PARTIAL" | "PENDING" | "CONFLICT" | "STALE";

export type GlobalMetrics = {
  worldHumanPopulation: number;
  authenticatedHumans: number;
  trustedHumanRelationships: number;
  authenticatedAiAgents: number;
  humanLinkedAiAgents: number;
  authenticatedAndroids: number;
  authenticatedThings: number;
  trustTps: number;
  operationalSovereignNodes: number;
  activeSecureSessions: number;
  operationalMode: OperationalMode;
  capturedAt: string;
};

export type EidContext = {
  eid: string;
  label: string;
  personaType: PersonaType;
  territoryScope?: string;
};

export type AccessContext = {
  uid: string;
  verifiedHuman: boolean;
  verifiedDevice: boolean;
  teamId: string;
  eid: EidContext;
  operationalMode: OperationalMode;
  territoryPath: string[];
};

export type WidgetDefinition = {
  key: string;
  title: string;
  description: string;
  signal: "critical" | "elevated" | "nominal" | "quiet";
  category: string;
};

export type CountrySimulationView = {
  isoAlpha2: string;
  name: string;
  operationalMode: OperationalMode;
  population: number;
  simulationQuality: number;
  demographics: Record<string, unknown>;
  workforce: Record<string, unknown>;
  telecom: Record<string, unknown>;
  banking: Record<string, unknown>;
  government: Record<string, unknown>;
  economy: Record<string, unknown>;
  humanMovement: Record<string, unknown>;
};

export type SyncObjectView = {
  id: string;
  edObjectId: string | null;
  cirightObjectId: string | null;
  sourceSystem: string;
  syncStatus: SyncStatus;
  syncConfidence: number;
  objectType: string;
  lastSyncedAt: string | null;
};

export type AngelAgentMessage = {
  role: "agent" | "system";
  content: string;
  timestamp: string;
};
