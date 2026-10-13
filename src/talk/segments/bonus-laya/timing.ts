import { outCubic, prog } from "#/engine/motion/ease";
import { keys } from "#/engine/motion/track";
import { hash1 } from "#/engine/util/random";
import type { Pt } from "#/talk/segments/tip-03-effort/tracks";

/** Bonus story times (absolute τ; storyboard §7 stops 29–31, window = [start + 1.4, end + 1.4)). */
export const TB = Object.freeze({
  winStart: 248.9,
  winEnd: 267.4,
  typeAt: 249.0,
  submitAt: 250.05,
  spinnerAt: 250.25,
  leave: 250.55,
  split: 250.8,
  one: { at: 253.5, holdEnd: 255.5 },
  laya: { at: 258.5, holdEnd: 261, barsAt: 256.0 },
  browser: { at: 264, holdEnd: 266 },
});

export const TB_TOKENS = keys([TB.spinnerAt, 96_300], [TB.browser.holdEnd, 103_800]);

/** Left (System 2) and right (System 1) spinner rows after the split. */
export const LEFT: Pt = { x: 200, y: 520 };
export const RIGHT: Pt = { x: 1180, y: 520 };

/** Token chips the slow spinner has written by τ: brisk in the lead-in, one per 0.4 τ-s in the hold. */
export function chipsWritten(tau: number): number {
  if (tau < 251.0) return 0;
  if (tau < TB.one.at) return Math.floor((tau - 251.0) / 0.25) + 1;
  return Math.floor((TB.one.at - 251.0) / 0.25) + 1 + Math.floor((tau - TB.one.at) / 0.4);
}

/** Deterministic chip widths (token lengths) in px. */
export const chipWidth = (k: number): number => 44 + Math.round(hash1(k * 17 + 3) * 76);

/** The fast spinner's four bars, re-rolled 12 times a wall second. */
export function flickerBar(i: number, w: number): number {
  const step = Math.floor(w * 12);
  return 0.15 + 0.85 * hash1(step * 4 + i * 31 + 7);
}

/** Browser targets the cursor visits (stage px), in order. */
export const TARGETS: readonly Pt[] = [
  { x: 820, y: 676 },
  { x: 1120, y: 676 },
  { x: 1420, y: 676 },
  { x: 820, y: 800 },
  { x: 1180, y: 800 },
  { x: 1560, y: 800 },
];

export const stepAt = (k: number): number => 262.0 + k * 0.3;

/** Targets the cursor reaches (and rings) before the exit; it is still gliding to the next. */
export const RINGED = 4;

/** Cursor: hops target to target, then glides toward step 5 at ≤ 30 px per τ-s through the hold. */
export function cursorAt(tau: number): Pt {
  const first = TARGETS[0] as Pt;
  if (tau < stepAt(0)) {
    const u = prog(tau, 261.6, stepAt(0), outCubic);
    return { x: 700 + (first.x - 700) * u, y: 600 + (first.y - 600) * u };
  }
  for (let k = 0; k < 3; k++) {
    const a = TARGETS[k] as Pt;
    const b = TARGETS[k + 1] as Pt;
    if (tau < stepAt(k + 1)) {
      const u = prog(tau, stepAt(k) + 0.08, stepAt(k + 1), outCubic);
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u - Math.sin(Math.PI * u) * 50 };
    }
  }
  const a = TARGETS[3] as Pt;
  const b = TARGETS[4] as Pt;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const f =
    tau < TB.browser.at
      ? 0.5 * outCubic(prog(tau, stepAt(3) + 0.08, TB.browser.at))
      : 0.5 + (28 * (Math.min(tau, TB.browser.holdEnd) - TB.browser.at)) / dist;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}
