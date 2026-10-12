import { clamp, inOutCubic, inQuad, outBack, outCubic, outExpo, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import type { Frame } from "#/engine/types";
import { CssBed, RuleRise, Stamp } from "#/talk/kit/motion";
import { springFrom } from "#/talk/kit/motion/schedule";
import { Counter, ReadToolRow } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { scriptFor } from "#/talk/script";
import {
  Bot,
  Fx,
  px,
  SegmentRoot,
  TipFrame,
  Typed,
  type StyleMap,
} from "#/talk/segments/tip-06-cli-agents/boundary";
import { placeAt, type PlaceKey } from "#/talk/segments/tip-06-cli-agents/timing";

import { blockX, pressDepth, pullAt, splitAtSeparator, splitStat, TIP7 } from "./timing";

const D = TIP7;
const rtk = scriptFor("t7-rtk");
const headroom = scriptFor("t7-headroom");
export const HEADROOM_LINES = splitAtSeparator(headroom.code[0]?.code ?? "");
export const STATS = headroom.ui.map(splitStat);

const lift = (tau: number) =>
  prog(tau, D.lift.start, D.lift.end, inOutCubic) *
  (1 - prog(tau, D.exit, D.exit + 0.3, inOutCubic));
const fold = (tau: number, i = 0) => prog(tau, D.exit + i * 0.04, D.exit + i * 0.04 + 0.25, inQuad);
const scaleY = (u: number) => `scaleY(${(1 - u).toFixed(4)})`;

/** Body lines with manual breaks (≤ 34 chars per line in the right column). */
const RTK_LINES = [
  "RTK: a hook rewrites shell\ncommands and trims their output.",
  "Bash tool only. Read, Grep\nand Glob bypass it.",
  "Trim too hard and the agent\nre-runs the command, or the\nrewrite breaks.",
];

const CLAUDE_BOX = { x: 200, y: 208, w: 256, h: 144 };
const PRESS_X = 960;

/** Token cost on each re-run row: bursts in, then the last digit creeps through the hold. */
const rerunTokens = (start: number, total: number) => (tau: number) => {
  if (tau < start) return 0;
  return total * outCubic(prog(tau, start, start + 0.45)) + Math.max(0, tau - start - 0.45) * 40;
};

function Clamp() {
  const fx = (frame: Frame): StyleMap => {
    const u = springFrom(frame.tau, D.clamp.start, SPRINGS.SNAP);
    const breathe = 1 + 0.01 * Math.sin(frame.w * 2.4);
    const gap = 70 * (1 - clamp(u, 0, 1.2));
    return {
      visibility: frame.tau < D.clamp.start ? "hidden" : "visible",
      "--gap": px(gap),
      transform: `scaleY(${breathe.toFixed(4)})`,
    };
  };
  const jaw = (top: boolean) => ({
    position: "absolute" as const,
    left: 0,
    width: 520,
    height: 10,
    borderRadius: 4,
    background: "var(--clay)",
    top: top ? -8 : 50,
    transform: `translateY(calc(var(--gap) * ${top ? -1 : 1}))`,
  });
  return (
    <Fx fx={fx} style={{ left: 180, top: 254, width: 520, height: 52, visibility: "hidden" }}>
      <div style={jaw(true)} />
      <div style={jaw(false)} />
      <div
        className="type-label tui"
        style={{
          position: "absolute",
          left: 540,
          top: 4,
          padding: "0 12px",
          border: "2px solid var(--clay)",
          borderRadius: 6,
          color: "var(--clay)",
          background: "var(--bg-deep)",
        }}
      >
        rtk
      </div>
    </Fx>
  );
}

/** 400 lines of output squeezing through the clamp into 6. */
function Accordion() {
  const stream = (frame: Frame): StyleMap => {
    const u = prog(frame.tau, D.squeeze.start, D.squeeze.end, inOutCubic);
    const show = frame.tau >= D.bash + 0.1 && u < 1;
    const grow = prog(frame.tau, D.bash + 0.1, D.squeeze.start, outCubic);
    return {
      visibility: show ? "visible" : "hidden",
      transform: `scaleY(${(grow * (1 - u)).toFixed(4)})`,
    };
  };
  const widths = [420, 310, 380, 260, 340, 200];
  return (
    <>
      <Fx
        fx={stream}
        style={{
          left: 236,
          top: 316,
          width: 460,
          height: 760,
          transformOrigin: "0 0",
          background:
            "repeating-linear-gradient(to bottom, var(--muted) 0 2px, transparent 2px 7px)",
          opacity: 0.55,
          visibility: "hidden",
        }}
      />
      {widths.map((w, i) => {
        const at = D.squeeze.start + 0.2 + i * 0.04;
        return (
          <Fx
            key={w}
            fx={(frame) => ({
              transform: `scaleX(${prog(frame.tau, at, at + 0.2, outExpo).toFixed(4)})`,
            })}
            style={{
              left: 236,
              top: 322 + i * 14,
              width: w,
              height: 6,
              borderRadius: 3,
              background: "var(--muted)",
              transformOrigin: "0 50%",
              transform: "scaleX(0)",
            }}
          />
        );
      })}
    </>
  );
}

function RtkPlate() {
  const fx = (frame: Frame): StyleMap => ({ transform: scaleY(fold(frame.tau)) });
  return (
    <Fx fx={fx} style={{ inset: 0, transformOrigin: "0 500px" }}>
      <ReadToolRow
        tool="Bash"
        arg="git status"
        at={D.bash}
        style={{ position: "absolute", left: 200, top: 257 }}
      />
      <Clamp />
      <Accordion />
      {D.reruns.map((at, i) => (
        <div key={at} style={{ position: "absolute", left: 200, top: 430 + i * 104 }}>
          <ReadToolRow
            tool="Bash"
            arg="rtk grep …"
            at={at}
            outputAt={at + 0.1}
            output={[rtk.ui[1] ?? ""]}
          />
          <Fx
            fx={(frame) => ({ visibility: frame.tau >= at ? "visible" : "hidden" })}
            style={{ left: 440, top: 0, visibility: "hidden" }}
          >
            <div className="tui tui-line type-code" style={{ color: "var(--clay)" }}>
              <span>{"↓ "}</span>
              <Counter value={rerunTokens(at, 2900 + i * 1300)} />
              <span>{" tokens"}</span>
            </div>
          </Fx>
        </div>
      ))}
      {RTK_LINES.map((text, i) => (
        <div key={text} style={{ position: "absolute", left: 1080, top: [240, 396, 540][i] }}>
          <RuleRise text={text} className="type-body" settleBy={D.lines[i] ?? 0} rule={i === 0} />
        </div>
      ))}
    </Fx>
  );
}

/** The terminal's physical edge: visible only while the camera is outside it. */
function TerminalCamera({ children }: { children: React.ReactNode }) {
  const fx = (frame: Frame): StyleMap => {
    const u = pullAt(frame.tau);
    const k = Math.exp(u * Math.log(CLAUDE_BOX.w / 1920));
    const out = u > 0;
    return {
      transform: `translate3d(${px(CLAUDE_BOX.x * u)}, ${px(CLAUDE_BOX.y * u)}, 0) scale(${k.toFixed(5)})`,
      background: out ? "var(--bg)" : "transparent",
      outline: out ? `${(2 / k).toFixed(1)}px solid var(--soft)` : "none",
      "border-radius": out ? `${(10 / k).toFixed(1)}px` : "0",
      overflow: out ? "hidden" : "visible",
    };
  };
  return (
    <Fx fx={fx} style={{ left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0" }}>
      {children}
    </Fx>
  );
}

function Box({ label, x, w, at }: { label: string; x: number; w: number; at: number }) {
  const fx = (frame: Frame): StyleMap => {
    const u = prog(frame.tau, at, at + 0.35, outBack(1.8));
    return {
      transform: `scale(${Math.max(0, u).toFixed(4)})`,
      visibility: frame.tau < at ? "hidden" : "visible",
    };
  };
  return (
    <Fx
      fx={fx}
      className="type-label tui"
      style={{
        left: x,
        top: CLAUDE_BOX.y,
        width: w,
        height: CLAUDE_BOX.h,
        display: "grid",
        placeItems: "center",
        border: "2px solid var(--soft)",
        borderRadius: 10,
        background: "var(--bg)",
        color: "var(--text)",
        visibility: "hidden",
      }}
    >
      {label}
    </Fx>
  );
}

const SLABS = [0, 1, 2, 3];

function Pipe() {
  const press = (frame: Frame): StyleMap => {
    const d = pressDepth(frame.tau, D.strokes, 0.06);
    const graze = prog(frame.tau, D.strokes[1] + 0.15, D.strokes[2] - 0.05, inOutCubic);
    return {
      transform: `translate3d(${px(graze * 46)}, ${px(-104 + d * 104)}, 0)`,
      visibility: frame.tau >= D.boxes ? "visible" : "hidden",
    };
  };
  const pipeFx = (frame: Frame): StyleMap => ({
    transform: `scaleX(${prog(frame.tau, D.boxes, D.boxes + 0.5, outExpo).toFixed(4)})`,
  });
  return (
    <>
      <Fx
        fx={pipeFx}
        style={{
          left: 456,
          top: CLAUDE_BOX.y + 70,
          width: 1000,
          height: 4,
          background: "var(--soft)",
          transformOrigin: "0 50%",
          transform: "scaleX(0)",
        }}
      />
      {D.strokes.map((s) => (
        <Fx
          key={s}
          fx={(frame) => {
            const x = blockX(frame.tau, s, PRESS_X + 30, 1100);
            const flat = frame.tau >= s;
            return {
              visibility: x > 470 && x < 1290 ? "visible" : "hidden",
              transform: `translate3d(${px(x - 30)}, ${px(flat ? 22 : 0)}, 0) scaleY(${flat ? 0.28 : 1})`,
            };
          }}
          className="type-label tui"
          style={{
            left: 0,
            top: CLAUDE_BOX.y + 42,
            width: 60,
            height: 60,
            display: "grid",
            placeItems: "center",
            borderRadius: 8,
            background: "var(--clay)",
            color: "var(--on-clay)",
            transformOrigin: "50% 100%",
            visibility: "hidden",
          }}
        >
          {"{}"}
        </Fx>
      ))}
      <div
        className="type-label text-soft"
        style={{ position: "absolute", left: CLAUDE_BOX.x, top: CLAUDE_BOX.y + CLAUDE_BOX.h + 8 }}
      >
        claude
      </div>
      <Box label="headroom :8787" x={560} w={330} at={D.boxes} />
      <Box label="api" x={1300} w={200} at={D.boxes + 0.15} />
      {SLABS.map((i) => (
        <Fx
          key={i}
          fx={(frame) => {
            const cracked = i === 0 && frame.tau >= D.strokes[2];
            const glow = cracked ? Math.exp(-(frame.tau - D.strokes[2]) / 1.6) : 0;
            const rise = prog(
              frame.tau,
              D.boxes + 0.2 + i * 0.05,
              D.boxes + 0.5 + i * 0.05,
              outExpo,
            );
            return {
              background: cracked && glow > 0.02 ? "var(--clay)" : "var(--clay-wash-55)",
              "box-shadow": `0 0 ${(glow * 40).toFixed(1)}px rgb(217 119 87 / ${(glow * 0.9).toFixed(3)})`,
              transform: `scaleY(${rise.toFixed(4)})`,
            };
          }}
          style={{
            left: 1180 + i * 28,
            top: CLAUDE_BOX.y + 10,
            width: 20,
            height: CLAUDE_BOX.h - 20,
            borderRadius: 3,
            transformOrigin: "50% 100%",
            transform: "scaleY(0)",
          }}
        >
          {i === 0 ? (
            <Fx
              fx={(frame) => ({ visibility: frame.tau >= D.strokes[2] ? "visible" : "hidden" })}
              style={{ inset: 0, visibility: "hidden" }}
            >
              <svg viewBox="0 0 20 124" width={20} height={124} aria-hidden>
                <path
                  d="M10 0 L6 30 L13 52 L5 78 L11 100 L8 124"
                  stroke="var(--bg-deep)"
                  strokeWidth={3}
                  fill="none"
                />
              </svg>
            </Fx>
          ) : null}
        </Fx>
      ))}
      <Fx
        fx={press}
        style={{ left: PRESS_X - 70, top: CLAUDE_BOX.y + 40, width: 140, visibility: "hidden" }}
      >
        <div
          style={{
            position: "absolute",
            left: 66,
            top: -400,
            width: 8,
            height: 410,
            background: "var(--muted)",
          }}
        />
        <div
          style={{
            width: 140,
            height: 44,
            borderRadius: 6,
            background: "var(--soft)",
            boxShadow: "0 6px 0 var(--muted)",
          }}
        />
      </Fx>
    </>
  );
}

function Dashboard() {
  const card = (frame: Frame): StyleMap => {
    const u = springFrom(frame.tau, D.stats - 0.25, SPRINGS.LAND);
    return {
      transform: `translateY(${px((1 - u) * 60)})`,
      "clip-path": `inset(0 0 ${((1 - clamp(u * 1.5)) * 100).toFixed(2)}% 0)`,
    };
  };
  const [label = ""] = headroom.labels;
  const caption = headroom.footnotes[1] ?? "";
  return (
    <Fx
      fx={card}
      style={{
        left: 200,
        top: 716,
        width: 1040,
        height: 168,
        borderRadius: 12,
        border: "2px solid var(--hairline)",
        background: "var(--bg)",
        clipPath: "inset(0 0 100% 0)",
      }}
    >
      <div className="type-label text-muted" style={{ position: "absolute", left: 26, top: 8 }}>
        {caption}
      </div>
      {STATS.map((stat, i) => (
        <div key={stat.label} style={{ position: "absolute", left: 26 + i * 400, top: 44 }}>
          <div className="type-label text-soft">{stat.label}</div>
          <div
            className={`type-body ${i === 2 ? "text-clay" : ""}`}
            style={{ color: i === 2 ? undefined : "var(--text)", marginTop: -4 }}
          >
            {stat.value}
          </div>
        </div>
      ))}
      <Typed
        text={label}
        start={D.label.start}
        cps={D.label.cps}
        className="type-label text-soft"
        top={126}
        left={26}
      />
    </Fx>
  );
}

function HeadroomPlate() {
  const visible = (frame: Frame): StyleMap => ({
    display: frame.tau > D.pull.start && frame.tau < D.exit + 0.4 ? "block" : "none",
  });
  const [line1, line2] = HEADROOM_LINES;
  return (
    <Fx fx={visible} style={{ inset: 0, display: "none" }}>
      <CssBed tone="halftone" />
      <div style={{ position: "absolute", left: 200, top: 404 }}>
        <RuleRise text={headroom.headline ?? ""} settleBy={D.headline} />
      </div>
      <Pipe />
      <Fx
        fx={(frame) => ({
          transform: `scaleX(${prog(frame.tau, D.code.start - 0.15, D.code.start + 0.2, outExpo).toFixed(4)})`,
        })}
        style={{
          left: 180,
          top: 556,
          width: 1580,
          height: 104,
          borderRadius: 10,
          background: "var(--bg-deep)",
          transformOrigin: "0 50%",
          transform: "scaleX(0)",
        }}
      />
      <Typed text={line1} start={D.code.start} cps={D.code.cps} className="type-code" top={560} />
      <Typed
        text={line2}
        start={D.code.start + Array.from(line1).length / D.code.cps}
        cps={D.code.cps}
        className="type-code"
        top={606}
        left={240}
      />
      <Typed
        text={headroom.footnotes[0] ?? ""}
        start={D.foot.start}
        cps={D.foot.cps}
        className="type-label text-muted"
        top={672}
      />
      <Dashboard />
      <Stamp
        text={headroom.stamps[0] ?? ""}
        settleBy={D.stamp}
        rotate={-8}
        style={{ left: 1540, top: 790 }}
      />
    </Fx>
  );
}

const PLACES: readonly PlaceKey[] = [
  { at: 193.3, x: 0, y: 0, scale: 1 },
  { at: 193.9, x: 150, y: 290, scale: 0.7 },
  { at: 199.2, x: 150, y: 290, scale: 0.7 },
  { at: 199.9, x: -80, y: -372, scale: 0.6 },
  { at: 208.0, x: -80, y: -372, scale: 0.6 },
  { at: 208.35, x: 0, y: 0, scale: 1 },
];

const ACTS: readonly Act[] = [
  { kind: "shrug", at: 194.0, dur: 0.8 },
  { kind: "surprised", at: 195.0, dur: 0.5 },
  { kind: "look", at: 195.8, dur: 3.2, x: -0.8, y: -0.2 },
  { kind: "hop", at: 199.25, height: 70 },
  { kind: "surprised", at: 202.95, dur: 0.45 },
  { kind: "look", at: 203.6, dur: 4.3, x: 0.2, y: -0.9 },
  { kind: "carry", at: 208.2, dur: 0.5 },
  { kind: "hop", at: 208.3, height: 60 },
];

export default function Tip07HeadroomRtkSegment() {
  return (
    <SegmentRoot window={D.window}>
      <HeadroomPlate />
      <TerminalCamera>
        <TipFrame
          tip={{
            n: 7,
            prompt: rtk.headline ?? "",
            verb: "Smooshing",
            typeAt: D.typeAt,
            cps: D.cps,
            submitAt: D.submitAt,
            spinnerAt: D.spinnerAt,
            tokens: (tau) => Math.max(0, tau - D.spinnerAt) * 310,
          }}
          out={{ at: D.exit, pastVerb: "Sautéed", duration: "1m 15s" }}
          echoFx={(frame) => ({ transform: `translateY(${px(-220 * lift(frame.tau))})` })}
          spinnerFx={(frame) => ({ transform: `translateY(${px(310 * lift(frame.tau))})` })}
          stackFx={(frame) => ({ transform: `translateY(${px(600 * lift(frame.tau))})` })}
          plate={<RtkPlate />}
        />
      </TerminalCamera>
      <Bot acts={ACTS} place={(tau) => placeAt(PLACES, tau)} />
    </SegmentRoot>
  );
}
