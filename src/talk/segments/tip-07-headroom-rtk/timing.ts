import { inOutCubic, outCubic, prog } from "#/engine/motion/ease";

export const TIP7 = {
  window: { start: 191.9, end: 209.4 },
  typeAt: 192.0,
  cps: 32,
  submitAt: 192.72,
  spinnerAt: 192.92,
  lift: { start: 193.2, end: 193.8 },
  bash: 193.6,
  /** The echo lifts into the tip title */
  title: 194.2,
  clamp: { start: 193.62, end: 193.9 },
  squeeze: { start: 194.0, end: 194.45 },
  reruns: [194.5, 194.8, 195.1],
  lines: [195.4, 195.55, 195.7],
  rtk: { at: 196.5, hold: 2.5 },
  pull: { start: 199.0, end: 200.1 },
  boxes: 199.6,
  code: { start: 200.0, cps: 75 },
  foot: { start: 201.0, cps: 95 },
  strokes: [202.3, 202.6, 202.9],
  headline: 203.6,
  stats: 203.2,
  label: { start: 203.3, cps: 110 },
  stamp: 204.2,
  headroom: { at: 205, hold: 3 },
  exit: 208,
} as const;

/** Splits the Headroom command at its `--` separator into the two on-screen lines. */
export function splitAtSeparator(command: string): [string, string] {
  const i = command.indexOf(" -- ");
  if (i < 0) return [command, ""];
  return [command.slice(0, i + 3), command.slice(i + 4)];
}

/** `Saved by compression 1.4M` → label and value (the value is the last word). */
export function splitStat(stat: string): { label: string; value: string } {
  const i = stat.lastIndexOf(" ");
  return i < 0 ? { label: "", value: stat } : { label: stat.slice(0, i), value: stat.slice(i + 1) };
}

/**
 * Press depth 0 (raised) → 1 (down): fast strokes at `strokes`; after the last stroke it stays down
 * and only rises `creep` per τ-s, so the hold barely moves.
 */
export function pressDepth(tau: number, strokes: readonly number[], creep: number): number {
  const last = strokes.at(-1) ?? 0;
  for (const s of strokes.slice(0, -1)) {
    const t = tau - s;
    if (t >= -0.08 && t < 0.22) return t < 0 ? outCubic((t + 0.08) / 0.08) : 1 - outCubic(t / 0.22);
  }
  const t = tau - last;
  if (t < -0.08) return 0;
  if (t < 0) return outCubic((t + 0.08) / 0.08);
  return Math.max(0, 1 - t * creep);
}

/** Camera pull-out into the `claude` box (0 = full terminal, 1 = in the box) and back at the exit. */
export function pullAt(tau: number): number {
  const { pull, exit } = TIP7;
  return (
    prog(tau, pull.start, pull.end, inOutCubic) * (1 - prog(tau, exit, exit + 0.35, inOutCubic))
  );
}

/** X of JSON block `i` along the pipe: it reaches the press at stroke `i`, then runs on to the api. */
export function blockX(tau: number, strokeAt: number, press: number, speed: number): number {
  return press + (tau - strokeAt) * speed;
}
