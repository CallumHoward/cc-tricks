import "./afterword.css";
import type { ReactNode } from "react";

import { sampleKeys } from "#/engine/motion/track";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { World } from "#/talk/kit/motion";
import { HOME, SpinnerLine } from "#/talk/kit/tui";
import { setStyle, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { scriptFor } from "#/talk/script";
import { HomeRest } from "#/talk/segments/shared/home";

import {
  AFT,
  BOT_ACTS,
  BOT_SCALE,
  BOT_STAND,
  BOT_X,
  CARD,
  CARD_HEIGHT,
  CARD_SCALE,
  CARD_TILT,
  columnScale,
  columnY,
  EMBER_COUNT,
  emberAt,
  FABLE,
  glowReveal,
  letterAt,
  limitsCamera,
  SHOT,
} from "./tracks";

const limits = scriptFor("aft-limits");
const TITLE = Array.from(limits.kicker ?? "Afterword");
const ALWAYS = { from: 0, to: 1e9 };

function Screen({ y, children }: { y: number; children: ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${y}px)` }}>
      {children}
    </div>
  );
}

/** The home shot with no `❯` this time: the spinner simply reads `Ebbing…`, gone by the return. */
function Terminal() {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    setStyle(root, "display", frame.tau < AFT.craneIn + AFT.craneDur ? "block" : "none");
  });
  return (
    <>
      <HomeRest pile={10} {...ALWAYS} />
      <div ref={ref}>
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
      </div>
    </>
  );
}

/** "Afterword", letter by letter: each rises through a mask while the tracking closes up. */
function Title() {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const letters = root.children;
    for (let i = 0; i < letters.length; i++) {
      const { lift, spread } = letterAt(frame.tau, i);
      setStyle(
        letters[i],
        "transform",
        `translate3d(${(i * spread).toFixed(2)}px, ${(lift * 110).toFixed(2)}%, 0)`,
      );
    }
  });
  return (
    <div ref={ref} className="aft-title type-headline" aria-label={TITLE.join("")}>
      {TITLE.map((ch, i) => (
        // oxlint-disable-next-line react/no-array-index-key -- letters of a fixed word
        <span key={i} aria-hidden>
          {ch}
        </span>
      ))}
    </div>
  );
}

/** The Fable row lights up: a glow outline sweeps on and the rest of the card dims. */
function FableGlow() {
  const row = FABLE.row;
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const u = glowReveal(frame.tau);
    setStyle(root, "visibility", u > 0 ? "visible" : "hidden");
    setStyle(root, "clip-path", `inset(-40px ${((1 - u) * 100).toFixed(2)}% -40px -40px)`);
    const breathe = 0.5 + 0.5 * Math.sin(ambientTime(frame) * 1.6);
    setStyle(root, "--aft-glow", (0.55 + 0.45 * breathe).toFixed(3));
    setStyle(root.parentElement?.querySelector(".aft-dim"), "opacity", (u * 0.55).toFixed(3));
  });
  return (
    <>
      <div className="aft-dim" style={{ opacity: 0, clipPath: dimHole(row) }} aria-hidden />
      <div
        ref={ref}
        className="aft-glow"
        style={{
          left: row.x * CARD_SCALE,
          top: row.y * CARD_SCALE,
          width: row.w * CARD_SCALE,
          height: row.h * CARD_SCALE,
          visibility: "hidden",
        }}
        aria-hidden
      />
    </>
  );
}

/** Everything on the card except the Fable row (an evenodd hole). */
function dimHole(row: { x: number; y: number; w: number; h: number }): string {
  const [x0, y0] = [row.x * CARD_SCALE, row.y * CARD_SCALE];
  const [x1, y1] = [x0 + row.w * CARD_SCALE, y0 + row.h * CARD_SCALE];
  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x0}px ${y0}px, ${x0}px ${y1}px, ${x1}px ${y1}px, ${x1}px ${y0}px, ${x0}px ${y0}px)`;
}

/** The real weekly-limits screenshot on a floating card that arrives tipped back and lies flat. */
function LimitsCard() {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const tilt = sampleKeys(CARD_TILT, frame.tau);
    setStyle(root, "transform", `rotateX(${tilt.toFixed(3)}deg)`);
  });
  return (
    <div
      className="aft-persp"
      style={{ left: CARD.left, top: CARD.top, width: CARD.width, height: CARD_HEIGHT }}
    >
      <div ref={ref} className="aft-card">
        <img
          src={SHOT.src}
          width={CARD.width}
          height={CARD_HEIGHT}
          alt="Weekly limits: All models 88% used, Fable 95% used, both reset in 6 min"
          draggable={false}
        />
        <FableGlow />
      </div>
    </div>
  );
}

/** Point lights drifting up off the 95% fill end on ambient time: still rising at the stop. */
function Embers() {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const a = ambientTime(frame);
    for (let i = 0; i < root.children.length; i++) {
      const e = emberAt(i, a, frame.tau);
      const el = root.children[i];
      setStyle(
        el,
        "transform",
        `translate3d(${e.x.toFixed(2)}px, ${e.y.toFixed(2)}px, 0) scale(${e.size.toFixed(3)})`,
      );
      setStyle(el, "opacity", e.alpha.toFixed(3));
    }
  });
  return (
    <div ref={ref} aria-hidden>
      {Array.from({ length: EMBER_COUNT }, (_, i) => (
        <div key={i} className="aft-ember" style={{ opacity: 0 }} />
      ))}
    </div>
  );
}

function BarBot() {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const shown = frame.tau >= AFT.walkFrom - 0.25;
    setStyle(root, "visibility", shown ? "visible" : "hidden");
    setStyle(root, "transform", `translate3d(${sampleKeys(BOT_X, frame.tau).toFixed(2)}px, 0, 0)`);
  });
  return (
    <div
      ref={ref}
      className="aft-abs"
      style={{ left: 0, top: BOT_STAND.ground - 180, width: 240, height: 200 }}
    >
      <div className="aft-bot" style={{ transform: `scale(${BOT_SCALE})` }}>
        <StageMascot acts={BOT_ACTS} title="the bot" />
      </div>
    </div>
  );
}

/** Aft-limits → aft-wanted: the real screenshot, the Fable row lit, then a slow push into it. */
function LimitsPlate() {
  return (
    <World camera={limitsCamera} smear={false}>
      <Title />
      <LimitsCard />
      <Embers />
      <BarBot />
    </World>
  );
}

/** Cranes down from the terminal to the card and back up again: eased, no blur. */
function Column({ children }: { children: ReactNode }) {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    setStyle(root, "transform", `scale(${columnScale(frame.tau).toFixed(5)})`);
    setStyle(
      root.firstElementChild,
      "transform",
      `translate3d(0, ${columnY(frame.tau).toFixed(2)}px, 0)`,
    );
  });
  return (
    <div ref={ref} className="aft-column">
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    </div>
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
      <Column>
        <Terminal />
        <Screen y={1080}>
          <LimitsPlate />
        </Screen>
      </Column>
    </Window>
  );
}
