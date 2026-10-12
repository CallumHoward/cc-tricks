import type { CueAt } from "#/talk/cues";

import { CONVERGE, CRACK, EXIT, PLAN, PLUS_AT, RELEASE, SPROUT, TURN } from "./tracks";

/** Sound for [151.9, 160.9): every cue sits on the frame its visual lands. */
export const CUES: readonly CueAt[] = [
  { tau: TURN.typeAt, cue: "type" },
  { tau: TURN.submitAt, cue: "thud" },
  { tau: PLAN.enter, cue: "type" },
  { tau: SPROUT.start, cue: "pop" },
  { tau: PLUS_AT, cue: "tick" },
  { tau: CONVERGE.start, cue: "whoosh" },
  { tau: RELEASE - 0.1, cue: "riser" },
  { tau: CRACK, cue: "slam" },
  { tau: EXIT.completeAt, cue: "type" },
  { tau: EXIT.pocketAt, cue: "pop" },
  { tau: EXIT.whipAt, cue: "whoosh" },
];
