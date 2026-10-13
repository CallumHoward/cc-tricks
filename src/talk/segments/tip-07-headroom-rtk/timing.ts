import { inOutCubic, prog } from "#/engine/motion/ease";

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
  rtk: { at: 196.5, hold: 2.5 },
  pull: { start: 199.0, end: 199.7 },
  /** The dashboard window tilts in as the terminal recedes, and drops away before the push back */
  shot: { in: 199.35, out: 207.75 },
  name: 199.9,
  headroom: { at: 205, hold: 3 },
  exit: 208,
} as const;

/** Camera pull-out off the terminal (0 = full terminal, 1 = gone) and back in at the exit. */
export function pullAt(tau: number): number {
  const { pull, exit } = TIP7;
  return (
    prog(tau, pull.start, pull.end, inOutCubic) * (1 - prog(tau, exit, exit + 0.35, inOutCubic))
  );
}
