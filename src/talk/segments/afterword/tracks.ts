import { clamp, inOutCubic, outCubic, prog } from "#/engine/motion/ease";
import { springAt, SPRINGS } from "#/engine/motion/spring";
import { keys } from "#/engine/motion/track";
import { shotTrack, type Cam } from "#/talk/kit/motion";
import type { Act } from "#/talk/mascot/actions";

/** Afterword story times (absolute τ); window [267.4, 280.9), stops at 272 and 277. */
export const AFT = Object.freeze({
  start: 267.4,
  spinnerAt: 267.55,
  craneIn: 268.4,
  craneDur: 0.9,
  tiltTo: 269.7,
  titleAt: 269.3,
  glowFrom: 270.2,
  glowTo: 270.8,
  walkFrom: 269.9,
  walkTo: 270.9,
  limitsAt: 272,
  pushFrom: 274.1,
  pushTo: 276.2,
  wantedAt: 277,
  pullFrom: 279.5,
  pullTo: 280.15,
  craneOut: 279.95,
  craneOutDur: 0.7,
  end: 280.9,
});

/** The weekly-limits screenshot (1970×598) framed as a floating card on the stage. */
export const SHOT = Object.freeze({ w: 1970, h: 598, src: "/talk/refs/weekly-limits.webp" });
export const CARD = Object.freeze({ left: 200, top: 330, width: 1520 });
export const CARD_SCALE = CARD.width / SHOT.w;
export const CARD_HEIGHT = Math.round(SHOT.h * CARD_SCALE);

/** Screenshot px → stage px. */
export const onCard = (x: number, y: number) => ({
  x: CARD.left + x * CARD_SCALE,
  y: CARD.top + y * CARD_SCALE,
});

/** The Fable row in screenshot px: label, bar (track and 95% fill end) and the "95% used" text. */
export const FABLE = Object.freeze({
  row: { x: 22, y: 398, w: 1926, h: 140 },
  barY: 467,
  fillEnd: 1634,
  trackEnd: 1684,
  barHalf: 9,
});

/** Where the bot stands: in the last 5% of the Fable bar, feet on the track. */
export const BOT_STAND = (() => {
  const end = onCard(FABLE.fillEnd, FABLE.barY - FABLE.barHalf);
  return { x: end.x + 22, ground: end.y };
})();

/** The bot is scaled down so it doesn't dwarf a 14 px bar. */
export const BOT_SCALE = 0.72;

/** Bot box (240×200, ground at +180) left edge: walks in from the card's right edge. */
export const BOT_X = keys(
  [AFT.walkFrom, CARD.left + CARD.width + 60 - 120],
  [AFT.walkTo, BOT_STAND.x - 120, inOutCubic],
);

export const BOT_ACTS: readonly Act[] = [
  { kind: "turn", at: AFT.walkFrom - 0.2, dur: 0.3, to: -70 },
  { kind: "walk", at: AFT.walkFrom, dur: AFT.walkTo - AFT.walkFrom, dx: -1, stepRate: 8 },
  { kind: "turn", at: AFT.walkTo - 0.05, dur: 0.4, to: -25 },
  { kind: "face", at: AFT.walkFrom, dur: AFT.pushFrom - AFT.walkFrom, expr: "determined" },
  { kind: "look", at: AFT.walkTo, dur: AFT.pushFrom - AFT.walkTo, x: -0.9, y: 0.2 },
  { kind: "sweat", at: AFT.walkTo, dur: AFT.pushFrom - AFT.walkTo },
  { kind: "turn", at: AFT.pushFrom, dur: 0.5, to: 0 },
  { kind: "shrug", at: AFT.pushFrom + 0.6, dur: 1.2 },
  { kind: "face", at: AFT.pushFrom + 0.6, dur: 30, expr: "curious" },
  { kind: "look", at: AFT.pushTo - 0.4, dur: 30, x: 0.15, y: -0.1 },
];

/** Glow round the Fable row: sweeps on left → right (clip fraction 0..1). */
export const glowReveal = (tau: number): number => prog(tau, AFT.glowFrom, AFT.glowTo, outCubic);

/** Stage point the camera pushes in on for the wanted stop: the Fable bar's last 5%. */
const PUSH_FOCUS = { x: 1330, y: 690 };

const REST: Cam = { x: 960, y: 540, zoom: 1, roll: 0, tilt: 0 };

/**
 * Holds the whole card, creeps through the limits hold, pushes in on the Fable row's end for the
 * wanted stop, creeps again, then pulls back to the home framing before the exit crane.
 */
export const limitsCamera = shotTrack([
  { at: AFT.limitsAt - 0.8, ...REST },
  { at: AFT.pushFrom - 0.1, x: 980, y: 548, zoom: 1.025 },
  { at: AFT.pushTo, x: PUSH_FOCUS.x, y: PUSH_FOCUS.y, zoom: 1.5, ease: inOutCubic },
  { at: AFT.pullFrom, zoom: 1.54 },
  { at: AFT.pullTo, ...REST, ease: inOutCubic },
]);

/** A smooth vertical crane between two screens: eased travel, no blur. */
function crane(tau: number, at: number, dur: number, distance: number): number {
  return distance * inOutCubic(prog(tau, at, at + dur));
}

/** The crane pulls back a touch mid-move, like a dolly out and in (scale ≤ 1). */
function craneScale(tau: number, at: number, dur: number): number {
  return 1 - 0.07 * Math.sin(Math.PI * prog(tau, at, at + dur));
}

/** Screen y of the column: cranes down to the card, then back up to the home shot. */
export const columnY = (tau: number): number =>
  crane(tau, AFT.craneIn, AFT.craneDur, -1080) + crane(tau, AFT.craneOut, AFT.craneOutDur, 1080);

export const columnScale = (tau: number): number =>
  craneScale(tau, AFT.craneIn, AFT.craneDur) * craneScale(tau, AFT.craneOut, AFT.craneOutDur);

/** Card pitch (deg): arrives tipped back and settles flat on a spring. */
export const CARD_TILT = keys([AFT.craneIn + 0.2, 22], [AFT.tiltTo, 0, SPRINGS.LAND]);

/** Glowing embers rising off the 95% fill end; `a` is ambient time so they never freeze. */
export type Ember = { x: number; y: number; size: number; alpha: number };

const EMBER_PERIOD = 2.6;
const EMBER_RISE = 180;
export const EMBER_COUNT = 14;

export function emberAt(i: number, a: number, tau: number): Ember {
  const seed = Math.sin(i * 12.9898) * 43758.5453;
  const r = seed - Math.floor(seed);
  const life = (((a / EMBER_PERIOD + i / EMBER_COUNT) % 1) + 1) % 1;
  const origin = onCard(FABLE.fillEnd - 30 + r * 60, FABLE.barY);
  const on = clamp((tau - AFT.glowFrom) / 0.5);
  return {
    x: origin.x + Math.sin(a * 1.3 + i * 2.1) * 14 + (r - 0.5) * 40 * life,
    y: origin.y - life * EMBER_RISE * (0.7 + 0.6 * r),
    size: (3 + r * 5) * on,
    alpha: Math.sin(Math.PI * life) * on,
  };
}

const LETTER_STAGGER = 0.045;

/**
 * Per-letter title rise: `lift` 1 is hidden below the mask, 0 at rest; `spread` (px) is the extra
 * tracking each letter closes up as the word lands.
 */
export function letterAt(tau: number, i: number): { lift: number; spread: number } {
  const lift = 1 - springAt(tau - (AFT.titleAt + i * LETTER_STAGGER), SPRINGS.LAND);
  const spread = 26 * (1 - prog(tau, AFT.titleAt, AFT.titleAt + 1, outCubic));
  return { lift, spread };
}
