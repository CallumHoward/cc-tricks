import { outCubic, prog } from "#/engine/motion/ease";
import { pocketKeys } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { scriptFor } from "#/talk/script";
import {
  Bot,
  BOT_FEET,
  foldAt,
  HomeIntro,
  HomeOutro,
  Layer,
  type BotPath,
} from "#/talk/segments/tip-03-effort/bracket";
import { arcPoint, type Pt } from "#/talk/segments/tip-03-effort/tracks";

import "./tip5.css";
import { ChainPlate } from "./chain-plate";
import { RoutinesPlate } from "./routines-plate";
import { Sun } from "./sun";
import { HORIZON, T5, T5_TOKENS } from "./timing";

const NAP: Pt = { x: 290, y: HORIZON };

/** Bot: hops off home to nap at the dawn end of the ruler, then comes home to pocket a token. */
const botPath: BotPath = (tau) => {
  if (tau < 162.65) return { ...BOT_FEET, scale: 1 };
  if (tau < T5.chain.holdEnd) {
    const u = prog(tau, 162.65, 163.4, outCubic);
    return { ...arcPoint(BOT_FEET, NAP, u, 140), scale: 1 - 0.3 * u };
  }
  const u = prog(tau, T5.chain.holdEnd, T5.chain.holdEnd + 0.45, outCubic);
  return { ...arcPoint(NAP, BOT_FEET, u, 160), scale: 0.7 + 0.3 * u };
};

const ACTS: readonly Act[] = [
  { kind: "hop", at: 162.55, height: 100 },
  { kind: "sleepy", at: 163.5, dur: 5.1 },
  { kind: "wave", at: 168.75, dur: 0.45, side: "R" },
  { kind: "wave", at: 169.15, dur: 0.6, side: "R" },
  { kind: "look", at: 169.9, dur: 6.4, x: 0.6, y: -0.5 },
  { kind: "carry", at: T5.chain.holdEnd + 0.5, dur: 0.4 },
];

/** Hold creep: a slow push in each hold. */
const creep = (tau: number) => {
  const a = Math.min(1, Math.max(0, (tau - T5.routines.at) / 2.5));
  const back = prog(tau, T5.routines.holdEnd, 169, outCubic);
  const b = Math.min(1, Math.max(0, (tau - T5.chain.at) / 2.5));
  return { scale: 1 + 0.015 * a * (1 - back) + 0.015 * b };
};

const fold = (tau: number) => foldAt(tau, T5.chain.holdEnd);

export default function Tip05ProcSegment() {
  const turn = scriptFor("t5-routines").headline ?? "5. Proc the 5h window";
  return (
    <>
      <HomeIntro
        winStart={T5.winStart}
        pile={4}
        turn={{
          prompt: turn,
          verb: "Photosynthesizing",
          typeAt: T5.typeAt,
          cps: 34,
          submitAt: T5.submitAt,
          spinnerAt: T5.spinnerAt,
          tokens: T5_TOKENS,
        }}
        leave={{ at: T5.leave, dur: 0.8 }}
        glyphOff={T5.leave}
      />
      <Layer track={fold} style={{ transformOrigin: "50% 500px" }}>
        <Layer track={creep}>
          <ChainPlate />
          <RoutinesPlate />
        </Layer>
      </Layer>
      <Sun />
      <Bot path={botPath} acts={ACTS} from={T5.typeAt} to={T5.chain.holdEnd + 1.3} />
      <HomeOutro
        holdEnd={T5.chain.holdEnd}
        winEnd={T5.winEnd}
        pastVerb="Baked"
        duration="1m 15s"
        pile={pocketKeys(T5.chain.holdEnd + 0.5, 5)}
        pileAfter={5}
      />
    </>
  );
}
