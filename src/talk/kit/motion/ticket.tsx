import "./kit-motion.css";
import { useRef, type CSSProperties, type ReactNode } from "react";

import { prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";

import { num, put } from "./dom";
import { springFrom } from "./schedule";
import { stubSwing, tearClips } from "./tear";

/**
 * A ticket with a perforated stub, a punch hole (punched at `punchAt`) and a stub that tears along
 * the perforation over `tear`. `stamp` sits in the stamp slot over the body.
 */
export function Ticket({
  width = 760,
  height = 300,
  stubWidth = 170,
  punchAt,
  tear,
  stub,
  stamp,
  children,
  style,
}: {
  width?: number;
  height?: number;
  stubWidth?: number;
  punchAt?: number;
  tear?: { start: number; end: number };
  stub?: ReactNode;
  stamp?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const perf = width - stubWidth;
  const body = useRef<HTMLDivElement>(null);
  const stubEl = useRef<HTMLDivElement>(null);
  const hole = useRef<HTMLDivElement>(null);
  const geom = { width, height, perf, seed: width + height };

  useFrame((frame: Frame) => {
    const p = tear ? prog(frame.tau, tear.start, tear.end) : 0;
    const clips = tearClips(p, geom);
    put(body.current, "clip-path", clips.body);
    put(stubEl.current, "clip-path", clips.stub);
    const tip = p * height;
    put(stubEl.current, "transform-origin", `${perf}px ${num(tip, 1)}px`);
    put(
      stubEl.current,
      "transform",
      `translate3d(${num(p * 14, 1)}px, ${num(p * p * 30, 1)}px, 0) rotate(${num(stubSwing(p), 2)}deg)`,
    );
    const punch = punchAt === undefined ? 0 : springFrom(frame.tau, punchAt, SPRINGS.SNAP);
    put(hole.current, "transform", `translate(-50%, -50%) scale(${num(punch, 3)})`);
  });

  const notch = (x: number) =>
    `radial-gradient(circle 16px at ${x}px 0, transparent 15.5px, #000 16px), radial-gradient(circle 16px at ${x}px 100%, transparent 15.5px, #000 16px)`;

  return (
    <div className="km-ticket" style={{ width, height, ...style }}>
      <div
        ref={stubEl}
        className="km-ticket-part km-ticket-stub"
        style={{ maskImage: notch(perf), maskComposite: "intersect" }}
      >
        <div className="km-ticket-stub-content" style={{ left: perf, width: stubWidth }}>
          {stub}
        </div>
        <div
          ref={hole}
          className="km-ticket-hole"
          style={{ left: perf + stubWidth / 2, top: height * 0.28 }}
        />
      </div>
      <div
        ref={body}
        className="km-ticket-part km-ticket-body"
        style={{ maskImage: notch(perf), maskComposite: "intersect" }}
      >
        <div className="km-ticket-content" style={{ width: perf }}>
          {children}
        </div>
        <div className="km-ticket-perf" style={{ left: perf }} />
      </div>
      {stamp ? <div className="km-ticket-slot">{stamp}</div> : null}
    </div>
  );
}
