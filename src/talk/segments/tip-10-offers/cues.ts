import type { CueAt } from "#/talk/cues";

import { swapAt, T10 } from "./tracks";

/** Stamp impact: the kit's SLAM lands 0.21 τ-s before its settle. */
const STAMP_IMPACT = 0.21;
/** A LAND run first reaches its rest 0.125 τ-s in (ticket contact). */
const LAND_CONTACT = 0.125;

/** Every cue in [231.4, 248.9), at the τ the picture lands it (turn-in, both stops, exit). */
export const CUES: readonly CueAt[] = [
  { tau: T10.typeAt, cue: "type" },
  { tau: T10.submitAt, cue: "thud" },
  { tau: T10.diveAt, cue: "whoosh" },
  { tau: T10.rowAt, cue: "type" },
  { tau: T10.bankedAt + LAND_CONTACT, cue: "pop" },
  { tau: T10.instantAt + LAND_CONTACT, cue: "pop" },
  { tau: T10.stampSettle - STAMP_IMPACT, cue: "slam" },
  { tau: T10.boneIn.start, cue: "shutter" },
  ...[0, 1, 2, 3].map((i) => ({
    tau: T10.ticketsAt + i * T10.ticketGap + LAND_CONTACT,
    cue: "pop" as const,
  })),
  { tau: T10.notCcSettle - STAMP_IMPACT, cue: "slam" },
  { tau: T10.closedSettle - STAMP_IMPACT, cue: "slam" },
  { tau: T10.punchAt, cue: "thud" },
  { tau: T10.headSettle - 0.6, cue: "riser" },
  { tau: T10.exit.boneOut.start, cue: "shutter" },
  { tau: swapAt(T10.exit.boneOut) + 0.02, cue: "type" },
  { tau: T10.exit.punchAt, cue: "thud" },
  { tau: T10.exit.whipAt, cue: "whoosh" },
];
