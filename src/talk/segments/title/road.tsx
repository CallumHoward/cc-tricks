import { useRef } from "react";

import { clamp, inOutCubic, inOutQuad, inQuad, lerp, outExpo, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { keys } from "#/engine/motion/track";
import { useFrame } from "#/engine/stage/react";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { BAR_POSES, ContextBar, type Zone } from "#/talk/kit/motion";
import { num, put } from "#/talk/kit/motion/dom";
import { springFrom } from "#/talk/kit/motion/schedule";
import { Counter, GLYPH_PATHS, HOME, PromptBox, punch } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { scriptFor } from "#/talk/script";
import { BOT_HOME } from "#/talk/segments/shared/home";

import { Mover, Rig, Rise, Typed, Win } from "./lib";
import {
  BLOCK_COUNT,
  HORIZON_Y,
  ROAD,
  SPOILER_SIZES,
  SUN,
  T,
  blockAt,
  holdPush,
  laneScroll,
  rayRotation,
  roadFraming,
  spoilerPush,
} from "./tracks";

const title = scriptFor("title");
const spoiler = scriptFor("spoiler");
const [sysL, toolsL, claudeL, msgL, resultsL] = spoiler.labels;

const ZONES: readonly Zone[] = [
  { id: "system", size: SPOILER_SIZES.system, state: "cached", label: sysL },
  { id: "tools", size: SPOILER_SIZES.tools, state: "cached", label: toolsL },
  { id: "claude-md", size: SPOILER_SIZES.claude, state: "cached", label: claudeL },
  { id: "messages", size: SPOILER_SIZES.messages, state: "paid", label: msgL },
  { id: "results", size: SPOILER_SIZES.results, state: "paid", label: resultsL },
];

const SCROLL_KEYS = keys(
  ...Array.from(
    { length: 49 },
    (_, i) => [T.diveEnd + i * 0.2, laneScroll(T.diveEnd + i * 0.2)] as const,
  ),
);

const BAR_KEYS = {
  pitch: keys(
    [T.diveEnd, 0],
    [T.roadEnd, ROAD.pitch, inOutCubic],
    [T.dollyEnd, ROAD.pitch],
    [T.craneEnd, 0, inOutCubic],
  ),
  height: keys(
    [T.diveEnd, 12],
    [T.roadEnd, ROAD.height, inOutCubic],
    [T.dollyEnd, ROAD.height],
    [T.craneEnd, 96, (u: number) => 1 - (1 - u) ** 4],
    [22.2, 96],
    [22.8, 12, inOutCubic],
  ),
  labels: keys([T.labelsAt, 0], [T.labelsAt + 0.6, 1, outExpo], [22.0, 1], [22.3, 0, inQuad]),
  scroll: SCROLL_KEYS,
};

/** Bar framing: home bar → road (cold open), road → labeled bar (crane), plus a slow creep left. */
function roadPlace(tau: number) {
  const f = roadFraming(tau);
  const s = 1 + f * (ROAD.scale - 1);
  const tx = lerp(ROAD.origin.x, ROAD.at.x, f) - s * ROAD.origin.x;
  const ty = lerp(ROAD.origin.y, ROAD.at.y, f) - s * ROAD.origin.y;
  const creep =
    -64 *
    prog(tau, T.spoilerTypeAt + 0.6, T.spoilerExit) *
    (1 - inOutCubic(prog(tau, T.spoilerExit, 22.7)));
  return { x: tx + creep, y: ty, s };
}

const SPOKE_SCALE_AT_DIVE = 10.3 * (2.4 / 4.4);

function sunPlace(tau: number) {
  const u = inOutCubic(prog(tau, T.diveEnd, T.roadEnd));
  const dolly = inQuad(prog(tau, T.titleHoldEnd, T.dollyEnd));
  const push = holdPush(tau);
  return {
    x: lerp(960, SUN.x, u),
    y: lerp(540, SUN.y, u) - dolly * 900,
    s: (1 + dolly * 1.5) * push,
    hidden: tau > T.dollyEnd,
  };
}

function Sun() {
  const spokes = useRef<SVGGElement>(null);
  const disc = useRef<HTMLDivElement>(null);
  const rays = useRef<SVGGElement>(null);
  useFrame((frame: Frame) => {
    const { tau } = frame;
    const u = inOutCubic(prog(tau, T.diveEnd, T.roadEnd));
    const k = Math.exp(lerp(Math.log(SPOKE_SCALE_AT_DIVE), 0, u));
    const rot = rayRotation(tau);
    put(spokes.current, "transform", `rotate(${num(rot, 2)}deg) scale(${num(k * 4.4, 4)})`);
    const d = springFrom(tau, T.diveEnd + 0.25, SPRINGS.SNAP);
    put(disc.current, "transform", `translate(-50%, -50%) scale(${num(d, 4)})`);
    const r = clamp(prog(tau, T.diveEnd + 0.3, T.roadEnd + 0.2, outExpo));
    // Rays repeat every 30°, so ambient spin wraps seamlessly and keeps turning at the stop
    const spin = (((ambientTime(frame) - tau) * 40) % 30) - rot * 0.6;
    put(rays.current, "transform", `rotate(${num(spin, 2)}deg) scale(${num(0.3 + 0.7 * r, 4)})`);
    put(rays.current, "opacity", num(r * 0.55, 3));
  });
  return (
    <Mover place={sunPlace}>
      <div
        ref={disc}
        className="so-sun-disc"
        style={{ left: 0, top: 0, width: SUN.r * 2, height: SUN.r * 2 }}
      />
      <svg
        viewBox="-500 -500 1000 1000"
        width={1000}
        height={1000}
        style={{ position: "absolute", left: -500, top: -500, overflow: "visible" }}
        aria-hidden
      >
        <g ref={rays} stroke="var(--clay-hi)" strokeWidth={3} strokeLinecap="round">
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const r0 = SUN.r * 1.5;
            const r1 = i % 2 ? 300 : 420;
            return (
              <line
                key={`ray-${a.toFixed(3)}`}
                x1={Math.cos(a) * r0}
                y1={Math.sin(a) * r0}
                x2={Math.cos(a) * r1}
                y2={Math.sin(a) * r1}
              />
            );
          })}
        </g>
        <g ref={spokes}>
          <path d={GLYPH_PATHS["✳"]} transform="translate(-50 -50)" fill="var(--clay-hi)" />
        </g>
      </svg>
    </Mover>
  );
}

function Blocks() {
  const els = useRef<(HTMLDivElement | null)[]>([]);
  useFrame((frame: Frame) => {
    for (let i = 0; i < BLOCK_COUNT; i++) {
      const el = els.current[i];
      const b = blockAt(i, frame.tau);
      put(el, "visibility", b.visible ? "inherit" : "hidden");
      if (!b.visible) continue;
      put(
        el,
        "transform",
        `translate3d(${num(b.x - b.size / 2, 2)}px, ${num(b.y - b.size / 2, 2)}px, 0) rotate(${num(b.rotate, 2)}deg)`,
      );
      put(el, "width", `${num(b.size, 1)}px`);
      put(el, "height", `${num(b.size, 1)}px`);
    }
  });
  return (
    <Mover
      place={(tau: number) => {
        const d = inQuad(prog(tau, T.titleHoldEnd, T.dollyEnd));
        const s = 1 + d * 2.5;
        return {
          x: SUN.x * (1 - s),
          y: HORIZON_Y * (1 - s) + d * 300,
          s,
          hidden: tau > T.dollyEnd || tau < T.diveEnd,
        };
      }}
    >
      {Array.from({ length: BLOCK_COUNT }, (_, i) => (
        <div
          key={`block-${i + 1}`}
          className="so-block"
          ref={(el) => {
            els.current[i] = el;
          }}
        >
          <svg viewBox="0 0 100 100" aria-hidden>
            <path d={GLYPH_PATHS["✳"]} fill="currentColor" />
          </svg>
        </div>
      ))}
    </Mover>
  );
}

const ROAD_BOT = { width: 216, height: 180 };
const ROAD_BOT_ACTS: readonly Act[] = [
  { kind: "walk", at: T.walkStart, dur: T.walkEnd - T.walkStart, dx: 0, stepRate: 4 },
  { kind: "look", at: T.walkEnd, dur: Number.POSITIVE_INFINITY, x: -0.85, y: -0.75 },
];

function roadBotPlace(tau: number) {
  const walk = 1 - prog(tau, T.walkStart, T.walkEnd, inOutQuad);
  const dolly = inQuad(prog(tau, T.titleHoldEnd, T.dollyEnd - 0.3));
  const feetY = HORIZON_Y + 30;
  const s = 1 + dolly * 5;
  return {
    x: SUN.x - (ROAD_BOT.width / 2) * s + walk * 230,
    y: feetY - ROAD_BOT.height * 0.9 * s + dolly * 1100,
    s,
    hidden: tau < T.walkStart - 0.1 || tau > T.dollyEnd,
  };
}

/** The hero "10": lands as "00" on the slam with a forward-only punch, then rolls up. */
function HeroTen() {
  const ref = useRef<HTMLSpanElement>(null);
  useFrame((frame: Frame) => {
    const k = punch(frame.tau, frame.v, T.slam);
    put(ref.current, "transform", `scale(${num(1 + 0.08 * k, 4)})`);
  });
  return (
    <span ref={ref} className="so-hero-ten">
      <Counter
        value={keys([T.slam, 0], [T.odometerEnd, 10, inOutQuad])}
        format="int"
        minDigits={2}
        slots={2}
      />
    </span>
  );
}

function TitleType() {
  return (
    <Mover
      place={(tau: number) => {
        const d = inQuad(prog(tau, T.titleHoldEnd, T.titleHoldEnd + 0.8));
        return { y: -d * 1000, x: -d * 120, s: 1 + d * 0.25, hidden: tau > T.dollyEnd };
      }}
    >
      <Rise
        className="type-hero"
        text={"tips for\nsaving tokens"}
        lead={{ id: "ten", node: <HeroTen /> }}
        startAt={T.titleRise}
        stagger={0.12}
        style={{ position: "absolute", left: 160, top: HORIZON_Y - 452 }}
      />
      <div className="so-byline type-label" style={{ left: 166, top: HORIZON_Y + 26 }}>
        <Typed text={title.lines[0] ?? ""} at={T.bylineAt} cps={40} />
      </div>
    </Mover>
  );
}

const SPOILER_BOT_ACTS: readonly Act[] = [
  { kind: "hop", at: 17.35, height: 90 },
  { kind: "walk", at: 18.3, dur: 3.7, dx: 0, stepRate: 2.2 },
  { kind: "look", at: 18.3, dur: 3.6, x: 0.4, y: 0.25 },
  { kind: "hop", at: T.exitHop, height: 110 },
];

const BAR_TOP = 740 - 96;
const SPOILER_BOT_X = 1000;

function spoilerBotPlace(tau: number) {
  const enter = 1 - outExpo(prog(tau, 17.5, 17.95));
  const walk = 90 * prog(tau, 18.3, T.spoilerExit);
  const air = inOutQuad(prog(tau, T.exitHop + 0.16, T.exitHop + 0.58));
  const dx = lerp(SPOILER_BOT_X + walk - BOT_HOME.left, 0, air);
  const dy = lerp(BAR_TOP - 560, 0, air) + enter * 200;
  return {
    x: BOT_HOME.left + dx,
    y: BOT_HOME.top + dy,
    hidden: tau < 17.3,
  };
}

/** Spoiler framing with a slow sway that only advances on ambient time, so the stop reads as slo-mo. */
function spoilerGroupPlace(tau: number, frame: Frame) {
  const a = ambientTime(frame) - tau;
  return spoilerPush(tau, 22 * Math.sin(a * 1.6));
}

/** Everything after the dive: the road under the ✳ sun, the title, then the labeled spoiler bar. */
export function RoadPlate() {
  const sky = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    const p = sunPlace(frame.tau);
    put(sky.current, "--sun-x", `${num(p.x, 1)}px`);
    put(sky.current, "--sun-y", `${num(p.y, 1)}px`);
    put(sky.current, "opacity", num(1 - prog(frame.tau, T.dollyEnd, T.craneEnd - 0.2), 3));
  });
  return (
    <Win from={T.diveStart} to={T.end}>
      <Win from={-1} to={T.craneEnd}>
        <div ref={sky} className="so-sky" />
        <Sun />
        <Mover
          place={(tau: number) => ({
            y: HORIZON_Y + inQuad(prog(tau, T.titleHoldEnd, T.dollyEnd)) * 400,
            sx: inOutCubic(prog(tau, T.diveEnd + 0.4, T.roadEnd + 0.3)),
            x: 960 * (1 - inOutCubic(prog(tau, T.diveEnd + 0.4, T.roadEnd + 0.3))),
            hidden: tau > T.dollyEnd,
          })}
          className="so-horizon"
          style={{ width: 1920 }}
        />
      </Win>
      <Mover place={spoilerGroupPlace} style={{ width: 1920, height: 1080 }}>
        <Mover place={roadPlace}>
          <ContextBar zones={ZONES} pose={BAR_POSES.flat} keys={BAR_KEYS} />
        </Mover>
        <Win from={T.craneEnd} to={T.end}>
          <Mover
            place={(tau: number) => ({
              clip: tau < 18 ? `inset(0 0 ${1080 - BAR_TOP}px 0)` : "none",
            })}
            style={{ width: 1920, height: 1080 }}
          >
            <Mover
              place={spoilerBotPlace}
              style={{ width: BOT_HOME.width, height: BOT_HOME.height }}
            >
              <Rig acts={SPOILER_BOT_ACTS} />
            </Mover>
          </Mover>
        </Win>
      </Mover>
      <Win from={-1} to={T.craneEnd}>
        <Blocks />
        <Mover place={roadBotPlace} style={{ width: ROAD_BOT.width, height: ROAD_BOT.height }}>
          <Rig acts={ROAD_BOT_ACTS} silhouette />
        </Mover>
        <TitleType />
      </Win>
      <Win from={T.spoilerExit + 0.3} to={T.end}>
        <Mover
          place={(tau: number) => {
            const u = 50 * (1 - inOutCubic(prog(tau, 22.45, 22.95)));
            return { clip: `inset(-20px ${num(u, 2)}% -20px ${num(u, 2)}%)` };
          }}
          style={{ left: HOME.left, top: HOME.promptTop }}
        >
          <PromptBox className="type-code" />
        </Mover>
      </Win>
    </Win>
  );
}
