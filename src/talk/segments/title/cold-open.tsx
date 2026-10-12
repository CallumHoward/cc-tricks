import { useRef } from "react";

import { outExpo, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { ContextBar, GlyphDive, World, shotTrack, type Glyph } from "#/talk/kit/motion";
import { springFrom } from "#/talk/kit/motion/schedule";
import { AgentRow, Chevron, GLYPH_PATHS, HOME, PromptBox, SpinnerLine } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { HOME_ZONES } from "#/talk/segments/shared/home";

import { Mover, Rig, Win } from "./lib";
import { RoadPlate } from "./road";
import {
  COLD_SHOTS,
  COUNTER_AT,
  PROMPT,
  ROW_TOKENS,
  T,
  coldPunch,
  magnitudeCrossings,
  rowEnterAt,
  rowTokenKeys,
  spinOnScreen,
  totalTokensAt,
} from "./tracks";

const SPIN: Glyph = { d: GLYPH_PATHS["✳"], box: 100, focus: { x: 50, y: 50 } };
const CROSSINGS = magnitudeCrossings();
const coldCam = shotTrack(COLD_SHOTS);
const DIVE = spinOnScreen();

const BOT_ACTS: readonly Act[] = [
  { kind: "hop", at: T.botHop, height: 70 },
  { kind: "look", at: T.botHop + 0.5, dur: 1.2, x: -0.9, y: 0.35 },
  { kind: "surprised", at: T.shove, dur: 0.6 },
  { kind: "look", at: T.shove + 0.1, dur: 2, x: -1, y: 0.5 },
];

/** Bot box (0.6× home) peeking up from behind the prompt's top rule, right of the counter. */
const BOT = { left: 866, top: 461, width: 132, height: 110 };

function botPlace(tau: number) {
  const rise = 1 - outExpo(prog(tau, T.botHop + 0.12, T.botHop + 0.5));
  const shove = 18 * springFrom(tau, T.shove, SPRINGS.PUNCH);
  return { x: BOT.left + shove, y: BOT.top + rise * 140, hidden: tau < T.botHop - 0.05 };
}

/** The echo of the submitted prompt rising into the scrollback. */
function echoPlace(tau: number) {
  const u = outExpo(prog(tau, T.submitAt + 0.12, T.submitAt + 0.5));
  return { x: HOME.textX, y: 232 + (1 - u) * 388, hidden: tau < T.submitAt + 0.12 };
}

function ColdWorld() {
  return (
    <World camera={coldCam}>
      <Mover place={echoPlace} className="so-echo type-code">
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <b>
            <Chevron />
          </b>
          <span style={{ marginLeft: "1ch" }}>{PROMPT}</span>
        </span>
      </Mover>
      {ROW_TOKENS.map((_, i) => (
        <AgentRow
          // oxlint-disable-next-line react/no-array-index-key -- fixed five subagents
          key={i}
          name="general-purpose"
          tokens={rowTokenKeys(i)}
          enterAt={rowEnterAt(i)}
          style={{ position: "absolute", left: HOME.textX, top: 280 + i * 38, width: 720 }}
        />
      ))}
      <SpinnerLine
        verb="Bloviating"
        at={T.spinnerAt}
        cps={4000}
        elapsed={0}
        tokens={totalTokensAt}
        className="type-label so-spinner"
        style={{ position: "absolute", left: HOME.textX, top: HOME.spinnerY }}
      />
      <PromptBox
        text={PROMPT}
        typeAt={T.typeAt}
        cps={60}
        submitAt={T.submitAt}
        className="type-code"
        style={{ position: "absolute", left: HOME.left, top: HOME.promptTop }}
      />
      <ContextBar zones={HOME_ZONES} />
      <div
        className="so-abs"
        style={{ width: 1920, height: 1080, clipPath: `inset(0 0 ${1080 - HOME.promptTop}px 0)` }}
      >
        <Mover place={botPlace} style={{ width: BOT.width, height: BOT.height }}>
          <Rig acts={BOT_ACTS} />
        </Mover>
      </div>
    </World>
  );
}

/** τ 0 → 5.6: the prompt, the ⏎, the million-token hook, then the dive into the spinner ✳. */
export function ColdOpen() {
  const gate = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    const pre = frame.tau < T.shove + 0.4;
    if (gate.current) {
      const next = pre ? "pre" : "on";
      if (gate.current.dataset.dive !== next) gate.current.dataset.dive = next;
    }
  });
  return (
    <div ref={gate} className="so-fill" data-dive="pre">
      <GlyphDive
        at={{ x: DIVE.x, y: DIVE.y }}
        size={DIVE.size}
        glyph={SPIN}
        start={T.diveStart}
        end={T.diveEnd}
        plate={<RoadPlate />}
      >
        <Win from={-1} to={T.diveEnd + 0.05}>
          <Mover
            place={(tau: number, frame: Frame) => {
              const s = coldPunch(tau, frame.v, CROSSINGS);
              const cam = coldCam(tau);
              const fx = 960 + (COUNTER_AT.x - cam.x) * cam.zoom;
              const fy = 540 + (COUNTER_AT.y - cam.y) * cam.zoom;
              return { x: fx * (1 - s), y: fy * (1 - s), s };
            }}
            style={{ width: 1920, height: 1080 }}
          >
            <ColdWorld />
          </Mover>
        </Win>
      </GlyphDive>
    </div>
  );
}
