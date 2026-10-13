import {
  clamp,
  inOutCubic,
  inQuad,
  outCubic,
  outExpo,
  prog,
  smoothstep,
} from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import type { Key } from "#/engine/motion/track";
import { splitWords, staggerStarts } from "#/talk/kit/motion/schedule";
import { HOME, pocketKeys } from "#/talk/kit/tui";

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
  titleSettle: 225.9,
  updateAt: 224.62,
  updateOutAt: 224.8,
  reghostAt: 224.62,
  tapeAt: 224.5,
  sweepAt: 224.6,
  sweepLand: 226.7,
  strikeAt: 225.4,
  collapseAt: 225.7,
  botWalkAt: 224.65,
  botWalkDur: 0.8,
  waveAt: 225.5,
  exit: Object.freeze({
    foldAt: 230.0,
    foldDur: 0.4,
    ghostLineAt: 230.08,
    solidAt: 230.32,
    solidDur: 0.22,
    pocketAt: 230.42,
    riseAt: 230.86,
    riseDur: 0.42,
  }),
});

export const GHOST_TEXT = "9. Turn off prompt suggestions";

/** Transcript scroll (px, negative = up) as the Update row prints, and back down in the fold. */
export function scrollY(tau: number): number {
  const up = prog(tau, T9.scrollAt, T9.scrollAt + T9.scrollDur, outExpo);
  return -120 * up;
}

/** τ the first word of a `RuleRise` title launches (its default 0.07 stagger on LAND). */
export function riseStart(text: string, settleBy: number): number {
  const n = splitWords(text).words.length;
  return staggerStarts(n, settleBy, 0.07, SPRINGS.LAND)[0] ?? settleBy;
}

/** How far (fraction of a line) a masked line has sunk below its mask: 0 in place, 1.1 gone. */
export function sinkAt(tau: number, at: number | undefined, dur = 0.3): number {
  return at === undefined ? 0 : 1.1 * prog(tau, at, at + dur, inQuad);
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

const COLLAPSE_SETTLED = 0.8;
const COLLAPSE_CREEP = 0.015;
const COLLAPSE_OUT = 0.25;

/**
 * How much of the struck ghost's width is left as it is pulled toward the caret: 1 → 0.8 by `at −
 * 0.8` (still legible), a 0.015/τ-s creep through the hold, then sucked in during the fold.
 */
export function collapseScale(tau: number): number {
  const settle = T9.at - 0.8;
  const { foldAt } = T9.exit;
  if (tau <= T9.collapseAt) return 1;
  if (tau <= settle) {
    return 1 - (1 - COLLAPSE_SETTLED) * smoothstep(prog(tau, T9.collapseAt, settle));
  }
  const held = COLLAPSE_SETTLED - COLLAPSE_CREEP * (Math.min(tau, foldAt) - settle);
  return held * (1 - prog(tau, foldAt, foldAt + COLLAPSE_OUT, inOutCubic));
}

/** Letter i of n: near letters shrink first (s^1.6), the far end lags (s^1). */
export function letterScale(s: number, i: number, n: number): number {
  const lag = n <= 1 ? 1 : 1.6 - (0.6 * i) / (n - 1);
  return clamp(s) ** lag;
}

/** How far the bot walks left: onto the prompt's top rule, just past the ghost's far end. */
const BOT_SHOO_DX = -470;

/** Bot travel (px from BOT_HOME.left): walks left to shoo the ghost, hops home in the fold. */
export function botX(tau: number): number {
  const out = inOutCubic(prog(tau, T9.botWalkAt, T9.botWalkAt + T9.botWalkDur));
  const back = inOutCubic(prog(tau, T9.exit.foldAt + 0.16, T9.exit.foldAt + 0.58));
  return BOT_SHOO_DX * out - BOT_SHOO_DX * back;
}

/** The plate dollies back (lift, scale) and fades on exit: 0 in place → 1 gone. */
export function foldAt(tau: number): number {
  return prog(tau, T9.exit.foldAt, T9.exit.foldAt + T9.exit.foldDur, inOutCubic);
}

/** Plate exit transform for fold progress `u`: lifts 48 px, scales to 0.94 and fades. */
export function plateOut(u: number): { y: number; scale: number; opacity: number } {
  return { y: -48 * u, scale: 1 - 0.06 * u, opacity: 1 - u };
}

/** Where the completion line sits on the home shot. */
export const COMPLETION_LINE_STYLE = {
  position: "absolute",
  left: HOME.textX,
  top: HOME.spinnerY,
  transform: "translateY(-50%)",
} as const;

/** The completion line glides up a few rows and fades as the scrollback moves on (0 → 1). */
export function lineRise(tau: number): number {
  return prog(tau, T9.exit.riseAt, T9.exit.riseAt + T9.exit.riseDur, inOutCubic);
}

/** Read-tape glint: a light travelling the read span every 2.4 ambient seconds (px along it). */
export function glintX(rho: number, span: number): number {
  const period = 2.4;
  const u = (((rho % period) + period) % period) / period;
  return u * span;
}

/** The pile: 8 tokens in, the ninth pocketed during the exit. */
export const PILE_KEYS: readonly Key[] = pocketKeys(T9.exit.pocketAt, 9, 0.42);
