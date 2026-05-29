"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatPhoneDisplay } from "@/lib/keyraSessionDisplay";
import { buildAdminGetStartedAccessUrl } from "@/lib/keyraAppUrls";

type Props = {
  reason: "sign_in" | "no_access";
  phoneE164?: string;
  nextPath: string;
  /** When true, show the gate even though a valid admin session already exists (dev / testing). */
  alreadyAuthorized?: boolean;
};

export function AdminAccessGate({
  reason,
  phoneE164,
  nextPath,
  alreadyAuthorized = false,
}: Props) {
  const loginHref = useMemo(() => buildAdminGetStartedAccessUrl(nextPath), [nextPath]);

  const isNoAccess = reason === "no_access";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full items-stretch overflow-hidden rounded-[var(--ds-radius-lg)] border border-[var(--ds-hairline-strong)] bg-[var(--ds-surface-card)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden border-r border-[var(--ds-hairline-strong)] bg-[var(--ds-canvas-soft)] p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="ds-badge-pill">SOIP admin</div>
            <h1 className="ds-display-md mt-8">Admin access uses your Keyra login.</h1>
            <p className="ds-body-sm mt-4 max-w-sm text-[var(--ds-body)]">
              Sign in on Keyra with the same mobile number linked to an active SOIP admin user record.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              "Sign in on Keyra",
              "Mobile matched to admin user",
              "Sovereign operations console",
            ].map((item) => (
              <div
                key={item}
                className="ds-admin-panel flex items-center gap-3 py-3 text-sm font-medium"
              >
                <span className="size-2 rounded-full bg-[var(--ds-ink)]" aria-hidden />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <div className="lg:hidden">
            <p className="ds-caption-uppercase">SOIP admin</p>
            <h2 className="ds-title-md mt-3">
              {isNoAccess ? "No admin access" : "Sign in on Keyra first"}
            </h2>
          </div>

          <div className="hidden lg:block">
            <h2 className="ds-title-md">
              {isNoAccess ? "No admin access" : "Sign in on Keyra first"}
            </h2>
          </div>

          {isNoAccess ? (
            <div className="ds-body-sm mt-5 space-y-3 text-[var(--ds-body)]">
              <p>
                You are signed in to Keyra
                {phoneE164 ? (
                  <>
                    {" "}
                    as{" "}
                    <span className="font-medium text-[var(--ds-ink)]">
                      {formatPhoneDisplay(phoneE164)}
                    </span>
                  </>
                ) : null}
                , but this mobile number does not have active SOIP admin rights.
              </p>
              <p>Contact a global administrator if you need SOIP admin access.</p>
            </div>
          ) : (
            <div className="ds-body-sm mt-5 space-y-3 text-[var(--ds-body)]">
              <p>
                Admin uses the same Keyra session as the main site. Sign in first, then return here.
              </p>
              <p>
                After login, access is granted only when your mobile number matches an active SOIP
                admin user.
              </p>
            </div>
          )}

          {alreadyAuthorized ? (
            <p className="ds-body-sm mt-5 text-[var(--ds-body)]">
              You already have an active admin session. Use Log out in the admin header to sign in
              as a different user, or continue to the console.
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {alreadyAuthorized ? (
              <Link href={nextPath} className="ds-btn-primary">
                Continue to admin
              </Link>
            ) : null}
            {!isNoAccess ? (
              <a href={loginHref} className="ds-btn-primary">
                Login on Keyra
              </a>
            ) : null}
            {/*
              "Back to SOIP home" only makes sense when the visitor already has
              a keyra_session cookie — i.e. no_access (logged in but missing
              admin rights) or alreadyAuthorized. In the sign_in case the
              middleware would just bounce them back to this gate.
            */}
            {isNoAccess || alreadyAuthorized ? (
              <Link href="/" className="ds-btn-secondary">
                Back to SOIP home
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
