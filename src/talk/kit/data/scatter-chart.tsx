import { useRef, type CSSProperties, type KeyboardEvent } from "react";

import { outCubic, prog } from "#/engine/motion/ease";
import { SPRINGS, springAt } from "#/engine/motion/spring";
import { AA_POINTS, aaFamily, aaLabel, type AaPoint } from "#/talk/data/aa";

import "./data-kit.css";
import { setAttr, setText, useVizFrame } from "./frame";
import { type VizClock } from "./logic";
import { DEFAULT_CALLOUTS, effortGlyph, LINE_H, scatterLayout } from "./scatter-layout";

export type ScatterChartProps = {
  /** Clock time at which the axes start drawing */
  start: number;
  points?: readonly AaPoint[];
  callouts?: readonly string[];
  /** Frontier draw-on window (absolute clock time); defaults to start + 2.2 … start + 3.4 */
  frontier?: { start: number; end: number };
  selected?: string | null;
  onSelect?: (slug: string) => void;
  clock?: VizClock;
  width?: number;
  height?: number;
  style?: CSSProperties;
  className?: string;
};

/** AA Intelligence Index vs cost per task, with effort glyphs, the frontier and typed callouts. */
export function ScatterChart({
  start,
  points = AA_POINTS,
  callouts = DEFAULT_CALLOUTS,
  frontier,
  selected,
  onSelect,
  clock = "tau",
  width = 1400,
  height = 760,
  style,
  className,
}: ScatterChartProps) {
  const layout = scatterLayout(points, width, height, callouts);
  const { plot } = layout;
  const axes = useRef<(SVGPathElement | null)[]>([]);
  const ticks = useRef<SVGGElement>(null);
  const marks = useRef<(SVGGElement | null)[]>([]);
  const front = useRef<SVGPathElement>(null);
  const labelText = useRef<(SVGTSpanElement | null)[]>([]);
  const leaders = useRef<(SVGLineElement | null)[]>([]);
  const fStart = frontier?.start ?? start + 2.2;
  const fEnd = frontier?.end ?? start + 3.4;
  const order = layout.markers
    .map((m, i) => ({ i, x: m.x }))
    .sort((a, b) => a.x - b.x)
    .map((o) => o.i);

  useVizFrame(clock, (t0) => {
    const t = t0 - start;
    const draw = prog(t, 0, 0.7, outCubic);
    for (const a of axes.current) setAttr(a, "stroke-dasharray", `${draw.toFixed(4)} 1`);
    setAttr(
      ticks.current,
      "transform",
      `translate(0 ${((1 - prog(t, 0.2, 0.7, outCubic)) * 24).toFixed(1)})`,
    );
    order.forEach((i, k) => {
      const m = layout.markers[i]!;
      const lt = t - 0.6 - k * 0.12;
      const y = springAt(lt, SPRINGS.LAND, m.y - 90, m.y);
      const s = springAt(lt, SPRINGS.SNAP, 0, 1);
      setAttr(
        marks.current[i],
        "transform",
        `translate(${m.x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`,
      );
    });
    const f = prog(t0, fStart, fEnd, outCubic);
    setAttr(front.current, "stroke-dasharray", `${f.toFixed(4)} 1`);
    let li = 0;
    layout.labels.forEach((l, k) => {
      const lt = t0 - fStart - k * 0.25;
      setAttr(leaders.current[k], "stroke-dasharray", `${prog(lt, -0.2, 0.2).toFixed(4)} 1`);
      for (const line of l.lines) {
        const n = Math.floor(prog(lt, 0, 0.6) * line.length);
        setText(labelText.current[li], line.slice(0, n));
        li++;
      }
    });
  });

  const onKey = (slug: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onSelect?.(slug);
    }
  };

  return (
    <div className={`dk-root ${className ?? ""}`} style={{ width, height, ...style }}>
      <svg className="dk-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <title>AA Intelligence Index against cost per task</title>
        <g ref={ticks}>
          {layout.yTicks.map((tk) => (
            <g key={tk.v}>
              <line className="dk-grid" x1={plot.x} x2={plot.x + plot.w} y1={tk.y} y2={tk.y} />
              <text
                className="type-label dk-tick"
                x={plot.x - 20}
                y={tk.y}
                textAnchor="end"
                dominantBaseline="central"
              >
                {tk.label}
              </text>
            </g>
          ))}
          {layout.xTicks.map((tk) => (
            <text
              key={tk.v}
              className="type-label dk-tick"
              x={tk.x}
              y={plot.y + plot.h + 46}
              textAnchor="middle"
            >
              {tk.label}
            </text>
          ))}
          <text
            className="type-label dk-muted"
            x={plot.x + plot.w}
            y={plot.y + plot.h + 90}
            textAnchor="end"
          >
            cost per task (log scale)
          </text>
          <text
            className="type-label dk-muted"
            x={plot.x + 16}
            y={plot.y + 8}
            dominantBaseline="hanging"
          >
            Intelligence Index
          </text>
        </g>
        <path
          ref={(el) => {
            axes.current[0] = el;
          }}
          className="dk-axis"
          d={`M${plot.x} ${plot.y + plot.h}H${plot.x + plot.w}`}
          pathLength={1}
          strokeDasharray="0 1"
          fill="none"
        />
        <path
          ref={(el) => {
            axes.current[1] = el;
          }}
          className="dk-axis"
          d={`M${plot.x} ${plot.y + plot.h}V${plot.y}`}
          pathLength={1}
          strokeDasharray="0 1"
          fill="none"
        />
        <path
          ref={front}
          d={layout.frontier}
          fill="none"
          stroke="var(--clay)"
          strokeWidth={4}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="0 1"
          opacity={0.75}
        />
        {layout.markers.map((m, i) => {
          const fam = aaFamily(m.p);
          const isSel = selected === m.p.slug;
          const interactive = onSelect !== undefined;
          return (
            <g
              key={m.p.slug}
              ref={(el) => {
                marks.current[i] = el;
              }}
              transform={`translate(${m.x} ${m.y}) scale(0)`}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? aaLabel(m.p) : undefined}
              aria-pressed={interactive ? isSel : undefined}
              onClick={interactive ? () => onSelect(m.p.slug) : undefined}
              onKeyDown={interactive ? onKey(m.p.slug) : undefined}
              style={interactive ? { cursor: "pointer", outline: "none" } : undefined}
              data-slug={m.p.slug}
            >
              {interactive ? <circle r={32} fill="transparent" /> : null}
              {isSel ? (
                <circle r={m.r + 14} fill="none" stroke="var(--clay-hi)" strokeWidth={3} />
              ) : null}
              {fam === "other" ? (
                <circle r={9} fill="var(--muted)" />
              ) : (
                <>
                  <path
                    d={effortGlyph(m.p.effort, m.r)}
                    stroke={fam === "opus" ? "var(--clay)" : "var(--text)"}
                    strokeWidth={fam === "opus" ? 6 : 3.5}
                    strokeLinecap="round"
                  />
                  <circle
                    r={m.r * 0.22}
                    fill={fam === "opus" ? "var(--clay)" : "var(--bg)"}
                    stroke={fam === "opus" ? "none" : "var(--text)"}
                    strokeWidth={2}
                  />
                </>
              )}
            </g>
          );
        })}
        {layout.labels.map((l, li) =>
          l.leader ? (
            <line
              key={l.slug}
              ref={(el) => {
                leaders.current[li] = el;
              }}
              {...l.leader}
              stroke="var(--muted)"
              strokeWidth={2}
              pathLength={1}
              strokeDasharray="0 1"
            />
          ) : null,
        )}
        {layout.labels.map((l, li) => (
          <text key={l.slug} className="type-label" x={l.rect.x} y={l.rect.y}>
            {l.lines.map((line, k) => {
              const idx = li * 2 + k;
              return (
                <tspan
                  key={line}
                  ref={(el) => {
                    labelText.current[idx] = el;
                  }}
                  x={l.rect.x}
                  y={l.rect.y + LINE_H * (k + 0.8)}
                  className={k === 0 ? undefined : "dk-hi"}
                >
                  {line}
                </tspan>
              );
            })}
          </text>
        ))}
      </svg>
    </div>
  );
}
