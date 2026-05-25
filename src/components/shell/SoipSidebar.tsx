"use client";

import { ACCESS_RESOLUTION_CHAIN } from "@/lib/access/resolution";
import type { AccessContext } from "@/lib/types/soip";

type Props = {
  access: AccessContext;
};

export function SoipSidebar({ access }: Props) {
  return (
    <aside id="soip-sidebar" className="ds-sidebar" aria-label="SOIP context">
      <div className="ds-sidebar-brand">
        <p className="ds-sidebar-brand__eyebrow">Keyra admin</p>
        <p className="ds-sidebar-brand__title">SOIP</p>
        <p className="ds-sidebar-brand__desc">
          Sovereign Operational Intelligence Platform — trust utility layer.
        </p>
      </div>

      <nav className="ds-sidebar-nav">
        <p className="ds-sidebar-heading">Context</p>
        <div className="soip-sidebar-info">
          <section className="soip-sidebar-info__block">
            <h2 className="soip-sidebar-info__heading">Access resolution</h2>
            <ol>
              {ACCESS_RESOLUTION_CHAIN.map((step, i) => (
                <li
                  key={step}
                  className={`soip-sidebar-info__item${i === ACCESS_RESOLUTION_CHAIN.length - 1 ? " is-active" : ""}`}
                >
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <section className="soip-sidebar-info__block">
            <h2 className="soip-sidebar-info__heading">Territory path</h2>
            <ul>
              {access.territoryPath.map((t) => (
                <li key={t} className="soip-sidebar-info__item">
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <section className="soip-sidebar-info__block">
            <h2 className="soip-sidebar-info__heading">Sync health</h2>
            <SyncRow label="Ciright Core" status="PARTIAL" confidence={0.78} />
            <SyncRow label="SOIP Intelligence" status="SYNCED" confidence={0.96} />
            <SyncRow label="SAT-NAMS" status="PARTIAL" confidence={0.71} />
          </section>
        </div>
      </nav>
    </aside>
  );
}

function SyncRow({
  label,
  status,
  confidence,
}: {
  label: string;
  status: string;
  confidence: number;
}) {
  return (
    <div className="soip-sidebar-info__item flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="ds-caption">
        {status} · {(confidence * 100).toFixed(0)}%
      </span>
    </div>
  );
}
