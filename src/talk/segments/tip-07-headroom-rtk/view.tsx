import { clamp, inOutCubic, outCubic, outExpo, prog } from "#/engine/motion/ease";
import { SPRINGS } from "#/engine/motion/spring";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { ExtLink } from "#/talk/kit/ext-link";
import { springFrom } from "#/talk/kit/motion/schedule";
import { Counter, ReadToolRow } from "#/talk/kit/tui";
import type { Act } from "#/talk/mascot/actions";
import { LINKS, scriptFor } from "#/talk/script";
import { TIP_TITLE_LINE, TIP_TITLE_TOP, TipTitle } from "#/talk/segments/shared/tip-title";
import {
  Bot,
  Fx,
  px,
  SegmentRoot,
  TipFrame,
  type StyleMap,
} from "#/talk/segments/tip-06-cli-agents/boundary";
import { placeAt, type PlaceKey } from "#/talk/segments/tip-06-cli-agents/timing";

import { pullAt, TIP7 } from "./timing";

const D = TIP7;
const rtk = scriptFor("t7-rtk");
const HEADROOM_SHOT = "/talk/refs/headroom-dashboard.webp";

const lift = (tau: number) =>
  prog(tau, D.lift.start, D.lift.end, inOutCubic) *
  (1 - prog(tau, D.exit, D.exit + 0.3, inOutCubic));

/** The RTK plate sits under the tip title */
const BASH_Y = TIP_TITLE_TOP + TIP_TITLE_LINE + 52;

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
  // A bracket hugging the Bash row: 6 px jaws with short returns at both ends
  const jaw = (top: boolean) => ({
    position: "absolute" as const,
    left: 0,
    width: 520,
    height: 16,
    border: "6px solid var(--clay)",
    [top ? "borderBottom" : "borderTop"]: "none",
    borderRadius: top ? "6px 6px 0 0" : "0 0 6px 6px",
    top: top ? -12 : 48,
    transform: `translateY(calc(var(--gap) * ${top ? -1 : 1}))`,
  });
  return (
    <Fx
      fx={fx}
      style={{ left: 180, top: BASH_Y - 3, width: 520, height: 52, visibility: "hidden" }}
    >
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
        <ExtLink href={LINKS.rtk}>rtk</ExtLink>
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
          top: BASH_Y + 59,
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
              top: BASH_Y + 65 + i * 14,
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
  // Leaves with the camera's pull-out and stays gone, so the push back in lands on the home shot
  const fx = (frame: Frame): StyleMap => ({
    display: frame.tau < D.pull.end ? "block" : "none",
  });
  return (
    <Fx fx={fx} style={{ inset: 0 }}>
      <ReadToolRow
        tool="Bash"
        arg="git status"
        at={D.bash}
        style={{ position: "absolute", left: 200, top: BASH_Y }}
      />
      <TipTitle text={rtk.headline ?? ""} settleBy={D.title} />
      <Clamp />
      <Accordion />
      {D.reruns.map((at, i) => (
        <div key={at} style={{ position: "absolute", left: 200, top: BASH_Y + 160 + i * 100 }}>
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
    </Fx>
  );
}

/** The camera dollies back off the terminal as it fades, and pushes back in at the exit. */
function TerminalCamera({ children }: { children: React.ReactNode }) {
  const fx = (frame: Frame): StyleMap => {
    const u = pullAt(frame.tau);
    if (u <= 0) return { transform: "none", opacity: "1", visibility: "visible" };
    return {
      transform: `translate3d(${px(-160 * u)}, 0, 0) scale(${(1 - 0.14 * u).toFixed(5)})`,
      opacity: (1 - u).toFixed(3),
      visibility: u >= 1 ? "hidden" : "visible",
    };
  };
  return (
    <Fx fx={fx} style={{ left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "50% 45%" }}>
      {children}
    </Fx>
  );
}

const SHOT = { left: 820, top: 196, width: 900, height: Math.round((900 * 1303) / 1600) };
const CHROME = 40;

/** Headroom's own dashboard, framed as a floating window: tilts in, settles, keeps drifting. */
function DashboardWindow() {
  const fx = (frame: Frame): StyleMap => {
    const u = springFrom(frame.tau, D.shot.in, SPRINGS.LAND);
    const out = prog(frame.tau, D.shot.out, D.shot.out + 0.4, inOutCubic);
    const rho = ambientTime(frame);
    const drift = Math.sin((rho - D.shot.in) * 0.35);
    const tiltX = 16 * (1 - u) + 1.2 * drift;
    const tiltY = -14 * (1 - u) - 4 + 0.8 * drift;
    return {
      opacity: (clamp(u * 1.8) * (1 - out)).toFixed(3),
      transform: `perspective(2400px) translate3d(0, ${px(160 * (1 - u) + 120 * out)}, 0) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`,
    };
  };
  const push = (frame: Frame): StyleMap => {
    const t = Math.max(0, ambientTime(frame) - D.shot.in);
    return { transform: `scale(${(1 + 0.005 * t).toFixed(5)})` };
  };
  return (
    <Fx
      fx={fx}
      style={{
        left: SHOT.left,
        top: SHOT.top - CHROME,
        width: SHOT.width,
        height: SHOT.height + CHROME,
        borderRadius: 14,
        overflow: "hidden",
        background: "#15161a",
        border: "1px solid rgb(255 255 255 / 0.08)",
        boxShadow: "0 40px 90px rgb(0 0 0 / 0.5), 0 0 0 1px rgb(0 0 0 / 0.4)",
        transformOrigin: "50% 60%",
        opacity: 0,
      }}
    >
      <div
        style={{ height: CHROME, display: "flex", alignItems: "center", gap: 9, paddingLeft: 16 }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: "rgb(255 255 255 / 0.16)",
            }}
          />
        ))}
      </div>
      <div
        style={{ position: "relative", width: SHOT.width, height: SHOT.height, overflow: "hidden" }}
      >
        <Fx fx={push} style={{ inset: 0, transformOrigin: "50% 35%" }}>
          <img
            src={HEADROOM_SHOT}
            alt="Headroom dashboard"
            width={SHOT.width}
            height={SHOT.height}
            style={{ display: "block", filter: "brightness(0.8)" }}
          />
        </Fx>
      </div>
    </Fx>
  );
}

const LETTERS = Array.from("headroom", (ch, i) => ({ ch, i, id: `${ch}${i}` }));

/** The project name, letter by letter on springs, linked to its repo. */
function HeadroomName() {
  const letter =
    (i: number) =>
    (frame: Frame): StyleMap => {
      const u = springFrom(frame.tau, D.name + i * 0.035, SPRINGS.LAND);
      const out = prog(
        frame.tau,
        D.shot.out - 0.1 + i * 0.02,
        D.shot.out + 0.25 + i * 0.02,
        inOutCubic,
      );
      return { transform: `translate3d(0, ${((1 - u) * 110 + out * 110).toFixed(2)}%, 0)` };
    };
  return (
    <div
      className="type-headline"
      style={{ position: "absolute", left: 200, top: 470, overflow: "hidden", paddingBottom: 12 }}
    >
      <ExtLink href={LINKS.headroom}>
        {LETTERS.map(({ ch, i, id }) => (
          <Fx
            key={id}
            inline
            fx={letter(i)}
            style={{ position: "relative", display: "inline-block", transform: "translateY(110%)" }}
          >
            {ch}
          </Fx>
        ))}
      </ExtLink>
    </div>
  );
}

function HeadroomPlate() {
  const visible = (frame: Frame): StyleMap => ({
    display: frame.tau > D.pull.start && frame.tau < D.exit + 0.4 ? "block" : "none",
  });
  return (
    <Fx fx={visible} style={{ inset: 0, display: "none" }}>
      <DashboardWindow />
      <HeadroomName />
    </Fx>
  );
}

const PLACES: readonly PlaceKey[] = [
  { at: 193.3, x: 0, y: 0, scale: 1 },
  { at: 193.9, x: 220, y: 290, scale: 0.7 },
  { at: 199.2, x: 220, y: 290, scale: 0.7 },
  { at: 199.9, x: -80, y: -410, scale: 0.6 },
  { at: 208.0, x: -80, y: -410, scale: 0.6 },
  { at: 208.35, x: 0, y: 0, scale: 1 },
];

const ACTS: readonly Act[] = [
  { kind: "shrug", at: 194.0, dur: 0.8 },
  { kind: "surprised", at: 195.0, dur: 0.5 },
  { kind: "look", at: 195.8, dur: 3.2, x: -0.8, y: -0.2 },
  { kind: "hop", at: 199.25, height: 70 },
  { kind: "look", at: 200.4, dur: 7.4, x: -0.3, y: 0.8 },
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
            tokens: (tau) => 1100 * outCubic(prog(tau, D.spinnerAt, D.lift.end)),
          }}
          out={{ at: D.exit, pastVerb: "Sautéed", duration: "1m 15s" }}
          textFx={(frame) => {
            const u = lift(frame.tau);
            const up = prog(frame.tau, D.lift.start, D.lift.end, inOutCubic);
            return {
              transform: `translateY(${px(-200 * u)})`,
              "clip-path": `inset(0 0 ${px(560 + 200 * u)} 0)`,
              visibility: up >= 1 ? "hidden" : "visible",
            };
          }}
          stackFx={(frame) => ({ transform: `translateY(${px(600 * lift(frame.tau))})` })}
          plate={<RtkPlate />}
        />
      </TerminalCamera>
      <Bot acts={ACTS} place={(tau) => placeAt(PLACES, tau)} />
    </SegmentRoot>
  );
}
