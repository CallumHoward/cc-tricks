import "#/talk/kit/motion/kit-motion.css";
import { useRef, type CSSProperties, type ReactNode } from "react";

import { SPRINGS } from "#/engine/motion/spring";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { num, put } from "#/talk/kit/motion/dom";
import { springFrom } from "#/talk/kit/motion/schedule";
import { stubSwing, tearClips } from "#/talk/kit/motion/tear";

/**
 * The kit's Ticket with the tear driven by a progress function of τ (the kit's is a linear window),
 * so a tear can run fast into a stop and creep through the hold.
 */
export function OfferTicket({
  width = 760,
  height = 300,
  stubWidth = 120,
  punchAt,
  punchY = 0.24,
  tear,
  stub,
  padding = "34px 28px",
  children,
  style,
}: {
  width?: number;
  height?: number;
  stubWidth?: number;
  punchAt?: number;
  /** Punch hole height as a fraction of the ticket */
  punchY?: number;
  tear?: (tau: number) => number;
  stub?: ReactNode;
  padding?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const perf = width - stubWidth;
  const body = useRef<HTMLDivElement>(null);
  const stubEl = useRef<HTMLDivElement>(null);
  const hole = useRef<HTMLDivElement>(null);
  const geom = { width, height, perf, seed: width + height };

  useFrame((frame: Frame) => {
    const p = tear ? tear(frame.tau) : 0;
    const clips = tearClips(p, geom);
    put(body.current, "clip-path", clips.body);
    put(stubEl.current, "clip-path", clips.stub);
    put(stubEl.current, "transform-origin", `${perf}px ${num(p * height, 1)}px`);
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
        <div
          className="km-ticket-stub-content"
          style={{ left: perf, width: stubWidth, padding: 0 }}
        >
          {stub}
        </div>
        <div
          ref={hole}
          className="km-ticket-hole"
          style={{
            left: perf + stubWidth / 2,
            top: height * punchY,
            boxShadow: "inset 0 3px 0 rgb(0 0 0 / 25%), 0 0 0 3px var(--clay)",
          }}
        />
      </div>
      <div
        ref={body}
        className="km-ticket-part km-ticket-body"
        style={{ maskImage: notch(perf), maskComposite: "intersect" }}
      >
        <div className="km-ticket-content" style={{ width: perf, padding }}>
          {children}
        </div>
        <div className="km-ticket-perf" style={{ left: perf }} />
      </div>
    </div>
  );
}
