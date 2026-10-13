import { inOutCubic, prog } from "#/engine/motion/ease";
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

/** The plate dollies back (scale and lift) and fades over [from, to]: no fold, no snap. */
export function plateExit(tau: number, from: number, to: number): StyleValues {
  const u = prog(tau, from, to, inOutCubic);
  return { y: -48 * u, scale: 1 - 0.06 * u, opacity: 1 - u };
}

/** The completion line glides up a few rows and fades over [from, to], as scrollback would. */
export function completionRise(tau: number, from: number, to: number): StyleValues {
  const u = prog(tau, from, to, inOutCubic);
  return { y: -96 * u, opacity: 1 - u };
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
