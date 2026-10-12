import type { CueAt } from "#/talk/cues";

import { flightStart, OUT } from "./tracks";

const recapTick = (k: number): CueAt => ({
  tau: OUT.recapAt + (k * OUT.recapDur) / 3,
  cue: "tick",
});

/** Every cue in the outro window, on the τ its visual lands. */
export const CUES: readonly CueAt[] = [
  { tau: OUT.whip, cue: "whoosh" },
  recapTick(0),
  recapTick(1),
  recapTick(2),
  { tau: OUT.wipeFrom, cue: "shutter" },
  { tau: OUT.thesisBy - 0.7, cue: "riser" },
  { tau: OUT.collapseFrom, cue: "thud" },
  { tau: OUT.cookedAt, cue: "type" },
  { tau: OUT.qrFrom, cue: "tick" },
  { tau: flightStart(9), cue: "pop" },
  { tau: flightStart(0) + OUT.flyDur, cue: "chime" },
];
