import type { CSSProperties, ReactNode } from "react";

import type { StyleValues } from "#/engine/stage/applier";
import { useTrack } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { setStyle, useFrameRef } from "#/talk/kit/tui/use-frame-ref";

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
