import { SPRINGS } from "#/engine/motion/spring";
import { ContextBar } from "#/talk/kit/motion";
import { num, put } from "#/talk/kit/motion/dom";
import { springFrom } from "#/talk/kit/motion/schedule";
import { CompletionLine, GLYPH_PATHS, HOME, Pile, pileSlot, PromptBox } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { BOT_HOME, HOME_ZONES, HomeRest } from "#/talk/segments/shared/home";
import { During, FILL, Layer, RisingLine } from "#/talk/segments/tip-09-suggestions/parts";
import { COMPLETION_LINE_STYLE } from "#/talk/segments/tip-09-suggestions/tracks";

import { OffersBoard } from "./offers";
import { ResetsPlate } from "./resets";
import { chipFlight, chipPoint, homeIn, pileCount, punchedLineRise, T10 } from "./tracks";

const TILE = 34;
/** The completion line's ✻ (two label cells at the line's start). */
const STAR = { x: HOME.textX + 18, y: HOME.spinnerY };
const SLOT = pileSlot(9, TILE);
const PILE_TOP = { x: HOME.pileX + SLOT.x, y: HOME.pileY + SLOT.y };

/** The board mounts as the resets plate starts to leave, and stays until its tickets have gone. */
const BOARD_FROM = T10.resetsOut.start;
const RESETS_TO = T10.resetsOut.end + 0.05;
const HOME_FROM = T10.exit.homeIn.start;
const BOARD_TO = T10.exit.ticketsOutAt + 3 * T10.exit.ticketOutGap + T10.exit.ticketOutRun + 0.05;
/** The shared home shot takes over once the completion line has risen away. */
const REST_FROM = T10.exit.riseAt + T10.exit.riseDur;

const EXIT_ACTS: readonly Act[] = [
  { kind: "look", at: T10.exit.punchAt, dur: 0.35, x: -1, y: -0.2 },
];

/** The completion line with its ✻ punched out, gliding up and away as the scrollback moves on. */
function PunchedLine() {
  return (
    <RisingLine rise={punchedLineRise}>
      <CompletionLine
        className="type-label"
        style={COMPLETION_LINE_STYLE}
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
    </RisingLine>
  );
}

/**
 * The exit: the home chrome cranes back up, a ticket punch knocks the ✻ out of `✻ Worked for 1m
 * 15s` and it lands on the pile.
 */
function ExitHome() {
  return (
    <Layer
      style={FILL}
      write={(el, frame) => {
        const u = homeIn(frame.tau);
        put(el, "transform", `translate3d(0, ${num(320 * u, 2)}px, 0)`);
        put(el, "opacity", num(1 - u, 3));
      }}
    >
      <ContextBar zones={HOME_ZONES} />
      <PunchedLine />
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
    </Layer>
  );
}

export default function Tip10OffersSegment() {
  return (
    <During from={T10.start} to={T10.end}>
      <During from={T10.start - 1} to={RESETS_TO}>
        <ResetsPlate />
      </During>
      <During from={BOARD_FROM} to={BOARD_TO}>
        <OffersBoard />
      </During>
      <During from={HOME_FROM} to={REST_FROM}>
        <ExitHome />
      </During>
      <HomeRest pile={10} from={REST_FROM} to={Number.POSITIVE_INFINITY} />
    </During>
  );
}
