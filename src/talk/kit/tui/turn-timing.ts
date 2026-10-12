import type { CueName } from "#/engine/types";

import { charLength, completionText, typeEnd, type CountSource, type VerbSource } from "./tui-math";

/** Home-shot geometry (1920×1080 logical px). */
export const HOME = Object.freeze({
  left: 160,
  width: 1600,
  textX: 200,
  spinnerY: 500,
  echoY: 436,
  promptTop: 560,
  promptHeight: 120,
  pileX: 1600,
  pileY: 560,
});

export type TurnIn = {
  /** Typed into the prompt, e.g. `1. Use subagents` */
  prompt: string;
  verb: VerbSource;
  typeAt: number;
  submitAt?: number;
  spinnerAt?: number;
  /** Prompt typing speed (chars per τ-s); the spinner line types at 60 */
  cps?: number;
  tokens?: CountSource;
  elapsed?: CountSource;
  /** Tip 9: a dim suggestion appears at `at` and Tab accepts it at `acceptAt` */
  ghost?: { text: string; at: number; acceptAt: number };
};

export type TurnOut = {
  pastVerb: string;
  duration: string;
  /** τ the completion line starts typing */
  at: number;
  /** τ the scrollback whip starts (needs `in` to whip into) */
  whipAt?: number;
  whipDur?: number;
  tone?: "dim" | "clay";
};

export type TurnSpec = { in?: TurnIn; out?: TurnOut };

export type TurnTimes = {
  completeAt?: number;
  completeEnd?: number;
  whipAt?: number;
  whipEnd?: number;
  typeAt?: number;
  typeEnd?: number;
  submitAt?: number;
  spinnerAt?: number;
  spinnerEnd?: number;
  /** Latest τ anything in the turn is still moving */
  landing: number;
};

const SPINNER_CPS = 60;
const COMPLETE_CPS = 60;
const LIFT = 0.44;

/** Fills defaulted timings so each beat follows the previous one. */
export function resolveTurn(spec: TurnSpec): TurnTimes {
  const t: TurnTimes = { landing: Number.NEGATIVE_INFINITY };
  if (spec.out) {
    const { at, pastVerb, duration } = spec.out;
    t.completeAt = at;
    t.completeEnd = at + (3 + charLength(completionText(pastVerb, duration))) / COMPLETE_CPS;
    if (spec.in) {
      t.whipAt = spec.out.whipAt ?? t.completeEnd + 0.35;
      t.whipEnd = t.whipAt + (spec.out.whipDur ?? 0.5);
    }
    t.landing = Math.max(t.completeEnd, t.whipEnd ?? t.completeEnd);
  }
  if (spec.in) {
    const { prompt, typeAt, cps = 30 } = spec.in;
    const text = spec.in.ghost ? spec.in.ghost.text : prompt;
    t.typeAt = typeAt;
    t.typeEnd = spec.in.ghost ? spec.in.ghost.acceptAt : typeEnd(typeAt, charLength(text), cps);
    t.submitAt = spec.in.submitAt ?? t.typeEnd + 0.25;
    t.spinnerAt = spec.in.spinnerAt ?? t.submitAt + 0.2;
    t.spinnerEnd = t.spinnerAt + 30 / SPINNER_CPS;
    t.landing = Math.max(t.landing, t.submitAt + LIFT, t.spinnerEnd);
  }
  return t;
}

/** Sound cues for the turn (forward crossings), to merge into the stop's beats. */
export function turnCues(spec: TurnSpec): { tau: number; cue: CueName }[] {
  const t = resolveTurn(spec);
  const cues: { tau: number; cue: CueName }[] = [];
  if (t.completeAt !== undefined) cues.push({ tau: t.completeAt, cue: "type" });
  if (t.whipAt !== undefined) cues.push({ tau: t.whipAt, cue: "whoosh" });
  if (t.typeAt !== undefined) cues.push({ tau: t.typeAt, cue: "type" });
  if (t.submitAt !== undefined) cues.push({ tau: t.submitAt, cue: "thud" });
  if (t.spinnerAt !== undefined) cues.push({ tau: t.spinnerAt, cue: "type" });
  return cues;
}
