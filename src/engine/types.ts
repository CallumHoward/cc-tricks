/**
 * Shared contracts for the motion presentation engine.
 *
 * Story time `tau` (seconds) is the position in the storyboarded film. Every visual that is part of
 * the film must be a pure function of `tau`, so reverse playback, deep links and stills are free.
 * Wall time `w` (seconds since the stage started) only drives ambient texture (grain, boil, blinks)
 * and the interactive widgets, which are deliberately not speed-ramped.
 */

/** A stop is a slide moment: the film brakes into slo-mo at `at` and creeps until `at + holdSpan`. */
export type Stop = {
  id: string;
  /** Story time at which everything readable has landed */
  at: number;
  /** Story seconds of slo-mo creep available after `at` (never exceeded) */
  holdSpan: number;
  /** Optional per-stop creep speed (fraction of 1x) */
  holdSpeed?: number;
};

/** One rendered instant. */
export type Frame = {
  /** Story time (seconds) */
  tau: number;
  /** Playhead velocity (story seconds per wall second); negative while rewinding */
  v: number;
  /** Wall time (seconds since the stage started) */
  w: number;
  /** Wall seconds since the previous frame (0 for stills) */
  dt: number;
};

/** Imperative per-frame callback. Must not allocate heavily or touch React state. */
export type FrameCallback = (frame: Frame) => void;

/** Navigation intents, from keys, clicks or the presenter console. */
export type NavAction =
  | { type: "next" }
  | { type: "prev" }
  | { type: "goto"; index: number }
  | { type: "first" }
  | { type: "last" };

/** A window of story time in which a segment's React tree is mounted. */
export type MountWindow = { start: number; end: number };

/** A storyboard section rendered by one React component (owned by one segment module). */
export type Segment = {
  id: string;
  /** Story time window this segment is visible in (inclusive of its lead-in and holds) */
  window: MountWindow;
  stops: readonly Stop[];
};

/** Something that lands at a story time; used by the timeline lints and the audio cue bus. */
export type Beat = {
  id: string;
  start: number;
  end: number;
  summary: string;
  /** Optional sound cue fired when the playhead crosses `start` */
  cue?: CueName;
};

export type CueName =
  | "whoosh"
  | "slam"
  | "tick"
  | "type"
  | "pop"
  | "shutter"
  | "riser"
  | "thud"
  | "chime";
