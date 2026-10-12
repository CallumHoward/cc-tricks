import { inOutExpo, outExpo, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import type { Frame } from "#/engine/types";
import { ContextBar, RuleRise } from "#/talk/kit/motion";
import { springFrom } from "#/talk/kit/motion/schedule";
import {
  AgentRow,
  CodeBlock,
  CompletionLine,
  GLYPH_PATHS,
  HOME,
  Pile,
  pocketKeys,
  PromptBox,
  SpinnerLine,
} from "#/talk/kit/tui";
import { setStyle, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { scriptFor } from "#/talk/script";
import { BOT_HOME, HOME_ZONES, HomeRest } from "#/talk/segments/shared/home";

import { Drive, Gate, TypedMono, TypedText } from "./parts";
import {
  ADV,
  AT,
  BOT_HOPS,
  botOffset,
  CARD,
  CARD_CLOSE,
  cardColX,
  cardFrame,
  cardLineY,
  chipAt,
  CHIPS,
  CRATES,
  crateRise,
  crateX,
  dockY,
  EXIT,
  HOLD_END,
  LABEL_AT,
  MAIN_TOKENS,
  PANEL,
  plateFold,
  ROW,
  rowFold,
  rowTop,
  SPINNER_ELAPSED,
  SPINNER_TOKENS,
  SPINNER_VERB,
  spokeAt,
  spokeLand,
  SPOKE_ANGLES,
  starScale,
  SUBAGENTS,
  subagentTokens,
  spinnerFold,
  TURN,
  whipUp,
  WIN,
  YAML_AT,
} from "./tracks";

const S1 = scriptFor("t1-agents");
const S2 = scriptFor("t1-model-effort");
const S3 = scriptFor("t1-advisor");
const YAML = (S2.code[0]?.code ?? "").split("\n");

const ACTS: readonly Act[] = [
  { kind: "celebrate", at: 49.05, dur: 1.1 },
  { kind: "hop", at: BOT_HOPS.toCard.at, height: 30, air: BOT_HOPS.toCard.air },
  { kind: "point", at: 55.85, dur: 0.7, angle: -20, side: "L" },
  { kind: "look", at: 56.7, dur: 3.2, x: -0.8, y: 0.2 },
  { kind: "hop", at: BOT_HOPS.toCrate.at, height: 40, air: BOT_HOPS.toCrate.air },
  { kind: "walk", at: 63.35, dur: 2.5, dx: 0, stepRate: 3 },
  { kind: "sweat", at: 63.5, dur: 4.9 },
  { kind: "hop", at: BOT_HOPS.toHome.at, height: 30, air: BOT_HOPS.toHome.air },
];

const abs = (left: number, top: number) => ({ position: "absolute" as const, left, top });

// Dock ------------------------------------------------------------------------------------------

const dockTrack = (tau: number) => ({ y: dockY(tau) });

/** Prompt box, context bar and pile: the home shot's furniture, dropped away during the plates. */
function Dock() {
  return (
    <Gate from={TURN.typeAt} to={EXIT.home}>
      <Drive fn={dockTrack} style={{ inset: 0 }}>
        <PromptBox
          style={abs(HOME.left, HOME.promptTop)}
          text={TURN.prompt}
          typeAt={TURN.typeAt}
          cps={TURN.cps}
          submitAt={TURN.submitAt}
        />
        <ContextBar zones={HOME_ZONES} />
        <Pile count={pocketKeys(EXIT.pocketAt, 1, 0.4)} x={HOME.pileX} y={HOME.pileY} />
      </Drive>
    </Gate>
  );
}

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

/** The ✳ grows out of the spinner glyph and sheds five spokes that land as the rows' ○ bullets. */
function SpokeStar() {
  const ref = useFrameRef<SVGSVGElement>((svg: SVGSVGElement, frame: Frame) => {
    const { tau } = frame;
    const spokes = svg.children;
    for (let i = 0; i < SPOKE_ANGLES.length; i++) {
      const el = spokes[i] as SVGRectElement | undefined;
      if (!el) continue;
      const s = spokeAt(i, tau);
      const scale = i < SUBAGENTS.length && tau >= 49.1 ? 1 : starScale(tau);
      const len = 36 * scale * (1 - s.ring) + 9 * s.ring;
      const thick = Math.max(1, 9 * scale * (1 - s.ring) + 9 * s.ring);
      el.setAttribute("x", (-len / 2).toFixed(2));
      el.setAttribute("y", (-thick / 2).toFixed(2));
      el.setAttribute("width", len.toFixed(2));
      el.setAttribute("height", thick.toFixed(2));
      el.setAttribute("rx", (thick / 2).toFixed(2));
      el.setAttribute("fill-opacity", (1 - s.ring).toFixed(3));
      el.setAttribute("stroke-width", (1.6 * s.ring).toFixed(2));
      el.setAttribute(
        "transform",
        `translate(${s.x.toFixed(2)} ${s.y.toFixed(2)}) rotate(${s.rotate.toFixed(2)})`,
      );
      el.setAttribute(
        "visibility",
        s.visible && (scale > 0.02 || s.ring > 0) ? "visible" : "hidden",
      );
    }
  });
  return (
    <svg
      ref={ref}
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
      aria-hidden
    >
      {SPOKE_ANGLES.map((angle) => (
        <rect key={angle} fill="var(--clay)" stroke="var(--clay)" visibility="hidden" />
      ))}
    </svg>
  );
}

/** Hides each row's own ○ until its spoke has landed on it. */
function SubagentRow({ i }: { i: number }) {
  const a = SUBAGENTS[i] ?? SUBAGENTS[0];
  const land = spokeLand(i);
  const ref = useFrameRef<HTMLDivElement>((el: HTMLDivElement, frame: Frame) => {
    const bullet = el.querySelector(".tui-agent-inner > span");
    setStyle(bullet, "visibility", frame.tau >= land + 0.1 ? "visible" : "hidden");
  });
  const fold = (tau: number) => rowFold(i, tau);
  return (
    <Drive fn={fold} style={{ ...abs(ROW.left, rowTop(i)), transformOrigin: "0 50%" }}>
      <div ref={ref}>
        <AgentRow
          style={{ width: ROW.width }}
          name="general-purpose"
          action={a.action}
          actionAt={land + 0.05}
          enterAt={land - 0.3}
          tokens={subagentTokens(i)}
        />
      </div>
    </Drive>
  );
}

const mainFold = (tau: number) => rowFold(-1, tau);

function AgentsPlate() {
  return (
    <>
      <RuleRise
        text={S1.headline ?? ""}
        settleBy={AT.agents - 0.8}
        exit={HOLD_END.agents}
        style={abs(200, 196)}
      />
      <RuleRise
        text={S1.lines[0] ?? ""}
        settleBy={AT.agents - 0.8}
        exit={HOLD_END.agents}
        className="type-body text-soft"
        rule={false}
        style={abs(200, 368)}
      />
      <Gate from={0} to={HOLD_END.agents + 0.05}>
        <TypedMono
          text={S1.labels[0] ?? ""}
          at={LABEL_AT}
          className="type-label text-muted"
          style={{ left: 200, top: 846 }}
        />
      </Gate>
      <Gate from={TURN.spinnerAt} to={55}>
        <Drive
          fn={spinnerFold}
          style={{ ...abs(HOME.textX, HOME.spinnerY - 18), transformOrigin: "0 50%" }}
        >
          <SpinnerLine
            className="type-label"
            verb={SPINNER_VERB}
            at={TURN.spinnerAt}
            tokens={SPINNER_TOKENS}
            elapsed={SPINNER_ELAPSED}
          />
        </Drive>
      </Gate>
      <Gate from={49} to={55}>
        <Drive fn={mainFold} style={{ ...abs(ROW.left, ROW.mainTop), transformOrigin: "0 50%" }}>
          <AgentRow
            style={{ width: ROW.width }}
            main
            name="main"
            enterAt={49}
            tokens={MAIN_TOKENS}
          />
        </Drive>
        {SUBAGENTS.map((a, i) => (
          <SubagentRow key={a.action} i={i} />
        ))}
      </Gate>
      <SpokeStar />
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
        boxShadow: "0 10px 24px rgb(0 0 0 / 35%)",
        whiteSpace: "pre",
      }}
    >
      {c.text}
    </Drive>
  );
}

const cardTrack = (tau: number) => cardFrame(tau);

function ModelPlate() {
  const lineOrigin = ROW.mainTop + 20 - CARD.top;
  return (
    <>
      <RuleRise
        text={S2.headline ?? ""}
        settleBy={AT.model - 0.8}
        exit={HOLD_END.model}
        style={abs(200, 196)}
      />
      <Drive
        fn={cardTrack}
        style={{
          ...abs(CARD.left, CARD.top),
          width: CARD.width,
          transformOrigin: `50% ${lineOrigin}px`,
        }}
      >
        <CodeBlock lines={YAML} label={S2.code[0]?.label} at={YAML_AT} stagger={0.08} />
      </Drive>
      <Gate from={0} to={CARD_CLOSE.start + 0.05}>
        {S2.labels.map((label, i) => (
          <TypedMono
            key={label}
            text={label}
            at={55.9}
            cps={64}
            className="type-label text-soft"
            style={{ left: cardColX(16), top: cardLineY(3 + i) - 18 }}
          />
        ))}
        {CHIPS.map((c, i) => (
          <Chip key={c.text} i={i} />
        ))}
      </Gate>
    </>
  );
}

// t1-advisor --------------------------------------------------------------------------------------

const advisorStar = (tau: number) => {
  const k = springFrom(tau, ADV.starIn, SPRINGS.LAND);
  const settle = AT.advisor - 0.8;
  return {
    x: 520 * (1 - k),
    rotate: -90 * (1 - k) + 1.5 * Math.max(0, tau - settle),
    scale: tau < ADV.starIn ? 0 : 1,
  };
};

/** The scan bar reads the whole conversation on τ, then idles over the panel on wall time. */
const scanTrack = (tau: number, frame: Frame) => {
  if (tau < ADV.scan.start) return { y: 0, opacity: 0 };
  const u = prog(tau, ADV.scan.start, ADV.scan.end, inOutExpo);
  if (u < 1) return { y: 190 + 640 * u, opacity: 1 };
  const idle = 590 + ((Math.sin(frame.w * 1.3) + 1) / 2) * 200;
  return { y: idle, opacity: 0.3 };
};

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
      style={{ position: "absolute", inset: 0 }}
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
      <TypedText
        text={ADV.line1}
        at={ADV.typeAt}
        cps={ADV.cps}
        caret
        className="type-headline"
        style={{ left: 200, top: 196 }}
      />
      <TypedText
        text={ADV.line2}
        at={ADV.typeAt + (ADV.line1.length + 1) / ADV.cps}
        cps={ADV.cps}
        caret
        className="type-headline text-clay"
        style={{ left: 200, top: 322 }}
      />
      <RuleRise
        text={S3.lines[0] ?? ""}
        settleBy={62}
        className="type-body text-soft"
        rule={false}
        style={abs(200, 470)}
      />
      <Drive fn={advisorStar} style={{ ...abs(1450, 214), width: 190, height: 190 }}>
        <svg viewBox="0 0 100 100" width={190} height={190} aria-hidden>
          <path d={GLYPH_PATHS["✽"]} fill="var(--clay-hi)" />
        </svg>
      </Drive>
      <Drive fn={scanTrack} style={{ left: 160, top: 0, width: 1600, height: 2 }}>
        <div
          style={{
            position: "absolute",
            inset: "-70px 0 0",
            background: "linear-gradient(to bottom, transparent, rgb(217 119 87 / 14%))",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "var(--clay)" }} />
      </Drive>
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
      <TypedText
        text={S3.lines[1] ?? ""}
        at={ADV.l2At}
        cps={80}
        className="type-body text-soft"
        style={{ left: 200, top: 822 }}
      />
    </Gate>
  );
}

// Exit ------------------------------------------------------------------------------------------

const foldTrack = (tau: number) => plateFold(tau);
const whipTrack = (tau: number) => whipUp(tau);

export default function Tip01SubagentsSegment() {
  return (
    <>
      <Gate from={WIN.start} to={TURN.typeAt}>
        <HomeRest pile={0} from={WIN.start} to={TURN.typeAt} bot={false} />
      </Gate>
      <Dock />
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
