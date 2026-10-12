import { useState } from "react";

import { RingTimer } from "#/talk/kit/data/ring-timer";

import { LADDER, subagentTtl, ttlLeft, type Rung } from "./logic";
import { Range, WidgetShell } from "./widget-shell";

function Ring({ label, who, left }: { label: string; who: string; left: number }) {
  return (
    <div className="wg-row" style={{ gap: 28 }}>
      <RingTimer label={label} start={-10} left={left} clock="w" size={150} />
      <div className="type-label" style={{ display: "grid", gap: 6 }}>
        <span>{who}</span>
        <span style={{ color: left > 0 ? "var(--soft)" : "var(--clay-hi)" }}>
          {left > 0 ? "warm" : "cold: next turn re-writes it"}
        </span>
      </div>
    </div>
  );
}

/**
 * W2: how long you can idle before each cache goes cold, and which setting decides a subagent's
 * TTL.
 */
export function IdleTtl() {
  const [idle, setIdle] = useState(7);
  const [enabled, setEnabled] = useState<ReadonlySet<Rung["id"]>>(() => new Set());
  const sub = subagentTtl(enabled);

  const toggle = (id: Rung["id"]) =>
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <WidgetShell label="Idle and cache TTL">
      <Range
        label="Idle"
        value={idle}
        min={0}
        max={90}
        display={`${idle} min`}
        onChange={setIdle}
      />
      <div className="wg-row" style={{ gap: 64 }}>
        <Ring label="1h" who="Main session" left={ttlLeft(idle, "1h")} />
        <Ring label={sub.ttl} who="Subagent" left={ttlLeft(idle, sub.ttl)} />
      </div>
      <fieldset
        className="wg-ladder wg-fieldset"
        aria-label="Subagent TTL precedence, highest first"
      >
        {LADDER.map((r, i) => (
          <button
            key={r.id}
            type="button"
            className="wg-rung"
            aria-pressed={enabled.has(r.id)}
            data-winner={sub.winner === r.id || undefined}
            onClick={() => toggle(r.id)}
          >
            <span className="wg-rung__rank type-label">{i + 1}</span>
            <span className="wg-rung__code type-label">{r.code}</span>
            <span className="wg-rung__tag type-label">
              {sub.winner === r.id ? `wins: ${r.value}` : enabled.has(r.id) ? "outranked" : r.note}
            </span>
          </button>
        ))}
      </fieldset>
    </WidgetShell>
  );
}
