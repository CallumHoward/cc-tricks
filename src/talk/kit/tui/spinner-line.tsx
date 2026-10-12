import "#/talk/tokens.css";
import "./tui.css";
import type { CSSProperties } from "react";

import type { Frame } from "#/engine/types";

import { Counter } from "./counter";
import { GLYPH_PATHS } from "./glyph-data";
import {
  charLength,
  formatElapsed,
  resolveCount,
  spinnerGlyph,
  spinnerVerb,
  typedChars,
  type CountSource,
  type VerbSource,
} from "./tui-math";
import { setStyle, setText, typeClip, useFrameRef } from "./use-frame-ref";

/** The live ✳ glyph: an SVG path cycling on wall time (never a font glyph, so it can be dived into). */
export function SpinnerGlyph({ rate = 1, className }: { rate?: number; className?: string }) {
  const ref = useFrameRef<SVGPathElement>((el: SVGPathElement, frame: Frame) => {
    const d = GLYPH_PATHS[spinnerGlyph(frame.w, rate)];
    if (el.getAttribute("d") !== d) el.setAttribute("d", d);
  });
  return (
    <svg className={`tui-cell tui-cell--wide ${className ?? ""}`} viewBox="0 0 100 100" aria-hidden>
      <path ref={ref} fill="currentColor" />
    </svg>
  );
}

export type SpinnerLineProps = {
  /** A verb, or verbs keyed by absolute τ; reads `Moonwalking` while rewinding */
  verb: VerbSource;
  /** τ the line starts typing (also elapsed zero unless `elapsed` is given) */
  at: number;
  /** Typing speed in chars per τ-second */
  cps?: number;
  /** Elapsed seconds over τ; defaults to τ − at */
  elapsed?: CountSource;
  tokens?: CountSource;
  /** Hide the `(elapsed · ↓ n tokens)` parenthetical */
  bare?: boolean;
  /** Glyph cadence multiplier (0.25 in the outro) */
  rate?: number;
  className?: string;
  style?: CSSProperties;
};

const STATS_CHARS = 26;

/** `✳ Verb… (12s · ↓ 1.2k tokens)` in the Claude Code spinner style. */
export function SpinnerLine({
  verb,
  at,
  cps = 60,
  elapsed,
  tokens = 0,
  bare = false,
  rate = 1,
  className,
  style,
}: SpinnerLineProps) {
  const elapsedAt = elapsed === undefined ? (tau: number) => tau - at : resolveCount(elapsed);
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const word = spinnerVerb(verb, frame.tau, frame.v);
    const verbEl = root.querySelector<HTMLElement>(".tui-verb");
    setText(verbEl, `${word}…`);
    setStyle(verbEl, "--shimmer", (1 - ((frame.w * 0.45) % 1.6)).toFixed(3));
    setText(root.querySelector(".tui-elapsed"), formatElapsed(elapsedAt(frame.tau)));
    const total = 3 + charLength(word) + 1 + (bare ? 0 : STATS_CHARS);
    const typed = typedChars(frame.tau, at, cps, total);
    setStyle(root, "clip-path", typed === 0 ? "inset(0 100% 0 0)" : typeClip(typed, total));
  });
  return (
    <div ref={ref} className={`tui tui-line ${className ?? ""}`} style={style} data-tui-replica>
      <span className="tui-clay">
        <SpinnerGlyph rate={rate} />
      </span>
      <span> </span>
      <span className="tui-verb" />
      {bare ? null : (
        <span className="tui-dim">
          {" ("}
          <span className="tui-elapsed" />
          {" · ↓ "}
          <Counter value={tokens} />
          {" tokens)"}
        </span>
      )}
    </div>
  );
}
