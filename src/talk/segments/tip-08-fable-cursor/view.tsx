import { inOutCubic, outExpo, prog } from "#/engine/motion/ease";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { ExtLink } from "#/talk/kit/ext-link";
import { RuleRise, SplitFlap } from "#/talk/kit/motion";
import type { Act } from "#/talk/mascot/actions";
import { scriptFor } from "#/talk/script";
import { TipTitle } from "#/talk/segments/shared/tip-title";
import {
  Bot,
  Fx,
  px,
  SegmentRoot,
  TipFrame,
  type StyleMap,
} from "#/talk/segments/tip-06-cli-agents/boundary";
import { placeAt, type PlaceKey } from "#/talk/segments/tip-06-cli-agents/timing";

import { BASE, BLOCK, ccTower, cursorTower, flapRows, quotaLeft, TIP8 } from "./timing";

const D = TIP8;
const cache = scriptFor("t8-cache");
const x18 = scriptFor("t8-18x");
const CURSOR_PRICING = "https://cursor.com/docs/models-and-pricing";
const TABLE = cache.tables[0] ?? { head: [], rows: [] };
const BOARD_ROWS = TABLE.rows.map(([l = "", r = ""]) => flapRows(l, r, 24));

const COL_X = [200, 980] as const;
const HEAD_Y = 372;
const FLAP_ROW_Y = [446, 566, 686] as const;
/** One quota bar under each column: the same plan, drained at Cursor's rate and at CC's. */
const QUOTA = { top: 852, width: 560, height: 14 };
const FLOOR = 860;
const TOWER_X = [1272, 1432] as const;
const TOWER_W = 138;

/** The tower's label block: the H says "CC", and "Claude Code" does not fit a 138 px tower. */
const CC_LABEL = "CC";
const base = (tau: number) => prog(tau, D.towers.start - 0.1, D.towers.start + 0.2, outExpo);

/** Each row's flap tiles fade once its roll has landed, leaving clean words on the board. */
const tileFade = (tau: number, row: number) =>
  prog(tau, (D.rows[row] ?? 0) + 0.85, (D.rows[row] ?? 0) + 1.1, inOutCubic);

const boardFold = (tau: number, row: number) =>
  prog(tau, D.board.foldStart + row * 0.06, D.board.foldStart + row * 0.06 + 0.4, inOutCubic);

/** The quota bars drift down and out before the tower bases rise through their row. */
const quotaFold = (tau: number) =>
  prog(tau, D.cache.at + D.cache.hold - 0.1, D.cache.at + D.cache.hold + 0.3, inOutCubic);

const QUOTA_BARS = [
  { speed: 1, tone: "var(--muted)" },
  { speed: 1 / 18, tone: "var(--clay)" },
] as const;

function QuotaBars() {
  const grow = (frame: Frame) =>
    prog(frame.tau, D.rows[2] - 0.1, D.rows[2] + 0.4, outExpo).toFixed(4);
  return (
    <>
      {QUOTA_BARS.map(({ speed, tone }, i) => (
        <Fx
          key={tone}
          fx={(frame) => ({ transform: `scaleX(${grow(frame)})` })}
          style={{
            left: COL_X[i],
            top: QUOTA.top,
            width: QUOTA.width,
            height: QUOTA.height,
            borderRadius: QUOTA.height / 2,
            overflow: "hidden",
            background: "var(--hairline)",
            transformOrigin: "0 50%",
            transform: "scaleX(0)",
          }}
        >
          <Fx
            fx={(frame) => ({
              "clip-path": `inset(0 ${((1 - quotaLeft(frame.tau, speed)) * 100).toFixed(2)}% 0 0 round ${QUOTA.height / 2}px)`,
              // Stripes stream toward the drained end on ambient time, so the hold keeps flowing
              "background-position": `${px(-ambientTime(frame) * 80 * speed)} 0`,
            })}
            style={{
              inset: 0,
              background: `repeating-linear-gradient(115deg, ${tone} 0 18px, color-mix(in srgb, ${tone} 72%, transparent) 18px 30px)`,
            }}
          />
        </Fx>
      ))}
    </>
  );
}

function Board() {
  const head =
    (i: number) =>
    (frame: Frame): StyleMap => {
      const u = prog(frame.tau, D.rows[0] - 0.2 + i * 0.1, D.rows[0] + 0.15 + i * 0.1, outExpo);
      return {
        transform: `translate3d(0, ${((1 - u) * 110 - boardFold(frame.tau, 0) * 60).toFixed(2)}%, 0)`,
        opacity: (1 - boardFold(frame.tau, 0)).toFixed(3),
      };
    };
  return (
    <>
      {TABLE.head.map((text, i) => (
        <div
          key={text}
          style={{ position: "absolute", left: COL_X[i], top: HEAD_Y, overflow: "hidden" }}
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
            {i === 0 ? <ExtLink href={CURSOR_PRICING}>{text}</ExtLink> : text}
          </Fx>
        </div>
      ))}
      {BOARD_ROWS.map((pair, r) =>
        pair.map((lines, c) => (
          <Fx
            key={`${r}-${lines.join("|")}`}
            fx={(frame) => ({
              transform: `rotateX(${(boardFold(frame.tau, r + 1) * 70).toFixed(1)}deg)`,
              opacity: (1 - boardFold(frame.tau, r + 1)).toFixed(3),
              "--tile": (1 - tileFade(frame.tau, r)).toFixed(3),
            })}
            className="t8-flap"
            style={{
              left: COL_X[c],
              top: FLAP_ROW_Y[r],
              ["--tile" as string]: "1",
              transformOrigin: "50% 0",
              perspective: 800,
              ["--cols" as string]: Math.max(...lines.map((line) => Array.from(line).length)),
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
      <style>{FLAP_CSS}</style>
    </>
  );
}

/**
 * Tighter cells than the kit's default so each phrase reads as words, not spaced letters. The hinge
 * line goes with the tiles, so punctuation on it ("flat-rate") lands as one glyph, not "=".
 */
const FLAP_CSS = `
.t8-flap .km-flap-board{font-size:42px;grid-template-columns:repeat(var(--cols),0.62em)!important;gap:6px 2px}
.t8-flap .km-flap-top,.t8-flap .km-flap-leaf[data-half="top"]{background:color-mix(in srgb,var(--hairline) calc(var(--tile)*100%),transparent)}
.t8-flap .km-flap-bot,.t8-flap .km-flap-leaf[data-half="bottom"]{background:color-mix(in srgb,var(--panel) calc(var(--tile)*100%),transparent)}
.t8-flap .km-flap-bot{border-top-width:calc(var(--tile)*1px)}
`;

function Tower({
  x,
  height,
  label,
  tone,
  glowing = false,
}: {
  x: number;
  height: (tau: number) => number;
  label: string;
  tone: string;
  /** Breathes a clay glow on ambient time */
  glowing?: boolean;
}) {
  const fx = (frame: Frame): StyleMap => {
    const h = height(frame.tau);
    const glow = glowing ? 0.35 + 0.2 * Math.sin(ambientTime(frame) * 1.6) : 0;
    return {
      "clip-path": `inset(${px(2400 - h)} -40px 0 -40px)`,
      filter: glow > 0 ? `drop-shadow(0 0 18px rgb(217 119 87 / ${glow.toFixed(3)}))` : "none",
    };
  };
  return (
    <>
      <Fx
        fx={fx}
        style={{
          left: x,
          top: FLOOR - BASE - 2400,
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
          top: FLOOR - BASE + 6,
          width: TOWER_W,
          height: BASE - 6,
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
          left: 1232,
          top: FLOOR,
          width: 380,
          height: 3,
          background: "var(--soft)",
          transformOrigin: "0 50%",
          transform: "scaleX(0)",
        }}
      />
      <Tower x={TOWER_X[0]} height={cursorTower} label={cursorLabel} tone="var(--muted)" />
      <Tower
        x={TOWER_X[1]}
        height={(tau) => ccTower(tau)}
        label={CC_LABEL}
        tone="var(--clay)"
        glowing
      />
      <Fx
        fx={(frame) => {
          const u = prog(frame.tau, D.towers.ccSettle - 0.4, D.towers.ccSettle, outExpo);
          return {
            transform: `translate3d(${px(-24 * (1 - u))}, 0, 0)`,
            opacity: u.toFixed(3),
          };
        }}
        className="type-code"
        style={{
          left: TOWER_X[1] + TOWER_W + 20,
          top: FLOOR - BASE - 18 * BLOCK - 4,
          fontSize: 44,
          color: "var(--clay)",
          opacity: 0,
        }}
      >
        ~18×
      </Fx>
    </>
  );
}

function Plate() {
  // Rises in behind the receding home shot, drifts up and fades at the exit
  const fx = (frame: Frame): StyleMap => {
    const v = prog(frame.tau, D.enter.start + 0.25, D.enter.end + 0.15, inOutCubic);
    const u = prog(frame.tau, D.exit, D.exit + 0.4, inOutCubic);
    return {
      transform: `translate3d(0, ${px(70 * (1 - v) - 48 * u)}, 0)`,
      opacity: (v * (1 - u)).toFixed(3),
      display: frame.tau >= D.enter.start && u < 1 ? "block" : "none",
    };
  };
  return (
    <Fx fx={fx} style={{ inset: 0, display: "none" }}>
      <TipTitle text={cache.headline ?? ""} settleBy={D.title} exit={D.board.foldStart} />
      <Fx
        fx={(frame) => {
          const u = quotaFold(frame.tau);
          return { transform: `translate3d(0, ${px(40 * u)}, 0)`, opacity: (1 - u).toFixed(3) };
        }}
        style={{ inset: 0 }}
      >
        <QuotaBars />
      </Fx>
      <Board />
      <Towers />
      <div style={{ position: "absolute", left: 200, top: 380 }}>
        <RuleRise text={x18.headline ?? ""} settleBy={D.headline} />
      </div>
    </Fx>
  );
}

/** The home shot dollies back and dims away as the board rolls in over it. */
const homeFx = (frame: Frame): StyleMap => {
  const back =
    prog(frame.tau, D.enter.start, D.enter.end, inOutCubic) *
    (1 - prog(frame.tau, D.exit + 0.1, D.exit + 0.5, inOutCubic));
  if (back <= 0) return { transform: "none", opacity: "1" };
  return {
    transform: `translate3d(0, ${px(60 * back)}, 0) scale(${(1 - 0.06 * back).toFixed(5)})`,
    opacity: (1 - back).toFixed(3),
  };
};

/** Where the bot stands for t8-cache: past the end of the CC quota bar, holding up the coin. */
const CACHE_SPOT = { x: 220, y: 330, scale: 0.7 };

const PLACES: readonly PlaceKey[] = [
  { at: 210.9, x: 0, y: 0, scale: 1 },
  { at: 211.6, ...CACHE_SPOT },
  { at: 216.6, ...CACHE_SPOT },
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
    <Fx
      fx={fx}
      style={{
        left: 1462 + CACHE_SPOT.x,
        top: 452 + CACHE_SPOT.y,
        width: 40,
        height: 40,
        visibility: "hidden",
      }}
    >
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
