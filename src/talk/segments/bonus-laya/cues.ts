import type { CueAt } from "#/talk/cues";
import { outroTimes } from "#/talk/segments/tip-03-effort/bracket";

import { RINGED, stepAt, TB } from "./timing";

const out = outroTimes(TB.browser.holdEnd);

/** Sound for [248.9, 267.4): every cue sits on the frame its visual lands. */
export const CUES: readonly CueAt[] = [
  { tau: TB.typeAt, cue: "type" },
  { tau: TB.submitAt, cue: "thud" },
  { tau: TB.leave, cue: "whoosh" },
  { tau: 251.3, cue: "riser" },
  { tau: 251.6, cue: "type" },
  { tau: 251.9, cue: "pop" },
  { tau: 255.6, cue: "type" },
  ...[0, 1, 2, 3].map((i) => ({ tau: TB.laya.barsAt + 0.1 + i * 0.3, cue: "tick" as const })),
  { tau: 261.1, cue: "whoosh" },
  ...Array.from({ length: RINGED }, (_, k) => ({ tau: stepAt(k), cue: "tick" as const })),
  { tau: out.line, cue: "type" },
  { tau: TB.browser.holdEnd + 0.3, cue: "pop" },
  { tau: out.whip, cue: "whoosh" },
];
