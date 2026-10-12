import type { CueAt } from "#/talk/cues";

import { flightStart, OUT } from "./tracks";

/** Every cue in the outro window, on the τ its visual lands. */
export const CUES: readonly CueAt[] = [
  { tau: OUT.whip, cue: "whoosh" },
  { tau: OUT.recapAt, cue: "riser" },
  { tau: OUT.recapAt + OUT.recapDur, cue: "tick" },
  { tau: OUT.wipeFrom, cue: "shutter" },
  { tau: OUT.thesisBy - 0.7, cue: "riser" },
  { tau: OUT.collapseTo, cue: "thud" },
  { tau: OUT.cookedAt, cue: "type" },
  { tau: OUT.hopTo, cue: "thud" },
  { tau: OUT.qrFrom, cue: "tick" },
  { tau: flightStart(9), cue: "pop" },
  { tau: flightStart(0) + OUT.flyDur, cue: "chime" },
];
