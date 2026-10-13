import { clamp, inOutCubic, outCubic, prog } from "#/engine/motion/ease";
import type { StyleValues } from "#/engine/stage/applier";
import { pocketKeys } from "#/talk/kit/tui";
import { HOP, type Act } from "#/talk/mascot/actions";
import { scriptFor } from "#/talk/script";

import { Bot, BOT_FEET, foldAt, HomeIntro, HomeOutro, Layer, type BotPath } from "./bracket";
import { ChartPlate, dotAt, OPUS_DOTS } from "./chart-plate";
import { DialPlate } from "./dial-plate";
import { T3, T3_TOKENS } from "./timing";
import { arcPoint, lerpPt, type Pt } from "./tracks";

const DIAL_BOT: Pt = { x: 1660, y: 900 };

/** The bot climbs the Opus dots low → max, one hop per effort level. */
const HOPS = OPUS_DOTS.length - 1;
const FLIGHT = HOP.anticipation + HOP.air;
const GAP = (T3.aa.at - FLIGHT - T3.aa.hopsAt) / (HOPS - 1);

/** τ hop `k` (from Opus dot k to k + 1) starts; the last one lands on Opus max at the stop. */
export const hopAt = (k: number) => T3.aa.hopsAt + k * GAP;

/** τ hop `k` touches down. */
export const landAt = (k: number) => hopAt(k) + FLIGHT;

/**
 * Feet on the Opus ladder: on a dot, or travelling between two in a hop's flight (the hop act adds
 * the lift, so the ground shadow runs the line between the dots).
 */
function ladderAt(tau: number, rho: number): Pt {
  for (let k = 0; k < HOPS; k++) {
    const off = hopAt(k) + HOP.anticipation;
    if (tau < off) return dotAt(k, tau, rho);
    if (tau < off + HOP.air) {
      return lerpPt(dotAt(k, tau, rho), dotAt(k + 1, tau, rho), (tau - off) / HOP.air);
    }
  }
  return dotAt(HOPS, tau, rho);
}

/** The bot's feet and scale over the whole segment (pure in τ and ρ). */
export const botPath: BotPath = (tau, rho) => {
  if (tau < 135.7) return { ...BOT_FEET, scale: 1 };
  if (tau < 141.3) {
    const u = prog(tau, 135.7, 136.3, outCubic);
    return { ...arcPoint(BOT_FEET, DIAL_BOT, u, 120), scale: 1 - 0.2 * u };
  }
  if (tau < T3.aa.hopsAt) {
    const u = prog(tau, 141.3, 143.7, inOutCubic);
    return { ...arcPoint(DIAL_BOT, dotAt(0, tau, rho), u, 60), scale: 0.8 - 0.3 * u };
  }
  const on = ladderAt(tau, rho);
  if (tau < T3.aa.holdEnd) return { ...on, scale: 0.5 };
  const u = prog(tau, T3.aa.holdEnd, T3.aa.holdEnd + 0.45, outCubic);
  return { ...arcPoint(on, BOT_FEET, u, 160), scale: 0.5 + 0.5 * u };
};

/** Each hop peaks about a fifth of its span above the line between its dots (rig units at ½ scale). */
function hopHeight(k: number): number {
  const a = dotAt(k, T3.aa.at, T3.aa.at);
  const b = dotAt(k + 1, T3.aa.at, T3.aa.at);
  return Math.min(260, 0.6 * Math.hypot(b.x - a.x, b.y - a.y));
}

const ACTS: readonly Act[] = [
  { kind: "hop", at: 135.62, height: 90 },
  { kind: "point", at: 136.9, dur: 4.0, angle: 30, side: "L" },
  { kind: "look", at: 136.9, dur: 4.0, x: -1, y: -0.2 },
  { kind: "walk", at: 141.3, dur: 2.4, dx: 0 },
  { kind: "look", at: 143.6, dur: 3.0, x: 0.8, y: -0.5 },
  ...Array.from(
    { length: HOPS },
    (_, k): Act => ({ kind: "hop", at: hopAt(k), height: hopHeight(k) }),
  ),
  { kind: "carry", at: T3.aa.holdEnd + 0.5, dur: 0.4 },
];

/** Hold creep on the dial: push 1.00 → 1.02 (the chart pushes in on its own pose). */
function creepAt(tau: number): StyleValues {
  const then =
    clamp((tau - T3.lastGen.at) / 2.5) * (1 - prog(tau, T3.lastGen.holdEnd, 142, outCubic));
  return { scale: 1 + 0.02 * then };
}

const fold = (tau: number) => foldAt(tau, T3.aa.holdEnd);

export default function Tip03EffortSegment() {
  const turn = scriptFor("t3-then").headline ?? "3. Manage effort levels";
  return (
    <>
      <HomeIntro
        winStart={T3.winStart}
        pile={2}
        turn={{
          prompt: turn,
          verb: "Deliberating",
          typeAt: T3.typeAt,
          cps: 32,
          submitAt: T3.submitAt,
          spinnerAt: T3.spinnerAt,
          tokens: T3_TOKENS,
        }}
        leave={{ at: T3.leave, dur: 0.8 }}
        glyphOff={T3.leave}
      />
      <Layer track={fold} style={{ transformOrigin: "50% 500px" }}>
        <ChartPlate />
        <Layer track={creepAt}>
          <DialPlate />
        </Layer>
      </Layer>
      <Bot path={botPath} acts={ACTS} from={T3.typeAt} to={T3.aa.holdEnd + 1.3} />
      <HomeOutro
        holdEnd={T3.aa.holdEnd}
        winEnd={T3.winEnd}
        pastVerb="Cogitated"
        duration="1m 30s"
        pile={pocketKeys(T3.aa.holdEnd + 0.5, 3)}
        pileAfter={3}
      />
    </>
  );
}
