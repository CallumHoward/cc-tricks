import { useState } from "react";

import { chainLabel, chainWindows, hhmm, ROUTINES, WINDOW_HOURS } from "#/talk/data/routines";
import { DayRuler, movePin } from "#/talk/kit/data/day-ruler";

import { WidgetShell } from "./widget-shell";

const FIRST_MESSAGE = 9 * 60;

/** W4: drag the three routine pings; the refills move, the weekly quota doesn't. */
export function PingChain({ start, width = 1500 }: { start: number; width?: number }) {
  const [pins, setPins] = useState<number[]>(() => ROUTINES.map((r) => r.at));
  const [on, setOn] = useState(true);
  const shown = on ? pins : [FIRST_MESSAGE];
  const windows = chainWindows(shown);

  return (
    <WidgetShell label="Ping chain">
      <div className="wg-row">
        <button
          type="button"
          className="wg-chip type-label"
          aria-pressed={on}
          onClick={() => setOn((v) => !v)}
        >
          {on ? "Routines on" : "Routines off"}
        </button>
        <span className="type-label" style={{ color: "var(--muted)" }}>
          {on
            ? "Drag a pin"
            : `No pings: your first message at ${hhmm(FIRST_MESSAGE)} starts the clock`}
        </span>
      </div>
      <DayRuler
        start={start}
        pins={shown}
        width={width}
        onPinChange={on ? movePin(setPins) : undefined}
      />
      <div className="wg-readout type-label" aria-live="polite">
        {windows.map((w) => (
          <span key={w.ping}>
            {on ? chainLabel(w) : `${hhmm(w.ping)} message → resets ${hhmm(w.end)}`}
          </span>
        ))}
        <span className="wg-hot">{`${WINDOW_HOURS}h windows · weekly limit unchanged`}</span>
      </div>
    </WidgetShell>
  );
}
