import { prog } from "#/engine/motion/ease";
import type { Frame } from "#/engine/types";
import { ContextBar, RuleRise } from "#/talk/kit/motion";
import {
  CompletionLine,
  GLYPH_PATHS,
  HOME,
  Pile,
  pocketKeys,
  PromptBox,
  punch,
  SpinnerLine,
} from "#/talk/kit/tui";
import { setStyle, setText, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import type { Act } from "#/talk/mascot/actions";
import { StageMascot } from "#/talk/mascot/stage-mascot";
import { scriptFor } from "#/talk/script";
import { BOT_HOME, HOME_ZONES, HomeRest } from "#/talk/segments/shared/home";

import { Drive, Gate, TypedMono } from "./parts";
import {
  AT,
  BOT_HOPS,
  botOffset,
  CRACK,
  dispatches,
  dockY,
  EXIT,
  HAMMER,
  headForm,
  headTop,
  PLAN_ROWS,
  planFold,
  plateFold,
  shardAt,
  SHARDS,
  streakLength,
  swarmAt,
  TURN,
  WALNUT,
  WALNUT_TOP,
  walnutHalf,
  whipUp,
  WIN,
} from "./tracks";

const S = scriptFor("t4-superpowers");
const [HAMMER_LABEL = "superpowers", WALNUT_LABEL = "fix the typo in README"] = S.ui;
const settle = AT - 0.8;

const ACTS: readonly Act[] = [
  { kind: "hop", at: BOT_HOPS.out.at, height: 30, air: BOT_HOPS.out.air },
  { kind: "look", at: 154.9, dur: 0.6, x: -0.9, y: -0.6 },
  { kind: "surprised", at: 155.5, dur: 4.25 },
  { kind: "face", at: 155.62, dur: 4.1, expr: "closed" },
  { kind: "hop", at: BOT_HOPS.home.at, height: 40, air: BOT_HOPS.home.air },
];

const abs = (left: number, top: number) => ({ position: "absolute" as const, left, top });

const dockTrack = (tau: number) => ({ y: dockY(tau) });

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
        <Pile count={pocketKeys(EXIT.pocketAt, 4, 0.35)} x={HOME.pileX} y={HOME.pileY} />
      </Drive>
    </Gate>
  );
}

/** Bot: flinches beside the walnut; trembles 1 px on wall time while it waits for the CRACK. */
const botTrack = (tau: number, frame: Frame) => {
  const o = botOffset(tau);
  const shiver = tau > 155.9 && tau < CRACK ? Math.sin(frame.w * 47) * 1 : 0;
  return { x: o.x + shiver, y: o.y };
};

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

// Plan ------------------------------------------------------------------------------------------

function PlanRowView({ i }: { i: number }) {
  const r = PLAN_ROWS[i] ?? PLAN_ROWS[0];
  const ref = useFrameRef<HTMLDivElement>((el: HTMLDivElement, frame: Frame) => {
    const u = prog(frame.tau, r.at, r.at + 0.3);
    setStyle(
      el.firstElementChild,
      "transform",
      `translate3d(0, ${((1 - u) * 110).toFixed(1)}%, 0)`,
    );
    const lead = el.lastElementChild;
    const sprout = prog(frame.tau, 153.6 + i * 0.05, 153.9 + i * 0.05);
    setStyle(lead, "transform", `scaleX(${sprout.toFixed(3)})`);
  });
  return (
    <div
      ref={ref}
      className="type-label tui"
      style={{ ...abs(r.x, r.y - 22), height: 44, overflow: "hidden", width: 300 }}
    >
      <div style={{ color: "var(--soft)" }}>{r.label}</div>
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 21,
          width: 56,
          height: 2,
          background: "var(--hairline)",
          transformOrigin: "0 50%",
        }}
      />
    </div>
  );
}

/** Thirty ✳ (implementer + two reviewers per task) that sprout, then swarm into the hammer head. */
function Swarm() {
  const ref = useFrameRef<SVGSVGElement>((svg: SVGSVGElement, frame: Frame) => {
    for (let k = 0; k < 30; k++) {
      const el = svg.children[k];
      if (!el) continue;
      const s = swarmAt(k, frame.tau);
      el.setAttribute(
        "transform",
        `translate(${(s.x - 17).toFixed(1)} ${(s.y - 17).toFixed(1)}) scale(${(0.34 * s.scale).toFixed(4)})`,
      );
      el.setAttribute("visibility", s.scale > 0.01 ? "visible" : "hidden");
    }
  });
  return (
    <svg
      ref={ref}
      width={1920}
      height={1080}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      {Array.from({ length: 30 }, (_, k) => (
        <path
          // oxlint-disable-next-line react/no-array-index-key -- fixed swarm slots
          key={k}
          d={GLYPH_PATHS["✳"]}
          fill={k % 3 === 0 ? "var(--clay)" : "var(--soft)"}
          visibility="hidden"
        />
      ))}
    </svg>
  );
}

const planTrack = (tau: number) => planFold(tau);
function Dispatches() {
  const ref = useFrameRef<HTMLSpanElement>((el: HTMLSpanElement, frame: Frame) => {
    setText(el, String(Math.floor(dispatches(frame.tau) + 1e-6)));
  });
  return <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }} />;
}
const plusTrack = (tau: number) => ({ scale: prog(tau, 154.3, 154.42) });

function Plan() {
  return (
    <Gate from={TURN.spinnerAt} to={155.15}>
      <Drive fn={planTrack} style={{ inset: 0, transformOrigin: "50% 660px" }}>
        <SpinnerLine
          className="type-label"
          style={abs(HOME.textX, HOME.spinnerY - 18)}
          verb="Boondoggling"
          at={TURN.spinnerAt}
          bare
        />
        {PLAN_ROWS.map((r) => (
          <PlanRowView key={r.label} i={r.i} />
        ))}
        <div style={{ ...abs(1130, 540), display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="type-headline tui text-clay" style={{ display: "flex" }}>
            <Dispatches />
            <Drive fn={plusTrack} style={{ position: "relative" }}>
              +
            </Drive>
          </div>
          <div className="type-label text-muted">dispatches</div>
        </div>
      </Drive>
      <Swarm />
    </Gate>
  );
}

// Hammer and walnut ------------------------------------------------------------------------------

const hammerTrack = (tau: number) => ({
  y: headTop(tau),
  scale: tau < 155.0 ? 0 : 1,
});
const headTrack = (tau: number) => {
  const k = headForm(tau);
  return { scale: 0.35 + 0.65 * k, opacity: k > 0 ? 1 : 0 };
};
const handleTrack = (tau: number) => ({ scaleY: prog(tau, 155.15, 155.4) });
const streakTrack = (tau: number) => {
  const len = streakLength(tau);
  return { scaleY: len / 150, opacity: len > 1 ? 1 : 0 };
};

function Hammer() {
  const left = HAMMER.cx - HAMMER.headW / 2;
  return (
    <Drive fn={hammerTrack} style={{ left: 0, top: 0, width: 1920, height: 0 }}>
      <Drive
        fn={handleTrack}
        style={{
          left: HAMMER.cx - HAMMER.handleW / 2,
          top: -HAMMER.handleH,
          width: HAMMER.handleW,
          height: HAMMER.handleH + 10,
          borderRadius: 10,
          background: "linear-gradient(90deg, var(--soft), var(--bone) 45%, var(--muted))",
          transformOrigin: "50% 100%",
        }}
      />
      <Drive
        fn={streakTrack}
        style={{ left, top: -150, width: HAMMER.headW, height: 150, transformOrigin: "50% 100%" }}
      >
        {[0.1, 0.32, 0.55, 0.78, 0.92].map((f, i) => (
          <div
            key={f}
            style={{
              position: "absolute",
              left: `${f * 100}%`,
              bottom: 0,
              width: 4,
              height: `${[100, 70, 88, 60, 80][i]}%`,
              borderRadius: 2,
              background: "linear-gradient(to top, rgb(250 249 245 / 75%), transparent)",
            }}
          />
        ))}
      </Drive>
      <Drive
        fn={headTrack}
        className="type-code"
        style={{
          left,
          top: 0,
          width: HAMMER.headW,
          height: HAMMER.headH,
          borderRadius: 18,
          background:
            "linear-gradient(to bottom, var(--clay-hi), var(--clay) 40%, var(--clay-deep))",
          boxShadow: "inset 0 -10px 0 rgb(0 0 0 / 18%), 0 18px 40px rgb(0 0 0 / 40%)",
          display: "grid",
          placeItems: "center",
          color: "var(--on-clay)",
          fontWeight: 800,
          letterSpacing: "0.06em",
        }}
      >
        {HAMMER_LABEL}
      </Drive>
    </Drive>
  );
}

function WalnutHalf({ side }: { side: -1 | 1 }) {
  const fn = (tau: number) => walnutHalf(side, tau);
  const clip = side < 0 ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)";
  return (
    <Drive fn={fn} style={{ inset: 0, transformOrigin: "50% 100%", clipPath: clip }}>
      <svg viewBox="0 0 104 76" width={WALNUT.w} height={WALNUT.h} aria-hidden>
        <ellipse
          cx="52"
          cy="40"
          rx="50"
          ry="35"
          fill="var(--clay-wash-55)"
          stroke="var(--clay-wash-35)"
          strokeWidth="2"
        />
        <path
          d="M52 6 C46 22 58 34 52 48 C46 60 56 68 52 75 M24 18 C30 30 22 44 30 58 M80 18 C74 30 82 44 74 58 M12 38 C18 36 22 42 28 40 M92 38 C86 36 82 42 76 40"
          fill="none"
          stroke="var(--clay-wash-20)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </Drive>
  );
}

function Shard({ i }: { i: number }) {
  const fn = (tau: number) => shardAt(i, tau);
  return (
    <Drive
      fn={fn}
      style={{
        left: WALNUT.w / 2 - 7,
        top: 10,
        width: 14,
        height: 10,
        background: "var(--clay-wash-55)",
        clipPath: "polygon(0 100%, 50% 0, 100% 70%)",
      }}
    />
  );
}

const flashTrack = (tau: number, frame: Frame) => {
  const p = punch(tau, frame.v, CRACK, 0.35);
  return { scale: 0.4 + 1.6 * prog(tau, CRACK, CRACK + 0.35), opacity: p };
};

function Walnut() {
  return (
    <>
      <div
        style={{
          ...abs(WALNUT.cx - 220, WALNUT.ground),
          width: 440,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, var(--hairline) 20%, var(--hairline) 80%, transparent)",
        }}
      />
      <Drive
        fn={flashTrack}
        style={{
          left: WALNUT.cx - 110,
          top: WALNUT.ground - 150,
          width: 220,
          height: 220,
          borderRadius: "50%",
          border: "6px solid var(--clay-hi)",
          opacity: 0,
        }}
      />
      <div
        style={{ ...abs(WALNUT.cx - WALNUT.w / 2, WALNUT_TOP), width: WALNUT.w, height: WALNUT.h }}
      >
        <WalnutHalf side={-1} />
        <WalnutHalf side={1} />
        {SHARDS.map((s, i) => (
          <Shard key={s.r} i={i} />
        ))}
      </div>
      <div
        className="type-label text-soft"
        style={{
          ...abs(WALNUT.cx - 300, WALNUT.ground + 16),
          width: 600,
          textAlign: "center",
          whiteSpace: "pre",
        }}
      >
        {WALNUT_LABEL}
      </div>
    </>
  );
}

/** Forward-only shake on the CRACK. */
const shakeTrack = (tau: number, frame: Frame) => {
  const p = punch(tau, frame.v, CRACK, 0.3);
  return { x: Math.sin(tau * 173) * 14 * p, y: Math.cos(tau * 131) * 10 * p };
};

const foldTrack = (tau: number) => plateFold(tau);
const whipTrack = (tau: number) => whipUp(tau);
const walnutEnter = (tau: number) => {
  const u = prog(tau, 154.85, 155.25);
  return { y: 40 * (1 - u) * (1 - u), scale: u > 0 ? 1 : 0 };
};

export default function Tip04SuperpowersSegment() {
  return (
    <>
      <Gate from={WIN.start} to={TURN.typeAt}>
        <HomeRest pile={3} from={WIN.start} to={TURN.typeAt} bot={false} />
      </Gate>
      <Dock />
      <Drive fn={foldTrack} style={{ inset: 0, transformOrigin: `50% ${HOME.spinnerY}px` }}>
        <Drive fn={shakeTrack} style={{ inset: 0 }}>
          <Plan />
          <Gate from={154.85} to={EXIT.foldEnd}>
            <RuleRise
              text={"4. Only use superpowers\nfor tasks that\nneed it."}
              settleBy={settle}
              style={abs(200, 196)}
            />
            <RuleRise
              text={S.lines[0] ?? ""}
              settleBy={settle}
              className="type-body text-soft"
              rule={false}
              style={abs(200, 636)}
            />
            <RuleRise
              text={S.lines[1] ?? ""}
              settleBy={settle}
              className="type-body text-clay"
              rule={false}
              style={abs(200, 700)}
            />
            <TypedMono
              text={S.footnotes[0] ?? ""}
              at={155.0}
              cps={100}
              className="type-label text-muted"
              style={{ left: 200, top: 772 }}
            />
            <Drive fn={walnutEnter} style={{ inset: 0 }}>
              <Walnut />
            </Drive>
            <Hammer />
          </Gate>
        </Drive>
      </Drive>
      <Gate from={EXIT.completeAt} to={EXIT.home}>
        <Drive fn={whipTrack} style={abs(HOME.textX, HOME.spinnerY - 18)}>
          <CompletionLine
            className="type-label"
            pastVerb="Crunched"
            duration="45s"
            at={EXIT.completeAt}
          />
        </Drive>
      </Gate>
      <Gate from={EXIT.home} to={WIN.end + 2}>
        <HomeRest pile={4} from={EXIT.home} to={WIN.end + 2} bot={false} />
      </Gate>
      <Bot />
    </>
  );
}
