import { useRef, type CSSProperties, type ReactNode } from "react";

import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { put } from "#/talk/kit/motion/dom";

/**
 * Rendered only while from ≤ τ < to. Uses `display`, not `visibility`: kit children (Pile tiles)
 * set `visibility: visible` themselves, which would leak through a hidden parent.
 */
export function DisplayWindow({
  from,
  to,
  children,
  className,
  style,
}: {
  from: number;
  to: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    put(ref.current, "display", frame.tau >= from && frame.tau < to ? "block" : "none");
  });
  return (
    <div ref={ref} className={className} style={{ display: "none", ...style }}>
      {children}
    </div>
  );
}
