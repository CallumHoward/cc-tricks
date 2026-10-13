import { clamp, inOutCubic, inOutExpo, outCubic, outExpo, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import type { StyleValues } from "#/engine/stage/applier";
import { springFrom } from "#/talk/kit/motion/schedule";
import { BOT_HOME } from "#/talk/segments/shared/home";
import { completionRise, hopArc, hopFlight, plateExit } from "#/talk/segments/shared/tip-turn";

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

/** Exit: plate dollies out → completion line → pocket → line rises away → home shot with one tile. */
export const EXIT = Object.freeze({
  fold: 68.5,
  foldEnd: 69.0,
  dockUp: 68.6,
  completeAt: 68.9,
  pocketAt: 69.15,
  whipAt: 69.42,
  whipEnd: 69.8,
  home: 69.8,
});

/** The prompt box, context bar and pile drop off-screen while the plates play. */
const DOCK_DROP = 640;

export function dockY(tau: number): number {
  const down = prog(tau, 48.7, 49.3, inOutExpo);
  const up = prog(tau, EXIT.dockUp, EXIT.dockUp + 0.5, outExpo);
  return DOCK_DROP * (down - up);
}

// Tip 1 · t1-agents ------------------------------------------------------------------------------

/** The real subagent TUI screenshot (1786×886), framed as a floating window. */
export const SHOT = Object.freeze({
  src: "/talk/refs/subagents-tui.webp",
  left: 200,
  top: 290,
  width: 1150,
  height: Math.round((1150 * 886) / 1786),
  /** Screenshot px → frame px. */
  k: 1150 / 1786,
});

/** The five general-purpose rows in screenshot px (x, y, w, h). */
const ROWS_PX = Object.freeze({ x: 24, y: 572, w: 1676, h: 270 });

/** The rows' highlight box in frame px, relative to the card. */
export const ROWS_BOX = Object.freeze({
  left: ROWS_PX.x * SHOT.k,
  top: ROWS_PX.y * SHOT.k,
  width: ROWS_PX.w * SHOT.k,
  height: ROWS_PX.h * SHOT.k,
});

const SHOT_IN = 49.05;
const SHOT_SPRING = SPRINGS.LIFT;
const SHOT_OUT = Object.freeze({ start: HOLD_END.agents, end: HOLD_END.agents + 0.5 });

export type Cam3D = {
  x: number;
  y: number;
  scale: number;
  rotateX: number;
  rotateY: number;
  opacity: number;
};

/**
 * Crane in: the window rises from below tipped back 32°, settles flat on a slow spring by `at −
 * 0.8`, floats on ambient time through the stop, then dollies back and fades.
 */
export function shotCam(tau: number, rho: number): Cam3D {
  const k = springFrom(tau, SHOT_IN, SHOT_SPRING);
  const out = prog(tau, SHOT_OUT.start, SHOT_OUT.end, inOutCubic);
  const float = prog(tau, SHOT_IN + 0.4, SHOT_IN + 1.6, inOutCubic) * (1 - out);
  return {
    x: 0,
    y: 300 * (1 - k) - 70 * out + float * 10 * Math.sin(rho * 0.9),
    scale: 0.84 + 0.16 * k - 0.08 * out + float * 0.012 * (1 - Math.cos(rho * 0.55)),
    rotateX: 32 * (1 - k) + 10 * out + float * 2.2 * Math.sin(rho * 0.7 + 1),
    rotateY: float * 3.2 * Math.sin(rho * 0.45),
    opacity: prog(tau, SHOT_IN, SHOT_IN + 0.3) * (1 - out),
  };
}

/** The dim-all-but-the-rows mask opens from the main row down over the five subagents. */
export function rowsReveal(tau: number): { open: number; glow: number } {
  const open = prog(tau, 50.35, 51.0, inOutCubic);
  return { open, glow: prog(tau, 50.55, 51.15, outCubic) };
}

/** The spinner line hands off to the window, which carries the same line at its top. */
export function spinnerOut(tau: number): StyleValues {
  const u = prog(tau, SHOT_IN, SHOT_IN + 0.4, inOutCubic);
  return { y: -36 * u, opacity: 1 - u };
}

/** The previous-talk link rises in under the window once it has landed. */
export function linkIn(tau: number): StyleValues {
  const u = springFrom(tau, 50.6, SPRINGS.LAND);
  const out = prog(tau, SHOT_OUT.start, SHOT_OUT.end - 0.1, inOutCubic);
  return { y: 24 * (1 - u) - 40 * out, opacity: Math.min(1, u * 2) * (1 - out) };
}

/** The "See:" label and the YAML card's first line. */
export const YAML_AT = 55.45;

// Tip 1 · t1-model-effort ------------------------------------------------------------------------

export const CARD = Object.freeze({ left: 200, top: 400, width: 1240, chX: 20.4, lineH: 45.9 });

/** Centre y of YAML line `i` inside the CodeBlock. */
const cardLineY = (i: number): number => CARD.top + 54 + 28 + CARD.lineH * i + CARD.lineH / 2;

/** Left x of column `col` in the YAML panel. */
const cardColX = (col: number): number => CARD.left + 40 + col * CARD.chX;

const CARD_IN = 54.9;
export const CARD_CLOSE = Object.freeze({ start: 60, end: 60.45 });

/** The card rises in on a spring as the screenshot dollies away, and lifts out for the advisor. */
export function cardFrame(tau: number): StyleValues {
  const k = springFrom(tau, CARD_IN, SPRINGS.LIFT);
  const close = prog(tau, CARD_CLOSE.start, CARD_CLOSE.end, inOutCubic);
  return {
    y: 120 * (1 - k) - 60 * close,
    opacity: Math.min(1, prog(tau, CARD_IN, CARD_IN + 0.3)) * (1 - close),
  };
}

/** Ambient float of the card: a slow tilt that keeps the stop alive. */
export function cardFloat(rho: number): { rotateX: number; rotateY: number } {
  return { rotateX: 1.6 * Math.sin(rho * 0.6 + 0.5), rotateY: 2.6 * Math.sin(rho * 0.42) };
}

/** Chip slots: `haiku` on line 3 col 7, `low` on line 4 col 8 (with 0.4ch padding each side). */
export const CHIPS = [
  { text: "haiku", line: 3, col: 7, from: { x: 1500, y: 640 }, launch: 55.7, land: 56.35 },
  { text: "low", line: 4, col: 8, from: { x: 1640, y: 360 }, launch: 55.95, land: 56.65 },
] as const;

/** Panel-coloured patch over a chip's base word, so the chip's hold drift never exposes it. */
export function chipCover(i: number): { left: number; top: number; width: number } {
  const c = CHIPS[i] ?? CHIPS[0];
  return {
    left: cardColX(c.col) - 4,
    top: cardLineY(c.line) - 23,
    width: c.text.length * CARD.chX + 8,
  };
}

/** `effort: low` drifts its last 6 px in the hold; `haiku` is pasted by the bot before. */
export function chipAt(i: number, tau: number): StyleValues {
  const c = CHIPS[i] ?? CHIPS[0];
  const slot = { x: cardColX(c.col) - 0.4 * CARD.chX, y: cardLineY(c.line) - 23 };
  if (tau < c.launch) return { x: slot.x, y: slot.y, scale: 0 };
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
});

/** The scan bar's sweep: it reads the transcript stack, then leaves. */
export function scanAt(tau: number): { y: number; opacity: number } {
  const u = prog(tau, ADV.scan.start, ADV.scan.end, inOutCubic);
  return { y: 540 + 240 * u, opacity: tau < ADV.scan.start || u >= 1 ? 0 : 1 };
}

/** Dimmed transcript lines (left x, width, centre y) that the scan reads and collapses into main. */
export const TRANSCRIPT = [
  { width: 620, y: 572 },
  { width: 470, y: 610 },
  { width: 700, y: 648 },
  { width: 540, y: 686 },
  { width: 660, y: 724 },
  { width: 400, y: 762 },
] as const;
export const TRANSCRIPT_LEFT = 640;
const TRANSCRIPT_IN = 60.45;

/** Line i's horizontal scale: wipes on from the left, collapses once the scan has passed it. */
export function transcriptLine(i: number, tau: number): number {
  const l = TRANSCRIPT[i] ?? TRANSCRIPT[0];
  const enter = prog(tau, TRANSCRIPT_IN + i * 0.06, TRANSCRIPT_IN + i * 0.06 + 0.3, outExpo);
  const read = prog(scanAt(tau).y, l.y - 30, l.y + 10, inOutExpo);
  return enter * (1 - read);
}

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
const BOT_SPOTS = Object.freeze({
  home: { x: 0, y: 0 },
  card: { x: 1440 - BOT_HOME.left, y: 740 - 180 - BOT_HOME.top },
});

/** Push spot: the rig's crate prop sits ~190 px into its box. */
const botPushX = (tau: number): number => crateX(1, tau) - 190 - BOT_HOME.left;

/** Hops: home → card (54.6), card → crate (62.6), crate → home (68.5). Flight = 0.16 + air. */
export const BOT_HOPS = Object.freeze({
  toCard: { at: 54.6, air: 0.5 },
  toCrate: { at: 62.6, air: 0.62 },
  toHome: { at: 68.5, air: 0.45 },
});

export function botOffset(tau: number): { x: number; y: number } {
  const a = hopFlight(tau, BOT_HOPS.toCard);
  const b = hopFlight(tau, BOT_HOPS.toCrate);
  const c = hopFlight(tau, BOT_HOPS.toHome);
  const crateSpot = { x: botPushX(tau), y: PANEL.floor - 180 - BOT_HOME.top };
  if (c > 0)
    return hopArc({ x: botPushX(BOT_HOPS.toHome.at), y: crateSpot.y }, BOT_SPOTS.home, c, 90);
  if (tau >= BOT_HOPS.toCrate.at + 0.78) return crateSpot;
  if (b > 0)
    return hopArc(
      BOT_SPOTS.card,
      { x: botPushX(BOT_HOPS.toCrate.at + 0.78), y: crateSpot.y },
      b,
      140,
    );
  if (a > 0) return hopArc(BOT_SPOTS.home, BOT_SPOTS.card, a, 70);
  return BOT_SPOTS.home;
}

// Exit -----------------------------------------------------------------------------------------

/** The plate dollies back and fades before the completion line appears. */
export const plateOut = (tau: number): StyleValues => plateExit(tau, EXIT.fold, EXIT.foldEnd);

export const completionOut = (tau: number): StyleValues =>
  completionRise(tau, EXIT.whipAt, EXIT.whipEnd);
