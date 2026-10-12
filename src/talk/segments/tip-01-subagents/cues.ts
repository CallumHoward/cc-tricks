import type { CueAt } from "#/talk/cues";

import {
  ADV,
  CHIPS,
  EXIT,
  HOLD_END,
  LABEL_AT,
  spokeLaunch,
  SUBAGENTS,
  TURN,
  YAML_AT,
} from "./tracks";

const chipLand = CHIPS.map((c) => c.land);

/** Sound for [47.4, 69.9): every cue sits on the frame its visual lands. */
export const CUES: readonly CueAt[] = [
  { tau: TURN.typeAt, cue: "type" },
  { tau: TURN.submitAt, cue: "thud" },
  ...SUBAGENTS.map((_, i) => ({ tau: spokeLaunch(i), cue: "pop" as const })),
  { tau: LABEL_AT, cue: "type" },
  { tau: HOLD_END.agents, cue: "whoosh" },
  { tau: YAML_AT, cue: "type" },
  ...chipLand.map((tau) => ({ tau, cue: "pop" as const })),
  { tau: ADV.typeAt, cue: "type" },
  { tau: ADV.starIn, cue: "whoosh" },
  { tau: ADV.rowsAt, cue: "tick" },
  { tau: ADV.cratesAt, cue: "thud" },
  { tau: ADV.l2At, cue: "type" },
  { tau: EXIT.completeAt, cue: "type" },
  { tau: EXIT.pocketAt, cue: "pop" },
  { tau: EXIT.whipAt, cue: "whoosh" },
];
