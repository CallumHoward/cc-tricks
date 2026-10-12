import "#/talk/tokens.css";
import "./tui.css";
import type { CSSProperties, ReactNode } from "react";

import { outExpo, prog } from "#/engine/motion/ease";
import type { Frame } from "#/engine/types";

import { CompletionLine } from "./completion-line";
import { Chevron } from "./icons";
import { Pile } from "./pile";
import { PromptBox } from "./prompt-box";
import { ScrollbackWhip } from "./scrollback-whip";
import { SpinnerLine } from "./spinner-line";
import type { CountSource } from "./tui-math";
import { HOME, resolveTurn, type TurnSpec } from "./turn-timing";
import { setStyle, useFrameRef } from "./use-frame-ref";

export type TurnProps = TurnSpec & {
  /** Pocketed tiles at the home shot's pile anchor (see `pocketKeys`) */
  pile?: CountSource;
  /** Extra content on the incoming screen (e.g. the dive target), in home-shot px */
  children?: ReactNode;
};

const lineAt = (y: number): CSSProperties => ({
  position: "absolute",
  left: HOME.textX,
  top: y,
  transform: "translateY(-50%)",
});

function Echo({ text, at }: { text: string; at: number }) {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const u = prog(frame.tau, at, at + 0.32, outExpo);
    setStyle(
      root.firstElementChild,
      "transform",
      `translate3d(0, ${((1 - u) * 110).toFixed(2)}%, 0)`,
    );
  });
  return (
    <div
      ref={ref}
      className="tui type-code"
      style={{ ...lineAt(HOME.echoY), overflow: "hidden" }}
      data-tui-replica
    >
      <div className="tui-line tui-dim">
        <Chevron />
        <span>{` ${text}`}</span>
      </div>
    </div>
  );
}

const promptStyle: CSSProperties = { position: "absolute", left: HOME.left, top: HOME.promptTop };

/**
 * The turn between tips in the home shot. Out: the completion line types and the camera whips up
 * the scrollback. In: the prompt types the tip, ⏎ punches, the spinner line types.
 */
export function Turn({ in: enter, out, pile, children }: TurnProps) {
  const t = resolveTurn({ in: enter, out });
  const pileEl = pile === undefined ? null : <Pile count={pile} x={HOME.pileX} y={HOME.pileY} />;

  const incoming = enter ? (
    <>
      {t.submitAt === undefined ? null : (
        <Echo text={enter.ghost?.text ?? enter.prompt} at={t.submitAt + 0.2} />
      )}
      <SpinnerLine
        className="type-label"
        style={lineAt(HOME.spinnerY)}
        verb={enter.verb}
        at={t.spinnerAt ?? 0}
        tokens={enter.tokens}
        elapsed={enter.elapsed}
      />
      <PromptBox
        style={promptStyle}
        text={enter.ghost ? "" : enter.prompt}
        typeAt={enter.typeAt}
        cps={enter.cps}
        submitAt={t.submitAt}
        ghost={enter.ghost?.text}
        ghostAt={enter.ghost?.at}
        acceptAt={enter.ghost?.acceptAt}
      />
      {pileEl}
      {children}
    </>
  ) : null;

  if (!out) return <div style={{ position: "absolute", inset: 0 }}>{incoming}</div>;

  const outgoing = (
    <>
      <CompletionLine
        className="type-label"
        style={lineAt(HOME.spinnerY)}
        pastVerb={out.pastVerb}
        duration={out.duration}
        at={out.at}
        tone={out.tone}
      />
      <PromptBox style={promptStyle} />
      {pileEl}
    </>
  );

  if (!enter || t.whipAt === undefined)
    return <div style={{ position: "absolute", inset: 0 }}>{outgoing}</div>;

  return (
    <ScrollbackWhip at={t.whipAt} dur={out.whipDur ?? 0.5} distance={1080}>
      {outgoing}
      <div style={{ position: "absolute", inset: 0, transform: "translateY(-1080px)" }}>
        {incoming}
      </div>
    </ScrollbackWhip>
  );
}
