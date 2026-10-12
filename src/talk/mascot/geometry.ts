import { noise1 } from "#/engine/util/random";

export type Pt = [number, number];

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Smooth closed (or open) path through the points via Catmull-Rom → cubic Bézier. */
export function smoothPath(pts: readonly Pt[], closed = true): string {
  const n = pts.length;
  if (n < 2) return "";
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.min(n - 1, Math.max(0, i))]);
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(
      p2[0] - (p3[0] - p1[0]) / 6,
    )} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

export function polyPath(pts: readonly Pt[], closed = false): string {
  if (pts.length === 0) return "";
  const body = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${r1(x)} ${r1(y)}`).join("");
  return closed ? `${body}Z` : body;
}

/** Resamples a closed polyline to `count` points evenly spaced by arc length. */
export function resample(pts: readonly Pt[], count: number): Pt[] {
  const n = pts.length;
  const cum = [0];
  for (let i = 1; i <= n; i++) {
    const a = pts[i - 1];
    const b = pts[i % n];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = cum[n];
  const out: Pt[] = [];
  let j = 0;
  for (let k = 0; k < count; k++) {
    const s = (k / count) * total;
    while (j < n - 1 && cum[j + 1] < s) j++;
    const a = pts[j];
    const b = pts[(j + 1) % n];
    const len = cum[j + 1] - cum[j];
    const u = len > 0 ? (s - cum[j]) / len : 0;
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
}

function arc(
  out: Pt[],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  steps: number,
) {
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
}

/** Soft box: rounded corners (separate top/bottom radii) and a slightly domed top edge. */
export function softBox(
  cx: number,
  bottom: number,
  w: number,
  h: number,
  rTop: number,
  rBottom: number,
  dome: number,
  count = 64,
): Pt[] {
  const hw = w / 2;
  const top = bottom - h;
  const rt = Math.min(rTop, hw, h / 2);
  const rb = Math.min(rBottom, hw, h / 2);
  const pts: Pt[] = [];
  const PI = Math.PI;
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const x = cx - hw + rt + u * (w - 2 * rt);
    pts.push([x, top - dome * Math.min(1, (w - 2 * rt) / 90) * Math.sin(u * PI)]);
  }
  arc(pts, cx + hw - rt, top + rt, rt, rt, -PI / 2, 0, 8);
  arc(pts, cx + hw - rb, bottom - rb, rb, rb, 0, PI / 2, 8);
  arc(pts, cx - hw + rb, bottom - rb, rb, rb, PI / 2, PI, 8);
  arc(pts, cx - hw + rt, top + rt, rt, rt, PI, (3 * PI) / 2, 8);
  return resample(dedupe(pts), count);
}

function dedupe(pts: Pt[]): Pt[] {
  return pts.filter((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.01;
  });
}

/** Capsule from a to b with end radii ra and rb (the b end is the rounder "hand"). */
export function capsule(a: Pt, b: Pt, ra: number, rb: number, count = 28): Pt[] {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const pts: Pt[] = [];
  arc(pts, b[0], b[1], rb, rb, ang - Math.PI / 2, ang + Math.PI / 2, 10);
  arc(pts, a[0], a[1], ra, ra, ang + Math.PI / 2, ang + (3 * Math.PI) / 2, 10);
  return resample(dedupe(pts), count);
}

export function ellipse(cx: number, cy: number, rx: number, ry: number, count = 24): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

/**
 * Eye outline: a pill whose top is cut by a slanted lid and whose bottom rises into a crescent as
 * `happy` → 1. `side` mirrors the slant so +slant always lowers the inner corner.
 */
export function eyeShape(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  open: number,
  happy: number,
  slant: number,
  side: 1 | -1,
): Pt[] {
  const n = 9;
  const top: Pt[] = [];
  const bottom: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = -Math.cos((i / n) * Math.PI);
    const x = u * rx;
    const half = Math.sqrt(Math.max(0, 1 - u * u));
    const t = -ry * half;
    const crescent = t + ry * 0.62 * Math.sqrt(half) + 2;
    const b = ry * half + (crescent - ry * half) * happy;
    const lid = -ry + (1 - open) * 2 * ry + slant * side * u * ry * 0.55;
    const y0 = Math.min(Math.max(t, lid), b - 2.4);
    top.push([cx + x, cy + y0]);
    bottom.push([cx + x, cy + b]);
  }
  return [...top, ...bottom.slice(1, -1).reverse()];
}

/** Displaces each point along its normal by smooth noise: the line "boils" per drawing. */
export function boil(pts: readonly Pt[], amp: number, seed: number): Pt[] {
  if (amp === 0) return pts.slice();
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    const k = amp * noise1(i * 0.55 + seed * 17.3);
    return [p[0] + (ty / len) * k, p[1] - (tx / len) * k];
  });
}

export function spiral(cx: number, cy: number, r: number, turns = 2.2): Pt[] {
  const pts: Pt[] = [];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const a = u * turns * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r * u, cy + Math.sin(a) * r * u]);
  }
  return pts;
}

export function star4(cx: number, cy: number, r: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.32;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return pts;
}
