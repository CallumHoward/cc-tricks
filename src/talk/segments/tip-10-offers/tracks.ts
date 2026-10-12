import { clamp, inOutCubic, outCubic, outExpo, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { sampleKeys, type Key } from "#/engine/motion/track";

/** Absolute τ for tip 10 (window [231.4, 248.9); stops at 236 and 244.5). */
export const T10 = Object.freeze({
  start: 231.4,
  resetsAt: 236,
  resetsHoldEnd: 238.5,
  offersAt: 244.5,
  offersHoldEnd: 247.5,
  end: 248.9,
  prompt: "10. Anthropic extra offers",
  typeAt: 231.48,
  cps: 30,
  submitAt: 232.5,
  spinnerAt: 232.7,
  scrollAt: 232.95,
  scrollDur: 0.5,
  titleSettle: 234.4,
  diveAt: 233.05,
  diveDur: 0.6,
  barsAt: 233.55,
  rowAt: 233.85,
  rowDur: 0.45,
  resetsCopySettle: 234.7,
  bankedAt: 234.3,
  instantAt: 234.6,
  instantLand: 235.15,
  pileHopAt: 234.55,
  pileHopDur: 0.5,
  stampSettle: 235.15,
  botHopAt: 234.2,
  pointAt: 234.95,
  /** Bone wipe in: the resets plate swaps for the offers board at its midpoint. */
  boneIn: Object.freeze({ start: 238.55, end: 239.35 }),
  ticketsAt: 239.1,
  ticketGap: 0.3,
  ticketRun: 0.55,
  railDrawAt: 238.95,
  notCcSettle: 241.9,
  closedSettle: 242.4,
  punchAt: 242.8,
  tearAt: 242.6,
  tearLand: 243.7,
  headSettle: 243.7,
  peekAt: 242.5,
  exit: Object.freeze({
    boneOut: Object.freeze({ start: 247.5, end: 248.1 }),
    lineAt: 247.72,
    punchAt: 247.98,
    chipDur: 0.36,
    whipAt: 248.38,
    whipDur: 0.42,
  }),
});

/** Midpoint of a wipe: the frame where the bed and plates swap under full cover. */
export const swapAt = (w: { start: number; end: number }): number => (w.start + w.end) / 2;

/** Transcript scroll (px, up) as the Settings panel opens under the echo. */
export function resetsScrollY(tau: number): number {
  return -200 * prog(tau, T10.scrollAt, T10.scrollAt + T10.scrollDur, outExpo);
}

/** ⏎ → panel morph progress (0 = the ⏎ glyph's box, 1 = the full panel). */
export function diveAt(tau: number): number {
  return prog(tau, T10.diveAt, T10.diveAt + T10.diveDur, inOutCubic);
}

export type Rect = { x: number; y: number; w: number; h: number };

const mix = (a: number, b: number, u: number) => a + (b - a) * u;

/** Rect between `from` and `to`; corners round in from the glyph's 50% to the panel's radius. */
export function mixRect(from: Rect, to: Rect, u: number): Rect {
  return {
    x: mix(from.x, to.x, u),
    y: mix(from.y, to.y, u),
    w: mix(from.w, to.w, u),
    h: mix(from.h, to.h, u),
  };
}

/** Banked ticket: slides out of the panel and LANDs (with overshoot) by 235.0. */
const BANKED_KEYS: readonly Key[] = [
  { at: T10.bankedAt, value: -620 },
  { at: T10.bankedAt + 0.7, value: 0, ease: SPRINGS.LAND },
];

/** Instant ticket: LANDs 10 px short by 235.15 (settled before at − 0.8), then creeps home. */
const INSTANT_KEYS: readonly Key[] = [
  { at: T10.instantAt, value: -620 },
  { at: T10.instantLand, value: -10, ease: SPRINGS.LAND },
  { at: T10.resetsAt, value: -10 },
  { at: T10.resetsHoldEnd, value: 0 },
];

export const bankedX = (tau: number): number => sampleKeys(BANKED_KEYS, tau);
export const instantX = (tau: number): number => sampleKeys(INSTANT_KEYS, tau);

/** Settings panel hold creep: drifts 8 px left across the resets hold. */
export function panelDrift(tau: number): number {
  return -8 * prog(tau, T10.resetsAt, T10.resetsHoldEnd);
}

/** The pile hops from home onto the banked ticket once it has landed (0 → 1). */
export function pileHop(tau: number): number {
  return prog(tau, T10.pileHopAt, T10.pileHopAt + T10.pileHopDur, inOutCubic);
}

/** Ticket i of the offers board runs in along its rail and LANDs 0.3 τ-s after the previous one. */
export function ticketRunKeys(i: number): readonly Key[] {
  const start = T10.ticketsAt + i * T10.ticketGap;
  return [
    { at: start, value: 1500 },
    { at: start + T10.ticketRun, value: 0, ease: SPRINGS.LAND },
  ];
}

/** Rails drift left once the board has landed: 10 px/τ-s (rail A), 7 px/τ-s (rail B). */
export function railDrift(tau: number, rate: number): number {
  const from = T10.ticketsAt + 4 * T10.ticketGap + T10.ticketRun;
  return -rate * Math.max(0, tau - from);
}

const TEAR_AT_LAND = 0.58;
const TEAR_CREEP = 0.025;

/** The cloud ticket's stub tear: fast to 58% by `tearLand`, 60% at the stop, then ≤ 2.5%/τ-s. */
export function tearProgress(tau: number): number {
  if (tau <= T10.tearAt) return 0;
  if (tau <= T10.tearLand) return TEAR_AT_LAND * outCubic(prog(tau, T10.tearAt, T10.tearLand));
  return clamp(TEAR_AT_LAND + TEAR_CREEP * (tau - T10.tearLand));
}

/** The bot peeks over rail A: rises from behind it (px below rest → 0). */
export function peekY(tau: number): number {
  return 150 * (1 - prog(tau, T10.peekAt, T10.peekAt + 0.55, outCubic));
}

/** Exit: the ✻ knocked out of the completion line arcs into the pile (0..1 along the flight). */
export function chipFlight(tau: number): number {
  return prog(tau, T10.exit.punchAt + 0.04, T10.exit.punchAt + 0.04 + T10.exit.chipDur, inOutCubic);
}

/** Point on the chip's arc from the completion line's ✻ to the pile's tenth slot. */
export function chipPoint(u: number, from: { x: number; y: number }, to: { x: number; y: number }) {
  return { x: mix(from.x, to.x, u), y: mix(from.y, to.y, u) - 220 * Math.sin(Math.PI * u) };
}

/** Pile count over the segment: 9 in, the tenth lands when the chip does. */
export function pileCount(tau: number): number {
  return chipFlight(tau) >= 1 ? 10 : 9;
}

export type TicketRow = { text: string; tone: "line" | "label" | "foot" };
export type TicketCopy = { headline: string; rows: readonly TicketRow[]; stamp?: string };

/** One ticket per script card: header, every line, label and footnote in order, and its stamp. */
export function ticketCopy(card: {
  headline: string;
  lines: readonly string[];
  labels: readonly string[];
  footnotes: readonly string[];
  stamps: readonly string[];
}): TicketCopy {
  const rows = (texts: readonly string[], tone: TicketRow["tone"]) =>
    texts.map((text) => ({ text, tone }));
  return {
    headline: card.headline,
    rows: [
      ...rows(card.lines, "line"),
      ...rows(card.labels, "label"),
      ...rows(card.footnotes, "foot"),
    ],
    stamp: card.stamps[0],
  };
}

/** Splits `Banked: saved in …` into its lead word and the rest, keeping the exact text. */
export function splitLead(label: string): [string, string] {
  const i = label.indexOf(":");
  return i < 0 ? ["", label] : [label.slice(0, i + 1), label.slice(i + 1)];
}
