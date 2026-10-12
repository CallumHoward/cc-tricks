import type { CueAt } from "#/talk/cues";

import { F, HOP_LANDS, HOPS } from "./tracks";

/** The composer first reaches full height (SETTLE overshoot peak follows ~0.1 s later). */
export const MORPH_LANDS = F.morph.start + 0.32;

const land = (i: number): number => (HOPS[i] as number) + HOP_LANDS;

/** Every sound cue in the foreword window, at the τ the visuals land. */
export const CUES: readonly CueAt[] = [
  { tau: MORPH_LANDS, cue: "thud" },
  { tau: F.placeholderAt, cue: "type" },
  { tau: 25.1, cue: "riser" },
  { tau: F.lineAt, cue: "type" },
  { tau: 30.7, cue: "whoosh" },
  { tau: 31.3, cue: "pop" },
  { tau: 32.1, cue: "pop" },
  { tau: land(1), cue: "thud" },
  { tau: F.a1At, cue: "type" },
  { tau: F.a2At, cue: "type" },
  { tau: F.tipsAt, cue: "type" },
  { tau: land(2), cue: "thud" },
  { tau: F.menuAt + 0.1, cue: "pop" },
  { tau: F.exit + 0.05, cue: "thud" },
];
