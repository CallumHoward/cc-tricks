import { inOutCubic, inQuad, outCubic, outExpo, prog } from "#/engine/motion/ease";
import type { Frame } from "#/engine/types";
import { RuleRise, SPIN_GLYPH } from "#/talk/kit/motion";
import { Counter, ReadToolRow, SpinnerGlyph } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { scriptFor } from "#/talk/script";

import { Bot, Chip, Fx, px, Rule, SegmentRoot, TipFrame, Typed, type StyleMap } from "./boundary";
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
const SPLIT_Y = 400;
const ROW_Y = [462, 568, 674] as const;
const HANDS: Point = { x: 1470, y: 300 };
const BATON_SLOT: Point = { x: 218, y: 600 };
/** Where each pane's baton would land, just past its chip; it creeps toward it through the hold. */
const BATON_END = [420, 330, 300] as const;

const kiro = scriptFor("t6-kiro");
const others = scriptFor("t6-others");
export const KIRO_LINES = wrapCommand(documentedKiro(kiro.code[0]?.code ?? ""), 78);
export const OTHER_LINES = others.code.map((block) => wrapCommand(block.code, 78));
const TIP_PROMPT = kiro.headline ?? "";

const lift = (tau: number) => prog(tau, D.lift.start, D.lift.end, inOutCubic);
const home = (tau: number) => 1 - prog(tau, D.exit, D.exit + 0.3, inOutCubic);

/** Blinds: element `i` of the plate drops shut (scaleY → 0) at the exit. */
const blind = (tau: number, i: number) =>
  prog(tau, D.exit + i * 0.05, D.exit + i * 0.05 + 0.22, inQuad);

function BatonSvg({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <path d={SPIN_GLYPH.d} fill="var(--clay)" />
    </svg>
  );
}

/** A ✳ thrown along an arc; `progress(τ)` is its place on the arc, hidden outside [show, hide). */
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
    const spin = (frame.tau - show) * 540;
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
  return burst + Math.max(0, tau - (D.kiro.at - 0.8)) * 38;
};

function KiroPane() {
  const typeEnd = (i: number) =>
    D.kiroType.start +
    KIRO_LINES.slice(0, i).reduce((sum, line) => sum + Array.from(line).length, 0) / D.kiroType.cps;
  const [label1 = "", label2 = ""] = kiro.labels;
  const status = (frame: Frame): StyleMap => ({
    "clip-path":
      frame.tau < D.baton.land
        ? "inset(0 100% 0 0)"
        : `inset(-0.4em ${((1 - prog(frame.tau, D.baton.land, D.baton.land + 0.25, outExpo)) * 100).toFixed(2)}% -0.4em -0.4em)`,
  });
  return (
    <>
      {KIRO_LINES.map((line, i) => (
        <Typed
          key={line}
          text={line}
          start={typeEnd(i)}
          cps={D.kiroType.cps}
          className="type-code"
          top={448 + i * 46}
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
      <Typed
        text={label1}
        start={D.labelsType.start}
        cps={D.labelsType.cps}
        className="type-label"
        top={688}
      />
      <Typed
        text={label2}
        start={D.labelsType.start + 0.12}
        cps={D.labelsType.cps}
        className="type-label text-muted"
        top={738}
      />
    </>
  );
}

function OtherRow({ i, lines }: { i: number; lines: string[] }) {
  const top = ROW_Y[i] ?? 0;
  const name = lines[0]?.split(" ")[0] ?? "";
  const fx = (frame: Frame): StyleMap => ({
    transform: `scaleY(${(1 - blind(frame.tau, 2 + i)).toFixed(4)})`,
  });
  const starts = lines.map(
    (_, k) =>
      (D.rowType[i] ?? 0) +
      lines.slice(0, k).reduce((sum, line) => sum + Array.from(line).length, 0) / 90,
  );
  return (
    <Fx fx={fx} style={{ inset: 0, transformOrigin: `0 ${top + 40}px` }}>
      <Rule at={D.rows[i] ?? 0} top={top} tone="var(--hairline)" />
      <Chip text={name} at={(D.rows[i] ?? 0) + 0.1} top={top} />
      {lines.map((line, k) => (
        <Typed
          key={line}
          text={line}
          start={starts[k] ?? 0}
          cps={90}
          className="type-code"
          top={top + 26 + k * 46}
        />
      ))}
    </Fx>
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

export function CliAgentsPlate() {
  const paneFx = (frame: Frame): StyleMap => {
    const u = prog(frame.tau, D.split.start + 0.05, D.split.end + 0.05, outExpo);
    const shut = blind(frame.tau, 1);
    return {
      "clip-path": `inset(0 0 ${((1 - u) * 100).toFixed(2)}% 0)`,
      transform: `scaleY(${(1 - shut).toFixed(4)})`,
    };
  };
  const kiroFx = (frame: Frame): StyleMap => {
    const u = prog(frame.tau, D.collapse.start, D.collapse.end, inQuad);
    return {
      transform: `scaleY(${(1 - u).toFixed(4)})`,
      visibility: u >= 1 ? "hidden" : "visible",
    };
  };
  const mainFx = (frame: Frame): StyleMap => ({
    transform: `scaleY(${(1 - blind(frame.tau, 0)).toFixed(4)})`,
  });
  const l1Fx = (frame: Frame): StyleMap => ({
    transform: `scaleY(${(1 - blind(frame.tau, 5)).toFixed(4)})`,
  });
  return (
    <>
      <Fx
        fx={mainFx}
        style={{ left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 280px" }}
      >
        <ReadToolRow
          tool="Bash"
          arg="kiro-cli …"
          status="running"
          at={D.split.start}
          style={{ position: "absolute", left: 200, top: 257 }}
        />
      </Fx>
      <Fx
        fx={paneFx}
        style={{
          left: 0,
          top: SPLIT_Y,
          width: 1920,
          height: 1080 - SPLIT_Y,
          background: "var(--bg-deep)",
          transformOrigin: "0 0",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: -SPLIT_Y, width: 1920, height: 1080 }}>
          <Fx fx={kiroFx} style={{ inset: 0, transformOrigin: `0 ${SPLIT_Y}px` }}>
            <KiroPane />
          </Fx>
          {OTHER_LINES.map((lines, i) => (
            <OtherRow key={lines[0]} i={i} lines={lines} />
          ))}
        </div>
      </Fx>
      <Fx
        fx={(frame) => ({ transform: `scaleY(${(1 - blind(frame.tau, 1)).toFixed(4)})` })}
        style={{ inset: 0, transformOrigin: `0 ${SPLIT_Y}px` }}
      >
        <Rule at={D.split.start} top={SPLIT_Y} tone="var(--clay)" />
        <Chip text="kiro-cli" at={D.split.start + 0.12} top={SPLIT_Y} />
      </Fx>
      <Fx fx={l1Fx} style={{ left: 200, top: 822, transformOrigin: "0 50%" }}>
        <RuleRise text={others.lines[0] ?? ""} className="type-body" settleBy={D.l1} rule={false} />
      </Fx>
      <Baton
        from={HANDS}
        to={BATON_SLOT}
        path={(a, b, u) => arcPoint(a, b, 140, u)}
        progress={(tau) => prog(tau, D.baton.launch, D.baton.land, inOutCubic)}
        show={D.baton.launch}
        hide={D.baton.land}
      />
      {ROW_Y.map((y, i) => (
        <Baton
          key={y}
          from={HANDS}
          to={{ x: BATON_END[i] ?? 0, y }}
          path={dropPoint}
          progress={(tau) => batonProgress(tau, 186.3 + i * 0.2, D.l1, 0.9, 0.015)}
          show={186.3 + i * 0.2}
          hide={D.exit + 0.15}
        />
      ))}
    </>
  );
}

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
        echoFx={(frame) => ({
          transform: `translateY(${px(-220 * lift(frame.tau) * home(frame.tau))})`,
        })}
        spinnerFx={(frame) => ({
          transform: `translateY(${px(-160 * lift(frame.tau) * home(frame.tau))})`,
        })}
        stackFx={(frame) => ({ transform: `translateY(${px(tip6StackDy(frame.tau))})` })}
        plate={<CliAgentsPlate />}
      />
      <Bot acts={ACTS} place={(tau) => ({ x: 0, y: tip6StackDy(tau), scale: 1 })} />
    </SegmentRoot>
  );
}
