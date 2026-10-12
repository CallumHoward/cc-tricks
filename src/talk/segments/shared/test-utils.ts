import { screen } from "@testing-library/react";

import { STOPS } from "#/talk/timeline-data";

type Point = { x: number; y: number };

/** RuleRise sets each word in its own span, so match the whole rise by its joined words. */
export const getRise = (text: string) =>
  screen.getByText(
    (_, el) =>
      el?.classList.contains("km-rr") === true &&
      el.textContent?.replace(/\s+/g, "") === text.replace(/\s+/g, ""),
  );

/** Largest dock or bot offset from the home shot at either edge of a tip's window. */
export const homeDrift = (
  win: { start: number; end: number },
  dockY: (tau: number) => number,
  botOffset: (tau: number) => Point,
): number =>
  Math.max(
    ...[win.start, win.end - 0.01].flatMap((tau) =>
      [dockY(tau), botOffset(tau).x, botOffset(tau).y].map(Math.abs),
    ),
  );

/** Cue times that fall outside the segment window or inside one of its stops' holds. */
export function misplacedCues(
  segment: string,
  win: { start: number; end: number },
  cues: readonly { tau: number }[],
): number[] {
  const holds = STOPS.filter((stop) => stop.segment === segment);
  if (holds.length === 0) throw new Error(`No stops for segment ${segment}`);
  const inHold = (tau: number) => holds.some((s) => tau >= s.at && tau < s.at + s.holdSpan);
  return cues.map((c) => c.tau).filter((tau) => tau < win.start || tau >= win.end || inHold(tau));
}
