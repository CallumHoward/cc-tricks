import { clamp, inOutCubic, outCubic, prog } from "#/engine/motion/ease";
import { useTrack } from "#/engine/stage/react";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { ROUTINES } from "#/talk/data/routines";
import { ExtLink } from "#/talk/kit/ext-link";
import { TipTitle } from "#/talk/segments/shared/tip-title";
import { Layer, Live, Wiped } from "#/talk/segments/tip-03-effort/bracket";
import { onShot, Shot, shotBox, type ShotPose } from "#/talk/segments/tip-03-effort/shot";
import { inCubic, type Pt } from "#/talk/segments/tip-03-effort/tracks";

import { cardFold, pinStart, T5 } from "./timing";

const SETTLE = T5.routines.at - 0.8;
const EXIT = T5.routines.holdEnd;

export const ROUTINES_SHOT = Object.freeze({
  src: "/talk/refs/routines.webp",
  alt: "Claude Desktop Routines page with three daily Haiku routines",
  size: { w: 1920, h: 1247 },
});
export const DOCS = Object.freeze({
  label: "Desktop scheduled tasks",
  href: "https://code.claude.com/docs/en/desktop-scheduled-tasks",
});

export const SHOT = shotBox(700, 196, 1120, ROUTINES_SHOT.size);
const K = SHOT.w / ROUTINES_SHOT.size.w;

/**
 * The three routine cards in the screenshot (image px), in ROUTINES order: morning, afternoon,
 * evening.
 */
const CARDS_PX = [
  { x: 981, y: 323, w: 811, h: 146 },
  { x: 128, y: 512, w: 810, h: 146 },
  { x: 128, y: 323, w: 810, h: 146 },
] as const;

/** Card `i` on stage when the screenshot is at rest. */
export const cardRect = (i: number) => {
  const c = CARDS_PX[i] ?? CARDS_PX[0];
  return { x: SHOT.x + c.x * K, y: SHOT.y + c.y * K, w: c.w * K, h: c.h * K };
};

/**
 * The window glides in from the right tilted, settles flat, floats on ambient time, then dollies
 * away.
 */
function routinesPose(tau: number, rho: number): ShotPose {
  const u = prog(tau, 163.3, 164.7, outCubic);
  const e = prog(tau, EXIT, EXIT + 0.6, inOutCubic);
  const push = clamp((tau - T5.routines.at) / 2.5) * (1 - e);
  return {
    x: (1 - u) * 200 + e * 80,
    y: 5 * Math.sin(rho * 0.8) - e * 60,
    scale: (0.92 + 0.08 * u) * (1 + 0.02 * push) * (1 - 0.1 * e),
    opacity: clamp(u * 2.5) * (1 - e),
    rx: (1 - u) * 6 + 0.8 * Math.sin(rho * 0.55),
    ry: (1 - u) * -16 + e * 10 + 1.2 * Math.sin(rho * 0.4 + 1),
  };
}

/** Outline `i` draws on its card, rides the window, then folds into the pin it becomes. */
export function glowAt(i: number, tau: number, rho: number) {
  const r = cardRect(i);
  const centre: Pt = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  const pose = routinesPose(tau, rho);
  const on = onShot(SHOT, pose, centre);
  const pin = pinStart(ROUTINES[i]?.at ?? 330);
  const f = cardFold(i, tau);
  const draw = prog(tau, 164.5 + i * 0.2, 164.85 + i * 0.2, outCubic);
  const shown = draw > 0 && f < 1;
  return {
    x: on.x - centre.x + (pin.x - on.x) * f,
    y: on.y - centre.y + (pin.y - on.y) * f,
    scale: shown ? pose.scale * (1.08 - 0.08 * draw) * (1 - 0.94 * f) : 0,
    scaleY: 1 - 0.5 * f,
    opacity: draw,
  };
}

function Glow({ i }: { i: number }) {
  const ref = useTrack((tau: number, frame: Frame) => glowAt(i, tau, ambientTime(frame)));
  const r = cardRect(i);
  return (
    <div
      ref={ref}
      className="seg-glow"
      style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
      aria-hidden
    />
  );
}

const sink = (tau: number) => {
  const u = prog(tau, EXIT, EXIT + 0.45, inCubic);
  return { y: u * 160, opacity: 1 - prog(tau, EXIT + 0.1, EXIT + 0.45) };
};

/** T5-routines: the real Routines window floats in beside the rising sun; its three routines glow. */
export function RoutinesPlate() {
  return (
    <>
      <Live from={T5.leave} to={EXIT + 0.6}>
        <TipTitle text={"5. Proc the\n5h window"} settleBy={SETTLE - 0.2} exit={EXIT} />
        <Layer track={sink}>
          <Wiped at={164.3} className="type-label seg-soft seg-abs" style={{ left: 200, top: 444 }}>
            <ExtLink href={DOCS.href}>{DOCS.label}</ExtLink>
          </Wiped>
        </Layer>
        <Shot src={ROUTINES_SHOT.src} alt={ROUTINES_SHOT.alt} box={SHOT} pose={routinesPose} />
      </Live>
      <Live from={164.5} to={T5.chain.pinsAt + 1.0}>
        {ROUTINES.map((r, i) => (
          <Glow key={r.id} i={i} />
        ))}
      </Live>
    </>
  );
}
