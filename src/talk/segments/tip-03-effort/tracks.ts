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

export const lerpPt = (a: Pt, b: Pt, u: number): Pt => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u,
});

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
