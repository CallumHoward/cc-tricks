import { inOutCubic, outCubic, prog } from "#/engine/motion/ease";
import { keys } from "#/engine/motion/track";
import { ContextBar, RuleRise, Stamp } from "#/talk/kit/motion";
import { num, put } from "#/talk/kit/motion/dom";
import {
  CompletionLine,
  GLYPH_PATHS,
  HOME,
  Pile,
  PromptBox,
  ReadToolRow,
  ScrollbackWhip,
  SpinnerLine,
} from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { scriptFor } from "#/talk/script";
import { BOT_HOME, HOME_ZONES, HomeRest } from "#/talk/segments/shared/home";
import { TIP_TITLE_LINE, TIP_TITLE_TOP, TipTitle } from "#/talk/segments/shared/tip-title";

import { During, Echo, FILL, Layer } from "./parts";
import {
  botX,
  breakWords,
  collapseScale,
  foldAt,
  GHOST_TEXT,
  letterScale,
  PILE_KEYS,
  riseStart,
  scrollY,
  strikeAt,
  sweepX,
  T9,
  tapeHeightKeys,
} from "./tracks";

const SCRIPT = scriptFor("t9-suggestions");
const TITLE = SCRIPT.headline ?? GHOST_TEXT;
const GHOST = SCRIPT.ui[0] ?? GHOST_TEXT;
const CODE = SCRIPT.code[0]?.code ?? "";
const [L1 = "", L2 = ""] = SCRIPT.lines;
const STAMP = SCRIPT.stamps[0] ?? "";
const FOOT = SCRIPT.footnotes[0] ?? "";

const PROMPT_Y = HOME.promptTop + HOME.promptHeight / 2;
/** One mono cell at code size (JetBrains Mono advance 0.6 em × 34 px). */
const CH = 20.4;
/** The fresh prompt's caret sits two cells right of the prompt's text origin. */
const CARET_X = HOME.left + 40 + 2 * CH;
/** The claim sits right of the transcript under the title; the stat pairs with the docs footnote. */
const COPY = { x: 1140, top: TIP_TITLE_TOP + TIP_TITLE_LINE + 32 };
const TAPE = { x: 200, bottom: 740, width: 1200 };
const STAT = { x: 1080, top: TAPE.bottom + 28 };

const BOT_ACTS: readonly Act[] = [
  { kind: "look", at: T9.ghostAt, dur: 1.1, x: -1, y: 0.7 },
  { kind: "surprised", at: T9.ghostAt + 0.05, dur: 0.35 },
  { kind: "walk", at: T9.botWalkAt, dur: T9.botWalkDur, dx: -1, stepRate: 5 },
  { kind: "look", at: T9.strikeAt - 0.3, dur: 4.9, x: -1, y: 0.6 },
  { kind: "wave", at: T9.waveAt, dur: T9.at - 0.8 - T9.waveAt, side: "L" },
  { kind: "hop", at: T9.exit.foldAt, height: 50 },
];

/** The re-suggested ghost: struck through, then sucked letter by letter into the caret. */
function GhostCollapse() {
  const letters = Array.from(GHOST);
  const n = letters.length;
  return (
    <Layer
      className="tui type-code"
      style={{ position: "absolute", left: CARET_X + CH, top: PROMPT_Y, height: 0 }}
      write={(root, frame) => {
        const { tau } = frame;
        const s = collapseScale(tau);
        const shown = tau >= T9.reghostAt && s > 0;
        put(root, "visibility", shown ? "visible" : "hidden");
        if (!shown) return;
        const spans = root.children;
        for (let i = 0; i < n; i++) {
          const k = letterScale(s, i, n);
          const x = i * CH * k;
          put(
            spans[i] as HTMLElement,
            "transform",
            `translate3d(${num(x, 2)}px, -50%, 0) scale(${num(0.2 + 0.8 * k, 3)})`,
          );
          put(spans[i] as HTMLElement, "opacity", num(Math.min(1, k * 3), 3));
        }
        const strike = spans[n] as HTMLElement | undefined;
        put(strike, "transform", `translateY(-50%) scaleX(${num(strikeAt(tau) * s, 4)})`);
        const type = prog(tau, T9.reghostAt, T9.reghostAt + n / 90);
        put(
          root,
          "clip-path",
          type >= 1 ? "none" : `inset(-1em ${num((1 - type) * n * CH, 1)}px -1em -4px)`,
        );
      }}
    >
      {letters.map((c, i) => (
        <span
          // oxlint-disable-next-line react/no-array-index-key -- letters are positional and repeat
          key={i}
          className="tui-dim"
          style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 50%" }}
        >
          {c}
        </span>
      ))}
      <span
        style={{
          position: "absolute",
          left: -4,
          top: 2,
          width: n * CH + 8,
          height: 4,
          background: "var(--clay)",
          transformOrigin: "0 50%",
        }}
      />
    </Layer>
  );
}

/** A dim read-head and ghost ✳ sweeping the whole context: each suggestion re-reads it. */
function GhostSweep() {
  return (
    <Layer
      style={{ position: "absolute", left: TAPE.x, top: TAPE.bottom - 28, height: 28, width: 0 }}
      write={(el, frame) => {
        const { tau } = frame;
        const shown = tau > T9.sweepAt && tau < T9.exit.foldAt + T9.exit.foldDur;
        put(el, "visibility", shown ? "visible" : "hidden");
        const x = sweepX(tau);
        put(el, "width", `${num(x, 1)}px`);
        const glyph = el.lastElementChild as HTMLElement | null;
        put(glyph, "transform", `translate(-50%, -50%) rotate(${num(x * 0.06, 2)}deg)`);
      }}
    >
      <div
        style={{
          ...FILL,
          background: "rgb(250 249 245 / 62%)",
          borderRight: "4px solid var(--text)",
          borderRadius: 3,
        }}
      />
      <svg
        viewBox="0 0 100 100"
        aria-hidden
        style={{ position: "absolute", left: "100%", top: "50%", width: 96, height: 96 }}
      >
        <path d={GLYPH_PATHS["✳"]} fill="var(--text)" />
      </svg>
    </Layer>
  );
}

/** Transcript, copy and the read sweep: everything that folds into the completion line on exit. */
function FoldingPlate() {
  return (
    <Layer
      style={{ ...FILL, transformOrigin: `0 ${HOME.spinnerY}px` }}
      write={(el, frame) => {
        const f = foldAt(frame.tau);
        put(el, "transform", `scaleY(${num(1 - f, 4)})`);
        put(el, "visibility", f >= 1 ? "hidden" : "visible");
      }}
    >
      <Layer
        style={FILL}
        write={(el, frame) =>
          put(el, "transform", `translate3d(0, ${num(scrollY(frame.tau), 2)}px, 0)`)
        }
      >
        <Echo
          text={GHOST}
          at={T9.submitAt + 0.2}
          outAt={riseStart(TITLE, T9.titleSettle) - 0.4}
          style={{ top: HOME.echoY, transform: "translateY(-50%)" }}
        />
        <ReadToolRow
          tool="Update"
          arg="settings.json"
          output={[{ text: CODE, kind: "add" }]}
          at={T9.updateAt}
          outputAt={T9.updateOutAt}
          style={{ position: "absolute", left: HOME.textX, top: HOME.echoY + 56 }}
        />
      </Layer>

      <TipTitle text={TITLE} settleBy={T9.titleSettle} exit={T9.exit.foldAt} />
      <RuleRise
        text={breakWords(L1, [5])}
        settleBy={T9.copySettle}
        className="type-body"
        rule={false}
        style={{ position: "absolute", left: COPY.x, top: COPY.top }}
      />
      <RuleRise
        text={L2}
        settleBy={T9.copySettle + 0.12}
        className="type-body"
        rule={false}
        style={{ position: "absolute", left: STAT.x, top: STAT.top, color: "var(--clay-hi)" }}
      />
      <Stamp
        text={STAMP}
        settleBy={T9.stampSettle}
        rotate={-6}
        style={{ left: STAT.x + 340, top: STAT.top + 100 }}
      />
      <GhostSweep />
      <RuleRise
        text={FOOT}
        settleBy={T9.footSettle}
        className="type-label"
        rule={false}
        style={{ position: "absolute", left: TAPE.x, top: TAPE.bottom + 26, color: "var(--muted)" }}
      />
    </Layer>
  );
}

/** The exit line: the ghost proposes `✻ Crunched for 45s`, then it solidifies. */
function ExitLine() {
  const lineStyle = {
    position: "absolute",
    left: HOME.textX,
    top: HOME.spinnerY,
    transform: "translateY(-50%)",
  } as const;
  return (
    <>
      <div style={{ opacity: 0.42 }}>
        <CompletionLine
          className="type-label"
          style={lineStyle}
          pastVerb="Crunched"
          duration="45s"
          at={T9.exit.ghostLineAt}
          cps={110}
        />
      </div>
      <Layer
        style={FILL}
        write={(el, frame) => {
          const u = prog(frame.tau, T9.exit.solidAt, T9.exit.solidAt + T9.exit.solidDur, outCubic);
          put(el, "clip-path", `inset(0 ${num((1 - u) * 100, 3)}% 0 0)`);
          put(el, "visibility", u > 0 ? "visible" : "hidden");
        }}
      >
        <CompletionLine
          className="type-label"
          style={lineStyle}
          pastVerb="Crunched"
          duration="45s"
        />
      </Layer>
    </>
  );
}

function Plate() {
  const tape = tapeHeightKeys();
  return (
    <div style={FILL}>
      <ContextBar zones={HOME_ZONES} keys={{ height: tape }} />
      <FoldingPlate />
      <During from={T9.start - 1} to={T9.exit.ghostLineAt}>
        <SpinnerLine
          className="type-label"
          style={{
            position: "absolute",
            left: HOME.textX,
            top: HOME.spinnerY,
            transform: "translateY(-50%)",
          }}
          verb="Lollygagging"
          at={T9.spinnerAt}
          tokens={keys([T9.spinnerAt, 0], [T9.at, 1840, inOutCubic], [T9.holdEnd, 2100])}
          elapsed={keys([T9.spinnerAt, 0], [T9.holdEnd, 45])}
        />
      </During>
      <ExitLine />
      <PromptBox
        style={{ position: "absolute", left: HOME.left, top: HOME.promptTop }}
        ghost={GHOST}
        ghostAt={T9.ghostAt}
        acceptAt={T9.acceptAt}
        submitAt={T9.submitAt}
      />
      <GhostCollapse />
      <Pile count={PILE_KEYS} x={HOME.pileX} y={HOME.pileY} />
      <Layer
        style={{
          position: "absolute",
          left: BOT_HOME.left,
          top: BOT_HOME.top,
          width: BOT_HOME.width,
          height: BOT_HOME.height,
        }}
        write={(el, frame) => {
          put(el, "transform", `translate3d(${num(botX(frame.tau), 2)}px, 0, 0)`);
        }}
      >
        <StageMascot acts={BOT_ACTS} title="the bot" />
      </Layer>
    </div>
  );
}

export default function Tip09SuggestionsSegment() {
  return (
    <During from={T9.start} to={T9.end}>
      <ScrollbackWhip at={T9.exit.whipAt} dur={T9.exit.whipDur} distance={1080}>
        <Plate />
        <div style={{ ...FILL, transform: "translateY(-1080px)" }}>
          <HomeRest pile={9} from={T9.exit.whipAt} to={Number.POSITIVE_INFINITY} />
        </div>
      </ScrollbackWhip>
    </During>
  );
}
