import { useRef } from "react";

import { outCubic, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { useFrame, useTrack } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { put } from "#/talk/kit/motion/dom";
import { springFrom } from "#/talk/kit/motion/schedule";
import { GLYPH_PATHS } from "#/talk/kit/tui";
import { scriptFor } from "#/talk/script";
import { TipTitle } from "#/talk/segments/shared/tip-title";
import { Live } from "#/talk/segments/tip-03-effort/bracket";

import { cursorAt, RINGED, stepAt, TARGETS, TB } from "./timing";

/** "LLM plans. System One clicks." broken after the first sentence. */
const TITLE = (scriptFor("b-browser").headline ?? "").replace(". ", ".\n");
const WIN = Object.freeze({ x: 160, y: 540, w: 1600, h: 330 });
const PLAN_LINES = [300, 250, 320, 210, 280];

function PlanCard() {
  const ref = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    const kids = ref.current?.children ?? [];
    for (let k = 0; k < kids.length; k++) {
      const u = prog(frame.tau, 261.55 + k * 0.12, 261.75 + k * 0.12, outCubic);
      put(kids[k] as HTMLElement, "transform", `scaleX(${u.toFixed(3)})`);
    }
  });
  return (
    <>
      <svg
        className="seg-abs seg-clay"
        viewBox="0 0 100 100"
        width={64}
        height={64}
        style={{ left: 200, top: 616 }}
        aria-hidden
      >
        <path d={GLYPH_PATHS["✽"]} fill="currentColor" />
      </svg>
      <div ref={ref} className="seg-abs" style={{ left: 290, top: 620, width: 340, height: 220 }}>
        {PLAN_LINES.map((w, k) => (
          <span key={w} className="b3-line" style={{ left: 0, top: k * 44, width: w }} />
        ))}
      </div>
    </>
  );
}

function Steps() {
  return (
    <>
      {TARGETS.map((t) => (
        <div
          key={`${t.x}-${t.y}`}
          className="b3-target"
          style={{ left: t.x - 110, top: t.y - 34, width: 220, height: 68 }}
        />
      ))}
      {TARGETS.slice(0, RINGED).map((t, k) => (
        <StepRing key={`ring-${t.x}-${t.y}`} k={k} />
      ))}
    </>
  );
}

function StepRing({ k }: { k: number }) {
  const t = TARGETS[k] ?? { x: 0, y: 0 };
  const ref = useTrack((tau: number) => ({ scale: springFrom(tau, stepAt(k), SPRINGS.SNAP) }));
  return <div ref={ref} className="b3-ring" style={{ left: t.x, top: t.y }} />;
}

function Cursor() {
  const ref = useTrack((tau: number) => {
    const p = cursorAt(tau);
    return { x: p.x, y: p.y, scale: tau >= 261.6 ? 1 : 0 };
  });
  return (
    <svg
      ref={ref}
      className="seg-abs"
      viewBox="0 0 40 52"
      width={40}
      height={52}
      style={{ left: 0, top: 0, transformOrigin: "0 0" }}
      aria-hidden
    >
      <path
        d="M2 2 L2 42 L13 32 L21 50 L28 47 L20 29 L35 29 Z"
        fill="var(--text)"
        stroke="var(--void)"
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** B-browser: one LLM call writes the plan; fast local decisions click through the page. */
export function BrowserPlate() {
  const strip = useTrack((tau: number) => ({ y: (1 - prog(tau, 261.1, 261.6, outCubic)) * 560 }));
  return (
    <Live from={TB.laya.holdEnd} to={TB.winEnd}>
      <TipTitle text={TITLE} settleBy={262.5} />
      <div ref={strip} className="seg-abs" style={{ inset: 0 }}>
        <div className="b3-window" style={{ left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h }}>
          <div className="b3-bar">
            <span className="b3-dot" />
            <span className="b3-dot" />
            <span className="b3-dot" />
            <span className="b3-url" />
          </div>
        </div>
        <PlanCard />
        <Steps />
        <Cursor />
      </div>
    </Live>
  );
}
