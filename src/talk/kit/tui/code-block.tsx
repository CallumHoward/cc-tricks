import "#/talk/tokens.css";
import "./tui.css";
import type { CSSProperties } from "react";

import { outExpo, prog } from "#/engine/motion/ease";
import type { CodeLang } from "#/engine/text/highlight";
import { HighlightedLine } from "#/engine/text/highlighted-line";
import type { Frame } from "#/engine/types";

import { setStyle, useFrameRef } from "./use-frame-ref";

export type CodeBlockProps = {
  /** Exact strings, one per line */
  lines: readonly string[];
  label?: string;
  /** τ the first line rises from its mask; later lines follow every `stagger` (omit: static) */
  at?: number;
  stagger?: number;
  /** Clay wash wiping left → right behind one line (0-based) */
  highlight?: { line: number; at: number; dur?: number };
  /** Syntax-highlights the lines in this language */
  lang?: CodeLang;
  className?: string;
  style?: CSSProperties;
};

const CODE_RISE = 0.3;

/** τ at which the block and its highlight have landed. */
export function codeBlockLanding({ lines, at, stagger = 0.08, highlight }: CodeBlockProps): number {
  const rose =
    at === undefined ? Number.NEGATIVE_INFINITY : at + lines.length * stagger + CODE_RISE;
  const wiped = highlight ? highlight.at + (highlight.dur ?? 0.45) : Number.NEGATIVE_INFINITY;
  return Math.max(rose, wiped);
}

/** Mono 34 code panel with an optional label above. */
export function CodeBlock({
  lines,
  label,
  at,
  stagger = 0.08,
  highlight,
  lang,
  className,
  style,
}: CodeBlockProps) {
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const { tau } = frame;
    const rows = root.querySelectorAll<HTMLElement>(".tui-code-line > span");
    if (at !== undefined) {
      const labelEl = root.querySelector<HTMLElement>(".tui-code-label > span");
      const lu = prog(tau, at - 0.1, at - 0.1 + CODE_RISE, outExpo);
      setStyle(labelEl, "transform", `translate3d(0, ${((1 - lu) * 110).toFixed(2)}%, 0)`);
      rows.forEach((el, i) => {
        const start = at + i * stagger;
        const u = prog(tau, start, start + CODE_RISE, outExpo);
        setStyle(el, "transform", `translate3d(0, ${((1 - u) * 105).toFixed(2)}%, 0)`);
      });
    }
    if (highlight) {
      const u = prog(tau, highlight.at, highlight.at + (highlight.dur ?? 0.45), outExpo);
      setStyle(root.querySelector(".tui-code-mark"), "transform", `scaleX(${u.toFixed(4)})`);
    }
  });
  return (
    <div ref={ref} className={`tui tui-code ${className ?? ""}`} style={style}>
      {label ? (
        <div className="tui-code-label type-label" style={{ overflow: "hidden" }}>
          <span style={{ display: "block" }}>{label}</span>
        </div>
      ) : null}
      <div className="tui-code-panel type-code">
        {lines.map((line, i) => (
          // oxlint-disable-next-line react/no-array-index-key -- lines are positional and may repeat
          <div key={i} className="tui-code-line">
            {highlight?.line === i ? <div className="tui-code-mark" /> : null}
            <span>{line ? <HighlightedLine line={line} lang={lang} /> : " "}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
