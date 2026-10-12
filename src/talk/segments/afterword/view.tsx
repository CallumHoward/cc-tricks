import "./afterword.css";
import type { ReactNode } from "react";

import { sampleKeys } from "#/engine/motion/track";
import type { Frame } from "#/engine/types";
import { WeeklyBars } from "#/talk/kit/data/weekly-bars";
import { RuleRise } from "#/talk/kit/motion";
import { GLYPH_PATHS, HOME, punch, ScrollbackWhip, SpinnerLine } from "#/talk/kit/tui";
import { setStyle, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import { drawMascot } from "#/talk/mascot/draw";
import { MascotSvg } from "#/talk/mascot/mascot";
import { restPose } from "#/talk/mascot/pose";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { scriptFor } from "#/talk/script";
import { HomeRest } from "#/talk/segments/shared/home";

import {
  AFT,
  BARS,
  BOT_ACTS,
  BOT_WIDTH,
  BOT_X,
  captionWords,
  POSTER,
  POSTER_ROTATE,
  posterCurl,
  posterLift,
  WEEKLY,
} from "./tracks";

const limits = scriptFor("aft-limits");
const wanted = scriptFor("aft-wanted");
const CAPTION = (limits.lines[0] ?? "").split(" ");
const SILHOUETTE = drawMascot(restPose(), 0, { boil: 0, silhouette: "#141413" });
const ALWAYS = { from: 0, to: 1e9 };

function Screen({ y, children }: { y: number; children: ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${y}px)` }}>
      {children}
    </div>
  );
}

/** The home shot with no `❯` this time: the spinner simply reads `Ebbing…`. */
function Terminal() {
  return (
    <>
      <HomeRest pile={10} {...ALWAYS} />
      <SpinnerLine
        className="type-label"
        style={{
          position: "absolute",
          left: HOME.textX,
          top: HOME.spinnerY,
          transform: "translateY(-50%)",
        }}
        verb="Ebbing"
        at={AFT.spinnerAt}
        tokens={2900}
      />
    </>
  );
}

function Caption() {
  const ref = useFrameRef<HTMLParagraphElement>((root: HTMLParagraphElement, frame: Frame) => {
    const n = captionWords(frame.tau, CAPTION.length);
    const words = root.children;
    for (let i = 0; i < words.length; i++)
      setStyle(words[i], "visibility", i < n ? "visible" : "hidden");
  });
  return (
    <p
      ref={ref}
      className="fin-caption fin-abs type-body"
      style={{ left: BARS.left, top: 720, width: 1240 }}
    >
      {CAPTION.map((word, i) => (
        // oxlint-disable-next-line react/no-array-index-key -- words of a fixed sentence
        <span key={i}>{word}</span>
      ))}
    </p>
  );
}

function SqueezedBot() {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    setStyle(root, "transform", `translate3d(${sampleKeys(BOT_X, frame.tau).toFixed(2)}px, 0, 0)`);
    setStyle(
      root.firstElementChild,
      "transform",
      `scaleX(${sampleKeys(BOT_WIDTH, frame.tau).toFixed(4)})`,
    );
  });
  return (
    <div
      ref={ref}
      className="fin-abs"
      style={{ left: 0, top: BARS.trackBottom - 180, width: 240, height: 200 }}
    >
      <div className="fin-bot" style={{ width: 240, height: 200 }}>
        <StageMascot acts={BOT_ACTS} title="the bot" />
      </div>
    </div>
  );
}

function Pin() {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const u = Math.min(1, Math.max(0, (frame.tau - AFT.pinAt) / (AFT.pinLand - AFT.pinAt)));
    const scale = frame.tau < AFT.pinAt ? 0 : 1 + 1.6 * (1 - u) ** 3;
    const glint = 6 * Math.sin(frame.w * 1.3);
    setStyle(root, "transform", `scale(${scale.toFixed(4)}) rotate(${glint.toFixed(2)}deg)`);
  });
  return (
    <div ref={ref} className="fin-pin fin-abs" aria-hidden>
      <svg viewBox="0 0 100 100">
        <path d={GLYPH_PATHS["✳"]} fill="currentColor" />
      </svg>
    </div>
  );
}

/** SIGHTINGS WANTED: a hard cut, pinned with a ✳, its bottom corner still curling down. */
function Poster() {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const { tau } = frame;
    const shown = tau >= AFT.cut && tau < AFT.yank + AFT.yankDur;
    setStyle(root, "visibility", shown ? "visible" : "hidden");
    if (!shown) return;
    const slam = 1 + 0.05 * punch(tau, frame.v, AFT.cut, 0.3);
    const rotate = sampleKeys(POSTER_ROTATE, tau);
    setStyle(
      root,
      "transform",
      `translate3d(0, ${posterLift(tau).toFixed(2)}px, 0) rotate(${rotate.toFixed(3)}deg) scale(${slam.toFixed(4)})`,
    );
    const c = posterCurl(tau).toFixed(1);
    const sheet = root.firstElementChild;
    setStyle(
      sheet,
      "clip-path",
      `polygon(-40px -60px, calc(100% + 40px) -60px, calc(100% + 40px) calc(100% - ${c}px), calc(100% - ${c}px) 100%, -40px 100%)`,
    );
    const fold = root.querySelector<HTMLElement>(".fin-fold");
    setStyle(fold, "width", `${c}px`);
    setStyle(fold, "height", `${c}px`);
  });
  return (
    <div
      ref={ref}
      className="fin-poster-hang fin-abs"
      style={{ ...POSTER, visibility: "hidden" }}
      data-testid="sightings-poster"
    >
      <div className="fin-poster">
        <div className="fin-poster-head type-label">{wanted.kicker}</div>
        <div className="fin-poster-rules" />
        <div className="fin-poster-figure">
          <MascotSvg drawing={SILHOUETTE} title="the bot, last seen" />
        </div>
        <div className="fin-poster-h">
          <RuleRise
            text={"On the 5.5 models,\nI'm nowhere near\nmy quota."}
            settleBy={AFT.posterTextBy - 0.3}
            rule={false}
          />
        </div>
        <RuleRise
          className="type-body fin-poster-l1"
          text={"Still hitting yours with these tips?\nTeach me how."}
          settleBy={AFT.posterTextBy}
          rule={false}
        />
        <div className="fin-fold fin-abs" />
      </div>
      <Pin />
    </div>
  );
}

/** Aft-limits → aft-wanted: the weekly bars at 88% / 95%, the bot as a sliver, then the poster. */
function LimitsPlate() {
  return (
    <>
      <div className="fin-abs fin-kicker" style={{ left: BARS.left, top: 236 }}>
        <RuleRise
          text={limits.kicker ?? "Afterword"}
          settleBy={AFT.kickerBy}
          className="type-label"
        />
      </div>
      <WeeklyBars
        className="fin-weekly"
        bars={WEEKLY}
        width={BARS.width}
        style={{ position: "absolute", left: BARS.left, top: BARS.top }}
      />
      <Caption />
      <SqueezedBot />
      <Poster />
    </>
  );
}

/** Kit parts set `visibility: visible` on their own nodes, so the window is enforced with display. */
function Window({ children }: { children: ReactNode }) {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    setStyle(root, "display", frame.tau >= AFT.start && frame.tau < AFT.end ? "block" : "none");
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      {children}
    </div>
  );
}

export default function AfterwordSegment() {
  return (
    <Window>
      <ScrollbackWhip at={AFT.whipIn} dur={AFT.whipDur} distance={-1080}>
        <Terminal />
        <Screen y={1080}>
          <ScrollbackWhip at={AFT.whipOut} dur={0.55} distance={1080}>
            <LimitsPlate />
            <Screen y={-1080}>
              <HomeRest pile={10} {...ALWAYS} />
            </Screen>
          </ScrollbackWhip>
        </Screen>
      </ScrollbackWhip>
    </Window>
  );
}
