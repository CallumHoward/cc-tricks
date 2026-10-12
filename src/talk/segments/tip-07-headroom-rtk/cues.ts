import { SPRINGS } from "#/engine/motion/spring";
import type { CueAt } from "#/talk/cues";
import { firstImpact, stampImpact } from "#/talk/segments/tip-06-cli-agents/cue-timing";
import { exitTimes } from "#/talk/segments/tip-06-cli-agents/timing";

import { TIP7 } from "./timing";

const D = TIP7;
const exit = exitTimes(D.exit);

/** Sound cues at the τ this segment lands each event. */
export const CUES: readonly CueAt[] = [
  { tau: D.typeAt, cue: "type" },
  { tau: D.submitAt, cue: "thud" },
  { tau: firstImpact(D.clamp.start, SPRINGS.SNAP), cue: "thud" },
  { tau: D.squeeze.start, cue: "whoosh" },
  ...D.reruns.map((tau): CueAt => ({ tau, cue: "tick" })),
  { tau: D.pull.start, cue: "whoosh" },
  { tau: D.code.start, cue: "type" },
  { tau: D.foot.start, cue: "type" },
  { tau: D.strokes[0], cue: "thud" },
  { tau: D.strokes[1], cue: "thud" },
  { tau: D.strokes[2], cue: "slam" },
  { tau: D.stats, cue: "tick" },
  { tau: stampImpact(D.stamp), cue: "slam" },
  { tau: exit.pocketAt, cue: "pop" },
  { tau: exit.whipAt, cue: "whoosh" },
];
