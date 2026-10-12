import { inOutCubic, outCubic, prog } from "#/engine/motion/ease";
import { keys, sampleKeys } from "#/engine/motion/track";
import { RULER } from "#/talk/data/routines";
import type { Pt } from "#/talk/segments/tip-03-effort/tracks";

/** Tip 5 story times (absolute τ; storyboard §7 stops 18–19, window = [start + 1.4, end + 1.4)). */
export const T5 = Object.freeze({
  winStart: 160.9,
  winEnd: 177.9,
  typeAt: 161.0,
  submitAt: 161.75,
  spinnerAt: 161.95,
  leave: 162.55,
  rulerStart: 163.0,
  routines: { at: 165.5, holdEnd: 168 },
  chain: { at: 174, holdEnd: 176.5, pinsAt: 168.4, pinStagger: 0.4, bandsAt: 171.1, bandDur: 3.34 },
});

export const T5_TOKENS = keys([T5.spinnerAt, 52_100], [T5.chain.holdEnd, 58_700]);

/** The day ruler's box on stage, and its axis (the horizon). */
export const RULER_BOX = Object.freeze({ x: 360, y: 620, w: 1400 });
const PAD = 60;
export const HORIZON = RULER_BOX.y + 150;

/** Stage x of a minute of the day on the ruler. */
export const minuteToX = (m: number): number =>
  RULER_BOX.x + PAD + ((m - RULER.from) / (RULER.to - RULER.from)) * (RULER_BOX.w - 2 * PAD);

/** Pin head before it drops (DayRuler starts pins 160 px above their rest). */
export const pinStart = (m: number): Pt => ({ x: minuteToX(m), y: RULER_BOX.y + 150 - 92 - 160 });

const ARC = Object.freeze({ rx: 640, ry: 260 });

/** The sun over the ruler at minute `m`: rises at 05:00 on the left, sets at 21:00 on the right. */
export function sunAt(m: number): Pt {
  const th = (Math.PI * (m - RULER.from)) / (RULER.to - RULER.from);
  const cx = minuteToX((RULER.from + RULER.to) / 2);
  return { x: cx - ARC.rx * Math.cos(th), y: HORIZON - ARC.ry * Math.sin(th) };
}

/** Far enough past 05:00 that the sun has cleared the horizon when the routines land. */
const DAWN = 350;

/** The sun's time of day: dawn creep, a stop at each ping, then a slow afternoon creep. */
export function sunMinute(tau: number): number {
  if (tau < 168.4) return DAWN + 5 * (Math.max(tau, 163.7) - 163.7);
  if (tau < 169.2)
    return sampleKeys(
      keys([168.4, DAWN + 5 * (168.4 - 163.7)], [168.8, 640, inOutCubic], [169.2, 950, inOutCubic]),
      tau,
    );
  return 950 + 5 * (tau - 169.2);
}

export const SUN_SIZE = 130;

/** Card `i` folds toward its pin over the 0.4 s before the pin drops. */
export function cardFold(i: number, tau: number): number {
  const drop = T5.chain.pinsAt + i * T5.chain.pinStagger;
  return prog(tau, drop - 0.4, drop, outCubic);
}
