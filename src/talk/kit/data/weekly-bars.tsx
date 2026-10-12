import { useRef, type CSSProperties } from "react";

import { sampleKeys, type Key } from "#/engine/motion/track";
import { noise1 } from "#/engine/util/random";

import "./data-kit.css";
import { setStyle, setText, useVizFrame } from "./frame";
import type { VizClock } from "./logic";

export type WeeklyBar = {
  id: string;
  label: string;
  /** E.g. "Resets in 6 min" */
  sub: string;
  /** Used fraction (0–1) over clock time; author with `keys()` and a ζ = 1 ease */
  used: readonly Key[];
};

export type WeeklyBarsProps = {
  bars: readonly WeeklyBar[];
  clock?: VizClock;
  width?: number;
  style?: CSSProperties;
  className?: string;
};

/** Weekly-limit bars: clay fill on a muted track; the end cap shivers on wall time. */
export function WeeklyBars({
  bars,
  clock = "tau",
  width = 1300,
  style,
  className,
}: WeeklyBarsProps) {
  const fills = useRef<(HTMLDivElement | null)[]>([]);
  const caps = useRef<(HTMLDivElement | null)[]>([]);
  const values = useRef<(HTMLElement | null)[]>([]);

  useVizFrame(clock, (t, frame) => {
    bars.forEach((b, i) => {
      const u = Math.min(1, Math.max(0, sampleKeys(b.used, t)));
      setStyle(fills.current[i], "transform", `scaleX(${u.toFixed(4)})`);
      const shiver = noise1(frame.w * 9 + i * 13) * 0.5;
      setStyle(
        caps.current[i],
        "transform",
        `translateX(calc(${(u * 100).toFixed(3)}cqw - 2px + ${shiver.toFixed(2)}px))`,
      );
      setText(values.current[i], `${Math.round(u * 100)}% used`);
    });
  });

  return (
    <div className={`dk-root dk-weekly ${className ?? ""}`} style={{ width, ...style }}>
      {bars.map((b, i) => (
        <div key={b.id} data-testid={`weekly-${b.id}`}>
          <div className="dk-weekly__head type-label">
            <b>{b.label}</b>
            <span
              ref={(el) => {
                values.current[i] = el;
              }}
            >
              {`${Math.round((b.used.at(-1)?.value ?? 0) * 100)}% used`}
            </span>
          </div>
          <div className="dk-track" style={{ containerType: "inline-size", overflow: "visible" }}>
            <div
              ref={(el) => {
                fills.current[i] = el;
              }}
              className="dk-track__fill"
              style={{ transform: "scaleX(0)" }}
            />
            <div
              ref={(el) => {
                caps.current[i] = el;
              }}
              className="dk-weekly__cap"
            />
          </div>
          <div className="dk-weekly__foot type-label">{b.sub}</div>
        </div>
      ))}
    </div>
  );
}
