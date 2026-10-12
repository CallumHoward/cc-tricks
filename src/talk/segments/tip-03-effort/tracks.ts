import { clamp, outCubic, prog } from "#/engine/motion/ease";
import type { StyleValues } from "#/engine/stage/applier";

/** Whole characters typed by τ (quantized to 60 Hz so stills and playback agree). */
export function typedCount(tau: number, at: number, cps: number, total: number): number {
  if (tau < at) return 0;
  const q = Math.ceil(tau * 60 - 1e-6) / 60;
  return clamp(Math.floor((q - at) * cps + 1e-6), 0, total);
}

/** Left-to-right wipe with a 24 px rise, landed by `at + dur`. */
export function wipe(tau: number, at: number, dur: number): StyleValues {
  const u = prog(tau, at, at + dur, outCubic);
  return { clipRight: (1 - u) * 100, y: (1 - u) * 24 };
}

/** The home shot sinking away as the camera tilts up to the plate. */
export function homeLeave(tau: number, at: number, dur: number): StyleValues {
  const u = prog(tau, at, at + dur, inCubic);
  return { y: u * 760, scale: 1 - u * 0.06, opacity: 1 - prog(tau, at + dur * 0.55, at + dur) };
}

/** Top-left of the 240×200 bot box whose feet sit at (x, y). */
export const botBox = (x: number, y: number) => ({ left: x - 120, top: y - 180 });

export type Pt = { x: number; y: number };

const lerpPt = (a: Pt, b: Pt, u: number): Pt => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u,
});

/** Cumulative arc length at each vertex of a polyline. */
function arcLengths(points: readonly Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Pt;
    const b = points[i] as Pt;
    out.push((out[i - 1] as number) + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return out;
}

/** Point at arc length `s` along a polyline (clamped to its ends). */
export function pointAlong(points: readonly Pt[], s: number): Pt {
  const lens = arcLengths(points);
  const total = lens.at(-1) ?? 0;
  const d = clamp(s, 0, total);
  for (let i = 1; i < points.length; i++) {
    const l1 = lens[i] as number;
    if (d <= l1) {
      const l0 = lens[i - 1] as number;
      return lerpPt(points[i - 1] as Pt, points[i] as Pt, l1 === l0 ? 0 : (d - l0) / (l1 - l0));
    }
  }
  return points.at(-1) ?? { x: 0, y: 0 };
}

/** Arc length of the point `u` of the way from vertex `i` to vertex `i + 1`. */
export function arcAt(points: readonly Pt[], i: number, u: number): number {
  const lens = arcLengths(points);
  const a = lens[i] ?? 0;
  const b = lens[i + 1] ?? a;
  return a + (b - a) * u;
}

/** Quadratic arc between two points, bulging `lift` px upward at the middle. */
export function arcPoint(a: Pt, b: Pt, u: number, lift: number): Pt {
  const p = lerpPt(a, b, u);
  return { x: p.x, y: p.y - Math.sin(Math.PI * u) * lift };
}

/** Effort dial: five glyph seats on an upper arc around `center`. */
export function dialSeats(center: Pt, radius: number, from = 200, to = 340): Pt[] {
  return Array.from({ length: 5 }, (_, i) => {
    const a = ((from + ((to - from) * i) / 4) * Math.PI) / 180;
    return { x: center.x + radius * Math.cos(a), y: center.y + radius * Math.sin(a) };
  });
}

/** Needle angle (deg, screen space) pointing at seat `k` (fractional) of the dial. */
export const dialAngle = (k: number, from = 200, to = 340): number => from + ((to - from) * k) / 4;

/** Cubic ease-in (the engine's ease module has no `inCubic`). */
export const inCubic = (u: number): number => u * u * u;
