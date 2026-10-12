import { describe, expect, it } from "vitest";

import { audioBeats } from "./cues";

const BEATS = [
  {
    id: "a-b1",
    stopId: "a",
    start: 0,
    end: 3,
    kind: "motion" as const,
    summary: "",
    cues: [{ tau: 1, cue: "type" as const }],
  },
  {
    id: "b-b1",
    stopId: "b",
    start: 10,
    end: 13,
    kind: "motion" as const,
    summary: "",
    cues: [{ tau: 11, cue: "thud" as const }],
  },
];
const SEGMENTS = [
  { id: "seg-a", window: { start: 0, end: 10 } },
  { id: "seg-b", window: { start: 10, end: 20 } },
];

describe("audioBeats", () => {
  it("should keep the storyboard cues when no segment overrides them", () => {
    expect(audioBeats(BEATS, SEGMENTS, {}).map((b) => [b.start, b.cue])).toEqual([
      [1, "type"],
      [11, "thud"],
    ]);
  });

  it("should replace a segment's storyboard cues with its own list", () => {
    const beats = audioBeats(BEATS, SEGMENTS, { "seg-b": [{ tau: 11.4, cue: "slam" }] });

    expect(beats.map((b) => [b.start, b.cue])).toEqual([
      [1, "type"],
      [11.4, "slam"],
    ]);
  });
});
