import type { AdminUser, DeploymentAdminRole } from "@prisma/client";
import { DeploymentAdminRole as R } from "@prisma/client";

export type DeploymentAuth =
  | { kind: "legacy_super" }
  | { kind: "user"; user: AdminUser };

export type AdminScope = {
  regionIds?: string[];
  countryIds?: string[];
  telcoIds?: string[];
};

export function parseScope(json: unknown): AdminScope {
  if (!json || typeof json !== "object" || json === null) return {};
  const o = json as Record<string, unknown>;
  const arr = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : undefined;
  return {
    regionIds: arr(o.regionIds),
    countryIds: arr(o.countryIds),
    telcoIds: arr(o.telcoIds),
  };
}

export function denyIfReadOnly(auth: DeploymentAuth): Response | null {
  if (auth.kind === "legacy_super") return null;
  if (auth.user.role === R.READ_ONLY) {
    return new Response(JSON.stringify({ error: "Forbidden: read-only role." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

export function isReadOnlyRole(auth: DeploymentAuth): boolean {
  return auth.kind === "user" && auth.user.role === R.READ_ONLY;
}

export function isComplianceReviewer(auth: DeploymentAuth): boolean {
  return auth.kind === "user" && auth.user.role === R.COMPLIANCE_REVIEWER;
}

export function denyIfComplianceOnlyWriter(auth: DeploymentAuth): Response | null {
  if (auth.kind === "legacy_super") return null;
  if (auth.user.role === R.COMPLIANCE_REVIEWER) {
    return new Response(
      JSON.stringify({ error: "Forbidden: compliance role is limited to access reviews." }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }
  return denyIfReadOnly(auth);
}

export function isGlobal(auth: DeploymentAuth): boolean {
  return auth.kind === "legacy_super" || auth.user.role === R.GLOBAL_ADMIN;
}

export function scopeRegions(auth: DeploymentAuth): string[] {
  if (auth.kind === "legacy_super") return [];
  return parseScope(auth.user.scopeJson).regionIds ?? [];
}

export function scopeCountries(auth: DeploymentAuth): string[] {
  if (auth.kind === "legacy_super") return [];
  return parseScope(auth.user.scopeJson).countryIds ?? [];
}

export function scopeTelcos(auth: DeploymentAuth): string[] {
  if (auth.kind === "legacy_super") return [];
  return parseScope(auth.user.scopeJson).telcoIds ?? [];
}

export function roleLabel(role: DeploymentAdminRole): string {
  switch (role) {
    case R.GLOBAL_ADMIN:
      return "Global Admin";
    case R.REGIONAL_ADMIN:
      return "Regional Admin";
    case R.COUNTRY_ADMIN:
      return "Country Admin";
    case R.TELCO_ADMIN:
      return "Telco Admin";
    case R.COMPLIANCE_REVIEWER:
      return "Compliance Reviewer";
    case R.READ_ONLY:
      return "Read Only";
    default: {
      const _e: never = role;
      return _e;
    }
  }
}
