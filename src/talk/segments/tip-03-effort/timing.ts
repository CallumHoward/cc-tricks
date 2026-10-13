import { keys } from "#/engine/motion/track";
import type { AaEffort } from "#/talk/data/aa";

import { dialSeats, type Pt } from "./tracks";

/** Tip 3 story times (absolute τ; storyboard §7 stops 15–16, window = [start + 1.4, end + 1.4)). */
export const T3 = Object.freeze({
  winStart: 133.9,
  winEnd: 151.9,
  typeAt: 134.0,
  submitAt: 134.85,
  spinnerAt: 135.05,
  leave: 135.6,
  lastGen: { at: 138.5, holdEnd: 141 },
  aa: { at: 147, holdEnd: 150.5, chartStart: 141.1, hopsAt: 144 },
});

export const T3_TOKENS = keys([T3.spinnerAt, 31_400], [T3.aa.holdEnd, 38_900]);

export const EFFORTS: readonly AaEffort[] = ["low", "medium", "high", "xhigh", "max"];
export const EFFORT_GLYPHS = ["✢", "✳", "✶", "✻", "✽"] as const;

/** Where the live spinner glyph sits in the home shot (stage px). */
export const SPIN_AT: Pt = { x: 218, y: 500 };

export const DIAL = Object.freeze({ center: { x: 1180, y: 790 }, radius: 330 });
export const DIAL_SEATS = dialSeats(DIAL.center, DIAL.radius);
export const glyphSize = (i: number) => 64 + i * 16;
