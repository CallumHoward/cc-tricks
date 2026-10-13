import "./tip2.css";
import type { ReactNode } from "react";

import { inOutCubic, prog } from "#/engine/motion/ease";
import type { Frame } from "#/engine/types";
import { ContextBar, RewindOverlay } from "#/talk/kit/motion";
import { CompletionLine, HOME, Pile, pocketKeys, PromptBox, Turn } from "#/talk/kit/tui";
import { setStyle, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import { HOME_ZONES, HomeRest } from "#/talk/segments/shared/home";

import { Bot } from "./bot";
import { During, Pan } from "./parts";
import { IdlePlate, KvPlate, PricePlate, StatelessPlate, SwitchPlate, TtlPlate } from "./plates";
import { TapeLayer } from "./tape-layer";
import { T, WINDOW } from "./timing";

const PILE_BEFORE = 1;
const PILE_AFTER = 2;
const DIVE_DUR = 0.8;

/** The TUI screen sinks under the bar as the camera cranes up and the GL tape takes over. */
function DiveOut({ children }: { children: ReactNode }) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const u = inOutCubic(prog(frame.tau, T.dive, T.dive + DIVE_DUR));
    setStyle(
      el,
      "transform",
      u > 0
        ? `translate3d(0, ${(260 * u).toFixed(1)}px, 0) scale(${(1 - 0.08 * u).toFixed(4)})`
        : "none",
    );
    setStyle(el, "clip-path", u > 0 ? `inset(${(720 * u).toFixed(1)}px 0 0 0)` : "none");
    setStyle(el, "opacity", ((1 - u) ** 1.5).toFixed(3));
    setStyle(el, "visibility", frame.tau < T.dive + DIVE_DUR ? "visible" : "hidden");
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, transformOrigin: "960px 734px" }}>
      {children}
    </div>
  );
}

/** Context bar of the turn screen; the GL bar sits exactly here once the dive starts. */
function TurnBar() {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    setStyle(el, "visibility", frame.tau < T.dive ? "visible" : "hidden");
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      <ContextBar zones={HOME_ZONES} />
    </div>
  );
}

/** Every plate closes into the spinner row through a mask that converges on it, drifting toward it. */
function Fold({ children }: { children: ReactNode }) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const f = inOutCubic(prog(frame.tau, T.fold, T.foldEnd));
    const top = HOME.spinnerY * f;
    const bottom = (1080 - HOME.spinnerY) * f;
    setStyle(
      el,
      "clip-path",
      f > 0 ? `inset(${top.toFixed(1)}px 0 ${bottom.toFixed(1)}px 0)` : "none",
    );
    setStyle(el, "transform", f > 0 ? `translate3d(0, ${(60 * f).toFixed(1)}px, 0)` : "none");
    setStyle(el, "visibility", f >= 1 ? "hidden" : "visible");
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      {children}
    </div>
  );
}

/** The home screen rises into place under the closing plate. */
function Arrive({ children }: { children: ReactNode }) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const u = inOutCubic(prog(frame.tau, T.fold, T.foldEnd + 0.05));
    setStyle(el, "transform", u < 1 ? `translate3d(0, ${(70 * (1 - u)).toFixed(1)}px, 0)` : "none");
    setStyle(el, "opacity", u.toFixed(3));
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      {children}
    </div>
  );
}

const promptAt = { position: "absolute", left: HOME.left, top: HOME.promptTop } as const;
const lineAt = {
  position: "absolute",
  left: HOME.textX,
  top: HOME.spinnerY,
  transform: "translateY(-50%)",
} as const;

/** Exit: the completion line, a pocketed token and an eased track up the scrollback onto home. */
function Exit() {
  const pile = pocketKeys(T.pocket, PILE_AFTER);
  return (
    <Pan at={T.track} dur={T.home - T.track} distance={1080}>
      <Arrive>
        <CompletionLine
          className="type-label"
          style={lineAt}
          pastVerb="Brewed"
          duration="3m 30s"
          at={T.foldEnd - 0.15}
        />
        <PromptBox className="type-code" style={promptAt} />
        <ContextBar zones={HOME_ZONES} />
        <Pile count={pile} x={HOME.pileX} y={HOME.pileY} />
      </Arrive>
      <div style={{ position: "absolute", inset: 0, transform: "translateY(-1080px)" }}>
        <PromptBox className="type-code" style={promptAt} />
        <ContextBar zones={HOME_ZONES} />
        <Pile count={PILE_AFTER} x={HOME.pileX} y={HOME.pileY} />
      </div>
    </Pan>
  );
}

export default function Tip02CacheSegment() {
  return (
    <>
      <TapeLayer />
      <During from={WINDOW.start - 1} to={T.typeAt}>
        <HomeRest pile={PILE_BEFORE} from={WINDOW.start - 1} to={T.typeAt} bot={false} />
      </During>
      <DiveOut>
        <During from={T.typeAt} to={T.dive + 0.7}>
          <Turn
            in={{ prompt: "2. Keep the cache warm", verb: "Simmering", typeAt: T.typeAt }}
            pile={PILE_BEFORE}
          >
            <TurnBar />
          </Turn>
        </During>
      </DiveOut>
      <Fold>
        <StatelessPlate />
        <KvPlate />
        <PricePlate />
        <TtlPlate />
        <IdlePlate />
        <SwitchPlate />
      </Fold>
      <During from={T.fold} to={T.home}>
        <Exit />
      </During>
      <During from={T.home} to={WINDOW.end + 1}>
        <HomeRest pile={PILE_AFTER} from={T.home} to={WINDOW.end + 1} bot={false} />
      </During>
      <Bot />
      <RewindOverlay window={{ start: 123.5, end: 129.5 }} />
    </>
  );
}
