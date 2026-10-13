import { outCubic, prog } from "#/engine/motion/ease";
import { keys } from "#/engine/motion/track";
import { ambientTime } from "#/engine/stage/stage";
import { ExtLink } from "#/talk/kit/ext-link";
import { ContextBar } from "#/talk/kit/motion";
import { attr, num, put } from "#/talk/kit/motion/dom";
import { HOME, Pile, PromptBox, ReturnGlyph, SpinnerLine } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { scriptFor } from "#/talk/script";
import { BOT_HOME, HOME_ZONES } from "#/talk/segments/shared/home";
import { TipTitle } from "#/talk/segments/shared/tip-title";
import { useDecoded } from "#/talk/segments/shared/use-decoded";
import { During, Echo, FILL, Layer } from "#/talk/segments/tip-09-suggestions/parts";
import { riseStart, sinkAt } from "#/talk/segments/tip-09-suggestions/tracks";

import "./resets.css";

import {
  CARD,
  chromeOut,
  diveAt,
  loop,
  mixRect,
  pileCount,
  pileHop,
  resetsOut,
  resetsScrollY,
  ROW_PX,
  shotCam,
  SHOT,
  T10,
  type Rect,
} from "./tracks";

const SCRIPT = scriptFor("t10-resets");
const TITLE = SCRIPT.headline ?? T10.prompt;
const [FULL_RESET = "", , RESET_FOR_FREE = ""] = SCRIPT.ui;
/** The limit-reset article the show notes link for tip 10. */
const LIMIT_RESET_URL = "https://support.claude.com/en/articles/17007452-what-is-a-limit-reset";
/** The echo and spinner sink out of the transcript as the title rises over them. */
const CLEAR_AT = riseStart(TITLE, T10.titleSettle) - 0.4;

const CH = 20.4;
/** The ⏎ that pops after the typed prompt (prompt text origin + text + 0.6 ch margin). */
const RETURN: Rect = {
  x: HOME.left + 40 + 2 * CH + T10.prompt.length * CH + 0.6 * CH,
  y: HOME.promptTop + 40,
  w: CH,
  h: 40,
};

/** The bot and the pile hop up onto the card's top edge, right of the title. */
const BOT_SPOT = { left: 1470, top: CARD.y - 182 };
const PILE_SPOT = { x: 1375, y: CARD.y };

const RESETS_BOT_ACTS: readonly Act[] = [
  { kind: "look", at: T10.diveAt, dur: 1, x: -0.8, y: 0.6 },
  { kind: "hop", at: T10.botHopAt, height: 70 },
  { kind: "point", at: T10.highlightAt + 0.2, dur: 3.6, angle: 40, side: "L" },
];

const PERIMETER = 2 * (ROW_PX.w + ROW_PX.h);

/**
 * The Full reset row lit up: everything else dims, a clay outline draws on and a point of light
 * keeps orbiting it on ambient time. The row is the link to the limit-reset article.
 */
function RowHighlight() {
  return (
    <Layer
      style={{
        position: "absolute",
        left: ROW_PX.x,
        top: ROW_PX.y,
        width: ROW_PX.w,
        height: ROW_PX.h,
        borderRadius: 14,
      }}
      write={(el, frame) => {
        const u = prog(frame.tau, T10.highlightAt, T10.highlightAt + T10.highlightDur, outCubic);
        put(el, "visibility", u > 0 ? "visible" : "hidden");
        put(el, "box-shadow", `0 0 0 3000px rgb(12 12 11 / ${num(0.58 * u, 3)})`);
        const [outline, orbit] = el.querySelectorAll("rect");
        attr(outline, "stroke-dashoffset", num(PERIMETER * (1 - u), 1));
        const lap = loop(ambientTime(frame), 3.2);
        attr(orbit, "stroke-dashoffset", num(-PERIMETER * lap, 1));
        put(orbit, "opacity", num(u, 3));
      }}
    >
      <ExtLink
        href={LIMIT_RESET_URL}
        style={{ position: "absolute", inset: 0, display: "block", borderRadius: 14 }}
      >
        <span className="t10-sr">{`${FULL_RESET} · ${RESET_FOR_FREE}`}</span>
      </ExtLink>
      <svg
        aria-hidden
        width={ROW_PX.w}
        height={ROW_PX.h}
        style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
      >
        <rect
          x={0}
          y={0}
          width={ROW_PX.w}
          height={ROW_PX.h}
          rx={14}
          fill="none"
          stroke="var(--clay)"
          strokeWidth={3}
          strokeDasharray={PERIMETER}
          style={{ filter: "drop-shadow(0 0 10px rgb(217 119 87 / 70%))" }}
        />
        <rect
          x={0}
          y={0}
          width={ROW_PX.w}
          height={ROW_PX.h}
          rx={14}
          fill="none"
          stroke="#fff4ec"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`90 ${PERIMETER - 90}`}
          style={{ filter: "drop-shadow(0 0 12px #eb9f7f) drop-shadow(0 0 26px #d97757)" }}
        />
      </svg>
    </Layer>
  );
}

/**
 * Settings › Usage, the real screenshot: it opens out of the ⏎, then the camera pushes in onto the
 * Full reset row while the frame widens into a letterbox under the title.
 */
function UsageShot() {
  useDecoded(SHOT.src);
  return (
    <div style={{ ...FILL, filter: "drop-shadow(0 30px 60px rgb(0 0 0 / 45%))" }}>
      <Layer
        style={{ ...FILL, background: "#1a1a19" }}
        write={(el, frame) => {
          const u = diveAt(frame.tau);
          put(el, "visibility", u > 0 ? "visible" : "hidden");
          const { card, s, tx, ty, radius } = shotCam(frame.tau, RETURN);
          put(
            el,
            "clip-path",
            `inset(${num(card.y, 1)}px ${num(1920 - card.x - card.w, 1)}px ${num(1080 - card.y - card.h, 1)}px ${num(card.x, 1)}px round ${num(radius, 1)}px)`,
          );
          const shot = el.firstElementChild as HTMLElement | null;
          put(
            shot,
            "transform",
            `translate3d(${num(card.x + tx, 2)}px, ${num(card.y + ty, 2)}px, 0) scale(${num(s, 4)})`,
          );
          const flash = el.lastElementChild as HTMLElement | null;
          put(flash, "opacity", num(Math.max(0, 1 - u * 1.6), 3));
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SHOT.w,
            height: SHOT.h,
            transformOrigin: "0 0",
          }}
        >
          <img
            src={SHOT.src}
            alt="Claude settings, Usage: Full reset, expires Oct 23, with a Reset for free button"
            width={SHOT.w}
            height={SHOT.h}
            draggable={false}
            style={{ display: "block" }}
          />
          <RowHighlight />
        </div>
        <div style={{ ...FILL, background: "var(--clay)", pointerEvents: "none" }} />
      </Layer>
    </div>
  );
}

/** The clay ⏎ that dives open into the window. */
function DiveGlyph() {
  return (
    <Layer
      style={{ position: "absolute", left: 0, top: 0, width: RETURN.w, height: RETURN.h * 2 }}
      write={(el, frame) => {
        const u = diveAt(frame.tau);
        const shown = frame.tau >= T10.submitAt && u < 0.7;
        put(el, "visibility", shown ? "visible" : "hidden");
        const r = mixRect(RETURN, shotCam(T10.diveAt + T10.diveDur, RETURN).card, u);
        const s = 1 + 9 * u;
        put(
          el,
          "transform",
          `translate3d(${num(r.x + r.w / 2 - RETURN.w / 2, 1)}px, ${num(r.y + r.h / 2 - RETURN.h, 1)}px, 0) scale(${num(s, 3)})`,
        );
        put(el, "opacity", num(1 - u / 0.7, 3));
      }}
    >
      <div className="tui type-code" style={{ color: "var(--clay)" }}>
        <ReturnGlyph />
      </div>
    </Layer>
  );
}

/** The home prompt box and context bar, sinking away as the window opens. */
function HomeChrome() {
  return (
    <During from={T10.start - 1} to={T10.diveAt + T10.chromeOutDur}>
      <Layer
        style={FILL}
        write={(el, frame) => {
          const u = chromeOut(frame.tau);
          put(el, "transform", `translate3d(0, ${num(260 * u, 2)}px, 0)`);
          put(el, "opacity", num(1 - u, 3));
        }}
      >
        <ContextBar zones={HOME_ZONES} />
        <PromptBox
          style={{ position: "absolute", left: HOME.left, top: HOME.promptTop }}
          text={T10.prompt}
          typeAt={T10.typeAt}
          cps={T10.cps}
          submitAt={T10.submitAt}
        />
      </Layer>
    </During>
  );
}

/** Stop 27: `10. Anthropic extra offers` dives through ⏎ into the real Settings › Usage page. */
export function ResetsPlate() {
  return (
    <Layer
      style={{ ...FILL, transformOrigin: "960px 600px" }}
      write={(el, frame) => {
        const u = resetsOut(frame.tau);
        put(
          el,
          "transform",
          `translate3d(0, ${num(-48 * u, 2)}px, 0) scale(${num(1 - 0.08 * u, 4)})`,
        );
        put(el, "opacity", num(1 - u, 3));
      }}
    >
      <HomeChrome />
      <Layer
        style={FILL}
        write={(el, frame) =>
          put(el, "transform", `translate3d(0, ${num(resetsScrollY(frame.tau), 2)}px, 0)`)
        }
      >
        <Echo
          text={T10.prompt}
          at={T10.submitAt + 0.2}
          outAt={CLEAR_AT}
          style={{ top: HOME.echoY, transform: "translateY(-50%)" }}
        />
        <div
          style={{
            position: "absolute",
            left: HOME.textX,
            top: HOME.spinnerY,
            transform: "translateY(-50%)",
            overflow: "hidden",
          }}
        >
          <Layer
            write={(el, frame) => {
              const y = sinkAt(frame.tau, CLEAR_AT + 0.08);
              put(el, "transform", `translate3d(0, ${num(y * 100, 2)}%, 0)`);
            }}
          >
            <SpinnerLine
              className="type-label"
              verb="Razzle-dazzling"
              at={T10.spinnerAt}
              tokens={keys([T10.spinnerAt, 0], [T10.resetsAt, 2600], [T10.resetsHoldEnd, 2900])}
              elapsed={keys([T10.spinnerAt, 0], [T10.resetsHoldEnd, 40])}
            />
          </Layer>
        </div>
      </Layer>
      <TipTitle text={TITLE} settleBy={T10.titleSettle} exit={T10.resetsHoldEnd} />
      <UsageShot />
      <DiveGlyph />
      <Layer
        style={{ ...FILL, zIndex: 2, pointerEvents: "none" }}
        write={(el, frame) => {
          const u = pileHop(frame.tau);
          const dx = (PILE_SPOT.x - HOME.pileX) * u;
          const dy = (PILE_SPOT.y - HOME.pileY) * u - 70 * Math.sin(Math.PI * u);
          put(el, "transform", `translate3d(${num(dx, 2)}px, ${num(dy, 2)}px, 0)`);
        }}
      >
        <Pile count={pileCount} x={HOME.pileX} y={HOME.pileY} />
      </Layer>
      <Layer
        style={{
          position: "absolute",
          left: BOT_HOME.left,
          top: BOT_HOME.top,
          width: BOT_HOME.width,
          height: BOT_HOME.height,
          zIndex: 2,
        }}
        write={(el, frame) => {
          const u = prog(frame.tau, T10.botHopAt + 0.16, T10.botHopAt + 0.58);
          const dx = (BOT_SPOT.left - BOT_HOME.left) * u;
          const dy = (BOT_SPOT.top - BOT_HOME.top) * u - 90 * Math.sin(Math.PI * u);
          put(el, "transform", `translate3d(${num(dx, 2)}px, ${num(dy, 2)}px, 0)`);
        }}
      >
        <StageMascot acts={RESETS_BOT_ACTS} title="the bot" />
      </Layer>
    </Layer>
  );
}
