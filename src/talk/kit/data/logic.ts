import { encode } from "uqr";

import { clamp, prog } from "#/engine/motion/ease";
import { SPRINGS, springAt, type SpringCfg } from "#/engine/motion/spring";
import { noise1 } from "#/engine/util/random";

/** Which clock a viz reads: τ for the film, wall time for widgets. */
export type VizClock = "tau" | "w";

export const timeOf = (frame: { tau: number; w: number }, clock: VizClock): number =>
  clock === "w" ? frame.w : frame.tau;

/** A number on screen: always critically damped so it never shows a false value. */
export const dataSpring = (t: number, from: number, to: number, cfg: SpringCfg = SPRINGS.COUNT) =>
  springAt(t, cfg.zeta < 1 ? { ...cfg, zeta: 1 } : cfg, from, to);

export function linScale(d0: number, d1: number, r0: number, r1: number) {
  return (x: number) => r0 + ((x - d0) / (d1 - d0)) * (r1 - r0);
}

export function logScale(d0: number, d1: number, r0: number, r1: number) {
  const l0 = Math.log10(d0);
  const l1 = Math.log10(d1);
  return (x: number) => r0 + ((Math.log10(x) - l0) / (l1 - l0)) * (r1 - r0);
}

/**
 * Indices of the cost/quality Pareto frontier, cheapest first (strictly better than all cheaper
 * points).
 */
export function paretoFrontier(points: readonly { x: number; y: number }[]): number[] {
  const order = points.map((_, i) => i).sort((a, b) => points[a]!.x - points[b]!.x);
  const out: number[] = [];
  let best = Number.NEGATIVE_INFINITY;
  for (const i of order) {
    if (points[i]!.y > best) {
      out.push(i);
      best = points[i]!.y;
    }
  }
  return out;
}

export type Rect = { x: number; y: number; w: number; h: number };

export const overlaps = (a: Rect, b: Rect, pad = 0) =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

export type LabelSide =
  | "right"
  | "left"
  | "above"
  | "below"
  | "above-right"
  | "below-right"
  | "above-left"
  | "below-left";

const SIDES: readonly LabelSide[] = [
  "right",
  "left",
  "above",
  "below",
  "above-right",
  "below-right",
  "above-left",
  "below-left",
];

export function labelRect(
  ax: number,
  ay: number,
  w: number,
  h: number,
  side: LabelSide,
  gap: number,
): Rect {
  const cx = ax - w / 2;
  const cy = ay - h / 2;
  switch (side) {
    case "right":
      return { x: ax + gap, y: cy, w, h };
    case "left":
      return { x: ax - gap - w, y: cy, w, h };
    case "above":
      return { x: cx, y: ay - gap - h, w, h };
    case "below":
      return { x: cx, y: ay + gap, w, h };
    case "above-right":
      return { x: ax + gap * 0.6, y: ay - gap * 0.6 - h, w, h };
    case "below-right":
      return { x: ax + gap * 0.6, y: ay + gap * 0.6, w, h };
    case "above-left":
      return { x: ax - gap * 0.6 - w, y: ay - gap * 0.6 - h, w, h };
    case "below-left":
      return { x: ax - gap * 0.6 - w, y: ay + gap * 0.6, w, h };
  }
}

export type LabelRequest = {
  x: number;
  y: number;
  w: number;
  h: number;
  prefer?: LabelSide;
  /** Distance from the anchor (defaults to the shared gap) */
  gap?: number;
};

/**
 * Greedy placement: each label takes the first side (preferred first) that stays in bounds and
 * clears every earlier label and every marker. Returns null for a label that cannot be placed.
 */
export function placeLabels(
  labels: readonly LabelRequest[],
  markers: readonly Rect[],
  bounds: Rect,
  gap = 24,
  pad = 8,
): (Rect | null)[] {
  const placed: Rect[] = [];
  const leads: Segment[] = [];
  return labels.map((l) => {
    const sides = l.prefer ? [l.prefer, ...SIDES.filter((s) => s !== l.prefer)] : SIDES;
    for (const reach of [1, 2.5, 4.5]) {
      for (const side of sides) {
        const r = labelRect(l.x, l.y, l.w, l.h, side, (l.gap ?? gap) * reach);
        const inside =
          r.x >= bounds.x &&
          r.y >= bounds.y &&
          r.x + r.w <= bounds.x + bounds.w &&
          r.y + r.h <= bounds.y + bounds.h;
        if (!inside) continue;
        if (placed.some((p) => overlaps(p, r, pad)) || markers.some((m) => overlaps(m, r, pad / 2)))
          continue;
        const lead = { x1: l.x, y1: l.y, ...edgeXY(nearestEdge(r, l.x, l.y)) };
        if (
          placed.some((p) => segmentHitsRect(lead, p)) ||
          leads.some((s) => segmentHitsRect(s, r))
        )
          continue;
        placed.push(r);
        leads.push(lead);
        return r;
      }
    }
    return null;
  });
}

type Segment = { x1: number; y1: number; x2: number; y2: number };

const edgeXY = (p: { x: number; y: number }) => ({ x2: p.x, y2: p.y });

/** Liang–Barsky clip: does the segment pass through the rect's interior? */
export function segmentHitsRect(s: Segment, r: Rect): boolean {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  let lo = 0;
  let hi = 1;
  const edges: [number, number][] = [
    [-dx, s.x1 - r.x],
    [dx, r.x + r.w - s.x1],
    [-dy, s.y1 - r.y],
    [dy, r.y + r.h - s.y1],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q <= 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) lo = Math.max(lo, t);
    else hi = Math.min(hi, t);
    if (lo >= hi) return false;
  }
  return hi - lo > 1e-6;
}

/** Point on a rect's edge nearest to (x, y), for leader lines. */
export function nearestEdge(r: Rect, x: number, y: number): { x: number; y: number } {
  return { x: Math.min(r.x + r.w, Math.max(r.x, x)), y: Math.min(r.y + r.h, Math.max(r.y, y)) };
}

/** Fraction of a TTL ring left: 1 until `start`, burning linearly to 0 at `end`. */
export const ringLeft = (t: number, start: number, end: number) =>
  1 - clamp((t - start) / (end - start));

/**
 * Dark modules of a QR code in reading order (row by row, left to right), with a 4-module quiet
 * zone.
 */
export function qrModules(value: string, border = 4) {
  const { data, size } = encode(value, { border });
  const modules: { x: number; y: number }[] = [];
  data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) modules.push({ x, y });
    }),
  );
  return { size, modules };
}

/** How many modules are visible when the row-by-row reveal is `u` (0–1) of the way through. */
export function qrRevealCount(
  modules: readonly { x: number; y: number }[],
  size: number,
  u: number,
): number {
  const rows = clamp(u) * size;
  const full = Math.floor(rows);
  const cols = (rows - full) * size;
  let n = 0;
  for (const m of modules) {
    if (m.y < full || (m.y === full && m.x < cols)) n++;
    else break;
  }
  return n;
}

/** Closed-form ±amp quiver on an uncertain value (deterministic in t). */
export const quiver = (t: number, amp: number, seed = 0) => noise1(t * 1.3 + seed * 17.1) * amp;

export function fmtUSD(x: number): string {
  if (x >= 100) return `$${Math.round(x)}`;
  if (x >= 0.1) return `$${x.toFixed(2)}`;
  if (x === 0) return "$0";
  const s = Number(x.toPrecision(2)).toString();
  const decimals = s.split(".")[1]?.length ?? 0;
  return `$${decimals < 2 ? Number(s).toFixed(2) : s}`;
}

export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${Number((n / 1_000_000).toFixed(1))}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

export const fmtTimes = (x: number) => `${Number(x.toFixed(1))}×`;

export const fmtPct = (p: number) => `${(p * 100).toFixed(1)}%`;

/** Day ruler: minutes since midnight → x. */
export const minuteX = (m: number, from: number, to: number, x0: number, x1: number) =>
  x0 + ((m - from) / (to - from)) * (x1 - x0);

/** Value of column i at clock-relative time t (COUNT spring, ζ = 1, shared by bar and number). */
export function columnValueAt(
  t: number,
  i: number,
  from: number,
  to: number,
  stagger: number,
): number {
  return dataSpring(t - i * stagger, from, to);
}

const PROB_LAND = 1.1;

/** Bar i at clock-relative t: a ζ = 1 data spring, then an optional closed-form quiver. */
export function probAt(
  t: number,
  i: number,
  from: number,
  to: number,
  stagger: number,
  quivers: boolean,
): number {
  const lt = t - i * stagger;
  const v = dataSpring(lt, from, to, SPRINGS.GROW);
  return quivers ? v + quiver(t, 0.005, i) * prog(lt, PROB_LAND, PROB_LAND + 0.6) : v;
}
