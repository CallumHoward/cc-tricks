import "#/talk/tokens.css";
import "./tui.css";
import type { CSSProperties } from "react";

import { outExpo, prog } from "#/engine/motion/ease";
import type { Frame } from "#/engine/types";

import { Chevron, ReturnGlyph } from "./icons";
import { caretOn, charLength, punch, sliceChars, typedChars, typeEnd } from "./tui-math";
import { setStyle, setText, useFrameRef } from "./use-frame-ref";

export type PromptBoxProps = {
  /** Text typed into the prompt */
  text?: string;
  /** τ typing starts */
  typeAt?: number;
  /** Chars per τ-second */
  cps?: number;
  /** τ of ⏎: the rules punch (forward only) and the line scrolls up out of the box */
  submitAt?: number;
  /** Dim suggestion shown from `ghostAt`; Tab accepts it at `acceptAt` */
  ghost?: string;
  ghostAt?: number;
  acceptAt?: number;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
};

export const LIFT_DUR = 0.32;
/** ⏎ pops before the line scrolls away */
export const LIFT_DELAY = 0.12;

/** τ at which the prompt's typing and ⏎ scroll have landed. */
export function promptLanding({
  text = "",
  typeAt = 0,
  cps = 30,
  submitAt,
}: PromptBoxProps): number {
  const typed = typeEnd(typeAt, charLength(text), cps);
  return submitAt === undefined ? typed : Math.max(typed, submitAt + LIFT_DELAY + LIFT_DUR);
}

/** Claude Code's prompt: two rules (not a frame), `❯`, a block caret on wall time. */
export function PromptBox({
  text = "",
  typeAt = 0,
  cps = 30,
  submitAt,
  ghost,
  ghostAt,
  acceptAt,
  width = 1600,
  height = 120,
  className,
  style,
}: PromptBoxProps) {
  const len = charLength(text);
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const { tau, v, w } = frame;
    const [top, bottom, clip] = root.children;
    const [rowA, rowB] = clip?.children ?? [];
    const [, typedEl, caretA, ghostEl, ret] = rowA?.children ?? [];
    const caretB = rowB?.children[1];

    const accepted = ghost !== undefined && acceptAt !== undefined && tau >= acceptAt;
    const n = typedChars(tau, typeAt, cps, len);
    const typed = accepted ? ghost : sliceChars(text, n);
    const showGhost = ghost !== undefined && !accepted && ghostAt !== undefined && tau >= ghostAt;
    setText(typedEl, typed);
    setText(ghostEl, showGhost ? Array.from(ghost).slice(charLength(typed)).join("") : "");

    const submitted = submitAt !== undefined && tau >= submitAt;
    const lift =
      submitAt === undefined
        ? 0
        : outExpo(prog(tau, submitAt + LIFT_DELAY, submitAt + LIFT_DELAY + LIFT_DUR));
    setStyle(rowA, "transform", `translate3d(0, ${(-lift * height).toFixed(2)}px, 0)`);
    setStyle(rowB, "transform", `translate3d(0, ${((1 - lift) * height).toFixed(2)}px, 0)`);
    setStyle(rowB, "visibility", submitted ? "visible" : "hidden");

    const typing = tau >= typeAt && n > 0 && n < len;
    setStyle(caretA, "visibility", !submitted && caretOn(w, typing) ? "visible" : "hidden");
    setStyle(caretB, "visibility", submitted && caretOn(w, false) ? "visible" : "hidden");

    const p = submitAt === undefined ? 0 : punch(tau, v, submitAt);
    const rules = `scale(${(1 + 0.06 * p).toFixed(4)}, ${(1 + 1.5 * p).toFixed(4)})`;
    setStyle(top, "transform", rules);
    setStyle(bottom, "transform", rules);
    setStyle(ret, "visibility", p > 0 ? "visible" : "hidden");
    setStyle(ret, "transform", `scale(${(0.6 + 0.8 * p).toFixed(3)})`);
  });
  return (
    <div
      ref={ref}
      className={`tui tui-prompt type-code ${className ?? ""}`}
      style={{ width, height, ...style }}
      data-tui-replica
    >
      <div className="tui-prompt-rule tui-prompt-rule--top" />
      <div className="tui-prompt-rule tui-prompt-rule--bottom" />
      <div className="tui-prompt-clip">
        <div className="tui-prompt-row">
          <span className="tui-chevron">
            <Chevron />
          </span>
          <span />
          <span className="tui-caret" />
          <span className="tui-dim" />
          <span className="tui-return">
            <ReturnGlyph />
          </span>
        </div>
        <div className="tui-prompt-row">
          <span className="tui-chevron">
            <Chevron />
          </span>
          <span className="tui-caret" />
        </div>
      </div>
    </div>
  );
}
