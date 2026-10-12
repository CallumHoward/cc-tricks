import { clamp, inOutCubic, prog } from "#/engine/motion/ease";
import type { Frame } from "#/engine/types";
import { setStyle, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { BOT_HOME } from "#/talk/segments/shared/home";

import { hitSag, MONOLITH, PRICE_BASE, PRICE_X, COIN } from "./scene";
import { T } from "./timing";

/** Feet sit this far below the bot box's top edge. */
export const FEET = 180;
const HOME_FEET = { x: BOT_HOME.left + BOT_HOME.width / 2, y: BOT_HOME.top + FEET };

/** Where the bot stands between hops (feet, stage px). */
export const SPOTS = Object.freeze({
  home: HOME_FEET,
  monolith: { x: MONOLITH.x, y: MONOLITH.y - MONOLITH.h / 2 },
  shelf: { x: 1520, y: 870 },
  hit: { x: PRICE_X[3], y: PRICE_BASE - COIN },
  strip: { x: 1170, y: 480 },
  clock: { x: 1480, y: 470 },
  road: { x: 640, y: 958 },
});

type Spot = { x: number; y: number };
type HopKey = { at: number; dur: number; to: Spot; height: number };

/** Every hop between spots, in order (the bot starts at home and ends at home). */
export const HOPS: readonly HopKey[] = [
  { at: 72.5, dur: 0.6, to: SPOTS.monolith, height: 140 },
  { at: 83.3, dur: 0.7, to: SPOTS.shelf, height: 120 },
  { at: 96.6, dur: 0.7, to: SPOTS.hit, height: 140 },
  { at: 106.2, dur: 0.6, to: SPOTS.strip, height: 160 },
  { at: 115.7, dur: 0.6, to: SPOTS.clock, height: 80 },
  { at: 123.6, dur: 0.7, to: SPOTS.road, height: 160 },
  { at: 132.6, dur: 0.6, to: SPOTS.home, height: 170 },
];

/** Feet position at τ: hops are parabolic arcs; the price hold adds the deadpan sag. */
export function botFeet(tau: number): Spot {
  let from: Spot = SPOTS.home;
  for (const hop of HOPS) {
    if (tau < hop.at) break;
    const u = clamp((tau - hop.at) / hop.dur);
    if (u < 1) {
      const e = inOutCubic(u);
      return {
        x: from.x + (hop.to.x - from.x) * e,
        y: from.y + (hop.to.y - from.y) * e - hop.height * 4 * u * (1 - u),
      };
    }
    from = hop.to;
  }
  if (from === SPOTS.hit) return { x: from.x, y: from.y + hitSag(tau) };
  return from;
}

const ACTS: readonly Act[] = [
  ...HOPS.map((h): Act => ({ kind: "hop", at: h.at - 0.12, height: 24, air: h.dur })),
  { kind: "look", at: 75.3, dur: 0.9, x: -0.6, y: 0.9 },
  { kind: "shrug", at: 76.4, dur: 0.8 },
  { kind: "push", at: 89.6, dur: 0.9, dir: -1 },
  { kind: "surprised", at: 98.4, dur: 0.6 },
  { kind: "look", at: 99.2, dur: 4, x: 0, y: 1 },
  { kind: "surprised", at: 109.5, dur: 0.5 },
  { kind: "face", at: 110.3, dur: 5.3, expr: "closed" },
  { kind: "sleepy", at: 116.4, dur: 0.8 },
  { kind: "surprised", at: 117.35, dur: 0.6 },
  { kind: "look", at: 124.9, dur: 1.2, x: 1, y: -0.4 },
  { kind: "surprised", at: 125.4, dur: 0.6 },
  { kind: "carry", at: 132.55, dur: 0.5 },
];

/** Tip 2's bot: one rig for the whole segment, travelling by hops so it never jumps. */
export function Bot() {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const f = botFeet(frame.tau);
    setStyle(
      el,
      "transform",
      `translate3d(${(f.x - BOT_HOME.width / 2).toFixed(1)}px, ${(f.y - FEET).toFixed(1)}px, 0)`,
    );
  });
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: BOT_HOME.width,
        height: BOT_HOME.height,
      }}
    >
      <StageMascot acts={ACTS} title="the bot" />
      <Ice />
    </div>
  );
}

/** Ice cube prop: grows up around the bot when its 5m cache burns out, cracks at t2-idle. */
function Ice() {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const grow = inOutCubic(prog(frame.tau, T.freeze, T.freeze + 0.5));
    const crack = prog(frame.tau, T.crack, T.crack + 0.25);
    const shown = grow > 0 && crack < 1;
    setStyle(el, "visibility", shown ? "visible" : "hidden");
    setStyle(el, "clip-path", `inset(${((1 - grow) * 100).toFixed(1)}% -20px -20px -20px)`);
    setStyle(
      el,
      "transform",
      `scale(${(1 + 0.12 * crack).toFixed(3)}) rotate(${(crack * 4).toFixed(2)}deg)`,
    );
  });
  return (
    <div
      ref={ref}
      aria-hidden
      className="t2-ice"
      style={{
        position: "absolute",
        left: 30,
        top: 18,
        width: 180,
        height: 172,
        visibility: "hidden",
      }}
    >
      <svg viewBox="0 0 180 172" width="180" height="172">
        <rect x="3" y="3" width="174" height="166" rx="18" className="t2-ice__body" />
        <path d="M22 26 L70 18 M18 44 L30 120" className="t2-ice__shine" />
        <path d="M128 140 L150 122 L162 134" className="t2-ice__crack" />
      </svg>
    </div>
  );
}
