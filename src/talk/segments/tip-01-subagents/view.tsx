import type { ReactNode } from "react";

import { outExpo, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { ExtLink } from "#/talk/kit/ext-link";
import { RuleRise } from "#/talk/kit/motion";
import { springFrom } from "#/talk/kit/motion/schedule";
import {
  AgentRow,
  CodeBlock,
  CompletionLine,
  GLYPH_PATHS,
  HOME,
  SpinnerLine,
} from "#/talk/kit/tui";
import { setStyle, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { LINKS, scriptFor } from "#/talk/script";
import { Drive, Gate } from "#/talk/segments/shared/gated-parts";
import { BOT_HOME, HomeRest } from "#/talk/segments/shared/home";
import { TipDock } from "#/talk/segments/shared/tip-turn";

import { RefShot } from "./ref-shot";
import { SpringLetters } from "./spring-letters";
import {
  ADV,
  AT,
  BOT_HOPS,
  botOffset,
  CARD,
  CARD_CLOSE,
  cardFloat,
  cardFrame,
  CHIPS,
  chipAt,
  chipCover,
  completionOut,
  CRATES,
  crateRise,
  crateX,
  dockY,
  EXIT,
  HOLD_END,
  linkIn,
  PANEL,
  plateOut,
  ROWS_BOX,
  rowsReveal,
  scanAt,
  SHOT,
  shotCam,
  spinnerOut,
  TRANSCRIPT,
  TRANSCRIPT_LEFT,
  transcriptLine,
  TURN,
  WIN,
  YAML_AT,
} from "./tracks";

const S1 = scriptFor("t1-agents");
const S2 = scriptFor("t1-model-effort");
const ADVISOR_DOCS = scriptFor("t1-advisor").sources[0] ?? "";
const YAML = (S2.code[0]?.code ?? "").split("\n");

const ACTS: readonly Act[] = [
  { kind: "celebrate", at: 49.05, dur: 1.1 },
  { kind: "hop", at: BOT_HOPS.toCard.at, height: 30, air: BOT_HOPS.toCard.air },
  { kind: "point", at: 55.6, dur: 0.7, angle: -20, side: "L" },
  { kind: "look", at: 56.4, dur: 3.5, x: -0.8, y: 0.2 },
  { kind: "hop", at: BOT_HOPS.toCrate.at, height: 40, air: BOT_HOPS.toCrate.air },
  { kind: "walk", at: 63.35, dur: 2.5, dx: 0, stepRate: 3 },
  { kind: "sweat", at: 63.5, dur: 4.9 },
  { kind: "hop", at: BOT_HOPS.toHome.at, height: 30, air: BOT_HOPS.toHome.air },
];

const abs = (left: number, top: number) => ({ position: "absolute" as const, left, top });

// Bot -------------------------------------------------------------------------------------------

const botTrack = (tau: number) => botOffset(tau);

function Bot() {
  return (
    <Drive
      fn={botTrack}
      style={{
        left: BOT_HOME.left,
        top: BOT_HOME.top,
        width: BOT_HOME.width,
        height: BOT_HOME.height,
      }}
    >
      <StageMascot acts={ACTS} title="the bot" />
    </Drive>
  );
}

// t1-agents ---------------------------------------------------------------------------------------

/** Dims everything but the five subagent rows, then outlines them with a breathing glow. */
function RowsHighlight() {
  const ref = useFrameRef<HTMLDivElement>((el: HTMLDivElement, frame: Frame) => {
    const { open, glow } = rowsReveal(frame.tau);
    const breathe = glow * (0.75 + 0.25 * Math.sin(ambientTime(frame) * 1.3));
    const h = 34 + (ROWS_BOX.height - 34) * open;
    setStyle(el, "height", `${h.toFixed(2)}px`);
    setStyle(el, "opacity", open > 0 ? "1" : "0");
    setStyle(
      el,
      "box-shadow",
      `0 0 ${(18 + 18 * breathe).toFixed(1)}px ${(2 + 3 * breathe).toFixed(1)}px rgb(217 119 87 / ${(0.55 * breathe).toFixed(3)}), 0 0 0 3000px rgb(16 16 22 / ${(0.5 * open).toFixed(3)})`,
    );
    setStyle(el, "outline-color", `rgb(235 159 127 / ${(0.9 * glow).toFixed(3)})`);
  });
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: ROWS_BOX.left,
        top: ROWS_BOX.top,
        width: ROWS_BOX.width,
        height: 34,
        borderRadius: 10,
        outline: "2px solid transparent",
        outlineOffset: 0,
        opacity: 0,
      }}
    />
  );
}

function AgentsPlate() {
  return (
    <>
      <RuleRise
        text={S1.headline ?? ""}
        settleBy={AT.agents - 0.8}
        exit={HOLD_END.agents}
        style={abs(200, 92)}
      />
      <Gate from={TURN.spinnerAt} to={50}>
        <Drive fn={spinnerOut} style={abs(HOME.textX, HOME.spinnerY - 18)}>
          <SpinnerLine className="type-label" verb="Orchestrating" at={TURN.spinnerAt} />
        </Drive>
      </Gate>
      <Gate from={48.9} to={HOLD_END.agents + 0.6}>
        <RefShot
          src={SHOT.src}
          alt="Claude Code with main and five general-purpose subagents, each at 150k to 231k tokens"
          left={SHOT.left}
          top={SHOT.top}
          width={SHOT.width}
          height={SHOT.height}
          cam={shotCam}
        >
          <RowsHighlight />
        </RefShot>
        <Drive
          fn={linkIn}
          className="type-label text-muted"
          style={abs(SHOT.left, SHOT.top + SHOT.height + 60)}
        >
          <ExtLink href={LINKS.previousTalk}>{S1.labels[0]}</ExtLink>
        </Drive>
      </Gate>
    </>
  );
}

// t1-model-effort ---------------------------------------------------------------------------------

function Chip({ i }: { i: number }) {
  const c = CHIPS[i] ?? CHIPS[0];
  const fn = (tau: number) => chipAt(i, tau);
  return (
    <Drive
      fn={fn}
      className="type-code"
      style={{
        left: 0,
        top: 0,
        height: 46,
        padding: "0 0.4ch",
        borderRadius: 10,
        background: "var(--clay)",
        color: "var(--on-clay)",
        lineHeight: "46px",
        fontWeight: 700,
        boxShadow: "0 10px 24px rgb(0 0 0 / 35%), 0 0 22px rgb(217 119 87 / 45%)",
        whiteSpace: "pre",
      }}
    >
      {c.text}
    </Drive>
  );
}

/** Erases the chip's base word from launch, so the pasted chip replaces it. */
function ChipCover({ i }: { i: number }) {
  const c = CHIPS[i] ?? CHIPS[0];
  const box = chipCover(i);
  const fn = (tau: number) => ({ scaleX: tau >= c.launch ? 1 : 0 });
  return (
    <Drive
      fn={fn}
      style={{ ...box, height: 46, background: "var(--bg-deep)", transformOrigin: "0 50%" }}
    />
  );
}

const cardTrack = (tau: number) => cardFrame(tau);

/** Card and chips share one slow ambient tilt, so the chips never slide off their slots. */
function CardFloat({ children }: { children: ReactNode }) {
  const ref = useFrameRef<HTMLDivElement>((el: HTMLDivElement, frame: Frame) => {
    const f = cardFloat(ambientTime(frame));
    setStyle(
      el,
      "transform",
      `rotateX(${f.rotateX.toFixed(3)}deg) rotateY(${f.rotateY.toFixed(3)}deg)`,
    );
  });
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1800 }}>
      <div
        ref={ref}
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `${CARD.left + CARD.width / 2}px ${CARD.top + 160}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModelPlate() {
  return (
    <>
      <RuleRise
        text={S2.headline ?? ""}
        settleBy={AT.model - 0.8}
        exit={HOLD_END.model}
        style={abs(200, 196)}
      />
      <Gate from={54.85} to={CARD_CLOSE.end}>
        <CardFloat>
          <Drive fn={cardTrack} style={{ ...abs(CARD.left, CARD.top), width: CARD.width }}>
            <CodeBlock lines={YAML} label={S2.code[0]?.label} at={YAML_AT} stagger={0.08} />
          </Drive>
          <Drive fn={cardTrack} style={{ inset: 0 }}>
            {CHIPS.map((c, i) => (
              <ChipCover key={c.text} i={i} />
            ))}
            {CHIPS.map((c, i) => (
              <Chip key={c.text} i={i} />
            ))}
          </Drive>
        </CardFloat>
      </Gate>
    </>
  );
}

// t1-advisor --------------------------------------------------------------------------------------

/** The advisor ✽ swings in, then turns forever on ambient time. */
const advisorStar = (tau: number, frame: Frame) => {
  const k = springFrom(tau, ADV.starIn, SPRINGS.LAND);
  return {
    x: 520 * (1 - k),
    rotate: -90 * (1 - k) + 24 * ambientTime(frame),
    scale: tau < ADV.starIn ? 0 : 1,
  };
};

const scanTrack = (tau: number) => scanAt(tau);

/** Main's conversation as dimmed lines: the advisor's scan reads each one and it folds away. */
function Transcript() {
  return (
    <Gate from={ADV.typeAt} to={ADV.scan.end + 0.05}>
      {TRANSCRIPT.map((l, i) => (
        <Drive
          key={l.y}
          fn={(tau: number) => ({ scaleX: transcriptLine(i, tau) })}
          style={{
            ...abs(TRANSCRIPT_LEFT, l.y - 5),
            width: l.width,
            height: 10,
            borderRadius: 5,
            background: "var(--hairline)",
            transformOrigin: "0 50%",
          }}
        />
      ))}
    </Gate>
  );
}

function Crate({ i }: { i: number }) {
  const c = CRATES[i] ?? CRATES[0];
  const fn = (tau: number) => {
    const rise = crateRise(i, tau);
    return {
      x: crateX(i, tau),
      y: 24 * (1 - rise),
      scale: 0.7 + 0.3 * rise,
      opacity: rise > 0 ? 1 : 0,
    };
  };
  return (
    <Drive
      fn={fn}
      className="type-label"
      style={{
        left: 0,
        top: c.top,
        width: c.width,
        height: 64,
        borderRadius: 8,
        border: "2px solid var(--clay-wash-55)",
        background: "var(--panel)",
        color: "var(--soft)",
        display: "grid",
        placeItems: "center",
        whiteSpace: "pre",
      }}
    >
      {c.label}
    </Drive>
  );
}

/** Tethers from each subagent row's bullet to the crate it is dragging. */
function Tethers() {
  const ref = useFrameRef<SVGSVGElement>((svg: SVGSVGElement, frame: Frame) => {
    CRATES.forEach((c, i) => {
      const line = svg.children[i];
      if (!line) return;
      const rise = crateRise(i, frame.tau);
      const x1 = crateX(i, frame.tau) + c.width;
      const y1 = c.top + 32;
      const x2 = PANEL.subLeft - 6;
      const y2 = (PANEL.subTops[i] ?? 0) + 23;
      line.setAttribute("x1", x1.toFixed(1));
      line.setAttribute("y1", y1.toFixed(1));
      line.setAttribute("x2", (x1 + (x2 - x1) * rise).toFixed(1));
      line.setAttribute("y2", (y1 + (y2 - y1) * rise).toFixed(1));
      line.setAttribute("visibility", rise > 0 ? "visible" : "hidden");
    });
  });
  return (
    <svg
      ref={ref}
      width={1920}
      height={1080}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden
    >
      {CRATES.map((c) => (
        <line
          key={c.label}
          stroke="var(--clay)"
          strokeWidth={2}
          strokeDasharray="6 8"
          visibility="hidden"
        />
      ))}
    </svg>
  );
}

const summaryTrack = (tau: number) => {
  const u = prog(tau, ADV.summaryAt, ADV.summaryAt + 0.5, outExpo);
  return { x: 420 * (1 - u), opacity: tau < ADV.summaryAt ? 0 : 1 };
};

function AdvisorPlate() {
  return (
    <Gate from={ADV.typeAt} to={EXIT.foldEnd}>
      <RuleRise
        text={ADV.line1}
        settleBy={ADV.typeAt + 0.75}
        className="type-body text-soft"
        rule={false}
        style={abs(200, 150)}
      />
      <ExtLink
        href={ADVISOR_DOCS}
        className="type-headline type-headline--xl"
        style={{ ...abs(196, 214), display: "block", textDecorationThickness: "0.03em" }}
      >
        <SpringLetters text={ADV.line2} at={ADV.typeAt + 0.4} className="text-clay" />
      </ExtLink>
      <Drive fn={advisorStar} style={{ ...abs(1450, 214), width: 190, height: 190 }}>
        <svg viewBox="0 0 100 100" width={190} height={190} aria-hidden>
          <path d={GLYPH_PATHS["✽"]} fill="var(--clay-hi)" />
        </svg>
      </Drive>
      <Transcript />
      <Drive
        fn={scanTrack}
        style={{ left: 160, top: -1, width: 1600, height: 3, background: "var(--clay)" }}
      />
      <AgentRow
        style={{ ...abs(200, PANEL.mainTop), width: 400 }}
        main
        name="main"
        enterAt={60.4}
      />
      <div
        style={{
          ...abs(240, PANEL.mainTop + 54),
          width: 300,
          height: 12,
          borderRadius: 6,
          background: "var(--hairline)",
          overflow: "hidden",
        }}
      >
        <div style={{ width: "22%", height: "100%", background: "var(--clay)" }} />
      </div>
      <Drive fn={summaryTrack} className="type-label tui" style={abs(200, PANEL.mainTop + 84)}>
        <span className="tui-line tui-dim">
          <span className="tui-hook" />
          summary
        </span>
      </Drive>
      {PANEL.subTops.map((top, i) => (
        <AgentRow
          key={top}
          style={{ ...abs(PANEL.subLeft, top), width: 520 }}
          name="general-purpose"
          enterAt={ADV.rowsAt + i * 0.15}
        />
      ))}
      <Tethers />
      {CRATES.map((c, i) => (
        <Crate key={c.label} i={i} />
      ))}
    </Gate>
  );
}

// Exit ------------------------------------------------------------------------------------------

const foldTrack = (tau: number) => plateOut(tau);
const whipTrack = (tau: number) => completionOut(tau);

export default function Tip01SubagentsSegment() {
  return (
    <>
      <Gate from={WIN.start} to={TURN.typeAt}>
        <HomeRest pile={0} from={WIN.start} to={TURN.typeAt} bot={false} />
      </Gate>
      <TipDock
        turn={TURN}
        until={EXIT.home}
        dockY={dockY}
        pile={{ at: EXIT.pocketAt, n: 1, dur: 0.4 }}
      />
      <Drive fn={foldTrack} style={{ inset: 0, transformOrigin: `50% ${HOME.spinnerY}px` }}>
        <AgentsPlate />
        <ModelPlate />
        <AdvisorPlate />
      </Drive>
      <Gate from={EXIT.completeAt} to={EXIT.home}>
        <Drive fn={whipTrack} style={abs(HOME.textX, HOME.spinnerY - 18)}>
          <CompletionLine
            className="type-label"
            pastVerb="Churned"
            duration="1m 30s"
            at={EXIT.completeAt}
          />
        </Drive>
      </Gate>
      <Gate from={EXIT.home} to={WIN.end + 2}>
        <HomeRest pile={1} from={EXIT.home} to={WIN.end + 2} bot={false} />
      </Gate>
      <Bot />
    </>
  );
}
