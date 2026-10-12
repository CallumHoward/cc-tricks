import { inOutCubic, outCubic, outExpo, prog } from "#/engine/motion/ease";
import type { Frame } from "#/engine/types";
import { RingTimer } from "#/talk/kit/data/ring-timer";
import { ClayField, RuleRise } from "#/talk/kit/motion";
import { AgentRow, ReadToolRow, SpinnerLine, StaticGlyph } from "#/talk/kit/tui";
import { setStyle, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import { scriptFor } from "#/talk/script";
import { IdleTtl } from "#/talk/widgets/idle-ttl";
import { PriceOfATurn } from "#/talk/widgets/price-of-a-turn";

import { Anchor, During, Rise, Typed } from "./parts";
import {
  COIN,
  IDLE_Y,
  KV_LAYER_PITCH,
  KV_PITCH,
  KV_PREFIX,
  KV_X0,
  KV_Y0,
  MONOLITH,
  PITCH,
  PREFIX_COLS,
  PRICE_BASE,
  PRICE_COUNTS,
  PRICE_VALUES,
  PRICE_X,
  propsAt,
  ROW_PITCH,
  STAIR_X0,
  STAIR_Y0,
} from "./scene";
import { holdEnd, IDLE, KV, PRICE, STATELESS, SWITCH, T, TTL } from "./timing";

const LEFT = 200;

// ── t2-stateless ─────────────────────────────────────────────────────────────────────────────

const STAIR_BOTTOM = STAIR_Y0 + 3 * ROW_PITCH + 30;

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
  const [bracketLabel, memory] = s.labels;
  return (
    <During from={T.dive} to={out + 0.6}>
      <Rise at={72.2} out={out} className="type-label text-clay" style={{ left: LEFT, top: 104 }}>
        {s.kicker}
      </Rise>
      <RuleRise
        text={s.headline ?? ""}
        settleBy={77.3}
        exit={out}
        style={{ position: "absolute", left: LEFT, top: 150 }}
      />
      <Rise
        at={78.7}
        out={out}
        className="type-body text-soft"
        style={{ left: LEFT, top: 292, width: 1400 }}
      >
        {s.lines[0]}
      </Rise>
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
      <Rise at={79.1} out={out} className="type-body" style={{ left: LEFT, top: 820, width: 1500 }}>
        {bracketLabel}
      </Rise>
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
        settleBy={91.2}
        exit={out}
        style={{ position: "absolute", left: LEFT, top: 92 }}
      />
      <Rise at={90.4} out={out} className="type-body text-soft" style={{ left: LEFT, top: 380 }}>
        {s.lines[0]}
      </Rise>
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
      <Typed
        text={s.footnotes[0] ?? ""}
        at={90.6}
        cps={95}
        out={out + 0.4}
        className="type-label text-muted"
        style={{ left: 360, top: 940 }}
      />
    </During>
  );
}

// ── t2-price ─────────────────────────────────────────────────────────────────────────────────

const COLUMN_NAMES = ["base", "5m write", "1h write", "hit"] as const;

function ColumnValue({ i }: { i: number }) {
  const value = PRICE_VALUES[i] ?? 0;
  const count = PRICE_COUNTS[i] ?? 1;
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const u = outCubic(
      prog(frame.tau, T.columns - 0.3 + i * 0.12, T.columns + 0.4 + i * 0.12 + count * 0.012),
    );
    const top = PRICE_BASE - COIN * count * u - 50;
    setStyle(
      el,
      "transform",
      `translate3d(${((PRICE_X[i] ?? 0) - 80).toFixed(1)}px, ${top.toFixed(1)}px, 0)`,
    );
    el.textContent = `$${(value * u).toFixed(2)}`;
  });
  return (
    <div
      ref={ref}
      className="type-label t2-col-value"
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      $0.00
    </div>
  );
}

export function PricePlate() {
  const s = scriptFor("t2-price");
  const table = s.tables[0];
  const [tableLabel, writes] = s.labels;
  const context = s.ui[0] ?? "";
  return (
    <During from={T.plan} to={T.cut}>
      <RuleRise
        text={s.headline ?? ""}
        settleBy={99.2}
        style={{ position: "absolute", left: LEFT, top: 92 }}
      />
      <Rise at={97.9} className="type-label text-muted" style={{ left: LEFT, top: 286 }}>
        {tableLabel}
      </Rise>
      <div className="t2-table" style={{ position: "absolute", left: LEFT, top: 340 }}>
        {table?.rows.map((row, r) => (
          <Rise
            key={row[0]}
            at={98.2 + r * 0.12}
            className="type-code t2-table__row"
            style={{ position: "relative" }}
          >
            <span>{row[0]}</span>
            <span className="text-clay">{row[1]}</span>
            <span className="text-muted">{row[2]}</span>
          </Rise>
        ))}
      </div>
      <Typed
        text={writes ?? ""}
        at={98.6}
        cps={90}
        className="type-label text-soft"
        style={{ left: LEFT, top: 578 }}
      />
      {COLUMN_NAMES.map((name, i) => (
        <ColumnValue key={name} i={i} />
      ))}
      {COLUMN_NAMES.map((name, i) => (
        <Rise
          key={name}
          at={T.columns + i * 0.12}
          className="type-label text-muted"
          style={{
            left: (PRICE_X[i] ?? 0) - 90,
            top: PRICE_BASE + 14,
            width: 180,
            textAlign: "center",
          }}
        >
          {name}
        </Rise>
      ))}
      <Rise at={T.columns + 0.5} className="type-label text-soft" style={{ left: 840, top: 286 }}>
        {context}
      </Rise>
      <div className="t2-w1" style={{ position: "absolute", left: 200, top: 680 }}>
        <Rise at={99.0} style={{ position: "relative" }}>
          <PriceOfATurn width={600} />
        </Rise>
      </div>
    </During>
  );
}

// ── t2-ttl ───────────────────────────────────────────────────────────────────────────────────

const STRIP_X = 900;
const STRIP_Y = 480;

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

export function TtlPlate() {
  const s = scriptFor("t2-ttl");
  const out = holdEnd(TTL);
  const code = s.code.filter((c) => c.onStage !== false);
  const [codeA, codeB] = code;
  return (
    <During from={T.irisStart} to={out + 0.6}>
      <RuleRise
        text={"Main session: 1h cache.\nSubagents: 5m."}
        settleBy={109.0}
        exit={out}
        style={{ position: "absolute", left: LEFT, top: 72 }}
      />
      <div style={{ position: "absolute", left: 1060, top: 196 }} className="t2-rings">
        <RingTimer label="1h" start={T.rings} burn={{ start: T.rings, end: 400 }} size={130} />
        {[0, 1, 2, 3, 4].map((i) => (
          <RingTimer
            key={`r${i + 1}`}
            label="5m"
            start={T.rings + 0.1 + i * 0.07}
            burn={i === 0 ? { start: T.subRow, end: T.freeze } : undefined}
            left={i === 0 ? undefined : 1}
            tone="cached"
            size={92}
          />
        ))}
      </div>
      <AgentRow
        name="cbdev tests (7m)"
        enterAt={T.subRow}
        className="type-code"
        style={{ position: "absolute", left: LEFT, top: 440, width: 1000 }}
      />
      <FrostStrip />
      <ReadToolRow
        tool="Read"
        arg={codeA?.label ?? ""}
        at={T.fix}
        className="type-code"
        style={{ position: "absolute", left: LEFT, top: 556 }}
      />
      <Typed
        text={codeA?.code ?? ""}
        at={T.fix + 0.15}
        cps={110}
        className="type-code t2-code"
        style={{ left: 260, top: 624 }}
      />
      <Typed
        text={codeA?.caption ?? ""}
        at={T.fix + 0.4}
        cps={110}
        className="type-label text-muted"
        style={{ left: 260, top: 676 }}
      />
      <Typed
        text={codeB?.code ?? ""}
        at={T.fix + 0.5}
        cps={110}
        className="type-code t2-code"
        style={{ left: 260, top: 740 }}
      />
      <Typed
        text={codeB?.caption ?? ""}
        at={T.fix + 0.85}
        cps={110}
        className="type-label text-muted"
        style={{ left: 260, top: 792 }}
      />
      <Typed
        text={s.footnotes[1] ?? ""}
        at={T.fix + 1.0}
        cps={110}
        className="type-label text-clay"
        style={{ left: 360, top: 850 }}
      />
      <div
        className="t2-w2"
        style={{
          position: "absolute",
          left: 1300,
          top: 400,
          transform: "scale(0.7)",
          transformOrigin: "0 0",
        }}
      >
        <Rise at={T.fix + 0.6} style={{ position: "relative" }}>
          <IdleTtl />
        </Rise>
      </div>
    </During>
  );
}

/** The one clay field (hard cut, forward on the hit) and its footnote; render above everything. */
export function TtlField() {
  const s = scriptFor("t2-ttl");
  return (
    <>
      <ClayField
        text={"Cold is 25–80×\nthe price of warm."}
        cut={T.cut}
        settleBy={104.6}
        iris={{ start: T.irisStart, end: T.irisEnd, to: { x: PRICE_X[2] ?? 0, y: 700 } }}
      />
      <FieldFoot text={s.footnotes[0] ?? ""} />
    </>
  );
}

/** The field's footnote: types under the slam and leaves with the iris. */
function FieldFoot({ text }: { text: string }) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const r = 1 - inOutCubic(prog(frame.tau, T.irisStart, T.irisEnd));
    setStyle(el, "visibility", frame.tau >= T.cut && frame.tau < T.irisEnd ? "visible" : "hidden");
    setStyle(
      el,
      "clip-path",
      r >= 1
        ? "none"
        : `circle(${(r * 2300).toFixed(1)}px at ${(PRICE_X[2] ?? 0).toFixed(0)}px 700px)`,
    );
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, visibility: "hidden" }}>
      <Typed
        text={text}
        at={104.1}
        cps={110}
        className="type-label t2-on-clay"
        style={{ left: 360, top: 820 }}
      />
    </div>
  );
}

// ── t2-idle ──────────────────────────────────────────────────────────────────────────────────

const CLOCK = { x: 1480, y: 600, r: 120 };

/** Wall clock: the minute hand sweeps an hour, then creeps into a second lap. */
function Clock() {
  const ref = useFrameRef<SVGSVGElement>((el, frame: Frame) => {
    const sweep = inOutCubic(prog(frame.tau, T.clock, T.clockEnd));
    const lap =
      0.06 * outCubic(prog(frame.tau, 118.6, IDLE.at)) + 0.008 * Math.max(0, frame.tau - IDLE.at);
    const minutes = (sweep + lap) * 360;
    const hand = el.querySelector(".t2-clock__minute");
    const pop = outExpo(prog(frame.tau, T.crack, T.crack + 0.5));
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
  const [notice, cachebeat] = s.labels;
  return (
    <During from={T.crack} to={out + 0.6}>
      <RuleRise
        text={s.headline ?? ""}
        settleBy={118.6}
        exit={out}
        style={{ position: "absolute", left: LEFT, top: 92 }}
      />
      <Rise at={118.0} out={out} className="type-body text-soft" style={{ left: LEFT, top: 246 }}>
        {s.lines[1]}
      </Rise>
      <div style={{ position: "absolute", left: 1210, top: 410 }}>
        <RingTimer
          label="1h"
          start={T.crack}
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
      <Typed
        text={cachebeat ?? ""}
        at={T.notice + 0.7}
        cps={70}
        out={out + 0.4}
        className="type-label text-clay"
        style={{ left: LEFT, top: IDLE_Y + 132 }}
      />
    </During>
  );
}

// ── t2-switch ────────────────────────────────────────────────────────────────────────────────

export function SwitchPlate() {
  const s = scriptFor("t2-switch");
  return (
    <During from={123.5} to={T.fold}>
      <RuleRise
        text={"Switch effort levels,\nnot models."}
        settleBy={128.7}
        style={{ position: "absolute", left: LEFT, top: 72 }}
      />
      {s.lines.map((line, i) => (
        <Typed
          key={line}
          text={line}
          at={127.75 + i * 0.3}
          cps={110}
          className={i === 2 ? "type-label text-soft" : "type-code"}
          style={{ left: LEFT, top: 352 + i * 56 }}
        />
      ))}
      <SpinnerLine
        verb="Simmering"
        at={123.6}
        className="type-label"
        style={{ position: "absolute", left: LEFT, top: 540 }}
      />
      <Anchor x={1500} y={360} z={0} dx={-60} dy={46}>
        <Rise at={125.0} className="type-label text-muted">
          /model
        </Rise>
      </Anchor>
    </During>
  );
}

export const PLATE_STOPS = [STATELESS, KV, PRICE, TTL, IDLE, SWITCH] as const;
