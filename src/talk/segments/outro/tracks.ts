import { inOutCubic, lerp, outCubic, prog } from "#/engine/motion/ease";
import { springAt, SPRINGS } from "#/engine/motion/spring";
import { keys, sampleKeys, type Key } from "#/engine/motion/track";
import type { Shot } from "#/talk/kit/motion";
import { formatElapsed } from "#/talk/kit/tui";
import { pileTiles } from "#/talk/kit/tui/tui-math";
import type { Act } from "#/talk/mascot/actions";

/** Outro story times (absolute τ); window [280.9, 299.5), stops at 285.5 and 293.5. */
export const OUT = Object.freeze({
  start: 280.9,
  craneIn: 281.1,
  craneInDur: 0.6,
  recapAt: 281.75,
  recapDur: 1.25,
  wipeFrom: 283.3,
  wipeDur: 0.9,
  craneTo: 284.6,
  thesisAt: 285.5,
  collapseFrom: 287.5,
  collapseTo: 287.95,
  rulesTo: 288.8,
  hopFrom: 287.9,
  hopTo: 288.75,
  cookedAt: 288.7,
  pileFrom: 289.2,
  pileTo: 290.3,
  qrFrom: 290.6,
  qrTo: 291.4,
  flyFirst: 291,
  flyDur: 0.6,
  flyStagger: 0.1,
  labelAt: 291.5,
  qrAt: 293.5,
  end: 299.5,
});

/** A smooth vertical crane: eased travel with a slight dolly out mid-move, no blur. */
function crane(tau: number, at: number, dur: number, distance: number) {
  const u = prog(tau, at, at + dur);
  return { y: distance * inOutCubic(u), scale: 1 - 0.06 * Math.sin(Math.PI * u) };
}

/** The home shot: at rest through the match cut, then the camera cranes up the scrollback. */
export const homeCrane = (tau: number) => crane(tau, OUT.craneIn, OUT.craneInDur, 1080);

/** The camera keeps craning up past the top of the scrollback onto the short, clean bar. */
export const plateCrane = (tau: number) => crane(tau, OUT.wipeFrom, OUT.wipeDur, 1080);

/** Every completion line of the talk, tip 1 → bonus (storyboard §4.2). */
export const RECAP = [
  { pastVerb: "Churned", duration: "1m 30s" },
  { pastVerb: "Brewed", duration: "3m 30s" },
  { pastVerb: "Cogitated", duration: "1m 30s" },
  { pastVerb: "Crunched", duration: "45s" },
  { pastVerb: "Baked", duration: "1m 15s" },
  { pastVerb: "Worked", duration: "1m 15s" },
  { pastVerb: "Sautéed", duration: "1m 15s" },
  { pastVerb: "Churned", duration: "1m" },
  { pastVerb: "Crunched", duration: "45s" },
  { pastVerb: "Worked", duration: "1m 15s" },
  { pastVerb: "Cogitated", duration: "1m 15s" },
] as const;

/** The recap as the scrollback holds it: newest just above the prompt, tip 1 at the top. */
export const SCROLLBACK = [...RECAP].reverse();

/** The short, clean context bar: x, bottom edge, scale. */
export const BAR = Object.freeze({ x: 200, y: 800, width: 1520, capacity: 100, height: 72 });

const shrink = (long: number, short: number, creep = short): readonly Key[] =>
  keys([OUT.wipeFrom, long], [OUT.craneTo, short, SPRINGS.GLIDE], [OUT.collapseFrom, creep]);

/**
 * Zones shrink from the home bar to a short, mostly cached one; the last keeps creeping in the
 * hold.
 */
export const SHORT_ZONES = [
  { id: "system", size: shrink(18, 7), state: "cached" as const },
  { id: "tools", size: shrink(22, 6), state: "cached" as const },
  { id: "claude-md", size: shrink(10, 3), state: "cached" as const },
  { id: "messages", size: shrink(30, 5.2, 4.6), state: "paid" as const },
];

/** Bar pose keys: flat top-down plate, collapsing to a rule before it becomes the prompt box. */
export const BAR_KEYS = {
  height: keys([OUT.collapseFrom, BAR.height], [OUT.collapseTo, 4, inOutCubic]),
};

/**
 * Crane: from close on the bar back to a framing centred on it, a slow push in the hold, then
 * level.
 */
export const CRANE: readonly Shot[] = [
  { at: OUT.wipeFrom, x: 620, y: 740, zoom: 1.45 },
  { at: OUT.craneTo, x: 860, y: 690, zoom: 1.25, ease: outCubic },
  { at: OUT.collapseFrom, zoom: 1.28 },
  { at: OUT.rulesTo, x: 960, y: 540, zoom: 1, ease: inOutCubic },
];

/** Peak height (px) of a tile's hop; tiles skim the band under the label, then rise into the QR. */
const TILE_HOP = 90;

/** Flight fractions where a tile snaps from pile size to its module, and where it inks over. */
const SHRINK_FROM = 0.82;
export const INK_FROM = 0.9;

/** The QR plate: the prompt box's two rules, kept inside the safe band (corners stay empty). */
export const PLATE = Object.freeze({ left: 160, width: 1600, top: 300, bottom: 876 });

export const QR = Object.freeze({ left: 214, top: 322, size: 540 });

/** The show notes link beside the QR, vertically centred on it (one 56 px line). */
export const LABEL = Object.freeze({ left: 840, top: QR.top + QR.size / 2 - 36 });

/** Label word `i` lift through its mask (1 hidden below, 0 at rest), springing in word by word. */
export const labelLift = (tau: number, i: number): number =>
  1 - springAt(tau - (OUT.labelAt + i * 0.07), SPRINGS.LAND);

export type RuleBox = { x: number; y: number; w: number };

/** The prompt box's rules split out of the collapsed bar and stretch to the plate. */
export function plateRules(tau: number, barWidth: number): { top: RuleBox; bottom: RuleBox } {
  const u = prog(tau, OUT.collapseTo, OUT.rulesTo, outCubic);
  const mid = BAR.y - 2;
  const x = lerp(BAR.x, PLATE.left, u);
  const w = lerp(barWidth, PLATE.width, u);
  return {
    top: { x, y: lerp(mid, PLATE.top, u), w },
    bottom: { x, y: lerp(mid, PLATE.bottom, u), w },
  };
}

/** Bot box left/top (240×200, ground at +180): walks the short bar, then hops onto the plate's rule. */
export const BOT_X = keys(
  [OUT.wipeFrom, 210],
  [OUT.collapseFrom, 290],
  [OUT.hopTo, 1060, inOutCubic],
);

export function botLift(tau: number): number {
  const u = prog(tau, OUT.hopFrom, OUT.hopTo);
  const ground = lerp(BAR.y - BAR.height, PLATE.bottom, inOutCubic(u));
  return ground - 180 - Math.sin(Math.PI * u) * 260;
}

export const BOT_ACTS: readonly Act[] = [
  { kind: "walk", at: OUT.wipeFrom, dur: OUT.collapseFrom - OUT.wipeFrom, dx: 1, stepRate: 3 },
  { kind: "face", at: OUT.wipeFrom, dur: OUT.collapseFrom - OUT.wipeFrom, expr: "happy" },
  { kind: "hop", at: OUT.hopFrom - 0.1, height: 30, air: 0.62 },
  { kind: "look", at: OUT.pileFrom - 0.2, dur: OUT.pileTo - OUT.pileFrom, x: -0.8, y: 0.6 },
  { kind: "look", at: OUT.flyFirst, dur: 1.4, x: -1, y: -0.3 },
  { kind: "sleepy", at: OUT.qrTo + 0.2, dur: 1e6 },
];

/** The bot empties its pockets onto the rule just right of the QR, so the tiles' flight is short. */
const PILE = Object.freeze({ x: 990, y: PLATE.bottom, size: 34 });
const PILE_COUNT = keys([OUT.pileFrom, 0], [OUT.pileTo, 10]);

export type Module = { x: number; y: number };

export type TileState = {
  x: number;
  y: number;
  rotate: number;
  /** Tile edge in px */
  size: number;
  /** 0 clay ✳ tile, 1 ink module */
  ink: number;
  visible: boolean;
};

/** τ the tile pocketed `i`-th (0 first) starts flying; the first pocketed lands last. */
export const flightStart = (i: number): number => OUT.flyFirst + (9 - i) * OUT.flyStagger;

/** τ tile `i` lands on its module. */
export const landing = (i: number): number => flightStart(i) + OUT.flyDur;

/** Module each tile fills: the first pocketed takes the very last held-back module. */
const tileTarget = (i: number, held: readonly Module[]): Module | undefined =>
  held[held.length - 1 - i];

/**
 * Tile `i` at τ: in the pile, mid-flight, or landed exactly on its module rect (QR px origin at
 * `QR.left/top`, `n` modules across).
 */
export function tileAt(i: number, tau: number, held: readonly Module[], n: number): TileState {
  const slot = pileTiles(sampleKeys(PILE_COUNT, tau), 10, PILE.size)[i];
  const target = tileTarget(i, held);
  const px = QR.size / n;
  const from = { x: PILE.x + slot.x, y: PILE.y + slot.y, rotate: slot.rotate, scale: slot.scale };
  const start = flightStart(i);
  if (!target || tau < start) {
    return {
      x: from.x,
      y: from.y,
      rotate: from.rotate,
      size: PILE.size * from.scale,
      ink: 0,
      visible: slot.visible,
    };
  }
  const u = prog(tau, start, start + OUT.flyDur);
  const e = inOutCubic(u);
  const to = { x: QR.left + (target.x + 0.5) * px, y: QR.top + (target.y + 0.5) * px };
  const skim = lerp(from.y, PLATE.bottom - PILE.size * 0.7, prog(u, 0, 0.3, outCubic));
  return {
    x: lerp(from.x, to.x, e),
    y: lerp(skim, to.y, prog(u, 0.35, 1, inOutCubic)) - Math.sin(Math.PI * u) * TILE_HOP,
    rotate: lerp(from.rotate, 360, e),
    size: lerp(PILE.size, px * 1.02, prog(u, SHRINK_FROM, 1, outCubic)),
    ink: prog(u, INK_FROM, 1, outCubic),
    visible: true,
  };
}

/**
 * QR card fed out under the print (px): nothing until it prints, then one row ahead of the print
 * head.
 */
export function plateFed(tau: number, n: number): number {
  if (tau < OUT.qrFrom) return 0;
  return Math.min(QR.size, (prog(tau, OUT.qrFrom, OUT.qrTo) * n + 1) * (QR.size / n));
}

/** Estimated wall clock at the end of the talk (§8: 18:48), used until the stage has run that long. */
export const ESTIMATED_WALL = 18 * 60 + 48;

/** Seconds the talk has been cooking: wall time once it is plausible, else the estimate ticking on. */
export const elapsedSeconds = (w: number): number => (w >= 600 ? w : ESTIMATED_WALL + w);

/** Rendered width of the short bar at τ (px). */
export function barWidthAt(tau: number): number {
  const units = SHORT_ZONES.reduce((sum, z) => sum + sampleKeys(z.size, tau), 0);
  return (units * BAR.width) / BAR.capacity;
}

/** `✻ Cooked for {elapsed} · ↓ ≈3k tokens` with the elapsed time filled in. */
export function cookedText(template: string, seconds: number): string {
  return template.replace(/^✻ /, "").replace("{elapsed}", formatElapsed(seconds));
}
