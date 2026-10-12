import type { Beat, CueName } from "#/engine/types";
import type { SegmentEntry } from "#/talk/segments";
import type { BeatData } from "#/talk/timeline-data";

/** A sound cue at an absolute story time. */
export type CueAt = { tau: number; cue: CueName };

/**
 * Audio beats for the whole talk: the storyboard's cues, except inside any segment that ships its
 * own `cues.ts` (keyed by segment id), whose list replaces the storyboard's within that segment's
 * window.
 */
export function audioBeats(
  beats: readonly BeatData[],
  segments: readonly Pick<SegmentEntry, "id" | "window">[],
  overrides: Readonly<Record<string, readonly CueAt[]>>,
): Beat[] {
  const owner = (tau: number) =>
    segments.find(({ window }) => tau >= window.start && tau < window.end)?.id;
  const fromStoryboard = beats.flatMap((beat) =>
    beat.cues
      .filter((cue) => {
        const id = owner(cue.tau);
        return id === undefined || !(id in overrides);
      })
      .map((cue, i) => ({ id: `${beat.id}:${i}`, at: cue.tau, cue: cue.cue })),
  );
  const fromSegments = Object.entries(overrides).flatMap(([id, cues]) =>
    cues.map((cue, i) => ({ id: `${id}:${i}`, at: cue.tau, cue: cue.cue })),
  );
  return [...fromStoryboard, ...fromSegments]
    .sort((a, b) => a.at - b.at)
    .map(({ id, at, cue }) => ({ id, start: at, end: at, summary: id, cue }));
}
