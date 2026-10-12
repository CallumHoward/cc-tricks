import { outCubic, prog } from "#/engine/motion/ease";
import type { StyleValues } from "#/engine/stage/applier";
import { useTrack } from "#/engine/stage/react";
import type { Act } from "#/talk/mascot/actions";
import { scriptFor } from "#/talk/script";
import {
  Bot,
  BOT_FEET,
  foldAt,
  HomeIntro,
  HomeOutro,
  Layer,
  Live,
  type BotPath,
} from "#/talk/segments/tip-03-effort/bracket";
import { SPIN_AT } from "#/talk/segments/tip-03-effort/timing";
import { arcPoint, inCubic, type Pt } from "#/talk/segments/tip-03-effort/tracks";

import "./bonus.css";
import { BrowserPlate } from "./browser-plate";
import { LayaPlate } from "./laya-plate";
import { SystemOnePlate } from "./system-one";
import { cursorAt, RINGED, TARGETS, TB, TB_TOKENS } from "./timing";

const BOOK_TOP: Pt = { x: 960, y: 470 };
const BAR_END: Pt = { x: 1690, y: 690 };
const STRIP: Pt = { x: 700, y: 540 };

const stripX = (tau: number) =>
  STRIP.x + 760 * outCubic(prog(tau, 261.8, TB.browser.at)) + 20 * Math.max(0, tau - TB.browser.at);

/** Bot: perches on the book, points at the uncertain bar, then walks the browser strip's top edge. */
export const botPath: BotPath = (tau) => {
  if (tau < 251.75) return { ...BOT_FEET, scale: 1 };
  if (tau < TB.one.holdEnd) {
    const u = prog(tau, 251.75, 252.15, outCubic);
    return { ...arcPoint(BOT_FEET, BOOK_TOP, u, 120), scale: 1 - 0.4 * u };
  }
  if (tau < TB.laya.holdEnd) {
    const u = prog(tau, TB.one.holdEnd, TB.one.holdEnd + 0.5, outCubic);
    return { ...arcPoint(BOOK_TOP, BAR_END, u, 140), scale: 0.6 };
  }
  if (tau < TB.browser.holdEnd) {
    const u = prog(tau, TB.laya.holdEnd, TB.laya.holdEnd + 0.6, outCubic);
    const on = { x: stripX(tau), y: STRIP.y };
    return { ...arcPoint(BAR_END, on, u, 160), scale: 0.6 - 0.1 * u };
  }
  const from = { x: stripX(TB.browser.holdEnd), y: STRIP.y };
  const u = prog(tau, TB.browser.holdEnd, TB.browser.holdEnd + 0.45, outCubic);
  return { ...arcPoint(from, BOT_FEET, u, 160), scale: 0.5 + 0.5 * u };
};

const ACTS: readonly Act[] = [
  { kind: "hop", at: 251.6, height: 90, air: 0.36 },
  { kind: "look", at: 252.0, dur: 0.45, x: -1, y: 0 },
  { kind: "look", at: 252.55, dur: 0.45, x: 1, y: 0 },
  { kind: "look", at: 253.1, dur: 2.3, x: -1, y: 0 },
  { kind: "point", at: 256.6, dur: 4.3, angle: 20, side: "L" },
  { kind: "walk", at: 261.8, dur: 4.2, dx: 0 },
];

const creep = (tau: number): StyleValues => {
  const hold = (at: number, span: number) => Math.min(1, Math.max(0, (tau - at) / span));
  const back = (end: number) => 1 - prog(tau, end, end + 0.5, outCubic);
  const s =
    hold(TB.one.at, 2) * back(TB.one.holdEnd) +
    hold(TB.laya.at, 2.5) * back(TB.laya.holdEnd) +
    hold(TB.browser.at, 2);
  return { scale: 1 + 0.015 * s };
};

const fold = (tau: number) => foldAt(tau, TB.browser.holdEnd);

/** Exit: the last ringed decision pounces into the completion line's ✻. */
function Pounce() {
  const ref = useTrack((tau: number) => {
    const end = TB.browser.holdEnd;
    const u = prog(tau, end, end + 0.3, inCubic);
    const p = arcPoint(TARGETS[RINGED - 1] ?? cursorAt(end), SPIN_AT, u, 240);
    return { x: p.x - 9, y: p.y - 9, scale: 1 - 0.4 * u };
  });
  return (
    <Live from={TB.browser.holdEnd} to={TB.browser.holdEnd + 0.3}>
      <div
        ref={ref}
        className="seg-abs"
        style={{
          left: 0,
          top: 0,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: "var(--clay)",
        }}
      />
    </Live>
  );
}

export default function BonusLayaSegment() {
  const turn = scriptFor("b-system-one").headline ?? "Bonus: Laya-ultrafast for browser use";
  return (
    <>
      <HomeIntro
        winStart={TB.winStart}
        pile={10}
        turn={{
          prompt: turn,
          verb: "Ruminating",
          typeAt: TB.typeAt,
          cps: 40,
          submitAt: TB.submitAt,
          spinnerAt: TB.spinnerAt,
          tokens: TB_TOKENS,
        }}
        leave={{ at: TB.leave, dur: 0.6 }}
        glyphOff={TB.leave}
      />
      <Layer track={fold} style={{ transformOrigin: "50% 500px" }}>
        <Layer track={creep}>
          <SystemOnePlate />
          <LayaPlate />
          <BrowserPlate />
        </Layer>
      </Layer>
      <Pounce />
      <Bot path={botPath} acts={ACTS} from={TB.typeAt} to={TB.browser.holdEnd + 1.3} />
      <HomeOutro
        holdEnd={TB.browser.holdEnd}
        winEnd={TB.winEnd}
        pastVerb="Cogitated"
        duration="1m 15s"
        pile={10}
        pileAfter={10}
      />
    </>
  );
}
