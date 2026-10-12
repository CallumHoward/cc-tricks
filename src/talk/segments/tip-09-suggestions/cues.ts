import type { CueAt } from "#/talk/cues";

import { T9 } from "./tracks";

/** Stamp impact: the kit's SLAM lands 0.21 τ-s before its settle. */
const STAMP_IMPACT = 0.21;

/** Every cue in [222.9, 231.4), at the τ the picture lands it (turn-in, beats, exit). */
export const CUES: readonly CueAt[] = [
  { tau: T9.ghostAt, cue: "pop" },
  { tau: T9.submitAt, cue: "thud" },
  { tau: T9.sweepAt, cue: "whoosh" },
  { tau: T9.updateOutAt, cue: "type" },
  { tau: T9.stampSettle - STAMP_IMPACT, cue: "slam" },
  { tau: T9.exit.ghostLineAt, cue: "pop" },
  { tau: T9.exit.pocketAt, cue: "tick" },
  { tau: T9.exit.whipAt, cue: "whoosh" },
];
