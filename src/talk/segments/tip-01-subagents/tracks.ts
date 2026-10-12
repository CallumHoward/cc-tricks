import { clamp, inOutExpo, outCubic, outExpo, prog } from "#/engine/motion/ease";
import { keys, sampleKeys } from "#/engine/motion/track";
import type { StyleValues } from "#/engine/stage/applier";
import { HOME } from "#/talk/kit/tui";
import { BOT_HOME } from "#/talk/segments/shared/home";

/** Visible window of this segment (registry: start + tail → next start + tail). */
export const WIN = Object.freeze({ start: 47.4, end: 69.9 });

export const AT = Object.freeze({ agents: 52, model: 57.5, advisor: 66 });
export const HOLD_END = Object.freeze({ agents: 54.5, model: 60, advisor: 68.5 });

/** Turn in: `❯ 1. Use subagents`, ⏎, spinner. */
export const TURN = Object.freeze({
  prompt: "1. Use subagents",
  typeAt: 47.5,
  cps: 30,
  submitAt: 48.25,
  spinnerAt: 48.45,
});

/** Exit: fold → completion line → pocket → whip → home shot with one tile. */
export const EXIT = Object.freeze({
  fold: 68.5,
  foldEnd: 68.85,
  dockUp: 68.6,
  completeAt: 68.8,
  pocketAt: 69.15,
  whipAt: 69.42,
  whipEnd: 69.8,
  home: 69.8,
});

/** The prompt box, context bar and pile drop off-screen while the plates play. */
export const DOCK_DROP = 640;

export function dockY(tau: number): number {
  const down = prog(tau, 48.7, 49.3, inOutExpo);
  const up = prog(tau, EXIT.dockUp, EXIT.dockUp + 0.5, outExpo);
  return DOCK_DROP * (down - up);
}

// Tip 1 · t1-agents ------------------------------------------------------------------------------

export const ROW = Object.freeze({ left: 200, width: 1100, mainTop: 542, top0: 592, gap: 46 });

export const rowTop = (i: number): number => ROW.top0 + i * ROW.gap;

export const SUBAGENTS = [
  { action: "Normalizing voice gains", tokens: 171_900, lag: 230 },
  { action: "Reading _measure.js", tokens: 150_500, lag: 240 },
  { action: "Removing clip paths", tokens: 217_600, lag: 215 },
  { action: "Writing S5 bars", tokens: 162_900, lag: 245 },
  { action: "Inspecting fold shading", tokens: 231_200, lag: 225 },
] as const;

/** Spokes snap off the ✳ 0.25 apart (cues 49.1 … 50.0) and fly 0.36 to their bullets. */
export const SPOKE = Object.freeze({ first: 49.1, gap: 0.25, flight: 0.36 });

export function spokeLaunch(i: number): number {
  return i === 0 ? SPOKE.first : SPOKE.first + 0.15 + (i - 1) * SPOKE.gap;
}

export const spokeLand = (i: number): number => spokeLaunch(i) + SPOKE.flight;

/** The big ✳ grows out of the spinner glyph, sheds five spokes, then sinks back into it. */
export const STAR = Object.freeze({ x: 218, y: 500, grow: 48.95, sink: 50.25, size: 150 });

/** Spoke angles (deg) of an 8-spoke ✳; the first five snap off. */
export const SPOKE_ANGLES = [90, 45, 135, 0, 180, 270, 225, 315] as const;

export type SpokeState = {
  x: number;
  y: number;
  rotate: number;
  /** 0 = spoke capsule, 1 = bullet ring */
  ring: number;
  visible: boolean;
};

/** Where a spoke is at τ: on the star, mid-arc, or landed as row i's bullet. */
export function spokeAt(i: number, tau: number): SpokeState {
  const angle = SPOKE_ANGLES[i] ?? 0;
  const grow = starScale(tau);
  const r = (STAR.size / 2) * 0.55 * grow;
  const rad = (angle * Math.PI) / 180;
  const home = { x: STAR.x + Math.cos(rad) * r, y: STAR.y + Math.sin(rad) * r };
  if (i >= SUBAGENTS.length) {
    return { ...home, rotate: angle, ring: 0, visible: grow > 0.02 };
  }
  const launch = spokeLaunch(i);
  const u = prog(tau, launch, launch + SPOKE.flight, outCubic);
  if (u <= 0) return { ...home, rotate: angle, ring: 0, visible: grow > 0.02 };
  const target = { x: ROW.left + 9, y: rowTop(i) + 23.4 };
  // Arc: overshoot right, then fall into the bullet column.
  const bulge = Math.sin(u * Math.PI) * 120;
  return {
    x: home.x + (target.x - home.x) * u + bulge,
    y: home.y + (target.y - home.y) * u,
    rotate: angle + 270 * u,
    ring: prog(u, 0.55, 1),
    visible: tau < spokeLand(i) + 0.12,
  };
}

/** Scale of the overlay ✳ relative to its full size (0 hidden). */
export function starScale(tau: number): number {
  const grow = prog(tau, STAR.grow, STAR.grow + 0.16, outExpo);
  const sink = prog(tau, STAR.sink, STAR.sink + 0.3, inOutExpo);
  const small = 36 / STAR.size;
  if (tau < STAR.grow) return 0;
  if (tau >= STAR.sink + 0.3) return 0;
  return small + (1 - small) * grow - (1 - small) * sink;
}

/** Hold ticks: each subagent counter steps its last digit up at these τ, avoiding the stills. */
export const TICKS = Object.freeze({ at: [52.8, 53.8] as const, snap: 0.1 });

/**
 * Subagent counters: roll up and detent on a whole last digit by 51.2, then tick one digit at a
 * time through the hold, resting on whole digits between the 0.1 τ-s snaps.
 */
export function subagentTokens(i: number): (tau: number) => number {
  const a = SUBAGENTS[i] ?? SUBAGENTS[0];
  const base = a.tokens - 100 * TICKS.at.length;
  const roll = keys([spokeLand(i), 0], [51.2, base, outCubic]);
  return (tau) => {
    if (tau < 51.2) return sampleKeys(roll, tau);
    const steps = TICKS.at.reduce((n, t) => n + prog(tau, t, t + TICKS.snap, outCubic), 0);
    return base + 100 * steps;
  };
}

/** The "See:" label types, then the YAML card types its first line. */
export const LABEL_AT = 50.3;
export const YAML_AT = 55.45;

export const MAIN_TOKENS = keys([49.0, 0], [50.6, 97_300, outCubic]);
export const SPINNER_TOKENS = keys([48.6, 0], [50.9, 97_300, outCubic]);
export const SPINNER_ELAPSED = keys([48.6, 0], [50.9, 1769, outCubic]);
export const SPINNER_VERB = [
  { at: 0, verb: "Orchestrating" },
  { at: 50.5, verb: "Onioning" },
] as const;

/** Rows fold into the agent card: each squashes onto the main row, staggered. */
export function rowFold(i: number, tau: number): StyleValues {
  const start = HOLD_END.agents + i * 0.04;
  const k = prog(tau, start, start + 0.32, inOutExpo);
  const y = (ROW.mainTop - (i < 0 ? ROW.mainTop : rowTop(i))) * k;
  return { y, scaleY: 1 - 0.85 * k, opacity: 1 - k };
}

/** Spinner line folds with the rows; it does not return. */
export function spinnerFold(tau: number): StyleValues {
  const u = prog(tau, HOLD_END.agents, HOLD_END.agents + 0.35, inOutExpo);
  return { y: 42 * u, scaleY: 1 - 0.85 * u, opacity: 1 - u };
}

// Tip 1 · t1-model-effort ------------------------------------------------------------------------

export const CARD = Object.freeze({ left: 200, top: 400, width: 1200, chX: 20.4, lineH: 45.9 });

/** Centre y of YAML line `i` inside the CodeBlock. */
export const cardLineY = (i: number): number =>
  CARD.top + 54 + 28 + CARD.lineH * i + CARD.lineH / 2;

/** Left x of column `col` in the YAML panel. */
export const cardColX = (col: number): number => CARD.left + 40 + col * CARD.chX;

export const CARD_OPEN = Object.freeze({ start: 54.85, end: 55.5 });
export const CARD_CLOSE = Object.freeze({ start: 60, end: 60.4 });

/** The card unfolds from the folded row line and folds back into it for the advisor. */
export function cardFrame(tau: number): StyleValues {
  const open = prog(tau, CARD_OPEN.start, CARD_OPEN.end, outExpo);
  const close = prog(tau, CARD_CLOSE.start, CARD_CLOSE.end, inOutExpo);
  const k = open * (1 - close);
  return {
    scaleY: Math.max(0.004, k),
    opacity: tau < CARD_OPEN.start || close >= 1 ? 0 : 1,
  };
}

/** Chip slots: `haiku` on line 3 col 7, `low` on line 4 col 8 (with 0.4ch padding each side). */
export const CHIPS = [
  { text: "haiku", line: 3, col: 7, from: { x: 1500, y: 640 }, launch: 55.95, land: 56.6 },
  { text: "low", line: 4, col: 8, from: { x: 1640, y: 360 }, launch: 56.2, land: 56.95 },
] as const;

/** `effort: low` drifts its last 6 px in the hold; `haiku` is pasted by the bot before. */
export function chipAt(i: number, tau: number): StyleValues {
  const c = CHIPS[i] ?? CHIPS[0];
  const slot = { x: cardColX(c.col) - 0.4 * CARD.chX, y: cardLineY(c.line) - 23 };
  if (tau < c.launch || tau >= CARD_CLOSE.start + 0.05) return { x: slot.x, y: slot.y, scale: 0 };
  if (i === 1) {
    const u = prog(tau, c.launch, c.land, outExpo);
    const drift = tau < c.land ? 6 : 6 * (1 - clamp((tau - c.land) / 2.5));
    const x = c.from.x + (slot.x + 6 - c.from.x) * u;
    const y = c.from.y + (slot.y - c.from.y) * u;
    return { x: tau < c.land ? x : slot.x + drift, y, scale: 1, rotate: 6 * (1 - u) };
  }
  const u = prog(tau, c.launch, c.land, outExpo);
  const lift = Math.sin(u * Math.PI) * -60;
  return {
    x: c.from.x + (slot.x - c.from.x) * u,
    y: c.from.y + (slot.y - c.from.y) * u + lift,
    scale: 0.6 + 0.4 * u,
    rotate: -10 * (1 - u),
  };
}

// Tip 1 · t1-advisor -----------------------------------------------------------------------------

export const ADV = Object.freeze({
  typeAt: 60.15,
  cps: 32,
  line1: "Get a second opinion:",
  line2: "/advisor opus",
  starIn: 61.2,
  scan: { start: 61.4, end: 62.4 },
  rowsAt: 62.55,
  cratesAt: 63.4,
  summaryAt: 64.6,
  l2At: 64.45,
});

export const PANEL = Object.freeze({
  mainTop: 600,
  subLeft: 1160,
  subTops: [606, 746] as const,
  floor: 800,
});

/** Crates leave main toward the subagent rows, then creep 20 px/τ-s through the hold. */
export const CRATES = [
  { label: "40 screenshots", width: 300, top: 596, x0: 600, x1: 800, delay: 0 },
  { label: "build.log", width: 220, top: 736, x0: 600, x1: 800, delay: 0.15 },
] as const;

export function crateX(i: number, tau: number): number {
  const c = CRATES[i] ?? CRATES[0];
  const start = ADV.cratesAt + c.delay;
  const u = prog(tau, start, AT.advisor, outCubic);
  const creep = 20 * clamp(tau - AT.advisor, 0, HOLD_END.advisor - AT.advisor);
  return c.x0 + (c.x1 - c.x0) * u + creep;
}

/** Crates rise out of the main block (masked) before sliding. */
export function crateRise(i: number, tau: number): number {
  const c = CRATES[i] ?? CRATES[0];
  return prog(tau, ADV.cratesAt + c.delay - 0.25, ADV.cratesAt + c.delay + 0.05, outExpo);
}

// Bot ------------------------------------------------------------------------------------------

/** Where the bot's box sits (offset from BOT_HOME); its rig acts animate inside the box. */
export const BOT_SPOTS = Object.freeze({
  home: { x: 0, y: 0 },
  card: { x: 1440 - BOT_HOME.left, y: 740 - 180 - BOT_HOME.top },
});

/** Push spot: the rig's crate prop sits ~190 px into its box. */
export const botPushX = (tau: number): number => crateX(1, tau) - 190 - BOT_HOME.left;

const arc = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  u: number,
  h: number,
) => ({
  x: from.x + (to.x - from.x) * u,
  y: from.y + (to.y - from.y) * u - Math.sin(u * Math.PI) * h,
});

/** Hops: home → card (54.6), card → crate (62.6), crate → home (68.5). Flight = 0.16 + air. */
export const BOT_HOPS = Object.freeze({
  toCard: { at: 54.6, air: 0.5 },
  toCrate: { at: 62.6, air: 0.62 },
  toHome: { at: 68.5, air: 0.45 },
});

export function botOffset(tau: number): { x: number; y: number } {
  const flight = (h: { at: number; air: number }) => prog(tau, h.at + 0.16, h.at + 0.16 + h.air);
  const a = flight(BOT_HOPS.toCard);
  const b = flight(BOT_HOPS.toCrate);
  const c = flight(BOT_HOPS.toHome);
  const crateSpot = { x: botPushX(tau), y: PANEL.floor - 180 - BOT_HOME.top };
  if (c > 0) return arc({ x: botPushX(BOT_HOPS.toHome.at), y: crateSpot.y }, BOT_SPOTS.home, c, 90);
  if (tau >= BOT_HOPS.toCrate.at + 0.78) return crateSpot;
  if (b > 0)
    return arc(BOT_SPOTS.card, { x: botPushX(BOT_HOPS.toCrate.at + 0.78), y: crateSpot.y }, b, 140);
  if (a > 0) return arc(BOT_SPOTS.home, BOT_SPOTS.card, a, 70);
  return BOT_SPOTS.home;
}

// Exit -----------------------------------------------------------------------------------------

/** Everything on the plate folds into the completion line at the spinner row. */
export function plateFold(tau: number): StyleValues {
  const u = prog(tau, EXIT.fold, EXIT.foldEnd, inOutExpo);
  return { scaleY: 1 - u, opacity: u >= 1 ? 0 : 1 };
}

/** The completion line whips up the scrollback, smeared by its own speed. */
export function whipUp(tau: number): StyleValues {
  const u = prog(tau, EXIT.whipAt, EXIT.whipEnd, inOutExpo);
  const mid = Math.sin(u * Math.PI);
  return { y: -620 * u, scaleY: 1 + 1.4 * mid, blur: 6 * mid, opacity: u >= 1 ? 0 : 1 };
}

export const SEGMENT_HOME = Object.freeze({ textX: HOME.textX, spinnerY: HOME.spinnerY });
