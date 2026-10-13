import type { CSSProperties } from "react";

import { SPRINGS } from "#/engine/motion/spring";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { springFrom } from "#/talk/kit/motion/schedule";
import { setStyle, useFrameRef } from "#/talk/kit/tui/use-frame-ref";

/** Letter i's entry (0 hidden below → 1 at rest) and its glow (0..1) riding a slow wave. */
function letterAt(i: number, tau: number, rho: number, at: number, stagger: number) {
  const k = springFrom(tau, at + i * stagger, SPRINGS.LAND);
  const wave = 0.5 + 0.5 * Math.sin(rho * 1.1 - i * 0.55);
  return { k, glow: k >= 1 ? wave : 0 };
}

/** Display type whose letters spring up one by one, then glow in a slow wave on ambient time. */
export function SpringLetters({
  text,
  at,
  stagger = 0.035,
  className,
  style,
}: {
  text: string;
  at: number;
  stagger?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const letters = Array.from(text);
  const ref = useFrameRef<HTMLSpanElement>((el: HTMLSpanElement, frame: Frame) => {
    const rho = ambientTime(frame);
    for (let i = 0; i < el.children.length; i++) {
      const s = letterAt(i, frame.tau, rho, at, stagger);
      const span = el.children[i] as HTMLElement;
      setStyle(
        span,
        "transform",
        `translate3d(0, ${((1 - s.k) * 0.9).toFixed(4)}em, 0) rotate(${((1 - s.k) * -10).toFixed(2)}deg)`,
      );
      setStyle(span, "opacity", Math.min(1, s.k * 3).toFixed(3));
      setStyle(
        span,
        "text-shadow",
        `0 0 ${(10 + 26 * s.glow).toFixed(1)}px rgb(235 159 127 / ${(0.15 + 0.4 * s.glow).toFixed(3)})`,
      );
    }
  });
  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline-block", whiteSpace: "pre", ...style }}
    >
      {letters.map((ch, i) => (
        // oxlint-disable-next-line react/no-array-index-key -- letters of fixed copy
        <span key={i} style={{ display: "inline-block", opacity: 0 }}>
          {ch}
        </span>
      ))}
    </span>
  );
}
