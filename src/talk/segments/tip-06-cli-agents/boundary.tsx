import type { CSSProperties, ReactNode } from "react";

import { inOutCubic, outExpo, prog } from "#/engine/motion/ease";
import type { CodeLang } from "#/engine/text/highlight";
import { HighlightedLine } from "#/engine/text/highlighted-line";
import type { Frame } from "#/engine/types";
import { ContextBar } from "#/talk/kit/motion";
import {
  Chevron,
  CompletionLine,
  HOME,
  Pile,
  pocketKeys,
  PromptBox,
  SpinnerLine,
  type CountSource,
} from "#/talk/kit/tui";
import { useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { BOT_HOME, HOME_ZONES, HomeRest } from "#/talk/segments/shared/home";

import { exitTimes, typedAt } from "./timing";

export type StyleMap = Record<string, string>;

/** Ref callback writing `fx(frame)` as inline styles now and on every tick. */
function useFx<T extends HTMLElement>(fx: (frame: Frame) => StyleMap) {
  return useFrameRef<T>((el: T, frame: Frame) => {
    const next = fx(frame);
    for (const prop in next) {
      const value = next[prop] as string;
      if (el.style.getPropertyValue(prop) !== value) el.style.setProperty(prop, value);
    }
  });
}

/** An absolutely positioned layer whose styles are a pure function of the frame. */
export function Fx({
  fx,
  style,
  className,
  children,
  inline = false,
}: {
  fx: (frame: Frame) => StyleMap;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
  /** Render a `span`, e.g. per-letter layers inside a link */
  inline?: boolean;
}) {
  const ref = useFx<HTMLElement>(fx);
  const Tag = inline ? "span" : "div";
  return (
    <Tag ref={ref} className={className} style={{ position: "absolute", ...style }}>
      {children}
    </Tag>
  );
}

export const px = (n: number) => `${n.toFixed(2)}px`;

function Echo({ text, at }: { text: string; at: number }) {
  const ref = useFx<HTMLDivElement>((frame) => {
    const u = prog(frame.tau, at, at + 0.32, outExpo);
    return { transform: `translate3d(0, ${((1 - u) * 110).toFixed(2)}%, 0)` };
  });
  return (
    <div
      className="tui type-body"
      style={{
        position: "absolute",
        left: HOME.textX,
        top: HOME.echoY,
        transform: "translateY(-50%)",
        overflow: "hidden",
      }}
      data-tui-replica
    >
      <div ref={ref} className="tui-line tui-text">
        <span className="tui-clay">
          <Chevron />
        </span>
        <span>{` ${text}`}</span>
      </div>
    </div>
  );
}

export type BotPlace = { x: number; y: number; scale: number };

/** The bot at BOT_HOME, moved by `place(τ)` (offset in px, scale about its feet). */
export function Bot({ acts, place }: { acts: readonly Act[]; place: (tau: number) => BotPlace }) {
  const ref = useFx<HTMLDivElement>((frame) => {
    const p = place(frame.tau);
    return {
      transform: `translate3d(${px(p.x)}, ${px(p.y)}, 0) scale(${p.scale.toFixed(4)})`,
    };
  });
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: BOT_HOME.left,
        top: BOT_HOME.top,
        width: BOT_HOME.width,
        height: BOT_HOME.height,
        transformOrigin: "50% 100%",
      }}
    >
      <StageMascot acts={acts} title="the bot" />
    </div>
  );
}

export type TipIn = {
  /** Tip number; the pile holds `n − 1` tiles until the exit pockets the `n`th */
  n: number;
  prompt: string;
  verb: string;
  typeAt: number;
  cps: number;
  submitAt: number;
  spinnerAt: number;
  tokens: CountSource;
  elapsed?: CountSource;
};

export type TipOut = { at: number; pastVerb: string; duration: string };

/**
 * One tip's terminal from home shot to home shot: the prompt types the tip and submits, the plate
 * plays, then everything folds into the completion line, the bot pockets a token and the completion
 * line scrolls away, leaving the home shot (swapped for `HomeRest` so boundaries match-cut).
 * `textFx` moves the echo + spinner, `stackFx` the prompt box, pile and context bar, `homeFx` all
 * of them (e.g. a glyph dive).
 */
export function TipFrame({
  tip,
  out,
  textFx,
  echoFx,
  spinnerFx,
  stackFx,
  homeFx,
  plate,
  over,
}: {
  tip: TipIn;
  out: TipOut;
  textFx?: (frame: Frame) => StyleMap;
  echoFx?: (frame: Frame) => StyleMap;
  spinnerFx?: (frame: Frame) => StyleMap;
  stackFx?: (frame: Frame) => StyleMap;
  homeFx?: (frame: Frame) => StyleMap;
  /** Content inside the terminal */
  plate: ReactNode;
  /** Content above the home layers but still inside the terminal */
  over?: ReactNode;
}) {
  const t = exitTimes(out.at);
  const fold = (frame: Frame): StyleMap => {
    const base = textFx?.(frame) ?? {};
    const u = prog(frame.tau, out.at, t.foldEnd, inOutCubic);
    if (u <= 0) return base;
    return { ...base, "clip-path": `inset(0 0 ${(u * 100).toFixed(2)}% 0)` };
  };
  // `display`, not `visibility`: pile tiles set `visibility: visible` themselves
  const live = (frame: Frame): StyleMap => ({
    display: frame.tau < t.restAt ? "block" : "none",
  });
  const rest = (frame: Frame): StyleMap => ({
    display: frame.tau >= t.restAt ? "block" : "none",
  });
  const scrollAway = (frame: Frame): StyleMap => {
    const u = prog(frame.tau, t.scrollAt, t.scrollAt + t.scrollDur, inOutCubic);
    return u > 0
      ? { transform: `translate3d(0, ${px(-36 * u)}, 0)`, opacity: (1 - u).toFixed(3) }
      : { transform: "none", opacity: "1" };
  };
  return (
    <>
      <Fx fx={live} style={{ inset: 0 }}>
        <Fx fx={homeFx ?? none} style={{ inset: 0, transformOrigin: "0 0" }}>
          <Fx fx={stackFx ?? none} style={{ inset: 0 }}>
            <ContextBar zones={HOME_ZONES} />
            <PromptBox
              style={{ position: "absolute", left: HOME.left, top: HOME.promptTop }}
              text={tip.prompt}
              typeAt={tip.typeAt}
              cps={tip.cps}
              submitAt={tip.submitAt}
            />
            <Pile
              count={pocketKeys(t.pocketAt, tip.n, t.pocketDur)}
              x={HOME.pileX}
              y={HOME.pileY}
            />
          </Fx>
          <Fx fx={fold} style={{ inset: 0 }}>
            <Fx fx={echoFx ?? none} style={{ inset: 0 }}>
              <Echo text={tip.prompt} at={tip.submitAt + 0.2} />
            </Fx>
            <Fx fx={spinnerFx ?? none} style={{ inset: 0 }}>
              <SpinnerLine
                className="type-label"
                style={{
                  position: "absolute",
                  left: HOME.textX,
                  top: HOME.spinnerY,
                  transform: "translateY(-50%)",
                }}
                verb={tip.verb}
                at={tip.spinnerAt}
                tokens={tip.tokens}
                elapsed={tip.elapsed}
              />
            </Fx>
          </Fx>
        </Fx>
        {plate}
        {over}
        <Fx fx={scrollAway} style={{ inset: 0 }}>
          <CompletionLine
            className="type-label"
            style={{
              position: "absolute",
              left: HOME.textX,
              top: HOME.spinnerY,
              transform: "translateY(-50%)",
            }}
            pastVerb={out.pastVerb}
            duration={out.duration}
            at={t.completeAt}
          />
        </Fx>
      </Fx>
      <Fx fx={rest} style={{ inset: 0, display: "none" }}>
        <HomeRest
          pile={tip.n}
          from={Number.NEGATIVE_INFINITY}
          to={Number.POSITIVE_INFINITY}
          bot={false}
        />
      </Fx>
    </>
  );
}

const none = (): StyleMap => ({});

export function Typed({
  text,
  start,
  cps,
  className,
  top,
  left = 200,
  color,
  lang,
}: {
  text: string;
  start: number;
  cps: number;
  className: string;
  top: number;
  left?: number;
  color?: string;
  lang?: CodeLang;
}) {
  const length = Array.from(text).length;
  const ref = useFx<HTMLDivElement>((frame) => {
    const n = typedAt(frame.tau, start, cps, length);
    return {
      "clip-path": n >= length ? "none" : `inset(-0.3em calc(100% - ${n}ch) -0.3em -0.2em)`,
    };
  });
  return (
    <div
      ref={ref}
      className={`tui ${className}`}
      style={{
        position: "absolute",
        left,
        top,
        color,
        whiteSpace: "pre",
        clipPath: "inset(0 100% 0 0)",
      }}
    >
      <HighlightedLine line={text} lang={lang} />
    </div>
  );
}

export function Rule({ at, top, tone }: { at: number; top: number; tone: string }) {
  const ref = useFx<HTMLDivElement>((frame) => ({
    transform: `scaleX(${prog(frame.tau, at, at + 0.35, outExpo).toFixed(4)})`,
  }));
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: 160,
        top: top - 1.5,
        width: 1600,
        height: 3,
        background: tone,
        transformOrigin: "0 50%",
        transform: "scaleX(0)",
      }}
    />
  );
}

/**
 * Hides the segment with `display` outside its window: the stage gates with `visibility`, which
 * children that set `visibility: visible` themselves (chips, stamps) would escape.
 */
export function SegmentRoot({
  window,
  children,
}: {
  window: { start: number; end: number };
  children: ReactNode;
}) {
  const fx = (frame: Frame): StyleMap => ({
    display: frame.tau >= window.start && frame.tau < window.end ? "block" : "none",
  });
  return (
    <Fx fx={fx} style={{ inset: 0 }}>
      {children}
    </Fx>
  );
}
