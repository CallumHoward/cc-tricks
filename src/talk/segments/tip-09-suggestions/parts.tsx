import { useRef, type CSSProperties, type ReactNode } from "react";

import { outExpo, prog } from "#/engine/motion/ease";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { num, put } from "#/talk/kit/motion/dom";
import { Chevron, HOME } from "#/talk/kit/tui";

export const FILL: CSSProperties = { position: "absolute", inset: 0 };

/**
 * Children rendered only while τ ∈ [from, to). Uses `display` (written only when it flips): kit
 * parts set `visibility: visible` on themselves, which would show through a hidden parent.
 */
export function During({
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
  const ref = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    put(ref.current, "display", frame.tau >= from && frame.tau < to ? "block" : "none");
  });
  return (
    <div ref={ref} style={{ ...FILL, display: "none", ...style }}>
      {children}
    </div>
  );
}

/** A positioned layer whose style is written from τ every frame. */
export function Layer({
  write,
  children,
  style,
  className,
}: {
  write: (el: HTMLDivElement, frame: Frame) => void;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    if (ref.current) write(ref.current, frame);
  });
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/** The submitted prompt as it sits in the transcript: `❯ text`, rising through its mask at `at`. */
export function Echo({ text, at, style }: { text: string; at: number; style?: CSSProperties }) {
  return (
    <div
      className="tui type-code"
      data-tui-replica
      style={{ position: "absolute", left: HOME.textX, overflow: "hidden", ...style }}
    >
      <Layer
        className="tui-line"
        style={{ color: "var(--text)" }}
        write={(el, frame) => {
          const u = prog(frame.tau, at, at + 0.32, outExpo);
          put(el, "transform", `translate3d(0, ${num((1 - u) * 110, 2)}%, 0)`);
        }}
      >
        <span className="tui-clay">
          <Chevron />
        </span>
        <span>{` ${text}`}</span>
      </Layer>
    </div>
  );
}
