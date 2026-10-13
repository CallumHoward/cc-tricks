import { clamp, inOutCubic, outCubic, outExpo, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { ExtLink } from "#/talk/kit/ext-link";
import { SPIN_GLYPH } from "#/talk/kit/motion";
import { springFrom } from "#/talk/kit/motion/schedule";
import { Counter, ReadToolRow, SpinnerGlyph } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { scriptFor } from "#/talk/script";
import { TIP_TITLE_LINE, TIP_TITLE_TOP, TipTitle } from "#/talk/segments/shared/tip-title";

import { Bot, Fx, px, Rule, SegmentRoot, TipFrame, Typed, type StyleMap } from "./boundary";
import {
  arcPoint,
  batonProgress,
  dropPoint,
  documentedKiro,
  tip6StackDy,
  TIP6,
  wrapCommand,
  type Point,
} from "./timing";

const D = TIP6;
const SPLIT_Y = 520;
const BASH_Y = TIP_TITLE_TOP + 2 * TIP_TITLE_LINE + 32;
const HANDS: Point = { x: 1470, y: 420 };
const BATON_SLOT: Point = { x: 222, y: SPLIT_Y + 32 + 2 * 46 + 30 };
/** Three stacked "subagent" panes for t6-others, each a two-line command behind its ✳ */
const PANE = { top: 548, height: 118, gap: 18, left: 200, width: 1520, chars: 66 } as const;
const paneY = (i: number) => PANE.top + i * (PANE.height + PANE.gap);

const kiro = scriptFor("t6-kiro");
const others = scriptFor("t6-others");
export const KIRO_LINES = wrapCommand(documentedKiro(kiro.code[0]?.code ?? ""), 78);
export const OTHER_LINES = others.code.map((block) => wrapCommand(block.code, PANE.chars));
const TIP_PROMPT = kiro.headline ?? "";
/** The title breaks after the three CLIs so line one clears the bot. */
const TITLE = TIP_PROMPT.replace(" as your", "\nas your");
const PROMPT_MASTER = "https://github.com/nidhinjs/prompt-master";

const lift = (tau: number) => prog(tau, D.lift.start, D.lift.end, inOutCubic);
/** The home prompt stack sinks out of frame under the plate and rises back inside the exit. */
const stackDrop = (tau: number) =>
  720 * lift(tau) * (1 - prog(tau, D.exit + 0.15, D.exit + 0.6, inOutCubic));

/** Plate exit: everything drifts up and fades over 0.4 τ-s, staggered by layer `i`. */
const leave = (tau: number, i = 0) =>
  prog(tau, D.exit + i * 0.05, D.exit + i * 0.05 + 0.4, inOutCubic);
const leaveFx =
  (i = 0) =>
  (frame: Frame): StyleMap => {
    const u = leave(frame.tau, i);
    return u > 0
      ? { transform: `translate3d(0, ${px(-48 * u)}, 0)`, opacity: (1 - u).toFixed(3) }
      : { transform: "none", opacity: "1" };
  };

function BatonSvg({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <path d={SPIN_GLYPH.d} fill="var(--clay)" />
    </svg>
  );
}

/** A ✳ thrown along a path; `progress(τ)` is its place on it, hidden outside [show, hide). */
function Baton({
  from,
  to,
  path,
  progress,
  show,
  hide,
}: {
  from: Point;
  to: Point;
  path: (a: Point, b: Point, u: number) => Point;
  progress: (tau: number) => number;
  show: number;
  hide: number;
}) {
  const fx = (frame: Frame): StyleMap => {
    const p = path(from, to, progress(frame.tau));
    // Spins in flight, then keeps turning slowly on ambient time so a stop never freezes it
    const flight = Math.min(frame.tau - show, 0.9);
    const spin = flight * 540 + Math.max(0, ambientTime(frame) - show - 0.9) * 24;
    return {
      visibility: frame.tau >= show && frame.tau < hide ? "visible" : "hidden",
      transform: `translate3d(${px(p.x - 22)}, ${px(p.y - 22)}, 0) rotate(${spin.toFixed(1)}deg)`,
    };
  };
  return (
    <Fx fx={fx} style={{ left: 0, top: 0, visibility: "hidden" }}>
      <BatonSvg />
    </Fx>
  );
}

const kiroTokens = (tau: number) => {
  const land = D.baton.land;
  if (tau < land) return 0;
  const burst = 2400 * outCubic(prog(tau, land, D.kiro.at - 0.8));
  return burst + Math.max(0, tau - (D.kiro.at - 0.8)) * 40;
};

function KiroPane() {
  const typeEnd = (i: number) =>
    D.kiroType.start +
    KIRO_LINES.slice(0, i).reduce((sum, line) => sum + Array.from(line).length, 0) / D.kiroType.cps;
  const status = (frame: Frame): StyleMap => ({
    "clip-path":
      frame.tau < D.baton.land
        ? "inset(0 100% 0 0)"
        : `inset(-0.4em ${((1 - prog(frame.tau, D.baton.land, D.baton.land + 0.25, outExpo)) * 100).toFixed(2)}% -0.4em -0.4em)`,
  });
  return (
    <>
      <ReadToolRow
        tool="Bash"
        arg="kiro-cli …"
        status="running"
        at={D.split.start}
        style={{ position: "absolute", left: 200, top: BASH_Y }}
      />
      {KIRO_LINES.map((line, i) => (
        <Typed
          key={line}
          text={line}
          start={typeEnd(i)}
          cps={D.kiroType.cps}
          className="type-code"
          top={SPLIT_Y + 32 + i * 46}
        />
      ))}
      <Fx fx={status} style={{ left: 200, top: BATON_SLOT.y - 22 }}>
        <div className="tui tui-line type-code" style={{ color: "var(--muted)" }}>
          <span style={{ color: "var(--clay)" }}>
            <SpinnerGlyph />
          </span>
          <span>{" ↓ "}</span>
          <Counter value={kiroTokens} />
          <span>{" tokens"}</span>
        </div>
      </Fx>
    </>
  );
}

/** One subagent pane: rises into place, its command typed in with the CLI name in clay. */
function OtherPane({ i, lines }: { i: number; lines: string[] }) {
  const top = paneY(i);
  const name = lines[0]?.split(" ")[0] ?? "";
  const at = D.rows[i] ?? 0;
  const fx = (frame: Frame): StyleMap => {
    const u = springFrom(frame.tau, at - 0.05, SPRINGS.LAND);
    const show = clamp(u * 1.6);
    // Each pane bobs on ambient time so the stop never freezes
    const bob = 3 * Math.sin(ambientTime(frame) * 0.9 + i * 1.7) * show;
    return {
      opacity: show.toFixed(3),
      transform: `translate3d(0, ${px((1 - u) * 56 + bob)}, 0)`,
    };
  };
  const starts = lines.map(
    (_, k) =>
      (D.rowType[i] ?? 0) +
      lines.slice(0, k).reduce((sum, line) => sum + Array.from(line).length, 0) / 90,
  );
  return (
    <Fx
      fx={fx}
      style={{
        left: PANE.left,
        top,
        width: PANE.width,
        height: PANE.height,
        border: "2px solid var(--hairline)",
        borderRadius: 14,
        background: "color-mix(in srgb, var(--bg-deep) 82%, transparent)",
        boxShadow: "0 18px 40px rgb(0 0 0 / 0.28)",
        opacity: 0,
      }}
    >
      {lines.map((line, k) => {
        const text =
          k === 0 ? `${" ".repeat(Array.from(name).length)}${line.slice(name.length)}` : line;
        return (
          <Typed
            key={line}
            text={text}
            start={starts[k] ?? 0}
            cps={90}
            className="type-label"
            top={22 + k * 42}
            left={84}
          />
        );
      })}
      <Typed
        text={name}
        start={starts[0] ?? 0}
        cps={90}
        className="type-label"
        color="var(--clay)"
        top={22}
        left={84}
      />
    </Fx>
  );
}

function CliAgentsPlate() {
  const paneFx = (frame: Frame): StyleMap => {
    const u = prog(frame.tau, D.split.start + 0.05, D.split.end + 0.05, outExpo);
    return { "clip-path": `inset(0 0 ${px((1 - u) * (1080 - SPLIT_Y))} 0)` };
  };
  /** Kiro's Bash row and command drift up and out before the three panes rise. */
  const kiroFx = (frame: Frame): StyleMap => {
    const u = prog(frame.tau, D.collapse.start, D.collapse.end, inOutCubic);
    return {
      transform: `translate3d(0, ${px(-40 * u)}, 0)`,
      opacity: (1 - u).toFixed(3),
      visibility: u >= 1 ? "hidden" : "visible",
    };
  };
  return (
    <>
      <Fx fx={leaveFx(0)} style={{ inset: 0 }}>
        <TipTitle text={TITLE} settleBy={D.title} exit={D.exit} />
      </Fx>
      <Fx fx={kiroFx} style={{ inset: 0 }}>
        <Fx fx={paneFx} style={{ inset: 0 }}>
          <KiroPane />
        </Fx>
      </Fx>
      {OTHER_LINES.map((lines, i) => (
        <Fx key={lines[0]} fx={leaveFx(1 + i)} style={{ inset: 0 }}>
          <OtherPane i={i} lines={lines} />
        </Fx>
      ))}
      <Fx fx={leaveFx(4)} style={{ inset: 0 }}>
        <Fx
          fx={(frame) => {
            const u = prog(frame.tau, D.l1 - 0.3, D.l1 + 0.1, outCubic);
            return { opacity: u.toFixed(3), transform: `translate3d(0, ${px((1 - u) * 16)}, 0)` };
          }}
          style={{ left: PANE.left, top: paneY(3) + 2, opacity: 0 }}
        >
          <ExtLink href={PROMPT_MASTER} className="type-label" style={{ color: "var(--soft)" }}>
            /prompt-master
          </ExtLink>
        </Fx>
      </Fx>
      <Fx fx={leaveFx(0)} style={{ inset: 0 }}>
        <Rule at={D.split.start} top={SPLIT_Y} tone="var(--clay)" />
      </Fx>
      <Baton
        from={HANDS}
        to={BATON_SLOT}
        path={(a, b, u) => arcPoint(a, b, 140, u)}
        progress={(tau) => prog(tau, D.baton.launch, D.baton.land, inOutCubic)}
        show={D.baton.launch}
        hide={D.baton.land}
      />
      {OTHER_LINES.map((lines, i) => (
        <Fx key={lines[0]} fx={leaveFx(1 + i)} style={{ inset: 0 }}>
          <Baton
            from={HANDS}
            to={{ x: PANE.left + 44, y: paneY(i) + 42 }}
            path={dropPoint}
            progress={(tau) => batonProgress(tau, 186.3 + i * 0.2, D.l1, 1, 0)}
            show={186.3 + i * 0.2}
            hide={D.exit + 0.6}
          />
        </Fx>
      ))}
    </>
  );
}

const ACTS: readonly Act[] = [
  { kind: "carry", at: 179.9, dur: 1.2 },
  { kind: "look", at: 181.2, dur: 3.6, x: -0.8, y: 0.7 },
  { kind: "carry", at: 185.9, dur: 1.1 },
  { kind: "look", at: 187.0, dur: 3.3, x: -0.4, y: 0.8 },
  { kind: "carry", at: 190.6, dur: 0.5 },
  { kind: "hop", at: 190.75, height: 60 },
];

export default function Tip06CliAgentsSegment() {
  return (
    <SegmentRoot window={D.window}>
      <TipFrame
        tip={{
          n: 6,
          prompt: TIP_PROMPT,
          verb: "Wrangling",
          typeAt: D.typeAt,
          cps: D.cps,
          submitAt: D.submitAt,
          spinnerAt: D.spinnerAt,
          tokens: (tau) => Math.max(0, tau - D.spinnerAt) * 260,
        }}
        out={{ at: D.exit, pastVerb: "Worked", duration: "1m 15s" }}
        textFx={(frame) => {
          const u = lift(frame.tau);
          return {
            transform: `translateY(${px(-200 * u)})`,
            "clip-path": `inset(0 0 ${px(560 + 200 * u)} 0)`,
            visibility: u >= 1 ? "hidden" : "visible",
          };
        }}
        stackFx={(frame) => ({ transform: `translateY(${px(stackDrop(frame.tau))})` })}
        plate={<CliAgentsPlate />}
      />
      <Bot acts={ACTS} place={(tau) => ({ x: 0, y: tip6StackDy(tau), scale: 1 })} />
    </SegmentRoot>
  );
}
