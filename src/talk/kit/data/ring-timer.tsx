import { useRef, type CSSProperties } from "react";

import { SPRINGS, springAt } from "#/engine/motion/spring";

import "./data-kit.css";
import { setAttr, setStyle, useVizFrame } from "./frame";
import { ringLeft, type VizClock } from "./logic";

export type RingTimerProps = {
  /** Text in the middle, e.g. "1h" or "5m" */
  label: string;
  /** Clock time at which the ring pops in */
  start: number;
  /** Burn-down window on the same clock; omit with `left` for a static ring */
  burn?: { start: number; end: number };
  /** Static fraction left (0–1), used by widgets */
  left?: number;
  tone?: "paid" | "cached";
  size?: number;
  clock?: VizClock;
  style?: CSSProperties;
  className?: string;
};

const TONES = { paid: "var(--clay)", cached: "var(--clay-wash-55)" } as const;

/** TTL ring: the arc burns down clockwise; at zero the ring goes cold. */
export function RingTimer({
  label,
  start,
  burn,
  left,
  tone = "paid",
  size = 180,
  clock = "tau",
  style,
  className,
}: RingTimerProps) {
  const group = useRef<SVGGElement>(null);
  const arc = useRef<SVGCircleElement>(null);
  const text = useRef<SVGTextElement>(null);
  const stroke = Math.max(10, size * 0.09);
  const r = size / 2 - stroke;

  useVizFrame(clock, (t) => {
    const s = springAt(t - start, SPRINGS.POP);
    setAttr(
      group.current,
      "transform",
      `translate(${size / 2} ${size / 2}) scale(${s.toFixed(4)})`,
    );
    const frac = left ?? (burn ? ringLeft(t, burn.start, burn.end) : 1);
    setAttr(arc.current, "stroke-dasharray", frac <= 0 ? "1 0" : `${frac.toFixed(4)} 1`);
    setStyle(arc.current, "stroke", frac <= 0 ? "var(--clay-wash-20)" : TONES[tone]);
    setStyle(text.current, "fill", frac <= 0 ? "var(--muted)" : "var(--text)");
  });

  return (
    <div className={`dk-root ${className ?? ""}`} style={{ width: size, height: size, ...style }}>
      <svg
        className="dk-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`${label} cache timer`}
      >
        <g ref={group} transform={`translate(${size / 2} ${size / 2})`}>
          <circle r={r} fill="var(--bg-deep)" stroke="var(--hairline)" strokeWidth={stroke} />
          <circle
            ref={arc}
            r={r}
            fill="none"
            stroke={TONES[tone]}
            strokeWidth={stroke}
            strokeLinecap="butt"
            pathLength={1}
            strokeDasharray="1 1"
            transform="rotate(-90) scale(1 -1)"
          />
          <text
            ref={text}
            className="type-label"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: Math.max(30, size * 0.22), fill: "var(--text)" }}
          >
            {label}
          </text>
        </g>
      </svg>
    </div>
  );
}
