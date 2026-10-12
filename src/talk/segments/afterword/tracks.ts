import { clamp, inOutCubic, inQuad, outCubic, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { keys, type Key } from "#/engine/motion/track";
import { shotTrack, type Cam } from "#/talk/kit/motion";
import type { Act } from "#/talk/mascot/actions";

/** Afterword story times (absolute τ); window [267.4, 280.9), stops at 272 and 277. */
export const AFT = Object.freeze({
  start: 267.4,
  spinnerAt: 267.55,
  whipIn: 268.45,
  whipDur: 0.6,
  kickerBy: 269.5,
  barsFrom: 269.1,
  barsTo: 270.6,
  walkFrom: 269.55,
  walkTo: 270.4,
  sliverFrom: 270.4,
  sliverTo: 271.1,
  captionAt: 270.4,
  captionEnd: 271.15,
  limitsAt: 272,
  cut: 274,
  pinAt: 274.55,
  pinLand: 274.9,
  drainFrom: 274.3,
  drainTo: 275.7,
  widenFrom: 274.4,
  widenTo: 275.2,
  peekFrom: 275.2,
  peekTo: 276,
  posterTextBy: 276.2,
  wantedAt: 277,
  yank: 279.5,
  yankDur: 0.45,
  whipOut: 280.35,
  whipOutDur: 0.55,
  end: 280.9,
});

/** Plate geometry (1920×1080 px). */
export const BARS = Object.freeze({
  left: 200,
  top: 330,
  width: 1300,
  gapCenter: 1467,
  trackBottom: 608,
});

export const POSTER = Object.freeze({ left: 600, top: 128, width: 720, height: 836 });

const drain = (from: number, peak: number, rest: number): readonly Key[] =>
  keys(
    [AFT.barsFrom, from],
    [AFT.barsTo, peak, SPRINGS.COUNT],
    [AFT.drainFrom, peak],
    [AFT.drainTo, rest, SPRINGS.COUNT],
  );

/** All models 88% and Fable 95%, draining to 21% and 1% behind the poster. */
export const WEEKLY = [
  { id: "all", label: "All models", sub: "Resets in 6 min", used: drain(0, 0.88, 0.21) },
  { id: "fable", label: "Fable", sub: "Resets in 6 min", used: drain(0, 0.95, 0.01) },
] as const;

/**
 * Bot box (240×200, ground at +180) left edge: walks into the Fable gap, then peeks round the
 * poster.
 */
export const BOT_X = keys(
  [AFT.walkFrom, 1600],
  [AFT.walkTo, BARS.gapCenter - 120, inOutCubic],
  [AFT.peekFrom, BARS.gapCenter - 120],
  [AFT.peekTo, POSTER.left + POSTER.width - 92, SPRINGS.MOVE],
);

/** Horizontal squash of the bot: a sliver in the 5% gap, full width again once the bars drain. */
export const BOT_WIDTH = keys(
  [AFT.sliverFrom, 1],
  [AFT.sliverTo, 0.15, outCubic],
  [AFT.widenFrom, 0.15],
  [AFT.widenTo, 1, SPRINGS.LAND],
);

export const BOT_ACTS: readonly Act[] = [
  { kind: "look", at: AFT.barsFrom - 0.1, dur: 0.9, x: -0.8, y: 0.1 },
  { kind: "walk", at: AFT.walkFrom, dur: AFT.walkTo - AFT.walkFrom, dx: -1, stepRate: 7 },
  { kind: "turn", at: AFT.sliverFrom - 0.05, dur: 0.45, to: 90 },
  { kind: "face", at: AFT.walkFrom, dur: AFT.drainFrom - AFT.walkFrom, expr: "determined" },
  { kind: "sweat", at: AFT.sliverFrom, dur: AFT.drainFrom - AFT.sliverFrom },
  { kind: "turn", at: AFT.widenFrom, dur: 0.5, to: 0 },
  { kind: "face", at: AFT.widenTo, dur: 30, expr: "curious" },
  { kind: "look", at: AFT.peekFrom, dur: 30, x: -0.7, y: -0.1 },
];

/** Bottom-right corner fold (px): still curling down at the stop, relaxing slowly in the hold. */
export function posterCurl(tau: number): number {
  if (tau < AFT.cut) return 0;
  return 38 + 92 * Math.exp(-(tau - AFT.cut) * 0.9);
}

/** Swing about the pin (deg): hangs crooked at the cut, swings true once pinned. */
export const POSTER_ROTATE = keys(
  [AFT.cut, 3.6],
  [AFT.pinLand, 3.6],
  [AFT.posterTextBy - 0.2, -1.2, SPRINGS.SWING],
  [AFT.yank, -0.7],
  [AFT.yank + AFT.yankDur, -7, inQuad],
);

/** Poster lift during the exit yank (px, negative is up). */
export const posterLift = (tau: number): number =>
  -1300 * prog(tau, AFT.yank, AFT.yank + AFT.yankDur, inQuad);

const PUSH = shotTrack([
  { at: AFT.captionAt, x: 960, y: 540, zoom: 1 },
  { at: AFT.limitsAt - 0.8, x: 850, y: 532, zoom: 1.14, ease: inOutCubic },
  { at: AFT.cut, zoom: 1.17 },
]);

const REST: Cam = { x: 960, y: 540, zoom: 1, roll: 0, tilt: 0 };

/**
 * Pushes in on the gauges and the sliver (kicker and caption stay out of the corner boxes), creeps
 * through the hold, and cuts back with the poster.
 */
export const limitsCamera = (tau: number): Cam => (tau < AFT.cut ? PUSH(tau) : REST);

/** Splits `text` into lines of `counts[i]` words each; the remainder makes the last line. */
export function wordLines(text: string, counts: readonly number[]): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let i = 0;
  for (const count of counts) {
    lines.push(words.slice(i, i + count).join(" "));
    i += count;
  }
  if (i < words.length) lines.push(words.slice(i).join(" "));
  return lines.join("\n");
}

/** Whole caption words visible while it types (word-wise, quantized to 60 Hz). */
export function captionWords(tau: number, total: number): number {
  const q = Math.ceil(tau * 60 - 1e-6) / 60;
  return Math.round(clamp((q - AFT.captionAt) / (AFT.captionEnd - AFT.captionAt)) * total);
}
