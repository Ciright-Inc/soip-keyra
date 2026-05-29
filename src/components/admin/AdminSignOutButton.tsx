"use client";

import { useKeyraSession } from "@/contexts/KeyraSessionContext";
import { useState } from "react";

type Props = {
  className?: string;
};

/** Clears Keyra + SimSecure sessions and redirects to /admin/login. */
export function AdminSignOutButton({ className = "ds-btn-secondary is-sm" }: Props) {
  const { logout } = useKeyraSession();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      // `logout()` clears local + SimSecure sessions, broadcasts, and navigates
      // to `/admin/login` (via Get Started on cross-domain hosts).
      await logout();
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
