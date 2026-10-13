import type { CSSProperties, ReactNode } from "react";

import "./seg.css";

import { clamp, inOutCubic, outCubic, prog } from "#/engine/motion/ease";
import type { StyleValues } from "#/engine/stage/applier";
import { useTrack } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { ContextBar } from "#/talk/kit/motion";
import {
  CompletionLine,
  HOME,
  Pile,
  PromptBox,
  Turn,
  type CountSource,
  type TurnIn,
} from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { DisplayWindow } from "#/talk/segments/shared/display-window";
import { BOT_HOME, HOME_ZONES, HomeRest } from "#/talk/segments/shared/home";

import { botBox, homeLeave, typedCount, wipe } from "./tracks";

/** Full-frame wrappers never take the pointer; links and widget controls opt back in (seg.css). */
const FILL: CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none" };

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
  return (
    <DisplayWindow from={from} to={to} className={className} style={{ ...FILL, ...style }}>
      {children}
    </DisplayWindow>
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
function outroTimes(holdEnd: number) {
  return {
    rise: holdEnd + 0.25,
    riseEnd: holdEnd + 0.85,
    line: holdEnd + 0.3,
    pocket: holdEnd + 0.5,
    lift: holdEnd + 0.88,
    rest: holdEnd + 1.3,
  };
}

/** The completion line drifts up into the scrollback as it fades. */
export function lineLift(tau: number, from: number, to: number): StyleValues {
  const u = prog(tau, from, to, inOutCubic);
  return { y: -96 * u, opacity: 1 - u };
}

/**
 * Window end: the home furniture cranes back up under the receding plate, the completion line
 * types, the bot pockets a token, and the line drifts up into the scrollback onto HomeRest.
 */
export function HomeOutro({ holdEnd, winEnd, pastVerb, duration, pile, pileAfter }: OutroSpec) {
  const t = outroTimes(holdEnd);
  const rise = (tau: number) => {
    const u = prog(tau, t.rise, t.riseEnd, outCubic);
    return { y: (1 - u) * 180, opacity: clamp(u * 1.6) };
  };
  const promptStyle: CSSProperties = { position: "absolute", left: HOME.left, top: HOME.promptTop };
  return (
    <>
      <Live from={holdEnd} to={t.rest}>
        <Layer track={(tau) => lineLift(tau, t.lift, t.rest)}>
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
        </Layer>
        <Layer track={rise}>
          <PromptBox className="type-code" style={promptStyle} />
          <ContextBar zones={HOME_ZONES} />
          <Pile count={pile} x={HOME.pileX} y={HOME.pileY} />
        </Layer>
      </Live>
      <Live from={t.rest} to={winEnd}>
        <HomeRest pile={pileAfter} from={t.rest} to={winEnd} />
      </Live>
    </>
  );
}

/** Bot feet at home (on the prompt box's top rule). */
export const BOT_FEET = Object.freeze({
  x: BOT_HOME.left + BOT_HOME.width / 2,
  y: BOT_HOME.top + BOT_HOME.height * 0.9,
});

/**
 * The plate dollies back over the first 0.55 s of the exit, clearing (0.45 s) before the home shot
 * rises.
 */
export function foldAt(tau: number, holdEnd: number): StyleValues {
  const u = prog(tau, holdEnd, holdEnd + 0.55, inOutCubic);
  return {
    scale: 1 - 0.1 * u,
    y: -70 * u,
    opacity: 1 - prog(tau, holdEnd, holdEnd + 0.45, outCubic),
  };
}
