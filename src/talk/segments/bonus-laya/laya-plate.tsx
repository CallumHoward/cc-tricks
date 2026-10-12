import { useState } from "react";

import { inOutCubic, outCubic, prog } from "#/engine/motion/ease";
import { useStage, useTrack } from "#/engine/stage/react";
import { LAYA_BARS, LAYA_FOOT, LAYA_INPUT } from "#/talk/data/laya";
import { ProbBars } from "#/talk/kit/data/prob-bars";
import { RuleRise } from "#/talk/kit/motion";
import { Chevron } from "#/talk/kit/tui";
import { scriptFor } from "#/talk/script";
import { Layer, Live, Typed, Wiped } from "#/talk/segments/tip-03-effort/bracket";
import { inCubic } from "#/talk/segments/tip-03-effort/tracks";
import { WidgetShell } from "#/talk/widgets/widget-shell";

import { PROB } from "./system-one";
import { TB } from "./timing";

const script = scriptFor("b-laya");
const SETTLE = TB.laya.at - 0.8;
const EXIT = TB.laya.holdEnd;
const GUESSES = ["billing", "technical"] as const;

/** W6, folded into the film: the τ bars are the reveal; a guess replays them on the wall clock. */
function Predict() {
  const stage = useStage();
  const [guess, setGuess] = useState<{ pick: string; at: number } | null>(null);
  return (
    <WidgetShell label="Predict, then reveal" className="seg-fill">
      <Layer track={barsWipe}>
        <div className="seg-abs" style={{ left: PROB.x, top: PROB.y }}>
          {guess ? (
            <ProbBars
              key={guess.at}
              bars={LAYA_BARS}
              start={guess.at}
              stagger={0.2}
              clock="w"
              width={PROB.w}
            />
          ) : (
            <ProbBars
              bars={LAYA_BARS}
              start={TB.laya.barsAt}
              stagger={0.3}
              quiverIndex={1}
              width={PROB.w}
            />
          )}
        </div>
      </Layer>
      <Wiped at={SETTLE - 0.5} className="seg-abs" style={{ left: 360, top: 904 }}>
        <div className="wg-row">
          <span className="type-label seg-soft">Billing or technical?</span>
          {GUESSES.map((g) => (
            <button
              key={g}
              type="button"
              className="wg-chip type-label"
              aria-pressed={guess?.pick === g}
              onClick={() => setGuess({ pick: g, at: stage.frame().w })}
            >
              {g}
            </button>
          ))}
        </div>
      </Wiped>
    </WidgetShell>
  );
}

/** The bars' value column has no entrance of its own: wipe the stack on as the bars land. */
const barsWipe = (tau: number) => ({ clipRight: (1 - prog(tau, 255.6, 256.2, outCubic)) * 100 });

const sink = (tau: number) => {
  const u = prog(tau, EXIT, EXIT + 0.4, inCubic);
  return { y: u * 420, opacity: 1 - prog(tau, EXIT + 0.1, EXIT + 0.4) };
};

/** B-laya: the fast spinner's bars land as Laya's typed probabilities for one support email. */
export function LayaPlate() {
  const input = useTrack((tau: number) => ({ x: (1 - prog(tau, 255.5, 255.9, inOutCubic)) * 40 }));
  return (
    <Live from={TB.one.holdEnd} to={EXIT + 0.5}>
      <div className="seg-abs" style={{ left: 160, top: 196, scale: 0.7, transformOrigin: "0 0" }}>
        <RuleRise text={"Text in,\nprobabilities out."} settleBy={256.5} exit={EXIT} />
      </div>
      <Layer track={sink}>
        <Wiped
          at={256.6}
          dur={0.55}
          className="type-body seg-text seg-abs"
          style={{ left: 160, top: 404 }}
        >
          {script.lines[0]}
        </Wiped>
        <div
          ref={input}
          className="tui tui-line type-code seg-abs"
          data-tui-replica
          style={{ left: 160, top: 482 }}
        >
          <Chevron />
          <Typed text={` ${LAYA_INPUT}`} at={255.6} cps={44} className="type-code seg-text" />
        </div>
        <Predict />
        <Wiped at={256.9} className="type-label seg-muted seg-abs" style={{ left: 360, top: 836 }}>
          {LAYA_FOOT}
        </Wiped>
      </Layer>
    </Live>
  );
}
