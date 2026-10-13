import { screen } from "@testing-library/react";

type Point = { x: number; y: number };

/** RuleRise sets each letter in its own span, so match the whole rise by its joined text. */
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

/** `f` sampled at `n + 1` evenly spaced τ across `at → at + dur`. */
export const sampleSpan = (f: (tau: number) => number, at: number, dur: number, n = 60): number[] =>
  Array.from({ length: n + 1 }, (_, k) => f(at + (k / n) * dur));

/** Largest jump between consecutive samples. */
export const maxStep = (ys: readonly number[]): number =>
  Math.max(...ys.slice(1).map((y, k) => Math.abs(y - (ys[k] ?? 0))));
