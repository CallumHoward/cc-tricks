import { useRef, type CSSProperties } from "react";

import { prog } from "#/engine/motion/ease";

import "./data-kit.css";
import { useVizFrame } from "./frame";
import { qrModules, qrRevealCount, type VizClock } from "./logic";

export type QrGrowProps = {
  value: string;
  /** Row-by-row reveal over [start, end] on the clock */
  start: number;
  end: number;
  /** Rendered size in logical px (≥ 520 to scan from the room) */
  size?: number;
  /** Modules the outro fills with flying tiles: hidden here, revealed by the segment */
  holdBack?: number;
  clock?: VizClock;
  style?: CSSProperties;
  className?: string;
};

/** QR code that prints like terminal output, row by row, ink on ivory with a 4-module quiet zone. */
export function QrGrow({
  value,
  start,
  end,
  size = 560,
  holdBack = 0,
  clock = "tau",
  style,
  className,
}: QrGrowProps) {
  const { size: n, modules } = qrModules(value);
  const rects = useRef<(SVGRectElement | null)[]>([]);
  const shown = useRef(-1);
  const head = useRef(-1);
  const order = modules.length - holdBack;

  useVizFrame(clock, (t) => {
    const count = Math.min(order, qrRevealCount(modules, n, prog(t, start, end)));
    if (count === shown.current) return;
    const lo = Math.min(count, Math.max(0, shown.current));
    const hi = Math.max(count, shown.current);
    for (let i = lo; i < hi; i++)
      rects.current[i]?.setAttribute("visibility", i < count ? "visible" : "hidden");
    if (head.current >= 0) rects.current[head.current]?.removeAttribute("data-head");
    head.current = count > 0 && count < order ? count - 1 : -1;
    if (head.current >= 0) rects.current[head.current]?.setAttribute("data-head", "");
    shown.current = count;
  });

  return (
    <div className={`dk-root ${className ?? ""}`} style={{ width: size, height: size, ...style }}>
      <svg
        className="dk-svg dk-qr"
        width={size}
        height={size}
        viewBox={`0 0 ${n} ${n}`}
        shapeRendering="crispEdges"
      >
        <title>{`QR code linking to ${value}`}</title>
        {modules.map((m, i) => (
          <rect
            key={`${m.x}:${m.y}`}
            ref={(el) => {
              rects.current[i] = el;
            }}
            x={m.x}
            y={m.y}
            width={1.02}
            height={1.02}
            visibility="hidden"
          />
        ))}
      </svg>
    </div>
  );
}
