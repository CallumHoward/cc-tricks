import { inOutCubic, outCubic, outExpo, prog, type Ease } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import type { Key } from "#/engine/motion/track";

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
  /** The prompt box and context bar sink away as the window opens out of ⏎. */
  chromeOutDur: 0.45,
  /** Camera push from the whole window onto the Limit resets row. */
  pushAt: 233.7,
  pushDur: 1.2,
  /** The highlight round the Full reset row draws on. */
  highlightAt: 234.6,
  highlightDur: 0.5,
  pileHopAt: 234.3,
  pileHopDur: 0.5,
  botHopAt: 234.2,
  /** The resets plate dollies back and fades as the board's rails draw. */
  resetsOut: Object.freeze({ start: 238.5, end: 239.05 }),
  ticketsAt: 239.1,
  ticketGap: 0.3,
  ticketRun: 0.55,
  railDrawAt: 238.95,
  notCcSettle: 241.9,
  closedSettle: 242.4,
  punchAt: 242.8,
  headSettle: 243.7,
  peekAt: 242.5,
  exit: Object.freeze({
    /** The bot ducks back behind rail A before the tickets leave. */
    duckAt: 247.2,
    /** Tickets run off left along their rails, rails retract. */
    ticketsOutAt: 247.5,
    ticketOutGap: 0.04,
    ticketOutRun: 0.38,
    /** Home chrome cranes up into place as the board clears. */
    homeIn: Object.freeze({ start: 247.7, end: 248.15 }),
    lineAt: 247.95,
    punchAt: 248.15,
    chipDur: 0.3,
    riseAt: 248.5,
    riseDur: 0.35,
  }),
});

/** Transcript scroll (px, up) as the Settings window opens under the echo. */
export function resetsScrollY(tau: number): number {
  return -200 * prog(tau, T10.scrollAt, T10.scrollAt + T10.scrollDur, outExpo);
}

/** ⏎ → window morph progress (0 = the ⏎ glyph's box, 1 = the whole window open). */
export function diveAt(tau: number): number {
  return prog(tau, T10.diveAt, T10.diveAt + T10.diveDur, inOutCubic);
}

export type Rect = { x: number; y: number; w: number; h: number };

const mix = (a: number, b: number, u: number) => a + (b - a) * u;

/** Rect between `from` and `to`. */
export function mixRect(from: Rect, to: Rect, u: number): Rect {
  return {
    x: mix(from.x, to.x, u),
    y: mix(from.y, to.y, u),
    w: mix(from.w, to.w, u),
    h: mix(from.h, to.h, u),
  };
}

/** The pile hops from home onto the window card's top edge (0 → 1). */
export function pileHop(tau: number): number {
  return prog(tau, T10.pileHopAt, T10.pileHopAt + T10.pileHopDur, inOutCubic);
}

/** Ticket i of the offers board runs in along its rail and LANDs 0.3 τ-s after the previous one. */
export function ticketRunKeys(i: number): readonly Key[] {
  const start = T10.ticketsAt + i * T10.ticketGap;
  return [
    { at: start, value: 1900 },
    { at: start + T10.ticketRun, value: 0, ease: SPRINGS.LAND },
  ];
}

/** Rails drift left once the board has landed: 10 px/τ-s (rail A), 7 px/τ-s (rail B). */
export function railDrift(tau: number, rate: number): number {
  const from = T10.ticketsAt + 4 * T10.ticketGap + T10.ticketRun;
  return -rate * Math.max(0, tau - from);
}

/** The bot peeks over rail A: rises from behind it (px below rest → 0), then ducks back down. */
export function peekY(tau: number): number {
  const up = prog(tau, T10.peekAt, T10.peekAt + 0.55, outCubic);
  const down = prog(tau, T10.exit.duckAt, T10.exit.duckAt + 0.3, inOutCubic);
  return 150 * (1 - up + down);
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

/** The resets plate's exit dolly (0 in place → 1 gone). */
export function resetsOut(tau: number): number {
  return prog(tau, T10.resetsOut.start, T10.resetsOut.end, inOutCubic);
}

/** Home chrome sinking out under the opening window (0 → 1). */
export function chromeOut(tau: number): number {
  return prog(tau, T10.diveAt, T10.diveAt + T10.chromeOutDur, inOutCubic);
}

/** Home chrome craning back up as the board clears (1 below → 0 home). */
export function homeIn(tau: number): number {
  return 1 - prog(tau, T10.exit.homeIn.start, T10.exit.homeIn.end, inOutCubic);
}

/** The completion line glides up and fades as the scrollback moves on (0 → 1). */
export function punchedLineRise(tau: number): number {
  return prog(tau, T10.exit.riseAt, T10.exit.riseAt + T10.exit.riseDur, inOutCubic);
}

const inCubic: Ease = (u) => u ** 3;

/** Ticket i runs off left along its rail at the end of the board (px, ≤ 0). */
export function ticketOutX(i: number, tau: number): number {
  const from = T10.exit.ticketsOutAt + i * T10.exit.ticketOutGap;
  const u = prog(tau, from, from + T10.exit.ticketOutRun, inCubic);
  return u > 0 ? -2100 * u : 0;
}

/** Positions in [0, 1) of a value looping every `period` ambient seconds; wraps on rewind. */
export function loop(rho: number, period: number): number {
  return (((rho % period) + period) % period) / period;
}

// The real Settings › Usage screenshot ----------------------------------------------------------

export const SHOT = Object.freeze({ src: "/talk/refs/usage-reset.webp", w: 1920, h: 1247 });

/** The opaque app window inside the screenshot (its margins hold the baked macOS shadow). */
const WINDOW_PX: Rect = { x: 56, y: 38, w: 1808, h: 1134 };

/** The Full reset row (label, expiry and the Reset for free button), screenshot px. */
export const ROW_PX: Rect = { x: 420, y: 826, w: 1358, h: 88 };

/** The card the window is framed in at the stop: a letterbox under the title. */
export const CARD: Rect = { x: 120, y: 350, w: 1680, h: 440 };

/** The whole window fitted under the title, as it first opens out of ⏎. */
const CARD_OPEN: Rect = { x: 360, y: 345, w: 1000, h: (1000 * WINDOW_PX.h) / WINDOW_PX.w };

/** Screenshot scale at the stop: the row's type reads at ~28 px. */
const PUSH_SCALE = 1.18;

/** Screenshot point framed at the card's centre: the tooltip, the row and the 5-hour reset. */
const FOCUS = { x: 1085, y: 880 };

/** The screenshot region framed at the stop, around the Full reset row. */
const VIEW_PUSHED: Rect = (() => {
  const w = CARD.w / PUSH_SCALE;
  const h = CARD.h / PUSH_SCALE;
  return { x: FOCUS.x - w / 2, y: FOCUS.y - h / 2, w, h };
})();

export type ShotCam = {
  /** The card's frame rect on screen. */
  card: Rect;
  /** Screenshot px → frame px: frame = card origin + t + s·px. */
  s: number;
  tx: number;
  ty: number;
  /** Corner radius of the card. */
  radius: number;
};

/** The screenshot camera: grows out of the ⏎ glyph's box, then pushes in onto the reset row. */
export function shotCam(tau: number, from: Rect): ShotCam {
  const d = diveAt(tau);
  const p = prog(tau, T10.pushAt, T10.pushAt + T10.pushDur, inOutCubic);
  const card = p > 0 ? mixRect(CARD_OPEN, CARD, p) : mixRect(from, CARD_OPEN, d);
  const view = mixRect(WINDOW_PX, VIEW_PUSHED, p);
  const s = card.w / view.w;
  return {
    card,
    s,
    tx: card.w / 2 - (view.x + view.w / 2) * s,
    ty: card.h / 2 - (view.y + view.h / 2) * s,
    radius: 10 + 12 * d,
  };
}

// The offers board ------------------------------------------------------------------------------

type Card = {
  headline: string;
  lines: readonly string[];
  labels: readonly string[];
  footnotes: readonly string[];
  stamps: readonly string[];
};

export type TicketCopy = { headline: string; rows: readonly string[]; stamp?: string };

type Pick = readonly ["lines" | "labels" | "footnotes", number];

/** Per card, the verbatim script rows kept on its ticket: the one fact the eye needs. */
const KEEP: readonly (readonly Pick[])[] = [
  [["labels", 0]],
  [["lines", 0]],
  [["lines", 0]],
  [
    ["lines", 0],
    ["footnotes", 0],
  ],
];

/** One ticket per script card: its header, at most two kept rows, and its stamp. */
export function ticketCopy(card: Card, index: number): TicketCopy {
  const rows = (KEEP[index] ?? [])
    .map(([field, i]) => card[field][i])
    .filter((row): row is string => row !== undefined)
    .slice(0, 2);
  return { headline: card.headline, rows, stamp: card.stamps[0] };
}
