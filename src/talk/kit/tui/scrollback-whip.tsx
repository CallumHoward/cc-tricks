import "#/talk/tokens.css";
import "./tui.css";
import { useId, type ReactNode } from "react";

import type { Frame } from "#/engine/types";

import { CompletionLine } from "./completion-line";
import { recapPosition, smear, whipOffset } from "./tui-math";
import { setStyle, useFrameRef } from "./use-frame-ref";

const filterId = (raw: string) => `tui-whip-${raw.replace(/[^\w-]/g, "")}`;

function SmearFilter({ id }: { id: string }) {
  return (
    <svg className="tui-whip-filter" aria-hidden>
      <filter id={id} x="-5%" y="-120%" width="110%" height="340%">
        <feGaussianBlur stdDeviation="0 0" />
      </filter>
    </svg>
  );
}

function applySmear(
  layer: HTMLElement | null,
  root: Element,
  id: string,
  offset: (tau: number) => number,
  frame: Frame,
) {
  const { blur, stretch } = smear(offset, frame.tau, frame.v);
  const y = offset(frame.tau);
  setStyle(
    layer,
    "transform",
    `translate3d(0, ${y.toFixed(2)}px, 0) scaleY(${stretch.toFixed(4)})`,
  );
  const gauss = root.querySelector("feGaussianBlur");
  const sd = `0 ${blur.toFixed(2)}`;
  if (gauss && gauss.getAttribute("stdDeviation") !== sd) gauss.setAttribute("stdDeviation", sd);
  setStyle(layer, "filter", blur > 0.4 ? `url(#${id})` : "none");
}

export type ScrollbackWhipProps = {
  /** τ the smash-pan starts */
  at: number;
  dur?: number;
  /** Px the content travels; positive moves it down (the camera whips up the scrollback) */
  distance?: number;
  children: ReactNode;
  className?: string;
};

/** Vertical smash-pan of its children with a directional smear from τ velocity. */
export function ScrollbackWhip({
  at,
  dur = 0.5,
  distance = 1080,
  children,
  className,
}: ScrollbackWhipProps) {
  const id = filterId(useId());
  const offset = (tau: number) => whipOffset(tau, at, dur, distance);
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    applySmear(root.querySelector<HTMLElement>(".tui-whip"), root, id, offset, frame);
  });
  return (
    <div ref={ref} className={className} style={{ position: "absolute", inset: 0 }}>
      <SmearFilter id={id} />
      <div className="tui-whip">{children}</div>
    </div>
  );
}

export type RecapLine = { pastVerb: string; duration: string; suffix?: string };

export type ScrollbackRecapProps = {
  lines: readonly RecapLine[];
  /** τ the recap starts and its length; each line dwells at `y` in turn */
  at: number;
  dur: number;
  /** Vertical px between lines and the reading line's y in the parent */
  spacing?: number;
  x?: number;
  y?: number;
  /** Type class for the lines (default label size) */
  lineClassName?: string;
};

/** The outro recap: every completion line flies past in order, pausing on each so it reads. */
export function ScrollbackRecap({
  lines,
  at,
  dur,
  spacing = 132,
  x = 200,
  y = 500,
  lineClassName = "type-code",
}: ScrollbackRecapProps) {
  const id = filterId(useId());
  const offset = (tau: number) => recapPosition(tau, at, dur, lines.length) * spacing;
  const ref = useFrameRef<HTMLDivElement>((root: HTMLDivElement, frame: Frame) => {
    const layer = root.querySelector<HTMLElement>(".tui-whip");
    applySmear(layer, root, id, offset, frame);
    const pos = recapPosition(frame.tau, at, dur, lines.length);
    const rows = layer?.children ?? [];
    for (let i = 0; i < rows.length; i++) {
      setStyle(rows[i], "opacity", (1 - 0.7 * Math.min(1, Math.abs(i - pos))).toFixed(3));
    }
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      <SmearFilter id={id} />
      <div className="tui-whip">
        {lines.map((line, i) => (
          <CompletionLine
            // oxlint-disable-next-line react/no-array-index-key -- recap lines repeat (two "Crunched for 45s")
            key={i}
            {...line}
            tone="clay"
            className={lineClassName}
            style={{
              position: "absolute",
              left: x,
              top: y - i * spacing,
              transform: "translateY(-50%)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
