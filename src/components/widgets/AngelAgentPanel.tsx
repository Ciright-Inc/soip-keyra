"use client";

import { useMemo, useState } from "react";
import type { AccessContext, AngelAgentMessage, WidgetDefinition } from "@/lib/types/soip";
import {
  angelAgentRespond,
  createAngelAgentGreeting,
} from "@/lib/agents/angelAgent";
import { soipBody, soipBtnSecondary, soipEyebrow, soipInput } from "@/lib/uiClasses";

type Props = {
  widget: WidgetDefinition;
  access: AccessContext;
  countryCode?: string;
};

export function AngelAgentPanel({ widget, access, countryCode }: Props) {
  const ctx = useMemo(
    () => ({ widget, access, countryCode }),
    [widget, access, countryCode],
  );

  const [messages, setMessages] = useState<AngelAgentMessage[]>(() => [
    createAngelAgentGreeting(ctx),
  ]);
  const [input, setInput] = useState("");

  function send() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { role: "system", content: trimmed, timestamp: new Date().toISOString() },
      angelAgentRespond(ctx, trimmed),
    ]);
    setInput("");
  }

  return (
    <div className="soip-angel-panel">
      <div className="soip-angel-panel__header">
        <p className={`${soipEyebrow} text-[var(--ds-text-link)]`}>SOIP Angel Agent</p>
        <p className={`${soipBody} mt-0.5`}>Dedicated · identity-aware · audit-logged</p>
      </div>
      <div className="soip-angel-panel__messages space-y-2">
        {messages.map((m, i) => (
          <p
            key={i}
            className={`${soipBody}${m.role === "agent" ? " text-[var(--ds-ink)]" : ""}`}
          >
            {m.role === "agent" && (
              <span className="material-symbols-outlined mr-1 align-middle text-base text-[var(--ds-text-link)]">
                smart_toy
              </span>
            )}
            {m.content}
          </p>
        ))}
      </div>
      <div className="soip-angel-panel__composer">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the Angel agent…"
          className={soipInput}
        />
        <button type="button" onClick={send} className={soipBtnSecondary}>
          Send
        </button>
      </div>
    </div>
  );
}
