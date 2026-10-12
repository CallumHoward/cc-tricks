import { SPRINGS } from "#/engine/motion/spring";
import { BoneSwap, ContextBar } from "#/talk/kit/motion";
import { num, put } from "#/talk/kit/motion/dom";
import { springFrom } from "#/talk/kit/motion/schedule";
import {
  CompletionLine,
  GLYPH_PATHS,
  HOME,
  Pile,
  pileSlot,
  PromptBox,
  ScrollbackWhip,
} from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { BOT_HOME, HOME_ZONES, HomeRest } from "#/talk/segments/shared/home";
import { During, FILL, Layer } from "#/talk/segments/tip-09-suggestions/parts";

import { OffersBoard } from "./offers";
import { ResetsPlate } from "./resets";
import { chipFlight, chipPoint, pileCount, swapAt, T10 } from "./tracks";

const WIPES = [
  { ...T10.boneIn, to: "bone" as const },
  { ...T10.exit.boneOut, to: "dark" as const },
];
const BOARD_FROM = swapAt(T10.boneIn);
const HOME_FROM = swapAt(T10.exit.boneOut);

const TILE = 34;
/** The completion line's ✻ (two label cells at the line's start). */
const STAR = { x: HOME.textX + 18, y: HOME.spinnerY };
const SLOT = pileSlot(9, TILE);
const PILE_TOP = { x: HOME.pileX + SLOT.x, y: HOME.pileY + SLOT.y };

const EXIT_ACTS: readonly Act[] = [
  { kind: "look", at: T10.exit.punchAt, dur: 0.6, x: -1, y: -0.2 },
];

/** The exit: a ticket punch knocks the ✻ out of `✻ Worked for 1m 15s` and it lands on the pile. */
function ExitHome() {
  return (
    <div style={FILL}>
      <ContextBar zones={HOME_ZONES} />
      <CompletionLine
        className="type-label"
        style={{
          position: "absolute",
          left: HOME.textX,
          top: HOME.spinnerY,
          transform: "translateY(-50%)",
        }}
        pastVerb="Worked"
        duration="1m 15s"
        at={T10.exit.lineAt}
      />
      <Layer
        className="km-ticket-hole"
        style={{ left: STAR.x, top: STAR.y, width: 40, height: 40, background: "var(--bg)" }}
        write={(el, frame) => {
          const k = springFrom(frame.tau, T10.exit.punchAt, SPRINGS.SNAP);
          put(el, "transform", `translate(-50%, -50%) scale(${num(k, 3)})`);
        }}
      />
      <PromptBox style={{ position: "absolute", left: HOME.left, top: HOME.promptTop }} />
      <Pile count={pileCount} x={HOME.pileX} y={HOME.pileY} />
      <Layer
        className="tui-tile"
        style={{ width: TILE, height: TILE, position: "absolute", left: 0, top: 0 }}
        write={(el, frame) => {
          const u = chipFlight(frame.tau);
          const shown = frame.tau >= T10.exit.punchAt + 0.04 && u < 1;
          put(el, "visibility", shown ? "visible" : "hidden");
          const p = chipPoint(u, STAR, PILE_TOP);
          put(
            el,
            "transform",
            `translate3d(${num(p.x - TILE / 2, 1)}px, ${num(p.y - TILE / 2, 1)}px, 0) rotate(${num(u * 340 + SLOT.rotate * u, 1)}deg)`,
          );
        }}
      >
        <svg viewBox="0 0 100 100">
          <path d={GLYPH_PATHS["✳"]} fill="currentColor" />
        </svg>
      </Layer>
      <div
        style={{
          position: "absolute",
          left: BOT_HOME.left,
          top: BOT_HOME.top,
          width: BOT_HOME.width,
          height: BOT_HOME.height,
        }}
      >
        <StageMascot acts={EXIT_ACTS} title="the bot" />
      </div>
    </div>
  );
}

export default function Tip10OffersSegment() {
  return (
    <During from={T10.start} to={T10.end}>
      <BoneSwap wipes={WIPES}>
        <ScrollbackWhip at={T10.exit.whipAt} dur={T10.exit.whipDur} distance={1080}>
          <During from={T10.start - 1} to={BOARD_FROM}>
            <ResetsPlate />
          </During>
          <During from={BOARD_FROM} to={HOME_FROM}>
            <OffersBoard />
          </During>
          <During from={HOME_FROM} to={Number.POSITIVE_INFINITY}>
            <ExitHome />
          </During>
          <div style={{ ...FILL, transform: "translateY(-1080px)" }}>
            <HomeRest pile={10} from={T10.exit.whipAt} to={Number.POSITIVE_INFINITY} />
          </div>
        </ScrollbackWhip>
      </BoneSwap>
    </During>
  );
}
