import "./tip2.css";
import type { ReactNode } from "react";

import { inOutCubic, inQuad, prog } from "#/engine/motion/ease";
import type { Frame } from "#/engine/types";
import { ContextBar, RewindOverlay } from "#/talk/kit/motion";
import {
  CompletionLine,
  HOME,
  Pile,
  pocketKeys,
  PromptBox,
  ScrollbackWhip,
  Turn,
} from "#/talk/kit/tui";
import { setStyle, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import { HOME_ZONES, HomeRest } from "#/talk/segments/shared/home";

import { Bot } from "./bot";
import { During } from "./parts";
import {
  IdlePlate,
  KvPlate,
  PricePlate,
  StatelessPlate,
  SwitchPlate,
  TtlField,
  TtlPlate,
} from "./plates";
import { TapeLayer } from "./tape-layer";
import { T, WINDOW } from "./timing";

const PILE_BEFORE = 1;
const PILE_AFTER = 2;

/** The TUI screen zooms through the context bar as the GL tape takes over (the dive). */
function DiveOut({ children }: { children: ReactNode }) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const u = inQuad(prog(frame.tau, T.dive, T.dive + 0.7));
    setStyle(el, "transform", `scale(${(1 + 5 * u).toFixed(4)})`);
    setStyle(el, "filter", u > 0.02 ? `blur(${(u * 10).toFixed(1)}px)` : "none");
    setStyle(el, "visibility", frame.tau < T.dive + 0.7 ? "visible" : "hidden");
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, transformOrigin: "800px 734px" }}>
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

/** Every plate folds into the completion line at the spinner row. */
function Fold({ children }: { children: ReactNode }) {
  const ref = useFrameRef<HTMLDivElement>((el, frame: Frame) => {
    const f = inOutCubic(prog(frame.tau, T.fold, T.foldEnd));
    setStyle(el, "transform", f > 0 ? `scaleY(${Math.max(0.001, 1 - f).toFixed(4)})` : "none");
  });
  return (
    <div
      ref={ref}
      style={{ position: "absolute", inset: 0, transformOrigin: `0 ${HOME.spinnerY}px` }}
    >
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

/** Exit: the completion line, a pocketed token and a whip up the scrollback onto the home shot. */
function Exit() {
  const pile = pocketKeys(T.pocket, PILE_AFTER);
  return (
    <ScrollbackWhip at={T.whip} dur={T.whipDur} distance={1080}>
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
      <div style={{ position: "absolute", inset: 0, transform: "translateY(-1080px)" }}>
        <PromptBox className="type-code" style={promptAt} />
        <ContextBar zones={HOME_ZONES} />
        <Pile count={PILE_AFTER} x={HOME.pileX} y={HOME.pileY} />
      </div>
    </ScrollbackWhip>
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
      <During from={T.foldEnd - 0.15} to={T.home}>
        <Exit />
      </During>
      <During from={T.home} to={WINDOW.end + 1}>
        <HomeRest pile={PILE_AFTER} from={T.home} to={WINDOW.end + 1} bot={false} />
      </During>
      <Bot />
      <TtlField />
      <RewindOverlay window={{ start: 123.5, end: 129.5 }} />
    </>
  );
}
