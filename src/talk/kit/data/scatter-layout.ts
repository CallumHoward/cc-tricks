import { aaFamily, aaLabel, type AaEffort, type AaPoint } from "#/talk/data/aa";

import {
  fmtUSD,
  linScale,
  logScale,
  nearestEdge,
  paretoFrontier,
  placeLabels,
  type Rect,
} from "./logic";

const EFFORT_RANK: Record<AaEffort, number> = { low: 0, medium: 1, high: 2, xhigh: 3, max: 4 };
const X_TICKS = [0.3, 1, 3, 10] as const;
const Y_TICKS = [30, 40, 50, 60] as const;
export const CHAR_W = 18;
export const LINE_H = 36;

export const DEFAULT_CALLOUTS = [
  "claude-sonnet-5-5",
  "claude-opus-5-5-xhigh",
  "claude-opus-5-5-high",
  "claude-sonnet-5-5-xhigh",
] as const;

/** Spokes grow with effort: low 4 … max 12. */
export function effortGlyph(effort: AaEffort, radius: number): string {
  const n = 4 + EFFORT_RANK[effort] * 2;
  const inner = radius * 0.22;
  let d = "";
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 - Math.PI / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    d += `M${(c * inner).toFixed(2)} ${(s * inner).toFixed(2)}L${(c * radius).toFixed(2)} ${(s * radius).toFixed(2)}`;
  }
  return d;
}

export const glyphRadius = (effort: AaEffort) => 13 + EFFORT_RANK[effort] * 3.5;

export type ScatterLayout = {
  plot: Rect;
  markers: { p: AaPoint; x: number; y: number; r: number }[];
  frontier: string;
  frontierSlugs: string[];
  labels: {
    slug: string;
    lines: [string, string];
    rect: Rect;
    leader: { x1: number; y1: number; x2: number; y2: number } | null;
  }[];
  xTicks: { v: number; x: number; label: string }[];
  yTicks: { v: number; y: number; label: string }[];
};

/** Honest axes: log x over $0.30–$10 with ticks named, linear y 30–60; labels placed collision-free. */
export function scatterLayout(
  points: readonly AaPoint[],
  width: number,
  height: number,
  callouts: readonly string[],
): ScatterLayout {
  const plot = { x: 96, y: 24, w: width - 96 - 32, h: height - 24 - 96 };
  const sx = logScale(0.3, 10, plot.x, plot.x + plot.w);
  const sy = linScale(30, 60, plot.y + plot.h, plot.y);
  const markers = points.map((p) => ({
    p,
    x: sx(p.costPerTaskUSD),
    y: sy(p.intelligenceIndex),
    r: aaFamily(p) === "other" ? 12 : glyphRadius(p.effort),
  }));
  const front = paretoFrontier(
    points.map((p) => ({ x: p.costPerTaskUSD, y: p.intelligenceIndex })),
  );
  const frontier = front
    .map((i, k) => `${k === 0 ? "M" : "L"}${markers[i]!.x.toFixed(1)} ${markers[i]!.y.toFixed(1)}`)
    .join("");
  const wanted = callouts
    .map((slug) => markers.find((m) => m.p.slug === slug))
    .filter((m) => m !== undefined);
  const lines = wanted.map((m): [string, string] => [
    aaLabel(m.p),
    `${Math.round(m.p.intelligenceIndex)} · ${fmtUSD(m.p.costPerTaskUSD)}`,
  ]);
  const rects = placeLabels(
    wanted.map((m, i) => ({
      x: m.x,
      y: m.y,
      w: Math.max(...lines[i]!.map((l) => l.length)) * CHAR_W,
      h: LINE_H * 2,
      prefer: m.p.intelligenceIndex > 55 ? "below" : "right",
      gap: m.r + 14,
    })),
    markers.map((m) => ({ x: m.x - m.r, y: m.y - m.r, w: m.r * 2, h: m.r * 2 })),
    plot,
    28,
  );
  const labels = wanted.flatMap((m, i) => {
    const rect = rects[i];
    if (!rect) return [];
    const edge = nearestEdge(rect, m.x, m.y);
    const far = Math.hypot(edge.x - m.x, edge.y - m.y) > m.r + 36;
    const leader = far ? { x1: m.x, y1: m.y, x2: edge.x, y2: edge.y } : null;
    return [{ slug: m.p.slug, lines: lines[i]!, rect, leader }];
  });
  return {
    plot,
    markers,
    frontier,
    frontierSlugs: front.map((i) => points[i]!.slug),
    labels,
    xTicks: X_TICKS.map((v) => ({ v, x: sx(v), label: v < 1 ? `$${v.toFixed(2)}` : `$${v}` })),
    yTicks: Y_TICKS.map((v) => ({ v, y: sy(v), label: String(v) })),
  };
}
