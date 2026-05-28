"use client";

import { useCallback, useEffect, useState } from "react";
import type { GlobalMetrics, OperationalMode } from "@/lib/types/soip";
import { resolveAccessContext } from "@/lib/access/resolution";
import { computeGlobalMetrics, computeGlobalMetricsSnapshot } from "@/lib/metrics/globalMetrics";
import { GlobalMetricsBar } from "@/components/metrics/GlobalMetricsBar";
import { SoipContextToolbar } from "@/components/shell/SoipContextToolbar";
import { SoipHeader } from "@/components/shell/SoipHeader";
import { SoipSidebar } from "@/components/shell/SoipSidebar";
import { WidgetGrid } from "@/components/widgets/WidgetGrid";

type Props = {
  countries: { code: string; name: string }[];
};

function MenuToggleIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      {open ? (
        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function SoipShell({ countries }: Props) {
  const [eidKey, setEidKey] = useState("eid-keyra-exec");
  const [mode, setMode] = useState<OperationalMode>("SIMULATION");
  const [country, setCountry] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metrics, setMetrics] = useState<GlobalMetrics>(() =>
    computeGlobalMetricsSnapshot("SIMULATION"),
  );

  const access = resolveAccessContext({ eidKey, mode });

  const handleModeChange = useCallback((next: OperationalMode) => {
    setMode(next);
    setMetrics(computeGlobalMetrics(next));
  }, []);

  // After hydration, replace deterministic snapshot with live jittered simulation.
  useEffect(() => {
    setMetrics(computeGlobalMetrics(mode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  return (
    <div
      data-surface="dashboard"
      className={`admin-dashboard${sidebarOpen ? " is-sidebar-open" : ""}`}
    >
      <button
        type="button"
        className="admin-dashboard__sidebar-backdrop"
        aria-label="Close navigation"
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={() => setSidebarOpen(false)}
      />

      <SoipSidebar access={access} />

      <div className="admin-dashboard__main">
        <SoipHeader
          access={access}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          menuToggleIcon={<MenuToggleIcon open={sidebarOpen} />}
        />

        <main className="admin-dashboard__content" id="soip-main-content">
          <div className="ds-page-header soip-page-header">
            <div>
              <h1 className="ds-display-sm">Sovereign dashboard</h1>
              <p className="ds-body-sm mt-1 max-w-prose">
                Trust utility observability across sovereign nodes, humans, AI agents, and
                authenticated things.
              </p>
            </div>
          </div>

          <SoipContextToolbar
            eidKey={eidKey}
            selectedCountry={country}
            mode={mode}
            countries={countries}
            onEidChange={setEidKey}
            onModeChange={handleModeChange}
            onCountryChange={setCountry}
          />

          <GlobalMetricsBar metrics={metrics} />
          <WidgetGrid access={access} countryCode={country || undefined} />
        </main>
      </div>
    </div>
  );
}
