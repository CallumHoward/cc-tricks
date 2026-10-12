import { inOutCubic, outCubic, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import type { StyleValues } from "#/engine/stage/applier";
import { useTrack } from "#/engine/stage/react";
import { RuleRise, Stamp } from "#/talk/kit/motion";
import { springFrom } from "#/talk/kit/motion/schedule";
import { GLYPH_PATHS } from "#/talk/kit/tui";
import { scriptFor } from "#/talk/script";

import { Layer, Live, Typed, Wiped } from "./bracket";
import {
  DIAL,
  DIAL_SEATS,
  EFFORT_GLYPHS,
  EFFORTS,
  glyphSize,
  OPUS_TARGETS,
  SPIN_AT,
  T3,
} from "./timing";
import { arcPoint, dialAngle, inCubic } from "./tracks";

const script = scriptFor("t3-then");
const [FOOT = "", L1 = "", L2 = "", L3 = ""] = script.lines;
const SETTLE = T3.lastGen.at - 0.8;
const EXIT = T3.lastGen.holdEnd;

/** Dial needle position in seats (0 = low … 4 = max): lands on medium, then creeps toward high. */
export function needleSeat(tau: number): number {
  const land = springFrom(tau, 137.0, SPRINGS.KNOB);
  return land + Math.max(0, tau - SETTLE) * (2.5 / 35);
}

/** One effort glyph: unrolls from the spinner onto its dial seat, then floats to its Opus point. */
export function glyphAt(i: number, tau: number): StyleValues {
  const seat = DIAL_SEATS[i] ?? SPIN_AT;
  const target = OPUS_TARGETS[i] ?? seat;
  const size = glyphSize(i);
  const s1 = T3.leave + i * 0.07;
  const u1 = prog(tau, s1, s1 + 0.8, outCubic);
  const s2 = T3.aa.chartStart + i * 0.05;
  const e2 = target.drop + 0.08;
  const u2 = prog(tau, s2, e2, inOutCubic);
  const gone = prog(tau, e2, e2 + 0.16, inCubic);
  const p = u2 > 0 ? arcPoint(seat, target, u2, 140) : arcPoint(SPIN_AT, seat, u1, 190);
  const px = u2 > 0 ? size + (40 - size) * u2 : 36 + (size - 36) * u1;
  const shown = tau >= T3.leave ? 1 : 0;
  return {
    x: p.x - 50,
    y: p.y - 50,
    scale: (px / 100) * (1 - gone) * shown,
    rotate: (1 - u1) * -270 + u2 * 180,
  };
}

function DialGlyph({ i }: { i: number }) {
  const ref = useTrack((tau: number) => glyphAt(i, tau));
  const glyph = EFFORT_GLYPHS[i] ?? "✳";
  return (
    <svg
      ref={ref}
      className="seg-abs seg-clay"
      viewBox="0 0 100 100"
      width={100}
      height={100}
      style={{ left: 0, top: 0, overflow: "visible" }}
      aria-hidden
    >
      <path d={GLYPH_PATHS[glyph]} fill="currentColor" />
    </svg>
  );
}

const ARC_R = DIAL.radius;
const arcD = (() => {
  const a0 = (dialAngle(0) * Math.PI) / 180;
  const a1 = (dialAngle(4) * Math.PI) / 180;
  const { x, y } = DIAL.center;
  return `M${x + ARC_R * Math.cos(a0)} ${y + ARC_R * Math.sin(a0)}A${ARC_R} ${ARC_R} 0 0 1 ${x + ARC_R * Math.cos(a1)} ${y + ARC_R * Math.sin(a1)}`;
})();

/** Things below the glyphs sink as the camera tilts up into the chart's sky. */
const sinkAt = (tau: number): StyleValues => {
  const u = prog(tau, EXIT, EXIT + 0.42, inCubic);
  return { y: u * 620, opacity: 1 - prog(tau, EXIT + 0.12, EXIT + 0.4) };
};

function Dial() {
  const arc = useTrack((tau: number) => ({
    "--draw": prog(tau, 136.3, 136.9, outCubic),
  }));
  const fill = useTrack((tau: number) => ({
    "--draw": prog(tau, 136.6, 137.0, outCubic) * (needleSeat(tau) / 4),
  }));
  const needle = useTrack((tau: number) => ({
    rotate: dialAngle(needleSeat(tau)),
    scale: springFrom(tau, 136.6, SPRINGS.SNAP),
  }));
  const labels = ["low", "medium", "high", "xhigh", "max"];
  return (
    <>
      <svg className="seg-abs" width={1920} height={1080} style={{ left: 0, top: 0 }} aria-hidden>
        <path
          ref={arc}
          d={arcD}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth={10}
          strokeLinecap="round"
          pathLength={1}
          style={{ strokeDasharray: "var(--draw) 1" }}
        />
        <path
          ref={fill}
          d={arcD}
          fill="none"
          stroke="var(--clay-wash-55)"
          strokeWidth={10}
          strokeLinecap="round"
          pathLength={1}
          style={{ strokeDasharray: "var(--draw) 1" }}
        />
      </svg>
      <div
        ref={needle}
        className="seg-abs"
        style={{
          left: DIAL.center.x,
          top: DIAL.center.y - 4,
          width: DIAL.radius - 96,
          height: 8,
          borderRadius: 4,
          background: "var(--clay)",
          transformOrigin: "0 50%",
        }}
      />
      <div
        className="seg-abs"
        style={{
          left: DIAL.center.x - 18,
          top: DIAL.center.y - 18,
          width: 36,
          height: 36,
          borderRadius: 18,
          background: "var(--clay)",
        }}
      />
      {labels.map((word, i) => {
        const a = (dialAngle(i) * Math.PI) / 180;
        const r = DIAL.radius + glyphSize(i) / 2 + 34;
        return (
          <Wiped
            key={word}
            at={136.5 + i * 0.06}
            dur={0.4}
            className="type-label seg-soft seg-abs"
            style={{
              left: DIAL.center.x + r * Math.cos(a),
              top: DIAL.center.y + r * Math.sin(a),
              translate: "-50% -50%",
            }}
          >
            <span aria-label={script.ui[i]}>{word}</span>
          </Wiped>
        );
      })}
    </>
  );
}

/** T3-then: the spinner's glyph cycle unrolls into an effort dial beside the last-gen numbers. */
export function DialPlate() {
  return (
    <Live from={T3.leave} to={T3.aa.holdEnd}>
      <div className="seg-abs" style={{ left: 160, top: 196 }}>
        <RuleRise text={"3. Manage\neffort levels"} settleBy={SETTLE - 0.2} exit={EXIT} />
      </div>
      <Layer track={sinkAt}>
        <Dial />
        <Wiped at={136.45} className="type-label seg-muted seg-abs" style={{ left: 160, top: 486 }}>
          {L1}
        </Wiped>
        <Typed
          text={L2}
          at={136.6}
          cps={48}
          className="type-code seg-hi seg-abs"
          style={{ left: 160, top: 536 }}
        />
        <Typed
          text={L3}
          at={136.75}
          cps={48}
          className="type-code seg-text seg-abs"
          style={{ left: 160, top: 590 }}
        />
        <Wiped
          at={136.95}
          dur={0.55}
          className="type-body seg-text seg-abs"
          style={{ left: 160, top: 668, width: 860 }}
        >
          {FOOT}
        </Wiped>
        <Stamp text={script.stamps[0] ?? ""} settleBy={SETTLE} style={{ left: 700, top: 856 }} />
      </Layer>
      {EFFORTS.map((effort, i) => (
        <DialGlyph key={effort} i={i} />
      ))}
    </Live>
  );
}
