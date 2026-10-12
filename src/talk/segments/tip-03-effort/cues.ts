import type { CueAt } from "#/talk/cues";

import { outroTimes } from "./bracket";
import { T3 } from "./timing";

const out = outroTimes(T3.aa.holdEnd);
/** First, middle and last chart marker LAND contact (drops start 0.12 apart, contact +0.125). */
const markerContact = (k: number) => T3.aa.chartStart + 0.6 + k * 0.12 + 0.125;

/** Sound for [133.9, 151.9): every cue sits on the frame its visual lands. */
export const CUES: readonly CueAt[] = [
  { tau: T3.typeAt, cue: "type" },
  { tau: T3.submitAt, cue: "thud" },
  { tau: T3.leave, cue: "whoosh" },
  { tau: 136.6, cue: "type" },
  { tau: 137.3, cue: "slam" },
  { tau: T3.aa.chartStart, cue: "whoosh" },
  { tau: markerContact(0), cue: "tick" },
  { tau: markerContact(5), cue: "tick" },
  { tau: markerContact(10), cue: "tick" },
  { tau: T3.aa.frontier.start, cue: "riser" },
  { tau: 145.0, cue: "pop" },
  { tau: 145.25, cue: "pop" },
  { tau: out.line, cue: "type" },
  { tau: out.pocket, cue: "pop" },
  { tau: out.whip, cue: "whoosh" },
];
