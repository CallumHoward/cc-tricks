import { inOutCubic, inQuad, outExpo, prog } from "#/engine/motion/ease";
import type { Frame } from "#/engine/types";
import {
  CssBed,
  diveAt,
  GlyphDive,
  RuleRise,
  SplitFlap,
  Stamp,
  ZERO_GLYPH,
} from "#/talk/kit/motion";
import { Chevron } from "#/talk/kit/tui";
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

import { BLOCK, ccTower, cursorTower, flapCounter, flapRows, TIP8 } from "./timing";

const D = TIP8;
const cache = scriptFor("t8-cache");
const x18 = scriptFor("t8-18x");
const TABLE = cache.tables[0] ?? { head: [], rows: [] };
export const BOARD_ROWS = TABLE.rows.map(([l = "", r = ""]) => flapRows(l, r, 13));

/** The `0` of the spinner's `↓ 0 tokens` (measured from a still). */
const ZERO = { x: 594, y: 486, size: 28 };
const DIVE = {
  at: { x: ZERO.x, y: ZERO.y },
  size: ZERO.size,
  glyph: ZERO_GLYPH,
  start: D.dive.start,
  end: D.dive.end,
};

const COL_X = [300, 1020] as const;
const FLAP_ROW_Y = [372, 510, 648] as const;
const FLOOR = 860;
const TOWER_X = [1230, 1410] as const;
const TOWER_W = 160;

/** The tower's label block: the H says "CC", and "Claude Code" does not fit a 160 px tower. */
const CC_LABEL = "CC";
const base = (tau: number) => prog(tau, D.towers.start - 0.1, D.towers.start + 0.2, outExpo);

const boardFold = (tau: number, row: number) =>
  prog(tau, D.board.foldStart + row * 0.08, D.board.foldStart + row * 0.08 + 0.3, inQuad);

function FlapCounter() {
  const digits = 6;
  const fx =
    (i: number) =>
    (frame: Frame): StyleMap => {
      const v = flapCounter(frame.tau);
      const place = 10 ** (digits - 1 - i);
      const digit = Math.floor(v / place) % 10;
      const phase = i === digits - 1 ? v - Math.floor(v) : 0;
      const flipping = phase > 0.02 && phase < 0.98;
      return {
        "--d": `"${digit}"`,
        "--n": `"${(digit + 1) % 10}"`,
        "--flip": flipping ? `${(-phase * 180).toFixed(1)}deg` : "-90deg",
      };
    };
  return (
    <div
      className="tui type-code"
      style={{
        position: "absolute",
        left: 1210,
        top: 206,
        display: "flex",
        gap: 4,
        alignItems: "center",
      }}
    >
      <span style={{ color: "var(--muted)", marginRight: 12 }}>↓</span>
      {Array.from({ length: digits }, (_, i) => (
        <Fx key={`d${i + 1}`} fx={fx(i)} className="t8-digit" style={{ position: "relative" }} />
      ))}
      <style>{DIGIT_CSS}</style>
    </div>
  );
}

const DIGIT_CSS = `
.t8-digit{width:1.15em;height:1.5em;border-radius:4px;background:var(--panel);color:var(--text);font-weight:600;perspective:300px;overflow:visible}
.t8-digit::before{content:var(--d);position:absolute;inset:0;display:grid;place-items:center;line-height:1.5em}
.t8-digit::after{content:var(--n);position:absolute;left:0;right:0;top:0;height:50%;overflow:hidden;display:grid;place-items:start center;line-height:1.5em;background:#2c2b28;border-radius:4px 4px 0 0;transform-origin:50% 100%;transform:rotateX(var(--flip));backface-visibility:hidden}
`;

function Board() {
  const head =
    (i: number) =>
    (frame: Frame): StyleMap => {
      const u = prog(frame.tau, D.rows[0] - 0.2 + i * 0.1, D.rows[0] + 0.15 + i * 0.1, outExpo);
      return {
        transform: `translate3d(0, ${((1 - u) * 110).toFixed(2)}%, 0) scaleY(${(1 - boardFold(frame.tau, 0)).toFixed(4)})`,
      };
    };
  return (
    <>
      {TABLE.head.map((text, i) => (
        <div
          key={text}
          style={{ position: "absolute", left: COL_X[i], top: 306, overflow: "hidden" }}
        >
          <Fx
            fx={head(i)}
            className="type-label"
            style={{
              position: "relative",
              color: i === 1 ? "var(--clay)" : "var(--soft)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {text}
          </Fx>
        </div>
      ))}
      {BOARD_ROWS.map((pair, r) =>
        pair.map((lines, c) => (
          <Fx
            key={`${r}-${lines.join("|")}`}
            fx={(frame) => ({
              transform: `rotateX(${(boardFold(frame.tau, r + 1) * 90).toFixed(1)}deg)`,
            })}
            style={{
              left: COL_X[c],
              top: FLAP_ROW_Y[r],
              transformOrigin: "50% 0",
              perspective: 800,
            }}
          >
            <SplitFlap
              rows={lines}
              start={(D.rows[r] ?? 0) + c * 0.06}
              rowStagger={0.1}
              colStagger={0.015}
            />
          </Fx>
        )),
      )}
    </>
  );
}

function Tower({
  x,
  height,
  label,
  tone,
}: {
  x: number;
  height: (tau: number) => number;
  label: string;
  tone: string;
}) {
  const fx = (frame: Frame): StyleMap => {
    const h = height(frame.tau);
    return { "clip-path": `inset(${px(2400 - h)} 0 0 0)` };
  };
  return (
    <>
      <Fx
        fx={fx}
        style={{
          left: x,
          top: FLOOR - 2400,
          width: TOWER_W,
          height: 2400,
          background: `repeating-linear-gradient(to top, ${tone} 0 ${BLOCK - 6}px, transparent ${BLOCK - 6}px ${BLOCK}px)`,
          clipPath: "inset(100% 0 0 0)",
        }}
      />
      <Fx
        fx={(frame) => ({ transform: `scaleY(${base(frame.tau).toFixed(4)})` })}
        className="type-label"
        style={{
          left: x,
          top: FLOOR - BLOCK + 6,
          width: TOWER_W,
          height: BLOCK - 6,
          display: "grid",
          placeItems: "center",
          background: "var(--bg-deep)",
          border: `2px solid ${tone}`,
          borderRadius: 4,
          color: "var(--text)",
          transformOrigin: "50% 100%",
          transform: "scaleY(0)",
        }}
      >
        {label}
      </Fx>
    </>
  );
}

function Towers() {
  const floor = (frame: Frame): StyleMap => ({
    transform: `scaleX(${prog(frame.tau, D.board.foldStart, D.towers.start + 0.3, outExpo).toFixed(4)})`,
  });
  const [cursorLabel = ""] = TABLE.head;
  return (
    <>
      <Fx
        fx={floor}
        style={{
          left: 1180,
          top: FLOOR,
          width: 440,
          height: 3,
          background: "var(--soft)",
          transformOrigin: "0 50%",
          transform: "scaleX(0)",
        }}
      />
      <Tower
        x={TOWER_X[0]}
        height={(tau) => cursorTower(tau) + BLOCK * base(tau)}
        label={cursorLabel}
        tone="var(--muted)"
      />
      <Tower
        x={TOWER_X[1]}
        height={(tau) => ccTower(tau) + BLOCK * base(tau)}
        label={CC_LABEL}
        tone="var(--clay)"
      />
    </>
  );
}

function Plate() {
  const exitFold = (frame: Frame): StyleMap => {
    const u = prog(frame.tau, D.exit, D.exit + 0.3, inOutCubic);
    return {
      transform: `scaleY(${(1 - u).toFixed(4)})`,
      display: frame.tau >= D.dive.start - 0.05 && u < 1 ? "block" : "none",
    };
  };
  return (
    <Fx fx={exitFold} style={{ inset: 0, transformOrigin: "0 500px", display: "none" }}>
      <GlyphDive
        {...DIVE}
        plate={
          <>
            <CssBed tone="dark" />
            <Fx
              fx={(frame) => ({ transform: `scaleY(${(1 - boardFold(frame.tau, 0)).toFixed(4)})` })}
              style={{ left: 200, top: 230, transformOrigin: "0 50%" }}
            >
              <div
                className="tui tui-line type-code tui-dim"
                style={{ transform: "translateY(-50%)" }}
              >
                <Chevron />
                <span>{` ${cache.headline ?? ""}`}</span>
              </div>
            </Fx>
            <Fx
              fx={(frame) => ({ transform: `scaleY(${(1 - boardFold(frame.tau, 0)).toFixed(4)})` })}
              style={{ inset: 0, transformOrigin: "0 230px" }}
            >
              <FlapCounter />
            </Fx>
            <Board />
            <Towers />
            <div style={{ position: "absolute", left: 200, top: 226 }}>
              <RuleRise
                text={"Up to ~18× more\nFable tokens in CC\nfor the same price"}
                settleBy={D.headline}
              />
            </div>
            <Typed
              text={x18.footnotes[0] ?? ""}
              start={D.foot.start}
              cps={D.foot.cps}
              className="type-label text-muted"
              top={664}
            />
            <Stamp
              text={x18.stamps[0] ?? ""}
              settleBy={D.stamp}
              rotate={-9}
              style={{ left: 560, top: 780 }}
            />
          </>
        }
      />
    </Fx>
  );
}

const homeFx = (frame: Frame): StyleMap => {
  if (frame.tau >= D.exit || frame.tau < D.dive.start) return { transform: "none", opacity: "1" };
  const d = diveAt(frame.tau, DIVE);
  return {
    transform: `translate3d(${px(d.tx)}, ${px(d.ty)}, 0) scale(${d.scale.toFixed(5)})`,
    opacity: d.u >= 1 ? "0" : "1",
  };
};

const PLACES: readonly PlaceKey[] = [
  { at: 210.9, x: 0, y: 0, scale: 1 },
  { at: 211.6, x: -520, y: 290, scale: 0.7 },
  { at: 216.6, x: -520, y: 290, scale: 0.7 },
  { at: 217.3, x: -460, y: 280, scale: 0.7 },
  { at: 221.5, x: -460, y: 280, scale: 0.7 },
  { at: 221.85, x: 0, y: 0, scale: 1 },
];

const ACTS: readonly Act[] = [
  { kind: "hop", at: 210.95, height: 80 },
  { kind: "carry", at: 212.0, dur: 4.4 },
  { kind: "look", at: 217.4, dur: 4.0, x: 0.7, y: -0.9 },
  { kind: "carry", at: 221.75, dur: 0.5 },
  { kind: "hop", at: 221.8, height: 60 },
];

/** The clay ✳ coin the bot holds up to the board in t8-cache. */
function Coin() {
  const fx = (frame: Frame): StyleMap => {
    const show = frame.tau >= 212.1 && frame.tau < D.board.foldStart;
    const u = prog(frame.tau, 212.1, 212.5, outExpo);
    return {
      visibility: show ? "visible" : "hidden",
      transform: `translate3d(0, ${px((1 - u) * 40)}, 0) rotate(${(frame.w * 40).toFixed(1)}deg)`,
    };
  };
  return (
    <Fx fx={fx} style={{ left: 942, top: 680, width: 40, height: 40, visibility: "hidden" }}>
      <svg viewBox="0 0 100 100" width={40} height={40} aria-hidden>
        <circle cx={50} cy={50} r={48} fill="var(--clay)" />
        <path
          d="M50 18v64M18 50h64M27 27l46 46M73 27L27 73"
          stroke="var(--on-clay)"
          strokeWidth={9}
          strokeLinecap="round"
        />
      </svg>
    </Fx>
  );
}

export default function Tip08FableCursorSegment() {
  return (
    <SegmentRoot window={D.window}>
      <TipFrame
        tip={{
          n: 8,
          prompt: cache.headline ?? "",
          verb: "Finagling",
          typeAt: D.typeAt,
          cps: D.cps,
          submitAt: D.submitAt,
          spinnerAt: D.spinnerAt,
          tokens: 0,
          elapsed: 0,
        }}
        out={{ at: D.exit, pastVerb: "Churned", duration: "1m" }}
        homeFx={homeFx}
        plate={<Plate />}
      />
      <Bot acts={ACTS} place={(tau) => placeAt(PLACES, tau)} />
      <Coin />
    </SegmentRoot>
  );
}
