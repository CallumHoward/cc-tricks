import type { CueAt } from "#/talk/cues";

import { AFT } from "./tracks";

/** Every cue in the afterword window, on the τ its visual lands. */
export const CUES: readonly CueAt[] = [
  { tau: AFT.whipIn, cue: "whoosh" },
  { tau: AFT.whipIn + AFT.whipDur, cue: "riser" },
  { tau: AFT.barsFrom, cue: "tick" },
  { tau: AFT.captionAt, cue: "type" },
  { tau: AFT.cut, cue: "slam" },
  { tau: AFT.pinLand, cue: "thud" },
  { tau: AFT.posterTextBy - 0.8, cue: "riser" },
  { tau: AFT.yank, cue: "whoosh" },
  { tau: AFT.whipOut, cue: "whoosh" },
];
