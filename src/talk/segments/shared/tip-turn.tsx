import { inOutExpo, prog } from "#/engine/motion/ease";
import type { StyleValues } from "#/engine/stage/applier";
import { ContextBar } from "#/talk/kit/motion";
import { HOME, Pile, pocketKeys, PromptBox } from "#/talk/kit/tui";
import { HOME_ZONES } from "#/talk/segments/shared/home";

import { Drive, Gate } from "./gated-parts";

type Point = { x: number; y: number };

type Turn = { prompt: string; typeAt: number; cps: number; submitAt: number };

/** A hop on a sine arc of height `h` from `from` to `to` at progress `u`. */
export const hopArc = (from: Point, to: Point, u: number, h: number): Point => ({
  x: from.x + (to.x - from.x) * u,
  y: from.y + (to.y - from.y) * u - Math.sin(u * Math.PI) * h,
});

/** Airborne progress of a hop that leaves the ground 0.16 τ-s after `at`. */
export const hopFlight = (tau: number, hop: { at: number; air: number }): number =>
  prog(tau, hop.at + 0.16, hop.at + 0.16 + hop.air);

/** The plate folds flat over [from, to]. */
export function foldFlat(tau: number, from: number, to: number): StyleValues {
  const u = prog(tau, from, to, inOutExpo);
  return { scaleY: 1 - u, opacity: u >= 1 ? 0 : 1 };
}

/** The completion line whips up the scrollback over [from, to], smeared by its own speed. */
export function whipScroll(tau: number, from: number, to: number): StyleValues {
  const u = prog(tau, from, to, inOutExpo);
  const mid = Math.sin(u * Math.PI);
  return { y: -620 * u, scaleY: 1 + 1.4 * mid, blur: 6 * mid, opacity: u >= 1 ? 0 : 1 };
}

const abs = (left: number, top: number) => ({ position: "absolute" as const, left, top });

/** Prompt box, context bar and pile: the home shot's furniture, dropped away during the plates. */
export function TipDock({
  turn,
  until,
  dockY,
  pile,
}: {
  turn: Turn;
  until: number;
  dockY: (tau: number) => number;
  pile: { at: number; n: number; dur: number };
}) {
  return (
    <Gate from={turn.typeAt} to={until}>
      <Drive fn={(tau) => ({ y: dockY(tau) })} style={{ inset: 0 }}>
        <PromptBox
          style={abs(HOME.left, HOME.promptTop)}
          text={turn.prompt}
          typeAt={turn.typeAt}
          cps={turn.cps}
          submitAt={turn.submitAt}
        />
        <ContextBar zones={HOME_ZONES} />
        <Pile count={pocketKeys(pile.at, pile.n, pile.dur)} x={HOME.pileX} y={HOME.pileY} />
      </Drive>
    </Gate>
  );
}
