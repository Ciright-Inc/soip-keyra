"use client";

import "@/styles/admin-dashboard.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { useKeyraSession } from "@/contexts/KeyraSessionContext";
import { lockDocumentScroll } from "@/lib/documentScrollLock";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

const SOIP_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/dashboard", label: "Operations" },
];

function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function MenuToggleIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      {open ? (
        <path
          d="M6 6l12 12M18 6 6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function AdminDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { headerLabel } = useKeyraSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setSidebarOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    if (!mq.matches) return;
    return lockDocumentScroll();
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  return (
    <>
      <div
        data-surface="dashboard"
        className={`admin-dashboard${sidebarOpen ? " is-sidebar-open" : ""}`}
      >
        <button
          type="button"
          className="admin-dashboard__sidebar-backdrop"
          aria-label="Close navigation"
          tabIndex={sidebarOpen ? 0 : -1}
          onClick={closeSidebar}
        />
        <aside id="admin-sidebar" className="ds-sidebar" aria-label="SOIP admin navigation">
          <div className="ds-sidebar-brand">
            <p className="ds-sidebar-brand__eyebrow">SOIP admin</p>
            <p className="ds-sidebar-brand__title">Console</p>
            <p className="ds-sidebar-brand__desc">
              Sovereign operational intelligence — deployments, agents, and trust telemetry.
            </p>
          </div>

          <nav className="ds-sidebar-nav">
            <p className="ds-sidebar-heading">Operations</p>
            {SOIP_NAV.map((item) => {
              const active = isNavActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  aria-current={active ? "page" : undefined}
                  className={`ds-sidebar-row${active ? " is-active" : ""}`}
                >
                  <span className="ds-sidebar-row__label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="admin-dashboard__main">
          <header className="ds-topbar">
            <div className="ds-topbar__lead">
              <button
                type="button"
                className="ds-topbar__menu-toggle"
                aria-expanded={sidebarOpen}
                aria-controls="admin-sidebar"
                aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                onClick={toggleSidebar}
              >
                <MenuToggleIcon open={sidebarOpen} />
              </button>
              <div className="ds-topbar__meta">
                <p className="ds-topbar__eyebrow">SOIP admin</p>
                <p className="ds-topbar__title">Sovereign Operations</p>
              </div>
            </div>
            <div className="ds-topbar__actions">
              {headerLabel ? (
                <span className="ds-body-sm" style={{ marginRight: "0.75rem" }}>
                  {headerLabel}
                </span>
              ) : null}
              <AdminSignOutButton />
            </div>
          </header>

          <div className="admin-dashboard__content" id="admin-main-content">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
