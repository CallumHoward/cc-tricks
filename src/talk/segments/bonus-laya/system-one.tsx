import { useRef } from "react";

import { inOutCubic, outCubic, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { useFrame, useTrack } from "#/engine/stage/react";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { ExtLink } from "#/talk/kit/ext-link";
import { put } from "#/talk/kit/motion/dom";
import { springFrom } from "#/talk/kit/motion/schedule";
import { StaticGlyph } from "#/talk/kit/tui";
import { LINKS, scriptFor } from "#/talk/script";
import { TipTitle } from "#/talk/segments/shared/tip-title";
import { Layer, Live, Typed } from "#/talk/segments/tip-03-effort/bracket";
import { SPIN_AT } from "#/talk/segments/tip-03-effort/timing";
import { inCubic, type Pt } from "#/talk/segments/tip-03-effort/tracks";

import { answerBar, LAND } from "./laya-plate";
import { chipsWritten, chipWidth, flickerBar, LEFT, RIGHT, TB } from "./timing";

const script = scriptFor("b-system-one");
const [FAST = "", SLOW = ""] = script.labels;
const [BOOK = "", AUTHOR = "", YEAR = ""] = script.ui;
const COVER = Object.freeze({ src: "/talk/refs/thinking-fast-and-slow.webp", w: 267, h: 400 });
/** Cover box on stage: centred between the two spinners, standing on the clay shelf at y = 858. */
const COVER_AT = Object.freeze({ x: 960 - COVER.w / 2, y: 858 - COVER.h });
const SETTLE = TB.one.at - 0.8;
const EXIT = TB.one.holdEnd;
const CHIPS = 24;

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

/** Flicker bar `i` in the right column; flies into the Laya window's answer bar `i` as it lands. */
export function flickerRect(i: number, tau: number, w: number) {
  const home = { x: RIGHT.x, y: RIGHT.y + 72 + i * 44, w: 520, h: 24 };
  const bar = answerBar(i);
  const goal = { x: bar.x, y: bar.y - 3, w: bar.w, h: 6 };
  const u = prog(tau, EXIT, LAND, inOutCubic);
  const on = tau >= TB.split + 0.6;
  const fill = on ? flickerBar(i, w) * (1 - u) + u : 0;
  return {
    x: home.x + (goal.x - home.x) * u,
    y: home.y + (goal.y - home.y) * u,
    w: home.w + (goal.w - home.w) * u,
    h: home.h + (goal.h - home.h) * u,
    fill,
    opacity: 1 - prog(tau, LAND, LAND + 0.35),
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
      put(el, "height", `${r.h.toFixed(1)}px`);
      put(el, "opacity", r.opacity.toFixed(3));
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

/** The real cover rises onto the clay shelf, turned slightly in 3D and turning on ambient time. */
function Book() {
  const rule = useTrack((tau: number) => ({ scaleX: prog(tau, 251.15, 251.5, outCubic) }));
  const rise = useTrack((tau: number, frame: Frame) => {
    const rho = ambientTime(frame);
    return {
      y: (1 - prog(tau, 251.3, 252.0, outCubic)) * 460,
      "--ry": -10 + 4 * Math.sin(rho * 0.45),
      "--rx": 3 * Math.sin(rho * 0.3 + 1),
    };
  });
  return (
    <>
      <div
        className="seg-abs"
        style={{
          left: COVER_AT.x - 60,
          top: COVER_AT.y - 60,
          width: COVER.w + 120,
          height: COVER.h + 60,
          overflow: "hidden",
        }}
      >
        <div ref={rise} className="seg-shot" style={{ position: "absolute", inset: 0 }}>
          <div className="seg-shot__tilt">
            <img
              className="b1-cover"
              src={COVER.src}
              alt={`${BOOK}, ${AUTHOR}, ${YEAR}`}
              width={COVER.w}
              height={COVER.h}
              decoding="sync"
              loading="eager"
              draggable={false}
              style={{ left: 60, top: 60, width: COVER.w, height: COVER.h }}
            />
          </div>
        </div>
      </div>
      <div
        ref={rule}
        className="seg-abs"
        style={{
          left: COVER_AT.x - 70,
          top: COVER_AT.y + COVER.h,
          width: COVER.w + 140,
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
        <ExtLink href={LINKS.laya}>
          <TipTitle
            text={"Bonus: Laya-ultrafast\nfor browser use"}
            settleBy={SETTLE - 0.2}
            exit={EXIT}
          />
        </ExtLink>
        <Layer track={sink}>
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
      <Live from={TB.split + 0.5} to={LAND + 0.4}>
        <FlickerBars />
      </Live>
    </>
  );
}
