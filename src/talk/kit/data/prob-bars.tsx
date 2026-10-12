import { useRef, type CSSProperties } from "react";

import { outCubic, prog } from "#/engine/motion/ease";

import "./data-kit.css";
import { setStyle, setText, useVizFrame } from "./frame";
import { fmtPct, probAt, type VizClock } from "./logic";

export type ProbBar = { id: string; label: string; answer: string; p: number };

export type ProbBarsProps = {
  bars: readonly ProbBar[];
  /** Clock time the first bar starts growing */
  start: number;
  stagger?: number;
  /** Index of the uncertain bar that quivers ±0.5% once landed */
  quiverIndex?: number;
  /** Values to grow from (defaults to 0) */
  from?: readonly number[];
  clock?: VizClock;
  width?: number;
  style?: CSSProperties;
  className?: string;
};

/** Labeled probability bars (Laya's typed answers), values springing in without overshoot. */
export function ProbBars({
  bars,
  start,
  stagger = 0.3,
  quiverIndex,
  from,
  clock = "tau",
  width = 1300,
  style,
  className,
}: ProbBarsProps) {
  const fills = useRef<(HTMLDivElement | null)[]>([]);
  const values = useRef<(HTMLDivElement | null)[]>([]);
  const labels = useRef<(HTMLDivElement | null)[]>([]);

  useVizFrame(clock, (t0) => {
    const t = t0 - start;
    bars.forEach((b, i) => {
      const v = probAt(t, i, from?.[i] ?? 0, b.p, stagger, i === quiverIndex);
      setStyle(fills.current[i], "transform", `scaleX(${Math.max(0, v).toFixed(4)})`);
      setText(values.current[i], fmtPct(Math.max(0, v)));
      const u = prog(t - i * stagger, -0.2, 0.3, outCubic);
      setStyle(labels.current[i], "clip-path", `inset(0 ${((1 - u) * 100).toFixed(1)}% 0 0)`);
    });
  });

  return (
    <div className={`dk-root dk-rows ${className ?? ""}`} style={{ width, ...style }}>
      {bars.map((b, i) => (
        <div key={b.id} className="dk-row" data-testid={`prob-${b.id}`}>
          <div
            ref={(el) => {
              labels.current[i] = el;
            }}
            className="dk-row__label type-label"
          >
            {b.label}: <b>{b.answer}</b>
          </div>
          <div className="dk-track">
            <div
              ref={(el) => {
                fills.current[i] = el;
              }}
              className="dk-track__fill"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
          <div
            ref={(el) => {
              values.current[i] = el;
            }}
            className="dk-row__value type-label"
          >
            {fmtPct(b.p)}
          </div>
        </div>
      ))}
    </div>
  );
}
