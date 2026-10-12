import type { CueAt } from "#/talk/cues";

import { exitTimes, TIP6 } from "./timing";

const D = TIP6;
const exit = exitTimes(D.exit);

/** Sound cues at the τ this segment lands each event. */
export const CUES: readonly CueAt[] = [
  { tau: D.typeAt, cue: "type" },
  { tau: D.submitAt, cue: "thud" },
  { tau: D.split.start, cue: "shutter" },
  { tau: D.kiroType.start, cue: "type" },
  { tau: D.labelsType.start, cue: "type" },
  { tau: D.rows[0], cue: "shutter" },
  ...D.rowType.map((tau): CueAt => ({ tau, cue: "type" })),
  { tau: exit.pocketAt, cue: "pop" },
  { tau: exit.whipAt, cue: "whoosh" },
];
