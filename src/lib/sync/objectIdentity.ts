import type { SyncObjectView, SyncStatus } from "@/lib/types/soip";

export type ObjectIdentityInput = {
  edObjectId?: string | null;
  cirightObjectId?: string | null;
  sourceSystem?: "SOIP" | "CIRIGHT" | "HYBRID";
  objectType: string;
};

export function resolveObjectIdentity(input: ObjectIdentityInput): {
  primaryId: string;
  sourceSystem: "SOIP" | "CIRIGHT" | "HYBRID";
  confidence: number;
} {
  if (input.edObjectId && input.cirightObjectId) {
    return { primaryId: input.edObjectId, sourceSystem: "HYBRID", confidence: 1 };
  }
  if (input.cirightObjectId) {
    return { primaryId: input.cirightObjectId, sourceSystem: "CIRIGHT", confidence: 0.92 };
  }
  if (input.edObjectId) {
    return { primaryId: input.edObjectId, sourceSystem: "SOIP", confidence: 0.88 };
  }
  return { primaryId: `pending-${input.objectType}`, sourceSystem: input.sourceSystem ?? "SOIP", confidence: 0 };
}

export function computeSyncHealth(objects: SyncObjectView[]): {
  total: number;
  synced: number;
  partial: number;
  conflict: number;
  avgConfidence: number;
} {
  const total = objects.length;
  if (total === 0) {
    return { total: 0, synced: 0, partial: 0, conflict: 0, avgConfidence: 0 };
  }

  let synced = 0;
  let partial = 0;
  let conflict = 0;
  let confidenceSum = 0;

  for (const obj of objects) {
    confidenceSum += obj.syncConfidence;
    if (obj.syncStatus === "SYNCED") synced++;
    else if (obj.syncStatus === "PARTIAL" || obj.syncStatus === "STALE") partial++;
    else if (obj.syncStatus === "CONFLICT") conflict++;
  }

  return {
    total,
    synced,
    partial,
    conflict,
    avgConfidence: confidenceSum / total,
  };
}

export function inferSyncStatus(confidence: number): SyncStatus {
  if (confidence >= 0.95) return "SYNCED";
  if (confidence >= 0.7) return "PARTIAL";
  if (confidence >= 0.4) return "PENDING";
  return "STALE";
}
