import type { CueAt } from "#/talk/cues";
import { stampImpact } from "#/talk/segments/tip-06-cli-agents/cue-timing";
import { exitTimes } from "#/talk/segments/tip-06-cli-agents/timing";

import { TIP8 } from "./timing";

const D = TIP8;
const exit = exitTimes(D.exit);

/** Sound cues at the τ this segment lands each event. */
export const CUES: readonly CueAt[] = [
  { tau: D.typeAt, cue: "type" },
  { tau: D.submitAt, cue: "thud" },
  { tau: D.dive.start, cue: "whoosh" },
  ...D.rows.map((tau): CueAt => ({ tau, cue: "tick" })),
  { tau: D.board.foldStart, cue: "riser" },
  { tau: D.towers.start + 1, cue: "riser" },
  { tau: stampImpact(D.stamp), cue: "slam" },
  { tau: exit.pocketAt, cue: "pop" },
  { tau: exit.whipAt, cue: "whoosh" },
];
