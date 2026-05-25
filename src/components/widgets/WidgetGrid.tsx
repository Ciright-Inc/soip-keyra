"use client";

import { useState } from "react";
import type { AccessContext } from "@/lib/types/soip";
import { CORE_WIDGETS } from "@/lib/widgets/registry";
import { WidgetFrame } from "@/components/widgets/WidgetFrame";

type Props = {
  access: AccessContext;
  countryCode?: string;
};

export function WidgetGrid({ access, countryCode }: Props) {
  const [expandedKey, setExpandedKey] = useState<string | null>("human-authentication");

  return (
    <div className="soip-widget-grid">
      {CORE_WIDGETS.map((widget) => (
        <WidgetFrame
          key={widget.key}
          widget={widget}
          access={access}
          countryCode={countryCode}
          expanded={expandedKey === widget.key}
          onToggle={() => setExpandedKey(expandedKey === widget.key ? null : widget.key)}
        />
      ))}
    </div>
  );
}
