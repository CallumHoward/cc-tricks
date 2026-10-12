import { useRef, type CSSProperties, type ReactNode } from "react";

import { outExpo, prog } from "#/engine/motion/ease";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { num, put } from "#/talk/kit/motion/dom";
import { Chevron, HOME } from "#/talk/kit/tui";
import { DisplayWindow } from "#/talk/segments/shared/display-window";

import { sinkAt } from "./tracks";

export const FILL: CSSProperties = { position: "absolute", inset: 0 };

/** Children rendered only while τ ∈ [from, to), filling the stage. */
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
  return (
    <DisplayWindow from={from} to={to} style={{ ...FILL, ...style }}>
      {children}
    </DisplayWindow>
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

/**
 * The submitted prompt as it sits in the transcript: `❯ text`, rising through its mask at `at` and
 * sinking back at `outAt`.
 */
export function Echo({
  text,
  at,
  outAt,
  style,
}: {
  text: string;
  at: number;
  outAt?: number;
  style?: CSSProperties;
}) {
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
          const y = (1 - u) * 1.1 + sinkAt(frame.tau, outAt);
          put(el, "transform", `translate3d(0, ${num(y * 100, 2)}%, 0)`);
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
