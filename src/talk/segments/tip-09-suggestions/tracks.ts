import { clamp, inOutCubic, outCubic, outExpo, prog, smoothstep } from "#/engine/motion/ease";
import type { Key } from "#/engine/motion/track";
import { pocketKeys } from "#/talk/kit/tui";

/** Absolute τ for tip 9 (window [222.9, 231.4); stop at 227.5, hold to 230). */
export const T9 = Object.freeze({
  start: 222.9,
  at: 227.5,
  holdEnd: 230,
  end: 231.4,
  ghostAt: 223.0,
  acceptAt: 223.45,
  submitAt: 223.7,
  spinnerAt: 223.9,
  scrollAt: 224.5,
  scrollDur: 0.4,
  updateAt: 224.62,
  updateOutAt: 224.8,
  reghostAt: 224.62,
  tapeAt: 224.5,
  sweepAt: 224.6,
  sweepLand: 226.7,
  strikeAt: 225.4,
  collapseAt: 225.7,
  copySettle: 226.35,
  stampSettle: 226.55,
  footSettle: 226.7,
  botWalkAt: 224.75,
  botWalkDur: 0.95,
  waveAt: 225.75,
  exit: Object.freeze({
    foldAt: 230.0,
    foldDur: 0.3,
    ghostLineAt: 230.08,
    solidAt: 230.32,
    solidDur: 0.22,
    pocketAt: 230.42,
    whipAt: 230.86,
    whipDur: 0.48,
  }),
});

export const GHOST_TEXT = "9. Turn off prompt suggestions";

/** Transcript scroll (px, negative = up) as the Update row prints, and back down in the fold. */
export function scrollY(tau: number): number {
  const up = prog(tau, T9.scrollAt, T9.scrollAt + T9.scrollDur, outExpo);
  return -120 * up;
}

/** Echo line scale: grows as it scrolls into the headline slot. */
export function echoScale(tau: number): number {
  return 1 + 0.2 * prog(tau, T9.scrollAt, T9.scrollAt + T9.scrollDur, outExpo);
}

/** Context bar height: flat 12 px → 28 px tape while the ghost reads it, flat again in the fold. */
export function tapeHeightKeys(): readonly Key[] {
  const { foldAt, foldDur } = T9.exit;
  return [
    { at: T9.tapeAt, value: 12 },
    { at: T9.tapeAt + 0.35, value: 28, ease: outCubic },
    { at: foldAt, value: 28 },
    { at: foldAt + foldDur, value: 12, ease: inOutCubic },
  ];
}

const SWEEP_FAST = 760;
const SWEEP_CREEP = 30;

/**
 * Ghost ✳ read head along the 1200 px tape: fast to 760 px by `sweepLand`, then a ≤ 30 px/τ-s
 * creep.
 */
export function sweepX(tau: number): number {
  if (tau <= T9.sweepAt) return 0;
  if (tau <= T9.sweepLand) return SWEEP_FAST * outCubic(prog(tau, T9.sweepAt, T9.sweepLand));
  return Math.min(1200, SWEEP_FAST + SWEEP_CREEP * (tau - T9.sweepLand));
}

/** Strike-through across the re-suggested ghost (0..1). */
export function strikeAt(tau: number): number {
  return prog(tau, T9.strikeAt, T9.strikeAt + 0.25, outCubic);
}

const COLLAPSE_AT_STOP = 0.3;
const COLLAPSE_CREEP = 0.06;

/**
 * How much of the ghost's width is left as it is sucked into the caret: 1 → 0.3 by the stop, then a
 * creep of 0.06 per τ-s (≤ 37 px/τ-s for the farthest letter).
 */
export function collapseScale(tau: number): number {
  if (tau <= T9.collapseAt) return 1;
  if (tau <= T9.at) {
    return 1 - (1 - COLLAPSE_AT_STOP) * smoothstep(prog(tau, T9.collapseAt, T9.at));
  }
  return Math.max(0, COLLAPSE_AT_STOP - COLLAPSE_CREEP * (tau - T9.at));
}

/** Letter i of n: near letters collapse first (s^2.4), the far end lags (s^1). */
export function letterScale(s: number, i: number, n: number): number {
  const lag = n <= 1 ? 1 : 2.4 - (1.4 * i) / (n - 1);
  return clamp(s) ** lag;
}

/** Bot travel (px from BOT_HOME.left): walks left to shoo the ghost, hops home in the fold. */
export function botX(tau: number): number {
  const out = inOutCubic(prog(tau, T9.botWalkAt, T9.botWalkAt + T9.botWalkDur));
  const back = inOutCubic(prog(tau, T9.exit.foldAt + 0.16, T9.exit.foldAt + 0.58));
  return -380 * out + 380 * back;
}

/** Plate fold into the completion line (0 open → 1 folded). */
export function foldAt(tau: number): number {
  return prog(tau, T9.exit.foldAt, T9.exit.foldAt + T9.exit.foldDur, inOutCubic);
}

/** The pile: 8 tokens in, the ninth pocketed during the exit. */
export const PILE_KEYS: readonly Key[] = pocketKeys(T9.exit.pocketAt, 9, 0.42);

/** Breaks display copy into lines of the given word counts (the rest on the last line). */
export function breakWords(text: string, counts: readonly number[]): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let i = 0;
  for (const n of counts) {
    if (i >= words.length) break;
    lines.push(words.slice(i, i + n).join(" "));
    i += n;
  }
  if (i < words.length) lines.push(words.slice(i).join(" "));
  return lines.join("\n");
}
