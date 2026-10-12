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

const LIFT_DUR = 0.32;
/** ⏎ pops before the line scrolls away */
const LIFT_DELAY = 0.12;

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

type TextProps = Pick<PromptBoxProps, "typeAt" | "cps" | "ghost" | "ghostAt" | "acceptAt">;

/** The ghost suggestion's state at τ: hidden, showing, or accepted into the prompt. */
function ghostPhase(tau: number, p: TextProps): "hidden" | "showing" | "accepted" {
  if (p.ghost === undefined) return "hidden";
  if (p.acceptAt !== undefined && tau >= p.acceptAt) return "accepted";
  return p.ghostAt !== undefined && tau >= p.ghostAt ? "showing" : "hidden";
}

/** What the prompt row reads at τ: typed text (or the accepted ghost) and the ghost's tail. */
function promptText(tau: number, text: string, len: number, p: TextProps) {
  const typeAt = p.typeAt ?? 0;
  const n = typedChars(tau, typeAt, p.cps ?? 30, len);
  const phase = ghostPhase(tau, p);
  const ghost = p.ghost ?? "";
  const typed = phase === "accepted" ? ghost : sliceChars(text, n);
  const ghostTail = phase === "showing" ? Array.from(ghost).slice(charLength(typed)).join("") : "";
  return { typed, ghostTail, typing: tau >= typeAt && n > 0 && n < len };
}

/** 0 → 1 as the submitted line scrolls up and a fresh prompt row slides in. */
const submitLift = (tau: number, submitAt: number | undefined): number =>
  submitAt === undefined
    ? 0
    : outExpo(prog(tau, submitAt + LIFT_DELAY, submitAt + LIFT_DELAY + LIFT_DUR));

const visibility = (on: boolean) => (on ? "visible" : "hidden");

function writeRows(rowA: Element | undefined, rowB: Element | undefined, lift: number, h: number) {
  setStyle(rowA, "transform", `translate3d(0, ${(-lift * h).toFixed(2)}px, 0)`);
  setStyle(rowB, "transform", `translate3d(0, ${((1 - lift) * h).toFixed(2)}px, 0)`);
}

/** The ⏎ punch: both rules swell and the return glyph pops. */
function writePunch(rules: Element[], ret: Element | undefined, p: number) {
  const scale = `scale(${(1 + 0.06 * p).toFixed(4)}, ${(1 + 1.5 * p).toFixed(4)})`;
  for (const rule of rules) setStyle(rule, "transform", scale);
  setStyle(ret, "visibility", visibility(p > 0));
  setStyle(ret, "transform", `scale(${(0.6 + 0.8 * p).toFixed(3)})`);
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

    const line = promptText(tau, text, len, { typeAt, cps, ghost, ghostAt, acceptAt });
    setText(typedEl, line.typed);
    setText(ghostEl, line.ghostTail);

    const submitted = submitAt !== undefined && tau >= submitAt;
    writeRows(rowA, rowB, submitLift(tau, submitAt), height);
    setStyle(rowB, "visibility", visibility(submitted));
    setStyle(caretA, "visibility", visibility(!submitted && caretOn(w, line.typing)));
    setStyle(caretB, "visibility", visibility(submitted && caretOn(w, false)));

    const p = submitAt === undefined ? 0 : punch(tau, v, submitAt);
    writePunch(
      [top, bottom].filter((el) => el !== undefined),
      ret,
      p,
    );
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
