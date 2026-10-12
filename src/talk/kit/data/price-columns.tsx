import { useRef, type CSSProperties } from "react";

import { outCubic, prog } from "#/engine/motion/ease";

import "./data-kit.css";
import { setStyle, setText, useVizFrame } from "./frame";
import { columnValueAt, fmtUSD, type VizClock } from "./logic";

export type PriceColumn = {
  id: string;
  label: string;
  value: number;
  tone?: "paid" | "cached" | "base" | "cold";
};

export type PriceColumnsProps = {
  columns: readonly PriceColumn[];
  /** Clock time at which the first column starts growing */
  start: number;
  /** Values to grow from (defaults to 0); widgets pass what was on screen */
  from?: readonly number[];
  /** Top of the shared zero-based scale (defaults to the largest value) */
  max?: number;
  stagger?: number;
  clock?: VizClock;
  format?: (v: number) => string;
  width?: number;
  height?: number;
  style?: CSSProperties;
  className?: string;
};

/** Zero-based price columns whose bars and numbers count up on the same spring. */
export function PriceColumns({
  columns,
  start,
  from,
  max,
  stagger = 0.12,
  clock = "tau",
  format = fmtUSD,
  width = 960,
  height = 520,
  style,
  className,
}: PriceColumnsProps) {
  const bars = useRef<(HTMLDivElement | null)[]>([]);
  const values = useRef<(HTMLDivElement | null)[]>([]);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const top = max ?? Math.max(...columns.map((c) => c.value));

  useVizFrame(clock, (t0) => {
    const t = t0 - start;
    columns.forEach((c, i) => {
      const v = columnValueAt(t, i, from?.[i] ?? 0, c.value, stagger);
      const h = Math.max(0, v) / top;
      setStyle(bars.current[i], "transform", `scaleY(${h.toFixed(4)})`);
      setStyle(values.current[i], "bottom", `${(h * 100).toFixed(2)}%`);
      setText(values.current[i], format(v));
      const rise = prog(t, i * stagger - 0.3, i * stagger + 0.2, outCubic);
      setStyle(labels.current[i], "transform", `translateY(${((1 - rise) * 110).toFixed(1)}%)`);
    });
  });

  return (
    <div className={`dk-root ${className ?? ""}`} style={{ width, height, ...style }}>
      <div className="dk-cols">
        {columns.map((c, i) => (
          <div key={c.id} className="dk-col" data-testid={`col-${c.id}`}>
            <div className="dk-col__well">
              <div
                ref={(el) => {
                  values.current[i] = el;
                }}
                className="dk-col__value type-label"
              >
                {format(c.value)}
              </div>
              <div
                ref={(el) => {
                  bars.current[i] = el;
                }}
                className="dk-col__bar"
                data-tone={c.tone ?? "paid"}
              />
            </div>
            <div className="dk-col__base" />
            <div className="dk-col__label type-label">
              <span
                ref={(el) => {
                  labels.current[i] = el;
                }}
              >
                {c.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
