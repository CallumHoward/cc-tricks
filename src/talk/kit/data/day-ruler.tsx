import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

import { outCubic, prog } from "#/engine/motion/ease";
import { SPRINGS, springAt } from "#/engine/motion/spring";
import { chainWindows, hhmm, RULER } from "#/talk/data/routines";

import "./data-kit.css";
import { setAttr, useVizFrame } from "./frame";
import { minuteX, type VizClock } from "./logic";

export type DayRulerProps = {
  /** Clock time at which the ruler starts drawing */
  start: number;
  /** Ping times, minutes since midnight */
  pins: readonly number[];
  /** Clock time the first pin drops; pins drop `pinStagger` apart */
  pinsAt?: number;
  pinStagger?: number;
  /** Window bands draw over [bandsAt, bandsAt + bandDur], staggered */
  bandsAt?: number;
  bandDur?: number;
  /** Band labels under the ruler ("05:30 → 10:30") */
  bandLabels?: boolean;
  /** Makes pins draggable sliders (widgets) */
  onPinChange?: (index: number, minutes: number) => void;
  step?: number;
  clock?: VizClock;
  width?: number;
  style?: CSSProperties;
  className?: string;
};

const HEIGHT = 300;
const PIN_KEYS = ["first", "second", "third", "fourth", "fifth"];
const AXIS_Y = 150;
const PAD = 60;

/** 05:00–21:00 ruler with ping pins and the chained 5h windows they open. */
export function DayRuler({
  start,
  pins,
  pinsAt = start + 0.8,
  pinStagger = 0.4,
  bandsAt = start + 2.2,
  bandDur = 0.9,
  bandLabels = true,
  onPinChange,
  step = 5,
  clock = "tau",
  width = 1500,
  style,
  className,
}: DayRulerProps) {
  const svg = useRef<SVGSVGElement>(null);
  const axis = useRef<SVGPathElement>(null);
  const ticks = useRef<SVGGElement>(null);
  const pinEls = useRef<(SVGGElement | null)[]>([]);
  const bandEls = useRef<(SVGRectElement | null)[]>([]);
  const bandText = useRef<(SVGTextElement | null)[]>([]);
  const x0 = PAD;
  const x1 = width - PAD;
  const mx = (m: number) => minuteX(m, RULER.from, RULER.to, x0, x1);
  const windows = chainWindows(pins);
  const hours = Array.from(
    { length: (RULER.to - RULER.from) / 60 + 1 },
    (_, i) => RULER.from + i * 60,
  );

  useVizFrame(clock, (t0) => {
    const t = t0 - start;
    setAttr(axis.current, "stroke-dasharray", `${prog(t, 0, 0.8, outCubic).toFixed(4)} 1`);
    setAttr(
      ticks.current,
      "transform",
      `translate(0 ${((1 - prog(t, 0.3, 0.9, outCubic)) * 30).toFixed(1)})`,
    );
    pins.forEach((m, i) => {
      const lt = t0 - pinsAt - i * pinStagger;
      const y = springAt(lt, SPRINGS.LAND, -160, 0);
      setAttr(pinEls.current[i], "transform", `translate(${mx(m).toFixed(1)} ${y.toFixed(1)})`);
    });
    windows.forEach((w, i) => {
      const u = prog(t0, bandsAt + i * 0.35, bandsAt + i * 0.35 + bandDur, outCubic);
      const full = mx(Math.min(w.end, RULER.to)) - mx(w.start);
      setAttr(bandEls.current[i], "width", (full * u).toFixed(1));
      const lu = prog(t0, bandsAt + i * 0.35 + 0.3, bandsAt + i * 0.35 + bandDur, outCubic);
      setAttr(bandText.current[i], "transform", `translate(0 ${((1 - lu) * 40).toFixed(1)})`);
    });
  });

  const toMinutes = (clientX: number) => {
    const rect = svg.current?.getBoundingClientRect();
    if (!rect) return RULER.from;
    const lx = ((clientX - rect.left) / rect.width) * width;
    const m = RULER.from + ((lx - x0) / (x1 - x0)) * (RULER.to - RULER.from);
    return Math.min(RULER.to, Math.max(RULER.from, Math.round(m / step) * step));
  };

  const drag = (i: number) => (e: PointerEvent<SVGGElement>) => {
    if (e.type === "pointerdown") e.currentTarget.setPointerCapture(e.pointerId);
    else if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    onPinChange?.(i, toMinutes(e.clientX));
  };

  const key = (i: number) => (e: KeyboardEvent<SVGGElement>) => {
    const delta = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step }[e.key];
    if (delta !== undefined) {
      e.preventDefault();
      e.stopPropagation();
      onPinChange?.(i, Math.min(RULER.to, Math.max(RULER.from, (pins[i] ?? 0) + delta * 2)));
    } else if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={`dk-root ${className ?? ""}`} style={{ width, height: HEIGHT, ...style }}>
      <svg
        ref={svg}
        className="dk-svg"
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
      >
        <title>Day ruler with 5-hour windows</title>
        {windows.map((w, i) => (
          <g key={w.ping}>
            <rect
              ref={(el) => {
                bandEls.current[i] = el;
              }}
              x={mx(w.start)}
              y={AXIS_Y - 64}
              width={0}
              height={64}
              rx={6}
              fill="var(--clay-wash-35)"
              stroke="var(--clay)"
              strokeWidth={2}
            />
            {bandLabels ? (
              <text
                ref={(el) => {
                  bandText.current[i] = el;
                }}
                className="type-label"
                x={mx(w.start) + 14}
                y={AXIS_Y - 22}
                style={{ clipPath: "inset(0 0 0 0)" }}
              >
                {`${hhmm(w.start)}→${hhmm(w.end)}`}
              </text>
            ) : null}
          </g>
        ))}
        <path
          ref={axis}
          className="dk-axis"
          d={`M${x0} ${AXIS_Y}H${x1}`}
          pathLength={1}
          strokeDasharray="0 1"
          style={{ stroke: "var(--soft)", strokeWidth: 3 }}
        />
        <g ref={ticks}>
          {hours.map((h) => (
            <g key={h}>
              <line
                x1={mx(h)}
                x2={mx(h)}
                y1={AXIS_Y}
                y2={AXIS_Y + ((h - RULER.from) % 120 === 0 ? 22 : 12)}
                stroke="var(--muted)"
                strokeWidth={2}
              />
              {(h - RULER.from) % 120 === 0 ? (
                <text className="type-label dk-tick" x={mx(h)} y={AXIS_Y + 62} textAnchor="middle">
                  {hhmm(h)}
                </text>
              ) : null}
            </g>
          ))}
        </g>
        {pins.map((m, i) => (
          <g
            key={PIN_KEYS[i] ?? m}
            ref={(el) => {
              pinEls.current[i] = el;
            }}
            transform={`translate(${mx(m)} -160)`}
            role={onPinChange ? "slider" : undefined}
            tabIndex={onPinChange ? 0 : undefined}
            aria-label={onPinChange ? `Ping ${i + 1}` : undefined}
            aria-valuemin={onPinChange ? RULER.from : undefined}
            aria-valuemax={onPinChange ? RULER.to : undefined}
            aria-valuenow={onPinChange ? m : undefined}
            aria-valuetext={onPinChange ? hhmm(m) : undefined}
            onPointerDown={onPinChange ? drag(i) : undefined}
            onPointerMove={onPinChange ? drag(i) : undefined}
            onKeyDown={onPinChange ? key(i) : undefined}
            style={
              onPinChange
                ? { cursor: "ew-resize", touchAction: "none", outline: "none" }
                : undefined
            }
          >
            {onPinChange ? (
              <rect x={-36} y={AXIS_Y - 110} width={72} height={124} fill="transparent" />
            ) : null}
            <line y1={AXIS_Y - 92} y2={AXIS_Y} stroke="var(--text)" strokeWidth={3} />
            <circle
              cy={AXIS_Y - 92}
              r={13}
              fill="var(--clay)"
              stroke="var(--text)"
              strokeWidth={3}
            />
            <circle cy={AXIS_Y} r={6} fill="var(--text)" />
          </g>
        ))}
      </svg>
    </div>
  );
}
