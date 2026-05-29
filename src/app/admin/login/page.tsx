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
  if (!raw) return "/";
  // Same-origin paths only: must start with `/` and not `//` (protocol-relative).
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
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
      {/*
        Server-rendered cover: hides the gate UI on the very first paint so
        visitors who are already logged in on another Keyra site never see a
        flash of "Sign in on Keyra first" before the auto-bridge kicks in.
        The cover is removed by AdminLoginRedirect once it has decided whether
        to redirect (auth → nextPath / Get Started bridge) or fall back to the
        gate. When ?force=1 is present we skip the cover entirely so the
        explicit switch-account UI is visible immediately. The inline script
        also drops the cover when sessionStorage indicates we've already
        bounced through Get Started in this tab (i.e. user is not signed in
        anywhere) so the gate stays visible without a flicker.
      */}
      {!forceLogin ? (
        <div
          id="soip-auth-cover"
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--ds-canvas-soft, #fff)",
            zIndex: 9998,
          }}
        />
      ) : null}
      {!forceLogin ? (
        <script
          // Drop the SSR cover early when we already know the gate must show.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.sessionStorage.getItem("soip:bridge-attempted")==="1"){var c=document.getElementById("soip-auth-cover");if(c)c.style.display="none";}}catch(e){}})();`,
          }}
        />
      ) : null}
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
