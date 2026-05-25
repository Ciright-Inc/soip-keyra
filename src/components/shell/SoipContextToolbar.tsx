"use client";

import type { OperationalMode } from "@/lib/types/soip";
import { DEMO_EIDS } from "@/lib/access/resolution";
import {
  soipContextToolbar,
  soipFilterLabel,
  soipFilterSelect,
  soipFilterToolbar,
  soipToolbarMeta,
} from "@/lib/uiClasses";

type Props = {
  eidKey: string;
  selectedCountry: string;
  mode: OperationalMode;
  countries: { code: string; name: string }[];
  onEidChange: (eid: string) => void;
  onModeChange: (mode: OperationalMode) => void;
  onCountryChange: (code: string) => void;
};

export function SoipContextToolbar({
  eidKey,
  selectedCountry,
  mode,
  countries,
  onEidChange,
  onModeChange,
  onCountryChange,
}: Props) {
  const eidLabel = DEMO_EIDS.find((e) => e.eid === eidKey)?.label ?? "—";
  const territoryLabel =
    countries.find((c) => c.code === selectedCountry)?.name ?? "Global";

  return (
    <div className={soipContextToolbar}>
      <div className={soipFilterToolbar}>
        <label className={`${soipFilterLabel} soip-filter--eid`}>
          EID
          <select
            value={eidKey}
            onChange={(e) => onEidChange(e.target.value)}
            className={soipFilterSelect}
            aria-label="Enterprise identity context"
          >
            {DEMO_EIDS.map((e) => (
              <option key={e.eid} value={e.eid}>
                {e.label}
              </option>
            ))}
          </select>
        </label>

        <label className={`${soipFilterLabel} soip-filter--territory`}>
          Territory
          <select
            value={selectedCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            className={soipFilterSelect}
            aria-label="Territory scope"
          >
            <option value="">Global</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className={`${soipFilterLabel} soip-filter--mode`}>
          Mode
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as OperationalMode)}
            className={soipFilterSelect}
            aria-label="Operational mode"
          >
            <option value="SIMULATION">Simulation</option>
            <option value="HYBRID">Hybrid</option>
            <option value="LIVE">Live</option>
          </select>
        </label>
      </div>

      <span className={soipToolbarMeta} title={`${eidLabel} · ${territoryLabel}`}>
        {mode.toLowerCase()} · {territoryLabel}
      </span>
    </div>
  );
}
