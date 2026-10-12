import { useRef, type CSSProperties, type ReactNode } from "react";

import "./seg.css";

import { clamp, outCubic, prog } from "#/engine/motion/ease";
import type { StyleValues } from "#/engine/stage/applier";
import { useFrame, useTrack } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { ContextBar } from "#/talk/kit/motion";
import { put } from "#/talk/kit/motion/dom";
import {
  CompletionLine,
  HOME,
  Pile,
  PromptBox,
  ScrollbackWhip,
  Turn,
  type CountSource,
  type TurnIn,
} from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { BOT_HOME, HOME_ZONES, HomeRest } from "#/talk/segments/shared/home";

import { botBox, homeLeave, inCubic, typedCount, wipe } from "./tracks";

const FILL: CSSProperties = { position: "absolute", inset: 0 };

/**
 * Rendered only while from ≤ τ < to. Uses `display`, not `visibility`: kit children (Pile tiles)
 * set `visibility: visible` themselves, which would leak through a hidden parent.
 */
export function Live({
  from,
  to,
  children,
  className,
  style,
}: {
  from: number;
  to: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    put(ref.current, "display", frame.tau >= from && frame.tau < to ? "block" : "none");
  });
  return (
    <div ref={ref} className={className} style={{ ...FILL, display: "none", ...style }}>
      {children}
    </div>
  );
}

/** A full-frame layer driven by a τ function (transform/clip/opacity only). */
export function Layer({
  track,
  children,
  className,
  style,
}: {
  track: (tau: number, frame: Frame) => StyleValues;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useTrack(track);
  return (
    <div ref={ref} className={className} style={{ ...FILL, ...style }}>
      {children}
    </div>
  );
}

/** Mono text typed in whole characters from `at` at `cps`. */
export function Typed({
  text,
  at,
  cps = 40,
  className = "type-label",
  style,
}: {
  text: string;
  at: number;
  cps?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const total = Array.from(text).length;
  const ref = useTrack((tau: number) => {
    const n = typedCount(tau, at, cps, total);
    return { clipRight: n >= total ? 0 : 100 - (n / total) * 100 };
  });
  return (
    <div ref={ref} className={className} style={{ whiteSpace: "pre", ...style }}>
      {text}
    </div>
  );
}

/** Serif or label text revealed by a left-to-right wipe with a short rise, landing by `at + dur`. */
export function Wiped({
  children,
  at,
  dur = 0.5,
  className,
  style,
}: {
  children: ReactNode;
  at: number;
  dur?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useTrack((tau: number) => wipe(tau, at, dur));
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

export type BotPath = (tau: number) => { x: number; y: number; scale: number };

/** The segment's own bot: feet at (x, y) in stage px, scaled about its feet. */
export function Bot({
  path,
  acts,
  from,
  to,
}: {
  path: BotPath;
  acts: readonly Act[];
  from: number;
  to: number;
}) {
  const ref = useTrack((tau: number) => {
    const p = path(tau);
    const box = botBox(p.x, p.y);
    return { x: box.left, y: box.top, scale: p.scale };
  });
  return (
    <Live from={from} to={to}>
      <div
        ref={ref}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: BOT_HOME.width,
          height: BOT_HOME.height,
          transformOrigin: "50% 90%",
        }}
      >
        <StageMascot acts={acts} title="the bot" />
      </div>
    </Live>
  );
}

export type IntroSpec = {
  /** Window start (shows HomeRest until the prompt starts typing) */
  winStart: number;
  pile: number;
  turn: TurnIn;
  /** The home shot sinks away (camera tilts up) over [at, at + dur] */
  leave: { at: number; dur: number };
  /** τ the live spinner glyph hands over to the plate's own copy of it */
  glyphOff: number;
};

/** Window start: HomeRest, then the prompt types the tip, ⏎, the spinner, and the home shot sinks. */
export function HomeIntro({ winStart, pile, turn, leave, glyphOff }: IntroSpec) {
  const sink = (tau: number) => homeLeave(tau, leave.at, leave.dur);
  const glyph = useTrack((tau: number) => ({ "--seg-glyph": tau >= glyphOff ? 0 : 1 }));
  return (
    <>
      <Live from={winStart} to={turn.typeAt}>
        <HomeRest pile={pile} from={winStart} to={turn.typeAt} />
      </Live>
      <Live from={turn.typeAt} to={leave.at + leave.dur}>
        <Layer track={sink} className="seg-home">
          <div ref={glyph} style={FILL}>
            <ContextBar zones={HOME_ZONES} />
            <Turn in={turn} pile={pile} />
          </div>
        </Layer>
      </Live>
    </>
  );
}

export type OutroSpec = {
  /** The last stop's hold end; the exit runs over [holdEnd, winEnd) */
  holdEnd: number;
  winEnd: number;
  pastVerb: string;
  duration: string;
  pile: CountSource;
  pileAfter: number;
};

/** Exit timings relative to the last hold's end (all within the 1.4 s exit tail). */
export function outroTimes(holdEnd: number) {
  return {
    rise: holdEnd,
    riseEnd: holdEnd + 0.4,
    line: holdEnd + 0.22,
    pocket: holdEnd + 0.5,
    whip: holdEnd + 0.92,
    whipEnd: holdEnd + 1.3,
  };
}

/**
 * Window end: the home rules rise back under the folding plate, the completion line types, the bot
 * pockets a token, and the camera whips up the scrollback onto HomeRest with the new pile.
 */
export function HomeOutro({ holdEnd, winEnd, pastVerb, duration, pile, pileAfter }: OutroSpec) {
  const t = outroTimes(holdEnd);
  const rise = (tau: number) => {
    const u = prog(tau, t.rise, t.riseEnd, outCubic);
    return { y: (1 - u) * 420, opacity: clamp(u * 2) };
  };
  const promptStyle: CSSProperties = { position: "absolute", left: HOME.left, top: HOME.promptTop };
  return (
    <>
      <Live from={holdEnd} to={t.whipEnd}>
        <ScrollbackWhip at={t.whip} dur={t.whipEnd - t.whip} distance={1080}>
          <CompletionLine
            className="type-label"
            style={{
              position: "absolute",
              left: HOME.textX,
              top: HOME.spinnerY,
              transform: "translateY(-50%)",
            }}
            pastVerb={pastVerb}
            duration={duration}
            at={t.line}
          />
          <Layer track={rise}>
            <PromptBox style={promptStyle} />
            <ContextBar zones={HOME_ZONES} />
            <Pile count={pile} x={HOME.pileX} y={HOME.pileY} />
          </Layer>
          <div style={{ ...FILL, transform: "translateY(-1080px)" }}>
            <PromptBox style={promptStyle} />
            <ContextBar zones={HOME_ZONES} />
            <Pile count={pileAfter} x={HOME.pileX} y={HOME.pileY} />
          </div>
        </ScrollbackWhip>
      </Live>
      <Live from={t.whipEnd} to={winEnd}>
        <HomeRest pile={pileAfter} from={t.whipEnd} to={winEnd} />
      </Live>
    </>
  );
}

/** Bot feet at home (on the prompt box's top rule). */
export const BOT_FEET = Object.freeze({
  x: BOT_HOME.left + BOT_HOME.width / 2,
  y: BOT_HOME.top + BOT_HOME.height * 0.9,
});

/** Plate fold into the completion line: collapses toward y = 500 over the first 0.36 s of the exit. */
export function foldAt(tau: number, holdEnd: number): StyleValues {
  const u = prog(tau, holdEnd, holdEnd + 0.36, inCubic);
  return { scaleY: Math.max(0.004, 1 - u), opacity: 1 - prog(tau, holdEnd + 0.22, holdEnd + 0.36) };
}
