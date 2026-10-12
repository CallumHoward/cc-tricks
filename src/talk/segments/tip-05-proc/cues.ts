import type { CueAt } from "#/talk/cues";
import { outroTimes } from "#/talk/segments/tip-03-effort/bracket";

import { T5 } from "./timing";

const out = outroTimes(T5.chain.holdEnd);
/** LAND reaches contact 0.125 τ-s after it starts. */
const LAND_CONTACT = 0.125;
const cardContact = (i: number) => 163.05 + i * 0.2 + LAND_CONTACT;
const pinContact = (i: number) => T5.chain.pinsAt + i * T5.chain.pinStagger + LAND_CONTACT;

/** Sound for [160.9, 177.9): every cue sits on the frame its visual lands. */
export const CUES: readonly CueAt[] = [
  { tau: T5.typeAt, cue: "type" },
  { tau: T5.submitAt, cue: "thud" },
  { tau: T5.leave, cue: "whoosh" },
  { tau: cardContact(0), cue: "pop" },
  { tau: cardContact(1), cue: "pop" },
  { tau: cardContact(2), cue: "pop" },
  { tau: pinContact(0), cue: "chime" },
  { tau: pinContact(1), cue: "chime" },
  { tau: pinContact(2), cue: "chime" },
  { tau: T5.chain.bandsAt, cue: "tick" },
  { tau: T5.chain.bandsAt + 0.7, cue: "type" },
  { tau: out.line, cue: "type" },
  { tau: out.pocket, cue: "pop" },
  { tau: out.whip, cue: "whoosh" },
];
