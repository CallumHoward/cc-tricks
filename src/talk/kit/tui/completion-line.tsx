import "#/talk/tokens.css";
import "./tui.css";
import type { CSSProperties } from "react";

import type { Frame } from "#/engine/types";

import { StaticGlyph } from "./icons";
import { charLength, completionText, typedChars } from "./tui-math";
import { setStyle, typeClip, useFrameRef } from "./use-frame-ref";

export type CompletionLineProps = {
  /**
   * One of Claude Code's past verbs: Baked, Brewed, Churned, Cogitated, Cooked, Crunched, Sautéed,
   * Worked
   */
  pastVerb: string;
  /** Deadpan duration, e.g. `1m 30s` */
  duration: string;
  /** Extra text after the duration, e.g. `· ↓ ≈3k tokens` */
  suffix?: string;
  /** τ the line starts typing; omit for a line that is simply there (scrollback, recap) */
  at?: number;
  cps?: number;
  /** `dim` is Claude Code's static ✻; `clay` keeps the accent for a hero exit */
  tone?: "dim" | "clay";
  className?: string;
  style?: CSSProperties;
};

/** `✻ Cooked for 1m 30s`: the static completion glyph and line. */
export function CompletionLine({
  pastVerb,
  duration,
  suffix,
  at,
  cps = 60,
  tone = "dim",
  className,
  style,
}: CompletionLineProps) {
  const text = completionText(pastVerb, duration, suffix);
  const total = 3 + charLength(text);
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    if (at === undefined) return;
    const typed = typedChars(frame.tau, at, cps, total);
    setStyle(root, "clip-path", typed === 0 ? "inset(0 100% 0 0)" : typeClip(typed, total));
  });
  return (
    <div ref={ref} className={`tui tui-line ${className ?? ""}`} style={style} data-tui-replica>
      <span className={tone === "clay" ? "tui-clay" : "tui-dim"}>
        <StaticGlyph glyph="✻" />
      </span>
      <span className={tone === "clay" ? "tui-text" : "tui-dim"}>{` ${text}`}</span>
    </div>
  );
}
