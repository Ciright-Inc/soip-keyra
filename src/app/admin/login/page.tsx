import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminAccessGate } from "./AdminAccessGate";
import { AdminLoginRedirect } from "@/components/admin/AdminLoginRedirect";
import {
  resolveAdminAccessState,
  resolveDeploymentAuthFromCookies,
} from "@/lib/deployments/adminContext";

type Search = { next?: string; reason?: string; force?: string };

export const dynamic = "force-dynamic";

function safeNext(raw: string | undefined): string {
  return raw?.startsWith("/admin") ? raw : "/admin";
}

function showLoginDespiteSession(sp: Search): boolean {
  return sp.force === "1" || sp.force === "true";
}

async function AdminLoginContent({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const nextPath = safeNext(sp.next);
  const forceLogin = showLoginDespiteSession(sp);

  if (!forceLogin) {
    const auth = await resolveDeploymentAuthFromCookies();
    if (auth) redirect(nextPath);

    const access = await resolveAdminAccessState();
    if (access.status === "authorized") redirect(nextPath);
  }

  const access = await resolveAdminAccessState();

  const reason =
    sp.reason === "no_access" || access.status === "no_access" ? "no_access" : "sign_in";

  return (
    <>
      <AdminLoginRedirect nextPath={nextPath} disabled={forceLogin} />
      <AdminAccessGate
        reason={reason}
        phoneE164={access.status === "no_access" ? access.phoneE164 : undefined}
        nextPath={nextPath}
        alreadyAuthorized={forceLogin && access.status === "authorized"}
      />
    </>
  );
}

export default function AdminLoginPage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 ds-body-sm text-[var(--ds-body)]">
          Loading…
        </div>
      }
    >
      <AdminLoginContent searchParams={searchParams} />
    </Suspense>
  );
}
