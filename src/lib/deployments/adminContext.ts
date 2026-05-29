import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { normalizePhoneE164 } from "@/lib/adminUserPhone";
import type { DeploymentAuth } from "@/lib/deployments/adminAuthz";
import {
  resolveKeyraSessionFromCookies,
  resolveKeyraSessionFromRequest,
} from "@/lib/keyraSessionServer";

export type AdminAccessState =
  | { status: "authorized"; auth: DeploymentAuth }
  | { status: "unsigned" }
  | { status: "no_access"; phoneE164: string };

export const resolveAdminAuthForPhone = cache(
  async (phoneE164: string): Promise<DeploymentAuth | null> => {
    const phone = normalizePhoneE164(phoneE164);
    if (!phone) return null;

    try {
      const user = await prisma.adminUser.findFirst({
        where: { phoneE164: phone, isActive: true },
      });
      if (!user) return null;
      return { kind: "user", user };
    } catch (err) {
      // DB unavailable / table missing — fail closed (no admin access).
      console.error("[soip:resolveAdminAuthForPhone]", err);
      return null;
    }
  },
);

export async function resolveDeploymentAuth(req: Request): Promise<DeploymentAuth | null> {
  const session = await resolveKeyraSessionFromRequest(req);
  if (!session?.phoneE164) return null;
  return resolveAdminAuthForPhone(session.phoneE164);
}

export const resolveDeploymentAuthFromCookies = cache(
  async (): Promise<DeploymentAuth | null> => {
    const session = await resolveKeyraSessionFromCookies();
    if (!session?.phoneE164) return null;
    return resolveAdminAuthForPhone(session.phoneE164);
  },
);

export const resolveAdminAccessState = cache(async (): Promise<AdminAccessState> => {
  const session = await resolveKeyraSessionFromCookies();
  if (!session?.phoneE164) return { status: "unsigned" };

  const auth = await resolveAdminAuthForPhone(session.phoneE164);
  if (!auth) return { status: "no_access", phoneE164: session.phoneE164 };
  return { status: "authorized", auth };
});

export async function requireDeploymentAuth(req: Request): Promise<DeploymentAuth | Response> {
  const auth = await resolveDeploymentAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return auth;
}

export { resolveKeyraSessionFromCookies, resolveKeyraSessionFromRequest };
