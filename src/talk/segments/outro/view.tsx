import "./outro.css";
import type { ReactNode } from "react";

import { sampleKeys } from "#/engine/motion/track";
import type { Frame } from "#/engine/types";
import { qrModules } from "#/talk/kit/data/logic";
import { QrGrow } from "#/talk/kit/data/qr-grow";
import { ExtLink } from "#/talk/kit/ext-link";
import { ContextBar, World } from "#/talk/kit/motion";
import { GLYPH_PATHS, punch, ScrollbackRecap, StaticGlyph } from "#/talk/kit/tui";
import { charLength, typedChars } from "#/talk/kit/tui/tui-math";
import { setStyle, setText, typeClip, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { scriptFor } from "#/talk/script";
import { HomeRest } from "#/talk/segments/shared/home";
import { SHOWNOTES_URL } from "#/talk/shownotes-url";

import {
  BAR,
  BAR_KEYS,
  barWidthAt,
  BOT_ACTS,
  BOT_X,
  botLift,
  CRANE,
  cookedText,
  homeCrane,
  elapsedSeconds,
  landing,
  OUT,
  plateRules,
  plateCrane,
  plateFed,
  LABEL,
  labelLift,
  QR,
  SCROLLBACK,
  SHORT_ZONES,
  tileAt,
} from "./tracks";

const qr = scriptFor("outro-qr");
const BAR_POSE = { pitch: 0, height: BAR.height, labels: 0, scroll: 0 };
const ALWAYS = { from: 0, to: 1e9 };

function Gate({
  from = -1e9,
  to = 1e9,
  children,
}: {
  from?: number;
  to?: number;
  children: ReactNode;
}) {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    setStyle(root, "display", frame.tau >= from && frame.tau < to ? "block" : "none");
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      {children}
    </div>
  );
}

/** A vertical crane layer: `offset` px plus the crane's eased travel and dolly scale. */
function Crane({
  offset,
  track,
  children,
}: {
  offset: number;
  track: (tau: number) => { y: number; scale: number };
  children: ReactNode;
}) {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const { y, scale } = track(frame.tau);
    setStyle(
      root,
      "transform",
      `scale(${scale.toFixed(5)}) translate3d(0, ${(offset + y).toFixed(2)}px, 0)`,
    );
  });
  return (
    <div ref={ref} className="fin-layer">
      {children}
    </div>
  );
}

function Screen({ y, children }: { y: number; children: ReactNode }) {
  return (
    <div className="fin-layer" style={{ transform: `translateY(${y}px)` }}>
      {children}
    </div>
  );
}

/** Home shot → the camera cranes up the scrollback and every completion line passes in order. */
function Recap() {
  return (
    <Crane offset={0} track={homeCrane}>
      <HomeRest pile={10} {...ALWAYS} />
      <Screen y={-1080}>
        <ScrollbackRecap lines={SCROLLBACK} at={OUT.recapAt} dur={OUT.recapDur} x={200} y={540} />
      </Screen>
    </Crane>
  );
}

function PlateRules() {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const shown = frame.tau >= OUT.collapseTo;
    setStyle(root, "visibility", shown ? "visible" : "hidden");
    if (!shown) return;
    const { top, bottom } = plateRules(frame.tau, barWidthAt(OUT.collapseTo));
    const [a, b] = root.children;
    for (const [el, r] of [
      [a, top],
      [b, bottom],
    ] as const)
      setStyle(
        el,
        "transform",
        `translate3d(${r.x.toFixed(2)}px, ${r.y.toFixed(2)}px, 0) scaleX(${r.w.toFixed(2)})`,
      );
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, visibility: "hidden" }}>
      <div className="fin-rule" />
      <div className="fin-rule" />
    </div>
  );
}

function CookedLine() {
  const template = qr.ui[0] ?? "";
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const text = cookedText(template, elapsedSeconds(frame.w));
    setText(root.querySelector(".fin-cooked-text"), ` ${text}`);
    const total = 2 + charLength(text);
    const typed = typedChars(frame.tau, OUT.cookedAt, 60, total);
    setStyle(root, "clip-path", typed === 0 ? "inset(0 100% 0 0)" : typeClip(typed, total));
  });
  return (
    <div
      ref={ref}
      className="tui tui-line type-code fin-cooked"
      style={{ left: 200, top: 232, clipPath: "inset(0 100% 0 0)" }}
      data-tui-replica
    >
      <span className="tui-clay">
        <StaticGlyph glyph="✻" />
      </span>
      <span className="fin-cooked-text" />
    </div>
  );
}

/** The show notes link: words rise through a mask one by one beside the QR. */
function ShownotesLink() {
  const words = (qr.lines[0] ?? "").split(" ");
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    setStyle(root, "visibility", frame.tau >= OUT.labelAt ? "visible" : "hidden");
    const spans = root.querySelectorAll(".fin-mask > span");
    for (let i = 0; i < spans.length; i++) {
      const lift = labelLift(frame.tau, i);
      setStyle(spans[i], "visibility", lift < 0.999 ? "visible" : "hidden");
      setStyle(spans[i], "transform", `translate3d(0, ${(lift * 110).toFixed(2)}%, 0)`);
    }
  });
  return (
    <div
      ref={ref}
      className="fin-abs"
      style={{ left: LABEL.left, top: LABEL.top, visibility: "hidden" }}
    >
      <ExtLink href={SHOWNOTES_URL} className="fin-link type-body">
        <span className="fin-link-words">
          {words.map((word, i) => (
            // oxlint-disable-next-line react/no-array-index-key -- words of a fixed line
            <span key={i} className="fin-mask">
              <span>{word}</span>
            </span>
          ))}
        </span>
      </ExtLink>
    </div>
  );
}

function Tiles({ value }: { value: string }) {
  const { size: n, modules } = qrModules(value);
  const held = modules.slice(-10);
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    for (let i = 0; i < root.children.length; i++) {
      const el = root.children[i];
      const t = tileAt(i, frame.tau, held, n);
      setStyle(el, "visibility", t.visible ? "visible" : "hidden");
      if (!t.visible) continue;
      const scale = (t.size / 34) * (1 + 0.45 * punch(frame.tau, frame.v, landing(i), 0.16));
      setStyle(
        el,
        "transform",
        `translate3d(${(t.x - 17).toFixed(2)}px, ${(t.y - 17).toFixed(2)}px, 0) rotate(${t.rotate.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
      );
      const [clay, ink] = el.children;
      setStyle(clay, "transform", `scale(${(1 - t.ink).toFixed(3)})`);
      setStyle(ink, "transform", `scale(${t.ink.toFixed(3)})`);
    }
  });
  return (
    <div ref={ref} aria-hidden>
      {held.map((m) => (
        <div key={`${m.x}:${m.y}`} className="fin-tile">
          <div className="tui-tile" style={{ width: 34, height: 34 }}>
            <svg viewBox="0 0 100 100">
              <path d={GLYPH_PATHS["✳"]} fill="currentColor" />
            </svg>
          </div>
          <div className="fin-tile-ink" />
        </div>
      ))}
    </div>
  );
}

/** The QR card feeds out row by row with the print, like terminal output. */
function QrPlate({ value }: { value: string }) {
  const { size: n } = qrModules(value);
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const fed = plateFed(frame.tau, n);
    setStyle(root, "visibility", fed > 0 ? "visible" : "hidden");
    const clip =
      fed >= QR.size ? "none" : `inset(-80px -80px ${(QR.size - fed).toFixed(1)}px -80px)`;
    if (fed > 0) setStyle(root, "clip-path", clip);
  });
  return (
    <div
      ref={ref}
      className="fin-abs fin-qr"
      style={{ left: QR.left, top: QR.top, visibility: "hidden" }}
    >
      <QrGrow value={value} start={OUT.qrFrom} end={OUT.qrTo} size={QR.size} holdBack={10} />
    </div>
  );
}

function PlateBot() {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const x = sampleKeys(BOT_X, frame.tau);
    setStyle(
      root,
      "transform",
      `translate3d(${x.toFixed(2)}px, ${botLift(frame.tau).toFixed(2)}px, 0)`,
    );
  });
  return (
    <div ref={ref} className="fin-abs" style={{ left: 0, top: 0, width: 240, height: 200 }}>
      <StageMascot acts={BOT_ACTS} title="the bot" />
    </div>
  );
}

/** Outro-thesis → outro-qr: the short clean bar, then the prompt box becomes the QR plate. */
function Plate() {
  const value = SHOWNOTES_URL;
  return (
    <World camera={CRANE} smear={false}>
      <Gate to={OUT.collapseTo}>
        <div
          className="fin-ghost-bar"
          style={{ left: BAR.x, top: BAR.y - BAR.height, width: 1216, height: BAR.height }}
        />
        <ContextBar
          zones={SHORT_ZONES}
          x={BAR.x}
          y={BAR.y}
          width={BAR.width}
          capacity={BAR.capacity}
          pose={BAR_POSE}
          keys={BAR_KEYS}
        />
      </Gate>
      <PlateRules />
      <CookedLine />
      <QrPlate value={value} />
      <PlateBot />
      <Tiles value={value} />
      <ShownotesLink />
    </World>
  );
}

export default function OutroSegment() {
  return (
    <Gate from={OUT.start} to={OUT.end + 1}>
      <div className="km-tone fin-layer">
        <Gate to={OUT.wipeFrom + OUT.wipeDur}>
          <Crane offset={0} track={plateCrane}>
            <Recap />
          </Crane>
        </Gate>
        <Gate from={OUT.wipeFrom}>
          <Crane offset={-1080} track={plateCrane}>
            <Plate />
          </Crane>
        </Gate>
      </div>
    </Gate>
  );
}
