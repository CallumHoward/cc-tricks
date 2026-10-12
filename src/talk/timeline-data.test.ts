import { describe, expect, it } from "vitest";

import { lintTimeline } from "#/engine/timeline/lint";
import type { CueName } from "#/engine/types";
import { BEATS, SEGMENTS, STOPS } from "#/talk/timeline-data";

const CUES: readonly CueName[] = [
  "whoosh",
  "slam",
  "tick",
  "type",
  "pop",
  "shutter",
  "riser",
  "thud",
  "chime",
];

const stopById = new Map(STOPS.map((stop) => [stop.id, stop]));

describe("timeline data", () => {
  it("should have unique stop ids", () => {
    expect(new Set(STOPS.map((stop) => stop.id)).size).toBe(STOPS.length);
  });

  it("should order stops by increasing story time", () => {
    const times = STOPS.map((stop) => stop.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(times).size).toBe(times.length);
  });

  it("should end every hold exactly where the next lead-in starts", () => {
    STOPS.slice(0, -1).forEach((stop, i) => {
      const next = STOPS[i + 1];
      expect(stop.at + stop.holdSpan).toBeCloseTo(next.leadIn.start, 6);
      expect(next.leadIn.end).toBeCloseTo(next.at, 6);
    });
  });

  it("should have unique beat ids that belong to a known stop", () => {
    expect(new Set(BEATS.map((beat) => beat.id)).size).toBe(BEATS.length);
    expect(BEATS.every((beat) => stopById.has(beat.stopId))).toBe(true);
  });

  it("should order beats by start time", () => {
    const starts = BEATS.map((beat) => beat.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it("should give every stop a motion beat and a hold beat", () => {
    const incomplete = STOPS.filter((stop) => {
      const kinds = new Set(BEATS.filter((beat) => beat.stopId === stop.id).map((b) => b.kind));
      return kinds.size !== 2;
    }).map((stop) => stop.id);
    expect(incomplete).toEqual([]);
  });

  it("should use only valid cue names placed inside their beat", () => {
    const invalid = BEATS.flatMap((beat) =>
      beat.cues
        .filter(
          ({ tau, cue }) => !CUES.includes(cue) || tau < beat.start - 1e-6 || tau > beat.end + 1e-6,
        )
        .map(({ cue }) => `${beat.id}: ${cue}`),
    );
    expect(invalid).toEqual([]);
  });

  it("should tile segments from zero without gaps", () => {
    expect(SEGMENTS[0].start).toBe(0);
    SEGMENTS.slice(1).forEach((segment, i) => {
      expect(segment.start).toBeCloseTo(SEGMENTS[i].end, 6);
    });
    expect(new Set(SEGMENTS.map((segment) => segment.id)).size).toBe(SEGMENTS.length);
  });

  it("should place every stop inside its segment", () => {
    const outside = STOPS.filter((stop) => {
      const segment = SEGMENTS.find((s) => s.id === stop.segment);
      return (
        !segment ||
        stop.leadIn.start < segment.start - 1e-6 ||
        stop.at + stop.holdSpan > segment.end + 1e-6
      );
    }).map((stop) => stop.id);
    expect(outside).toEqual([]);
  });

  it("should pass the engine timeline lint", () => {
    const result = lintTimeline({
      stops: STOPS,
      beats: BEATS.filter((beat) => beat.kind === "motion").map(({ id, start, end, summary }) => ({
        id,
        start,
        end,
        summary,
      })),
      segments: SEGMENTS.map((segment) => ({
        id: segment.id,
        window: { start: segment.start, end: segment.end },
        stops: STOPS.filter((stop) => stop.segment === segment.id),
      })),
    });
    expect(result.errors).toEqual([]);
  });

  it("should flag the t2 explainer stops and the rewind demo", () => {
    expect(STOPS.filter((stop) => stop.explainer).map((stop) => stop.id)).toEqual([
      "t2-stateless",
      "t2-kv",
    ]);
    expect(STOPS.filter((stop) => stop.rewindDemo).map((stop) => stop.id)).toEqual(["t2-switch"]);
  });

  it("should use the Cloud routine times for the ping chain", () => {
    const summaries = BEATS.filter((beat) => beat.stopId === "t5-chain").map((b) => b.summary);
    expect(summaries.join(" ")).toContain("10:40–15:40, 15:50–20:50");
  });
});
