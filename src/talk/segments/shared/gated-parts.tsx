import type { CSSProperties, ReactNode } from "react";

import type { StyleValues } from "#/engine/stage/applier";
import { useTrack } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { charLength, sliceChars, typedChars } from "#/talk/kit/tui/tui-math";
import { setStyle, setText, typeClip, useFrameRef } from "#/talk/kit/tui/use-frame-ref";

/**
 * Shown only while from ≤ τ < to: a hard cut. Opacity as well as visibility, because kit children
 * (Pile tiles) set their own `visibility: visible`, which would leak through a hidden parent.
 */
export function Gate({
  from,
  to,
  children,
  style,
}: {
  from: number;
  to: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const ref = useFrameRef<HTMLDivElement>((el: HTMLDivElement, frame: Frame) => {
    const on = frame.tau >= from && frame.tau < to;
    setStyle(el, "visibility", on ? "visible" : "hidden");
    setStyle(el, "opacity", on ? "1" : "0");
  });
  return (
    <div
      ref={ref}
      style={{ position: "absolute", inset: 0, visibility: "hidden", opacity: 0, ...style }}
    >
      {children}
    </div>
  );
}

/** An element driven by a pure style function of τ. */
export function Drive({
  fn,
  style,
  className,
  children,
}: {
  fn: (tau: number, frame: Frame) => StyleValues;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useTrack(fn);
  return (
    <div ref={ref} className={className} style={{ position: "absolute", ...style }}>
      {children}
    </div>
  );
}

/** Mono text typed in whole cells from `at` (clip, so layout never changes). */
export function TypedMono({
  text,
  at,
  cps = 60,
  className = "type-label",
  style,
}: {
  text: string;
  at: number;
  cps?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const total = charLength(text);
  const ref = useFrameRef<HTMLDivElement>((el: HTMLDivElement, frame: Frame) => {
    const n = typedChars(frame.tau, at, cps, total);
    setStyle(el, "clip-path", n === 0 ? "inset(0 100% 0 0)" : typeClip(n, total));
  });
  return (
    <div
      ref={ref}
      className={className}
      style={{ position: "absolute", whiteSpace: "pre", ...style }}
    >
      {text}
    </div>
  );
}

/** Proportional text typed character by character, with a clay block caret while typing. */
export function TypedText({
  text,
  at,
  cps = 40,
  className,
  caret = false,
  style,
}: {
  text: string;
  at: number;
  cps?: number;
  className: string;
  caret?: boolean;
  style?: CSSProperties;
}) {
  const total = charLength(text);
  const ref = useFrameRef<HTMLDivElement>((el: HTMLDivElement, frame: Frame) => {
    const n = typedChars(frame.tau, at, cps, total);
    const [typed, mark, rest] = el.children;
    setText(typed, sliceChars(text, n));
    setText(rest, Array.from(text).slice(n).join(""));
    const typing = n > 0 && n < total;
    setStyle(mark, "visibility", caret && typing ? "visible" : "hidden");
  });
  return (
    <div
      ref={ref}
      className={className}
      style={{ position: "absolute", whiteSpace: "pre", ...style }}
    >
      <span>{text}</span>
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: "0.08em",
          height: "0.8em",
          margin: "0 -0.04em",
          verticalAlign: "-0.06em",
          background: "var(--clay)",
          visibility: "hidden",
        }}
      />
      <span style={{ visibility: "hidden" }} />
    </div>
  );
}
