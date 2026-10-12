import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import type { Clock } from "#/engine/clock/clock";
import { inOutCubic, outExpo } from "#/engine/motion/ease";
import { keys } from "#/engine/motion/track";
import { StageProvider, useFrame } from "#/engine/stage/react";
import { createStage, type Stage } from "#/engine/stage/stage";
import {
  BAR_POSES,
  BoneSwap,
  ClayField,
  ContextBar,
  CssBed,
  GlyphDive,
  GrainOverlay,
  RewindOverlay,
  RuleRise,
  SPIN_GLYPH,
  SplitFlap,
  Stamp,
  Ticket,
  World,
  type Shot,
  type Zone,
} from "#/talk/kit/motion";

import "#/talk/tokens.css";
import "#/talk/talk.css";

type Search = { scene: string; tau?: number; v?: number; chrome: boolean };

export const Route = createFileRoute("/dev/kit-motion")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    scene: typeof s.scene === "string" ? s.scene : "world",
    tau: s.tau === undefined ? undefined : Number(s.tau),
    v: s.v === undefined ? undefined : Number(s.v),
    chrome: s.chrome !== false && s.chrome !== "0" && s.chrome !== 0,
  }),
  component: KitMotionGallery,
});

type Manual = { tau: number; v: number; playing: boolean; last: number };

function controls(state: Manual, span: readonly [number, number]) {
  return {
    seek(tau: number) {
      state.playing = false;
      state.tau = tau;
    },
    toggle() {
      state.playing = !state.playing;
      if (state.tau >= span[1]) state.tau = span[0];
    },
    reverse() {
      state.v = -state.v;
    },
  };
}

function manualClock(state: Manual): Clock {
  return {
    sample(t) {
      if (state.playing) state.tau += (t - state.last) * state.v;
      state.last = t;
      return { tau: state.tau, v: state.playing ? state.v : state.v };
    },
    dispatch() {},
    target: 0,
    subscribe: () => () => {},
    plan: () => [],
  };
}

const ZONES: Zone[] = [
  { id: "sys", size: 14, state: "cached", label: "system" },
  { id: "tools", size: 18, state: "cached", label: "tools" },
  { id: "hist", size: 34, state: "cold", label: "history" },
  { id: "new", size: keys([0.4, 4], [1.6, 12, outExpo]), state: "paid", label: "new" },
  { id: "out", size: 8, state: "output", label: "reply" },
];

const WORLD_SHOTS: Shot[] = [
  { at: 0 },
  { at: 1.6, x: 230, y: 500, zoom: 3.2, roll: -4, ease: inOutCubic },
  { at: 2.4, x: 230, y: 500, zoom: 3.4, roll: -4 },
  { at: 3.4, x: 800, y: 760, zoom: 1.4, roll: 0, tilt: 64, ease: inOutCubic },
  { at: 4.6, x: 960, y: 540, zoom: 1, tilt: 0, ease: inOutCubic },
];

function HomeShot() {
  return (
    <>
      <div
        className="type-label"
        style={{ position: "absolute", left: 200, top: 482, color: "var(--clay)" }}
      >
        ✳ <span style={{ color: "var(--text)" }}>Simmering… (12s · ↓ 1,031.4k tokens)</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 560,
          borderTop: "2px solid var(--muted)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 680,
          borderTop: "2px solid var(--muted)",
        }}
      />
      <div
        className="type-code"
        style={{ position: "absolute", left: 200, top: 596, color: "var(--text)" }}
      >
        ❯ 2. Keep the cache warm
      </div>
      <ContextBar zones={ZONES} />
    </>
  );
}

const SCENES: Record<string, { span: [number, number]; render: () => ReactNode }> = {
  world: {
    span: [0, 5],
    render: () => (
      <>
        <CssBed />
        <World camera={WORLD_SHOTS}>
          <HomeShot />
        </World>
      </>
    ),
  },
  type: {
    span: [0, 4],
    render: () => (
      <>
        <CssBed />
        <div style={{ position: "absolute", left: 160, top: 260 }}>
          <RuleRise className="type-hero" text={"10 tips for\nsaving tokens"} settleBy={1.6} />
        </div>
        <Stamp text="Anecdotal" settleBy={2.4} style={{ left: 1440, top: 720 }} />
        <Stamp
          text="Cheaper and better (then)"
          settleBy={2.9}
          rotate={8}
          style={{ left: 640, top: 860 }}
        />
      </>
    ),
  },
  clay: {
    span: [0, 3.2],
    render: () => (
      <>
        <CssBed />
        <HomeShot />
        <ClayField
          text={"Cold is 25–80×\nthe price of warm."}
          cut={0.4}
          settleBy={1.6}
          iris={{ start: 2.2, end: 3, to: { x: 1300, y: 740 } }}
        />
      </>
    ),
  },
  dive: {
    span: [0, 2.6],
    render: () => (
      <>
        <CssBed />
        <GlyphDive
          at={{ x: 196, y: 484 }}
          size={36}
          glyph={SPIN_GLYPH}
          start={0.4}
          end={2}
          plate={
            <>
              <CssBed tone="halftone" />
              <div style={{ position: "absolute", left: 160, top: 300 }}>
                <RuleRise text={"Use\nsubagents"} settleBy={2.4} />
              </div>
            </>
          }
        >
          <div
            className="type-label"
            style={{ position: "absolute", left: 244, top: 482, color: "var(--text)" }}
          >
            Orchestrating… (4s · ↓ 97.3k tokens)
          </div>
          <div
            style={{
              position: "absolute",
              left: 160,
              right: 160,
              top: 560,
              borderTop: "2px solid var(--muted)",
            }}
          />
        </GlyphDive>
      </>
    ),
  },
  bar: {
    span: [0, 4],
    render: () => (
      <>
        <CssBed />
        <ContextBar
          zones={ZONES}
          x={360}
          y={620}
          width={1200}
          pose={BAR_POSES.flat}
          keys={{
            height: keys([0.4, 12], [1.2, 96, inOutCubic], [2.2, 96], [3.2, 1500, inOutCubic]),
            labels: keys([1, 0], [1.6, 1, outExpo], [2.2, 1], [2.6, 0]),
            pitch: keys([2.2, 0], [3.2, 72, inOutCubic]),
            scroll: keys([2.2, 0], [4, 400]),
          }}
        />
      </>
    ),
  },
  bone: {
    span: [0, 4],
    render: () => (
      <BoneSwap wipes={[{ start: 0.4, end: 1.4, to: "bone", angle: -12 }]}>
        <div style={{ position: "absolute", left: 160, top: 120 }}>
          <RuleRise
            text="Offers come and go. Keep an eye out."
            className="type-headline"
            settleBy={2.2}
          />
        </div>
        <div style={{ position: "absolute", left: 160, top: 420, display: "flex", gap: 80 }}>
          <Ticket
            punchAt={2.2}
            stub={<div className="type-label">Oct 23</div>}
            stamp={
              <Stamp
                text="Community terms"
                settleBy={2.6}
                rotate={-10}
                style={{ left: 0, top: 0 }}
              />
            }
          >
            <div className="type-body">Full reset</div>
            <div className="type-label" style={{ color: "var(--ink-soft)", marginTop: 16 }}>
              Saved in Settings › Usage
            </div>
          </Ticket>
          <Ticket
            tear={{ start: 2.4, end: 4.2 }}
            stub={<div className="type-label">Nov 4</div>}
            stamp={<Stamp text="Closed" settleBy={2.8} rotate={9} style={{ left: 0, top: 0 }} />}
          >
            <div className="type-body">Cloud sessions credit</div>
            <div className="type-label" style={{ color: "var(--ink-soft)", marginTop: 16 }}>
              Claim window closed 7 Oct.
            </div>
          </Ticket>
        </div>
      </BoneSwap>
    ),
  },
  flap: {
    span: [0, 3],
    render: () => (
      <>
        <CssBed />
        <div style={{ position: "absolute", left: 360, top: 330 }}>
          <SplitFlap
            start={0.3}
            rows={["CURSOR       CLAUDE CODE", "TTL 5M       TTL 1H", "WRITE 1.25×  WRITE 2×"]}
          />
        </div>
      </>
    ),
  },
  rewind: {
    span: [0, 2],
    render: () => (
      <>
        <CssBed />
        <HomeShot />
        <RewindOverlay />
      </>
    ),
  },
};

function TauReadout({ state }: { state: Manual }) {
  const ref = (el: HTMLSpanElement | null) => {
    if (el) el.textContent = state.tau.toFixed(2);
  };
  useFrame((f) => {
    const el = document.getElementById("km-tau");
    if (el) el.textContent = `τ ${f.tau.toFixed(2)}  v ${f.v.toFixed(2)}`;
  });
  return <span id="km-tau" ref={ref} />;
}

function KitMotionGallery() {
  const search = Route.useSearch();
  const scene = SCENES[search.scene] ?? (SCENES.world as (typeof SCENES)[string]);
  const [state] = useState<Manual>(() => ({
    tau: search.tau ?? scene.span[0],
    v: search.v ?? 1,
    playing: search.tau === undefined,
    last: 0,
  }));
  const [ctl] = useState(() => controls(state, scene.span));
  const [stage] = useState<Stage>(() => createStage({ clock: manualClock(state) }));
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    stage.start();
    const fit = () =>
      setScale(
        Math.min(window.innerWidth / 1920, (window.innerHeight - (search.chrome ? 56 : 0)) / 1080),
      );
    fit();
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      stage.stop();
    };
  }, [stage, search.chrome]);

  return (
    <StageProvider stage={stage}>
      <div className="talk-page">
        <div
          className="stage-surface"
          style={{
            top: 0,
            left: 0,
            width: 1920,
            height: 1080,
            transformOrigin: "0 0",
            transform: `scale(${scale})`,
          }}
        >
          {scene.render()}
          <GrainOverlay />
        </div>
        {search.chrome ? (
          <div
            className="type-label"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: 56,
              display: "flex",
              gap: 16,
              alignItems: "center",
              padding: "0 16px",
              fontSize: 16,
              background: "var(--bg-deep)",
            }}
          >
            {Object.keys(SCENES).map((id) => (
              <a
                key={id}
                href={`?scene=${id}`}
                style={{ color: id === search.scene ? "var(--clay)" : "var(--soft)" }}
              >
                {id}
              </a>
            ))}
            <input
              type="range"
              aria-label="tau"
              min={scene.span[0]}
              max={scene.span[1]}
              step={0.01}
              defaultValue={state.tau}
              style={{ flex: 1 }}
              onInput={(e) => ctl.seek(Number(e.currentTarget.value))}
            />
            <button type="button" onClick={() => ctl.toggle()}>
              play
            </button>
            <button type="button" onClick={() => ctl.reverse()}>
              reverse
            </button>
            <TauReadout state={state} />
          </div>
        ) : null}
      </div>
    </StageProvider>
  );
}
