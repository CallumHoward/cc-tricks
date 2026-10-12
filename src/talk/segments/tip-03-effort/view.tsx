import { clamp, inOutCubic, outCubic, prog } from "#/engine/motion/ease";
import type { StyleValues } from "#/engine/stage/applier";
import { pocketKeys } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { scriptFor } from "#/talk/script";

import { Bot, BOT_FEET, foldAt, HomeIntro, HomeOutro, Layer, type BotPath } from "./bracket";
import { ChartPlate } from "./chart-plate";
import { DialPlate } from "./dial-plate";
import { BOT_ARC_AT, FRONTIER, T3, T3_TOKENS } from "./timing";
import { arcPoint, pointAlong, type Pt } from "./tracks";

const DIAL_BOT: Pt = { x: 1696, y: 846 };
const START: Pt = FRONTIER[0] ?? DIAL_BOT;

/** Where the bot's feet are on the frontier (arc length) at τ, creeping 4 px/τ-s in the hold. */
export function frontierArc(tau: number): number {
  if (tau <= T3.aa.at) return BOT_ARC_AT * outCubic(prog(tau, 144.0, T3.aa.at));
  return BOT_ARC_AT + 4 * (Math.min(tau, T3.aa.holdEnd) - T3.aa.at);
}

/** The bot's feet and scale over the whole segment (pure in τ). */
export const botPath: BotPath = (tau) => {
  if (tau < 135.7) return { ...BOT_FEET, scale: 1 };
  if (tau < 141.3) {
    const u = prog(tau, 135.7, 136.3, outCubic);
    return { ...arcPoint(BOT_FEET, DIAL_BOT, u, 120), scale: 1 - 0.2 * u };
  }
  if (tau < 144.0) {
    const u = prog(tau, 141.3, 143.7, inOutCubic);
    return { ...arcPoint(DIAL_BOT, START, u, 60), scale: 0.8 - 0.3 * u };
  }
  const on = pointAlong(FRONTIER, frontierArc(tau));
  if (tau < T3.aa.holdEnd) return { ...on, scale: 0.5 };
  const u = prog(tau, T3.aa.holdEnd, T3.aa.holdEnd + 0.45, outCubic);
  return { ...arcPoint(on, BOT_FEET, u, 160), scale: 0.5 + 0.5 * u };
};

const ACTS: readonly Act[] = [
  { kind: "hop", at: 135.62, height: 90 },
  { kind: "point", at: 136.9, dur: 4.0, angle: 30, side: "L" },
  { kind: "look", at: 136.9, dur: 4.0, x: -1, y: -0.2 },
  { kind: "walk", at: 141.3, dur: 2.4, dx: 0 },
  { kind: "walk", at: 144.0, dur: 6.4, dx: 0, stepRate: 3 },
  { kind: "carry", at: T3.aa.holdEnd + 0.5, dur: 0.4 },
];

/** Hold creep: push 1.00 → 1.02 in each hold. */
export function creepAt(tau: number): StyleValues {
  const then =
    clamp((tau - T3.lastGen.at) / 2.5) * (1 - prog(tau, T3.lastGen.holdEnd, 142, outCubic));
  const aa = clamp((tau - T3.aa.at) / 3.5);
  return { scale: 1 + 0.02 * then + 0.012 * aa };
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
        <Layer track={creepAt}>
          <DialPlate />
          <ChartPlate />
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
