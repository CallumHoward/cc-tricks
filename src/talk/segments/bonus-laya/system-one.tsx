import { useRef } from "react";

import { outCubic, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { useFrame, useTrack } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";
import { RuleRise } from "#/talk/kit/motion";
import { put } from "#/talk/kit/motion/dom";
import { springFrom } from "#/talk/kit/motion/schedule";
import { StaticGlyph } from "#/talk/kit/tui";
import { scriptFor } from "#/talk/script";
import { Layer, Live, Typed, Wiped } from "#/talk/segments/tip-03-effort/bracket";
import { SPIN_AT } from "#/talk/segments/tip-03-effort/timing";
import { inCubic, type Pt } from "#/talk/segments/tip-03-effort/tracks";

import { chipsWritten, chipWidth, flickerBar, LEFT, RIGHT, TB } from "./timing";

const script = scriptFor("b-system-one");
const [FAST = "", SLOW = ""] = script.labels;
const [BOOK = "", AUTHOR = "", YEAR = ""] = script.ui;
const SETTLE = TB.one.at - 0.8;
const EXIT = TB.one.holdEnd;
const CHIPS = 24;

/** Bars track geometry of the b-laya ProbBars (stage px), so the flicker bars land in them. */
export const PROB = Object.freeze({ x: 300, y: 560, w: 1300, rowH: 36, gap: 34 });
const TRACK_X = PROB.x + 520 + 28;
const TRACK_W = PROB.w - 520 - 170 - 56;

const splitFrom = (to: Pt) => (tau: number) => {
  const u = prog(tau, TB.split, TB.split + 0.6, outCubic);
  return {
    x: (SPIN_AT.x - 18 - to.x) * (1 - u),
    y: (SPIN_AT.y - 18 - to.y) * (1 - u),
    scale: tau < TB.leave ? 0 : 1,
  };
};

function SpinnerRow({ at, glyph, verb }: { at: Pt; glyph: "✽" | "·"; verb: string }) {
  const ref = useTrack(splitFrom(at));
  return (
    <div
      ref={ref}
      className="tui tui-line type-label seg-abs"
      data-tui-replica
      style={{ left: at.x, top: at.y }}
    >
      <span className="tui-clay">
        <StaticGlyph glyph={glyph} />
      </span>
      <span className="seg-hi">{` ${verb}…`}</span>
    </div>
  );
}

function Chips() {
  const ref = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    const n = chipsWritten(frame.tau);
    const kids = ref.current?.children ?? [];
    for (let k = 0; k < kids.length; k++) {
      put(kids[k] as HTMLElement, "transform", `scaleX(${k < n ? 1 : 0})`);
    }
  });
  return (
    <div
      ref={ref}
      className="seg-abs b1-chips"
      style={{ left: LEFT.x, top: LEFT.y + 64, width: 540 }}
      aria-hidden
    >
      {Array.from({ length: CHIPS }, (_, k) => (
        <span key={`chip-${k + 1}`} className="b1-chip" style={{ width: chipWidth(k) }} />
      ))}
    </div>
  );
}

/** Flicker bar `i` in the right column; drains into its ProbBars track as b-laya begins. */
function flickerRect(i: number, tau: number, w: number) {
  const home = { x: RIGHT.x, y: RIGHT.y + 72 + i * 44, w: 520, h: 24 };
  const goal = { x: TRACK_X, y: PROB.y + i * (PROB.rowH + PROB.gap) + 4, w: TRACK_W, h: 28 };
  const u = prog(tau, EXIT, EXIT + 0.5, outCubic);
  const on = tau >= TB.split + 0.6;
  const fill = on ? flickerBar(i, w) * (1 - u) + 0.02 * u : 0;
  return {
    x: home.x + (goal.x - home.x) * u,
    y: home.y + (goal.y - home.y) * u,
    w: home.w + (goal.w - home.w) * u,
    fill,
  };
}

function FlickerBars() {
  const ref = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    const kids = ref.current?.children ?? [];
    for (let i = 0; i < kids.length; i++) {
      const r = flickerRect(i, frame.tau, frame.w);
      const el = kids[i] as HTMLElement;
      put(el, "transform", `translate3d(${r.x.toFixed(1)}px, ${r.y.toFixed(1)}px, 0)`);
      put(el, "width", `${r.w.toFixed(1)}px`);
      put(el.firstElementChild as HTMLElement, "transform", `scaleX(${r.fill.toFixed(3)})`);
    }
  });
  return (
    <div ref={ref} className="seg-abs" style={{ inset: 0 }} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={`bar-${i + 1}`} className="b1-bar">
          <div className="b1-bar__fill" />
        </div>
      ))}
    </div>
  );
}

function Book() {
  const rule = useTrack((tau: number) => ({ scaleX: prog(tau, 251.15, 251.5, outCubic) }));
  const rise = useTrack((tau: number) => ({ y: (1 - prog(tau, 251.3, 252.0, outCubic)) * 400 }));
  return (
    <>
      <div
        className="seg-abs"
        style={{ left: 740, top: 470, width: 420, height: 390, overflow: "hidden" }}
      >
        <div ref={rise} className="b1-book">
          <span className="type-body seg-text">{BOOK}</span>
          <span className="type-label seg-soft">{AUTHOR}</span>
          <span className="type-label seg-muted">{YEAR}</span>
        </div>
      </div>
      <div
        ref={rule}
        className="seg-abs"
        style={{
          left: 730,
          top: 858,
          width: 460,
          height: 4,
          background: "var(--clay)",
          transformOrigin: "50% 50%",
        }}
      />
    </>
  );
}

const sink = (tau: number) => {
  const u = prog(tau, EXIT, EXIT + 0.4, inCubic);
  return { y: u * 420, opacity: 1 - prog(tau, EXIT + 0.1, EXIT + 0.4) };
};

const fastPop = (tau: number) => ({ scale: springFrom(tau, 251.9, SPRINGS.SLAM) });

/** B-system-one: the spinner splits into a slow writer and a fast picker around the book. */
export function SystemOnePlate() {
  const pop = useTrack(fastPop);
  return (
    <>
      <Live from={TB.leave} to={EXIT + 0.5}>
        <div
          className="seg-abs"
          style={{ left: 160, top: 196, scale: 0.7, transformOrigin: "0 0" }}
        >
          <RuleRise
            text={"Bonus: Laya-ultrafast\nfor browser use"}
            settleBy={SETTLE - 0.2}
            exit={EXIT}
          />
        </div>
        <Layer track={sink}>
          <Wiped at={251.6} className="type-body seg-text seg-abs" style={{ left: 160, top: 404 }}>
            {script.lines[0]}
          </Wiped>
          <SpinnerRow at={LEFT} glyph="✽" verb="Ruminating" />
          <SpinnerRow at={RIGHT} glyph="·" verb="Pouncing" />
          <Chips />
          <Typed
            text={SLOW}
            at={251.6}
            cps={30}
            className="type-label seg-soft seg-abs"
            style={{ left: LEFT.x, top: 800 }}
          />
          <div
            ref={pop}
            className="type-label seg-text seg-abs"
            style={{ left: RIGHT.x, top: 800, transformOrigin: "0 50%" }}
          >
            {FAST}
          </div>
          <Book />
        </Layer>
      </Live>
      <Live from={TB.split + 0.5} to={TB.laya.barsAt + 0.05}>
        <FlickerBars />
      </Live>
    </>
  );
}
