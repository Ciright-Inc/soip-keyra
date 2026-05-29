import { cache } from "react";
import "server-only";

import { redirect } from "next/navigation";
import {
  resolveAdminAccessState,
  resolveDeploymentAuthFromCookies,
} from "@/lib/deployments/adminContext";
import type { DeploymentAuth } from "@/lib/deployments/adminAuthz";

function authContinueHref(nextPath: string): string {
  const sp = new URLSearchParams();
  if (nextPath.startsWith("/admin")) sp.set("next", nextPath);
  const q = sp.toString();
  return `/auth/continue${q ? `?${q}` : ""}`;
}

function adminLoginHref(nextPath: string, reason?: "sign_in" | "no_access"): string {
  const sp = new URLSearchParams();
  if (nextPath.startsWith("/admin")) sp.set("next", nextPath);
  if (reason) sp.set("reason", reason);
  const q = sp.toString();
  return `/admin/login${q ? `?${q}` : ""}`;
}

/** Per-request dedupe for layout + page auth checks. */
export const getAdminAuth = cache(async (): Promise<DeploymentAuth | null> => {
  return resolveDeploymentAuthFromCookies();
});

export async function assertAdminServer(nextPath = "/admin"): Promise<DeploymentAuth> {
  const auth = await getAdminAuth();
  if (auth) return auth;

  const access = await resolveAdminAccessState();
  if (access.status === "unsigned") {
    redirect(authContinueHref(nextPath));
  }
  redirect(adminLoginHref(nextPath, "no_access"));
}
