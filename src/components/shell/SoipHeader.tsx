"use client";

import type { ReactNode } from "react";
import type { AccessContext } from "@/lib/types/soip";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";

type Props = {
  access: AccessContext;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  menuToggleIcon: ReactNode;
};

export function SoipHeader({ access, sidebarOpen, onToggleSidebar, menuToggleIcon }: Props) {
  const { user, hydrated, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="ds-topbar">
      <div className="ds-topbar__lead">
        <button
          type="button"
          className="ds-topbar__menu-toggle"
          aria-expanded={sidebarOpen}
          aria-controls="soip-sidebar"
          aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={onToggleSidebar}
        >
          {menuToggleIcon}
        </button>
        <div className="ds-topbar__meta">
          <p className="ds-topbar__eyebrow">Keyra · SOIP</p>
          <p className="ds-topbar__title">Sovereign Operational Intelligence</p>
        </div>
      </div>

      <div className="ds-topbar__actions">
        <div className="soip-status-pill">
          <span className={`soip-status-dot${access.verifiedHuman ? "" : " is-inactive"}`} />
          <span className="soip-status-pill__text">
            {hydrated && user?.phone ? `${user.phone} · ` : ""}
            UID verified · Team {access.teamId.slice(-8)}
          </span>
        </div>
        <button
          type="button"
          className="hosted-login-copy"
          style={{ marginLeft: 10, height: 36 }}
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
