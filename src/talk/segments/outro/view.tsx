import "./outro.css";
import type { ReactNode } from "react";

import { sampleKeys } from "#/engine/motion/track";
import type { Frame } from "#/engine/types";
import { qrModules } from "#/talk/kit/data/logic";
import { QrGrow } from "#/talk/kit/data/qr-grow";
import { BoneSwap, ContextBar, RuleRise, World } from "#/talk/kit/motion";
import {
  AgentRow,
  GLYPH_PATHS,
  ScrollbackRecap,
  ScrollbackWhip,
  StaticGlyph,
} from "#/talk/kit/tui";
import { charLength, typedChars } from "#/talk/kit/tui/tui-math";
import { setStyle, setText, typeClip, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { scriptFor } from "#/talk/script";
import { HomeRest } from "#/talk/segments/shared/home";
import { SHOWNOTES_URL, shownotesLabel } from "#/talk/shownotes-url";

import {
  BAR,
  BAR_KEYS,
  barWidthAt,
  BOT_ACTS,
  BOT_X,
  botLift,
  CRANE,
  cookedText,
  elapsedSeconds,
  OUT,
  plateRules,
  plateFed,
  QR,
  SCROLLBACK,
  SHORT_ZONES,
  thesisLines,
  tileAt,
} from "./tracks";

const thesis = scriptFor("outro-thesis");
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

function Screen({ y, children }: { y: number; children: ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${y}px)` }}>
      {children}
    </div>
  );
}

/** Home shot → the camera whips up the scrollback and every completion line flies past in order. */
function Recap() {
  return (
    <ScrollbackWhip at={OUT.whip} dur={OUT.whipDur} distance={1080}>
      <HomeRest pile={10} {...ALWAYS} />
      <Screen y={-1080}>
        <ScrollbackRecap lines={SCROLLBACK} at={OUT.recapAt} dur={OUT.recapDur} x={200} y={540} />
      </Screen>
    </ScrollbackWhip>
  );
}

function Thesis() {
  const [lead, emphasised] = thesisLines(thesis.headline ?? "", thesis.emphasis[0] ?? "");
  return (
    <div className="fin-thesis" style={{ left: 200, top: 300 }}>
      <RuleRise text={lead} settleBy={OUT.thesisBy - 0.15} exit={OUT.thesisExit} />
      <RuleRise
        text={emphasised}
        settleBy={OUT.thesisBy}
        exit={OUT.thesisExit + 0.05}
        className="type-headline fin-em"
      />
    </div>
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

function Words({
  text,
  at,
  end,
  className,
}: {
  text: string;
  at: number;
  end: number;
  className: string;
}) {
  const words = text.split(" ");
  const ref = useFrameRef<HTMLParagraphElement>((root: HTMLParagraphElement, frame: Frame) => {
    const n = Math.round(Math.min(1, Math.max(0, (frame.tau - at) / (end - at))) * words.length);
    for (let i = 0; i < root.children.length; i++)
      setStyle(root.children[i], "visibility", i < n ? "visible" : "hidden");
  });
  return (
    <p ref={ref} className={`fin-words ${className}`}>
      {words.map((word, i) => (
        // oxlint-disable-next-line react/no-array-index-key -- words of a fixed line
        <span key={i}>{word}</span>
      ))}
    </p>
  );
}

function Typed({
  text,
  at,
  className,
  children,
}: {
  text: string;
  at: number;
  className: string;
  children?: ReactNode;
}) {
  const total = charLength(text) + (children ? 1 : 0);
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const typed = typedChars(frame.tau, at, 60, total);
    setStyle(root, "clip-path", typed === 0 ? "inset(0 100% 0 0)" : typeClip(typed, total));
  });
  return (
    <div ref={ref} className={`tui ${className}`} style={{ clipPath: "inset(0 100% 0 0)" }}>
      {children}
      {text}
    </div>
  );
}

function References({ host }: { host: string }) {
  return (
    <div className="fin-refs" style={{ left: 820, top: 330 }}>
      <Words
        text={qr.lines[0] ?? ""}
        at={OUT.l1At}
        end={OUT.l1At + 0.45}
        className="type-body fin-ink"
      />
      <Typed text={host} at={OUT.urlAt} className="type-code fin-url" />
      <div className="fin-ref-list">
        {qr.refs.map((ref, i) => {
          const [title = ref.label, source] = ref.label.split(" · ");
          const at = OUT.refsAt + i * 0.2;
          return (
            <div key={ref.href} className="fin-ref">
              <AgentRow name={title} enterAt={at} style={{ width: 920 }} />
              {source ? (
                <Typed text={source} at={at + 0.25} className="type-label fin-ref-source">
                  <span className="tui-hook" />
                </Typed>
              ) : null}
            </div>
          );
        })}
      </div>
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
      setStyle(
        el,
        "transform",
        `translate3d(${(t.x - 17).toFixed(2)}px, ${(t.y - 17).toFixed(2)}px, 0) rotate(${t.rotate.toFixed(2)}deg) scale(${(t.size / 34).toFixed(4)})`,
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

/** The QR's ivory plate feeds out row by row with the print, like terminal output. */
function QrPlate({ value }: { value: string }) {
  const { size: n } = qrModules(value);
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const fed = plateFed(frame.tau, n);
    setStyle(root, "visibility", fed > 0 ? "visible" : "hidden");
    if (fed > 0) setStyle(root, "clip-path", `inset(0 0 ${(QR.size - fed).toFixed(1)}px 0)`);
  });
  return (
    <div ref={ref} className="fin-abs" style={{ left: QR.left, top: QR.top, visibility: "hidden" }}>
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

/** Outro-thesis → outro-qr: the short clean bar, then the prompt box as an ivory QR plate. */
function BonePlate() {
  const value = SHOWNOTES_URL;
  const host = shownotesLabel(value);
  return (
    <World camera={CRANE}>
      <Thesis />
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
      <References host={host} />
      <PlateBot />
      <Tiles value={value} />
    </World>
  );
}

export default function OutroSegment() {
  return (
    <Gate from={OUT.start} to={OUT.end + 1}>
      <BoneSwap
        initial="dark"
        wipes={[{ start: OUT.wipeFrom, end: OUT.wipeTo, to: "bone", angle: -12 }]}
      >
        <Gate to={OUT.swap}>
          <Recap />
        </Gate>
        <Gate from={OUT.swap}>
          <BonePlate />
        </Gate>
      </BoneSwap>
    </Gate>
  );
}
