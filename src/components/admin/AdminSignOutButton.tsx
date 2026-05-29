"use client";

import { useKeyraSession } from "@/contexts/KeyraSessionContext";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Props = {
  className?: string;
};

/** Clears Keyra + SimSecure sessions and redirects to /admin/login. */
export function AdminSignOutButton({ className = "ds-btn-secondary is-sm" }: Props) {
  const { logout } = useKeyraSession();
  const pathname = usePathname() ?? "/admin";
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      // Preserve the page the user logged out from so they return there after
      // re-authenticating. Same-origin paths only.
      const safeNext =
        pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/";
      const params = new URLSearchParams({ reason: "sign_in", next: safeNext });
      window.location.assign(`/admin/login?${params.toString()}`);
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      disabled={signingOut}
      onClick={() => void handleSignOut()}
    >
      {signingOut ? "Signing out…" : "Log out"}
    </button>
  );
}
