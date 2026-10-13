import type { ReactNode } from "react";

import { inOutCubic, outCubic, outExpo, prog } from "#/engine/motion/ease";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { RingTimer } from "#/talk/kit/data/ring-timer";
import { ExtLink } from "#/talk/kit/ext-link";
import { RuleRise } from "#/talk/kit/motion";
import { AgentRow, ReadToolRow, StaticGlyph } from "#/talk/kit/tui";
import { setStyle, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import { LINKS, scriptFor } from "#/talk/script";
import { TIP_TITLE_LINE, TIP_TITLE_TOP, TipTitle } from "#/talk/segments/shared/tip-title";

import { Anchor, During, Leave, Rise, Typed } from "./parts";
import { CARD_LEFT, cardAt, CHROME, highlightAt, onCard, REGIONS, SHOT } from "./price-card";
import {
  IDLE_Y,
  KV_LAYER_PITCH,
  KV_PITCH,
  KV_PREFIX,
  KV_X0,
  KV_Y0,
  MONOLITH,
  PITCH,
  PREFIX_COLS,
  propsAt,
  ROAD_X,
  roadRowY,
  ROW_PITCH,
  SKIP,
  STAIR_X0,
  STAIR_Y0,
} from "./scene";
import { holdEnd, IDLE, KV, STATELESS, T, TTL } from "./timing";

const LEFT = 200;

// ── t2-stateless ─────────────────────────────────────────────────────────────────────────────

const STAIR_BOTTOM = STAIR_Y0 + 3 * ROW_PITCH + 30;

/** The stop's own headline sits under the tip title at 60% of display size. */
const SUBHEAD_TOP = TIP_TITLE_TOP + TIP_TITLE_LINE + 16;
const SUBHEAD = {
  position: "absolute",
  left: LEFT,
  transform: "scale(0.6)",
  transformOrigin: "0 0",
} as const;

/** A bracket under the staircase, drawn on from its left end. */
function Bracket({
  x0,
  x1,
  at,
  tone,
}: {
  x0: number;
  x1: number;
  at: number;
  tone: "ivory" | "clay";
}) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const u = outCubic(prog(frame.tau, at, at + 0.45));
    setStyle(el, "transform", `scaleX(${u.toFixed(4)})`);
  });
  return (
    <div
      ref={ref}
      className={`t2-bracket t2-bracket--${tone}`}
      style={{ width: x1 - x0 - 8, transformOrigin: "0 0" }}
    />
  );
}

export function StatelessPlate() {
  const s = scriptFor("t2-stateless");
  const out = holdEnd(STATELESS);
  const memory = s.labels[1];
  return (
    <During from={T.dive} to={out + 0.6}>
      <TipTitle text={s.kicker ?? ""} settleBy={T.tapeHome} exit={out} />
      <div style={{ ...SUBHEAD, top: SUBHEAD_TOP }}>
        <RuleRise text={s.headline ?? ""} settleBy={77.3} exit={out} rule={false} />
      </div>
      <Anchor x={MONOLITH.x} y={MONOLITH.y + MONOLITH.h / 2} z={MONOLITH.d / 2} dx={-46} dy={14}>
        <Rise at={72.6} out={77.2} className="type-label text-muted">
          model
        </Rise>
      </Anchor>
      <Anchor
        x={MONOLITH.x}
        y={MONOLITH.y + 26}
        z={(t) => propsAt(t).drawer + MONOLITH.d / 2 + 10}
        dx={-58}
      >
        <Rise at={75.45} out={76.15} className="type-label t2-tag">
          {memory}
        </Rise>
      </Anchor>
      <Anchor x={STAIR_X0} y={STAIR_BOTTOM} z={30}>
        <div style={{ position: "absolute", left: 4, top: 0 }}>
          <Bracket x0={STAIR_X0} x1={STAIR_X0 + PREFIX_COLS * PITCH} at={78.9} tone="ivory" />
          <Rise at={79.0} out={out} className="type-label" style={{ left: 0, top: 18 }}>
            prefix
          </Rise>
        </div>
      </Anchor>
      <Anchor x={STAIR_X0 + PREFIX_COLS * PITCH} y={STAIR_BOTTOM} z={30}>
        <div style={{ position: "absolute", left: 4, top: 0 }}>
          <Bracket x0={0} x1={3 * PITCH} at={79.15} tone="clay" />
          <Rise
            at={79.2}
            out={out}
            className="type-label text-clay"
            style={{ left: 0, top: 18, whiteSpace: "nowrap" }}
          >
            new suffix
          </Rise>
        </div>
      </Anchor>
      <Anchor x={STAIR_X0 + 8.5 * PITCH} y={STAIR_Y0 + 1.5 * ROW_PITCH} z={30} dx={-36} dy={-36}>
        <Emboss at={79.3} />
      </Anchor>
    </During>
  );
}

/** ✳ pressed into the cached slab. */
function Emboss({ at }: { at: number }) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const u = outExpo(prog(frame.tau, at, at + 0.4));
    setStyle(el, "transform", `scale(${(1.6 - 0.6 * u).toFixed(3)})`);
    setStyle(el, "visibility", u > 0 && frame.tau < T.kvMorph ? "visible" : "hidden");
  });
  return (
    <div ref={ref} className="t2-emboss type-headline" aria-hidden>
      <StaticGlyph glyph="✳" />
    </div>
  );
}

// ── t2-kv ────────────────────────────────────────────────────────────────────────────────────

/** `recompute`, struck through on τ when the K/V wall is reused instead. */
function Strike({ at }: { at: number }) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const u = outExpo(prog(frame.tau, at, at + 0.22));
    setStyle(el, "transform", `scaleX(${u.toFixed(4)})`);
  });
  return <div ref={ref} className="t2-strike" />;
}

export function KvPlate() {
  const s = scriptFor("t2-kv");
  const out = holdEnd(KV);
  const [k, v, recompute] = s.labels;
  const wallTop = KV_Y0 - (KV_LAYER_PITCH * 5 + 30);
  return (
    <During from={T.kvMorph} to={out + 0.6}>
      <RuleRise
        text={"Same prefix? Reuse its\nstored K/V tensors."}
        settleBy={90.6}
        exit={out}
        style={{ position: "absolute", left: LEFT, top: 92 }}
      />
      <Anchor x={KV_X0 - 34} y={KV_Y0 - KV_LAYER_PITCH * 3.6} z={0} dx={-72}>
        <Rise at={84.2} out={out} className="type-code t2-drawer-tag">
          {k}
        </Rise>
      </Anchor>
      <Anchor x={KV_X0 - 34} y={KV_Y0 - KV_LAYER_PITCH * 1.1} z={0} dx={-72}>
        <Rise at={84.8} out={out} className="type-code t2-drawer-tag">
          {v}
        </Rise>
      </Anchor>
      <Anchor x={KV_X0 + (KV_PREFIX / 2 - 0.5) * KV_PITCH} y={wallTop} z={-60} dx={-100} dy={-58}>
        <Rise
          at={89.15}
          out={out}
          className="type-code text-muted"
          style={{ whiteSpace: "nowrap" }}
        >
          <span style={{ position: "relative", display: "inline-block" }}>
            {recompute}
            <Strike at={T.strike} />
          </span>
        </Rise>
      </Anchor>
    </During>
  );
}

// ── t2-price ─────────────────────────────────────────────────────────────────────────────────

/** Screen px of the card's bottom edge at rest, where the entrance tilt hinges. */
const CARD_HINGE = { x: 900, y: 1020 };

/** The real pricing table, framed as a window: rises in tilted, then the camera glides in. */
function PriceCard() {
  const entry = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const u = outCubic(prog(frame.tau, T.cardIn, T.cardLand));
    const rho = ambientTime(frame);
    const bob = 4 * Math.sin(rho * 0.6);
    const tilt = 22 * (1 - u) + 0.6 * Math.sin(rho * 0.45);
    setStyle(
      el,
      "transform",
      `perspective(2000px) translate3d(0, ${(260 * (1 - u) + bob).toFixed(1)}px, 0) rotateX(${tilt.toFixed(2)}deg)`,
    );
    setStyle(el, "opacity", Math.min(1, u * 2.5).toFixed(3));
  });
  const pose = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const p = cardAt(frame.tau);
    setStyle(
      el,
      "transform",
      `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) scale(${p.s.toFixed(4)})`,
    );
  });
  const dim = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const u = inOutCubic(prog(frame.tau, T.dim, T.dim + 0.6));
    setStyle(el, "transform", `scaleX(${u.toFixed(4)})`);
  });
  const dimHits = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const u = inOutCubic(prog(frame.tau, T.narrow, T.narrow + 0.8));
    setStyle(el, "transform", `scaleX(${u.toFixed(4)})`);
  });
  const outline = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const u = outCubic(prog(frame.tau, T.outline, T.outline + 0.7));
    const r = highlightAt(frame.tau);
    setStyle(el, "left", `${r.x0.toFixed(1)}px`);
    setStyle(el, "top", `${r.y0.toFixed(1)}px`);
    setStyle(el, "width", `${(r.x1 - r.x0).toFixed(1)}px`);
    setStyle(el, "height", `${(r.y1 - r.y0).toFixed(1)}px`);
    setStyle(el, "clip-path", `inset(-40px ${((1 - u) * 100).toFixed(2)}% -40px -40px)`);
  });
  const { caching, writes } = REGIONS;
  return (
    <div
      ref={entry}
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: `${CARD_HINGE.x}px ${CARD_HINGE.y}px`,
      }}
    >
      <div
        ref={pose}
        className="t2-card"
        style={{ width: SHOT.w, height: SHOT.h, transformOrigin: "0 0" }}
      >
        <div className="t2-card__chrome" style={{ height: CHROME, top: -CHROME }}>
          <span className="t2-card__dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <ExtLink href={LINKS.pricing} className="t2-card__title">
            Pricing
          </ExtLink>
        </div>
        <img src={SHOT.src} alt="Claude API pricing table" width={SHOT.w} height={SHOT.h} />
        <div
          ref={dim}
          className="t2-card__dim"
          style={{ left: 0, width: caching.x0, transformOrigin: "0 50%" }}
        />
        <div
          ref={dimHits}
          className="t2-card__dim"
          style={{ left: writes.x1, width: SHOT.w - writes.x1, transformOrigin: "100% 50%" }}
        />
        <div ref={outline} className="t2-card__outline" />
      </div>
    </div>
  );
}

export function PricePlate() {
  const s = scriptFor("t2-price");
  return (
    <During from={T.cardIn} to={T.cardGone + 0.1}>
      <div style={{ ...SUBHEAD, left: CARD_LEFT, top: 96 }}>
        <RuleRise text={s.headline ?? ""} settleBy={99.2} exit={103} rule={false} />
      </div>
      <PriceCard />
    </During>
  );
}

// ── t2-ttl ───────────────────────────────────────────────────────────────────────────────────

/** Fast enough that the fix has finished typing by at − 0.8. */
const CODE_CPS = 200;
const STRIP_X = 820;
const STRIP_Y = 520;

/** The cold subagent's DOM token strip: frost crawls across it (closed-form on τ). */
function FrostStrip() {
  const n = 9;
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const front = prog(frame.tau, T.freeze - 0.1, TTL.at + TTL.holdSpan) * (n + 2);
    const pop = outExpo(prog(frame.tau, T.subRow + 0.1, T.subRow + 0.5));
    Array.from(el.children).forEach((c, i) => {
      const f = Math.max(0, Math.min(1, front - i));
      setStyle(c, "--frost", f.toFixed(3));
      setStyle(c, "transform", `scaleY(${pop.toFixed(3)})`);
    });
  });
  return (
    <div
      ref={ref}
      className="t2-strip"
      style={{ position: "absolute", left: STRIP_X, top: STRIP_Y }}
    >
      {Array.from({ length: n }, (_, i) => (
        <span key={`b${i + 1}`} className="t2-strip__block" />
      ))}
    </div>
  );
}

/** Ring-row slot centres (1h first, then the 5m rings), from the `.t2-rings` flex layout. */
const RING_ROW = { x: 1200, y: 236, gap: 18, big: 120, small: 84 };

/** Each ring flies out of its write column on the pricing card as the card drops away. */
function FlyFrom({ dx, dy, children }: { dx: number; dy: number; children: ReactNode }) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const u = 1 - outCubic(prog(frame.tau, T.rings, T.ringsLand));
    setStyle(
      el,
      "transform",
      u > 0 ? `translate3d(${(dx * u).toFixed(1)}px, ${(dy * u).toFixed(1)}px, 0)` : "none",
    );
  });
  return <div ref={ref}>{children}</div>;
}

/** Offset from a ring's slot to its column header on the card when the rings pop. */
function ringOffset(slot: number): { dx: number; dy: number } {
  const { x, y, gap, big, small } = RING_ROW;
  const cx = slot === 0 ? x + big / 2 : x + big + gap + (slot - 1) * (small + gap) + small / 2;
  const cy = y + big / 2;
  const head = slot === 0 ? REGIONS.write1h : REGIONS.write5m;
  const from = onCard(T.rings, head.x, head.y);
  return { dx: from.x - cx, dy: from.y - cy };
}

export function TtlPlate() {
  const s = scriptFor("t2-ttl");
  const out = holdEnd(TTL);
  const code = s.code.filter((c) => c.onStage !== false);
  const [codeA, codeB] = code;
  const typed = (dt: number) => T.fix + dt;
  return (
    <During from={T.rings - 0.05} to={out + 0.4}>
      <RuleRise
        text={"Main session: 1h cache.\nSubagents: 5m."}
        settleBy={109.0}
        exit={out}
        style={{ position: "absolute", left: LEFT, top: 72 }}
      />
      <Leave at={out}>
        <div
          style={{ position: "absolute", left: RING_ROW.x, top: RING_ROW.y }}
          className="t2-rings"
        >
          <FlyFrom {...ringOffset(0)}>
            <RingTimer label="1h" start={T.rings} burn={{ start: T.rings, end: 400 }} size={120} />
          </FlyFrom>
          {[0, 1, 2, 3, 4].map((i) => (
            <FlyFrom key={`r${i + 1}`} {...ringOffset(i + 1)}>
              <RingTimer
                label="5m"
                start={T.rings + 0.1 + i * 0.07}
                burn={i === 0 ? { start: T.subRow, end: T.freeze } : undefined}
                left={i === 0 ? undefined : 1}
                tone="cached"
                size={84}
              />
            </FlyFrom>
          ))}
        </div>
        <AgentRow
          name="cbdev tests (7m)"
          enterAt={T.subRow}
          className="type-code"
          style={{ position: "absolute", left: LEFT, top: 480, width: 1000 }}
        />
        <FrostStrip />
        <ExtLink href={LINKS.settings} style={{ position: "absolute", left: LEFT, top: 596 }}>
          <ReadToolRow tool="Read" arg={codeA?.label ?? ""} at={T.fix} className="type-code" />
        </ExtLink>
        <Typed
          text={codeA?.code ?? ""}
          at={typed(0.1)}
          cps={CODE_CPS}
          className="type-code t2-code"
          style={{ left: 260, top: 664 }}
        />
        <Typed
          text={codeB?.code ?? ""}
          at={typed(0.3)}
          cps={CODE_CPS}
          className="type-code t2-code"
          style={{ left: 260, top: 732 }}
        />
      </Leave>
    </During>
  );
}

// ── t2-idle ──────────────────────────────────────────────────────────────────────────────────

const CLOCK = { x: 1480, y: 600, r: 120 };
const CACHEBEAT_REPO = "ARahim3/cachebeat";
const CACHEBEAT_URL = "https://github.com/ARahim3/cachebeat";

/** Wall clock: the minute hand sweeps an hour, then creeps into a second lap. */
function Clock() {
  const ref = useFrameRef<SVGSVGElement>((el, frame: Frame) => {
    const sweep = inOutCubic(prog(frame.tau, T.clock, T.clockEnd));
    const lap =
      0.06 * outCubic(prog(frame.tau, 118.6, IDLE.at)) + 0.008 * Math.max(0, frame.tau - IDLE.at);
    const minutes = (sweep + lap) * 360;
    const hand = el.querySelector(".t2-clock__minute");
    const pop = outExpo(prog(frame.tau, T.idleIn, T.idleIn + 0.5));
    setStyle(hand, "transform", `rotate(${minutes.toFixed(2)}deg)`);
    setStyle(el, "transform", `scale(${pop.toFixed(3)})`);
  });
  const ticks = Array.from({ length: 12 }, (_, i) => i);
  return (
    <svg
      ref={ref}
      className="t2-clock"
      viewBox="-130 -130 260 260"
      width={CLOCK.r * 2 + 20}
      height={CLOCK.r * 2 + 20}
      style={{ position: "absolute", left: CLOCK.x - CLOCK.r - 10, top: CLOCK.y - CLOCK.r - 10 }}
      aria-hidden
    >
      <circle r={CLOCK.r} className="t2-clock__face" />
      {ticks.map((i) => (
        <line
          key={`t${i}`}
          x1="0"
          y1={-CLOCK.r + 10}
          x2="0"
          y2={-CLOCK.r + (i % 3 ? 20 : 30)}
          transform={`rotate(${i * 30})`}
          className="t2-clock__tick"
        />
      ))}
      <line x1="0" y1="0" x2="0" y2="-62" className="t2-clock__hour" />
      <line x1="0" y1="14" x2="0" y2={-CLOCK.r + 18} className="t2-clock__minute" />
      <circle r="7" className="t2-clock__pin" />
    </svg>
  );
}

export function IdlePlate() {
  const s = scriptFor("t2-idle");
  const out = holdEnd(IDLE);
  const [notice, cachebeat = ""] = s.labels;
  const split = cachebeat.indexOf(CACHEBEAT_REPO);
  const beatPrefix = split >= 0 ? cachebeat.slice(0, split) : cachebeat;
  const beatRepo = split >= 0 ? CACHEBEAT_REPO : "";
  return (
    <During from={T.crack} to={out + 0.6}>
      <RuleRise
        text={s.headline ?? ""}
        settleBy={118.6}
        exit={out}
        style={{ position: "absolute", left: LEFT, top: 92 }}
      />
      <div style={{ position: "absolute", left: 1210, top: 410 }}>
        <RingTimer
          label="1h"
          start={T.idleIn}
          burn={{ start: T.clock, end: T.clockEnd - 0.08 }}
          size={130}
        />
      </div>
      <Clock />
      <Typed
        text={`※ ${notice ?? ""}`}
        at={T.notice}
        cps={70}
        out={out + 0.4}
        className="type-code t2-notice"
        style={{ left: LEFT, top: IDLE_Y + 70 }}
      />
      <Rise
        at={T.notice + 0.7}
        out={out}
        className="type-label text-clay"
        style={{ left: LEFT, top: IDLE_Y + 132 }}
      >
        {beatPrefix}
        <ExtLink href={CACHEBEAT_URL}>{beatRepo}</ExtLink>
      </Rise>
    </During>
  );
}

// ── t2-switch ────────────────────────────────────────────────────────────────────────────────

export function SwitchPlate() {
  return (
    <During from={123.5} to={T.foldEnd}>
      <RuleRise
        text={"Switch effort levels,\nnot models."}
        settleBy={127.7}
        style={{ position: "absolute", left: LEFT, top: 72 }}
      />
      <Anchor x={ROAD_X + 120} y={roadRowY(1)} z={26} dx={0} dy={-20}>
        <Rise at={127.0} out={T.fold} className="type-code t2-road-tag">
          /effort
        </Rise>
      </Anchor>
      <Anchor x={SKIP.x} y={SKIP.y} z={0} dx={-60} dy={46}>
        <Rise at={125.0} out={T.fold} className="type-code t2-road-tag t2-road-tag--off">
          /model
        </Rise>
      </Anchor>
    </During>
  );
}
