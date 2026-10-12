import { describe, expect, it } from "vitest";

import { SPRINGS } from "#/engine/motion/spring";
import { keys } from "#/engine/motion/track";
import type { Beat, Segment, Stop } from "#/engine/types";

import { leadIn, lintTimeline, motionTime } from "./lint";

describe("lintTimeline", () => {
  const STOPS: Stop[] = [
    { id: "intro", at: 2, holdSpan: 3 },
    { id: "tip1", at: 10, holdSpan: 4 },
  ];

  const SEGMENTS: Segment[] = [
    { id: "open", window: { start: 0, end: 6 }, stops: [STOPS[0] as Stop] },
    { id: "one", window: { start: 5, end: 15 }, stops: [STOPS[1] as Stop] },
  ];

  const beat = (id: string, start: number, end = start + 0.5, summary = ""): Beat => ({
    id,
    start,
    end,
    summary,
  });

  const BEATS: Beat[] = [beat("title", 0, 1.5), beat("exit", 5.2), beat("enter", 7.5, 9.5)];

  it("should pass a well-formed timeline", () => {
    expect(lintTimeline({ stops: STOPS, beats: BEATS, segments: SEGMENTS })).toEqual({
      errors: [],
      warnings: [],
    });
  });

  it("should flag unsorted and duplicate stops", () => {
    const { errors } = lintTimeline({
      stops: [STOPS[1] as Stop, STOPS[0] as Stop, { id: "tip1", at: 30, holdSpan: 0 }],
      beats: [],
      segments: [],
    });
    expect(errors).toEqual([
      expect.stringContaining("is not after tip1"),
      expect.stringContaining("duplicate id"),
      expect.stringContaining("holdSpan must be positive"),
    ]);
  });

  it("should flag a hold that runs into the next stop's lead-in", () => {
    const stops: Stop[] = [
      { id: "a", at: 0, holdSpan: 4.8 },
      { id: "b", at: 5, holdSpan: 2 },
    ];
    expect(lintTimeline({ stops, beats: [], segments: [] }).errors).toEqual([
      expect.stringContaining("after b's lead-in"),
    ]);
    expect(leadIn(stops[1] as Stop)).toBeGreaterThan(0.2);
    expect(leadIn(stops[1] as Stop)).toBeLessThan(0.5);
  });

  it("should flag segments whose windows do not contain their stops", () => {
    const { errors } = lintTimeline({
      stops: STOPS,
      beats: [],
      segments: [
        { id: "bad", window: { start: 3, end: 4 }, stops: [STOPS[0] as Stop] },
        { id: "empty", window: { start: 4, end: 4 }, stops: [] },
      ],
    });
    expect(errors).toEqual([
      expect.stringContaining("segment bad: stop intro"),
      expect.stringContaining("segment empty: empty window"),
    ]);
  });

  it("should measure motion time outside hold windows", () => {
    expect(motionTime(STOPS, 0, 2)).toBe(2);
    expect(motionTime(STOPS, 0, 6)).toBe(3);
    expect(motionTime(STOPS, 3, 4)).toBe(0);
    expect(motionTime(STOPS, 4, 12)).toBe(5);
  });

  it("should warn about motion gaps over 3 s and error over 6 s", () => {
    const stops: Stop[] = [{ id: "s", at: 30, holdSpan: 2 }];
    const { errors, warnings } = lintTimeline({
      stops,
      beats: [beat("a", 0), beat("b", 4), beat("c", 11), beat("d", 13)],
      segments: [],
    });
    expect(warnings).toEqual([expect.stringContaining("beat a → beat b: 4 s")]);
    expect(errors).toEqual([
      expect.stringContaining("beat b → beat c: 7 s"),
      expect.stringContaining("beat d → s hold end: 17 s"),
    ]);
  });

  it("should not warn about long moves that are tagged as such", () => {
    const { warnings } = lintTimeline({
      stops: [],
      beats: [beat("a", 0, 4, "camera long-move"), beat("b", 4)],
      segments: [],
    });
    expect(warnings).toEqual([]);
  });

  it("should not count hold time against the motion gap", () => {
    const { errors, warnings } = lintTimeline({
      stops: [{ id: "s", at: 2, holdSpan: 10 }],
      beats: [beat("a", 1), beat("b", 13)],
      segments: [],
    });
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it("should flag beats that land inside a hold and warn about beats that start in one", () => {
    const { errors, warnings } = lintTimeline({
      stops: STOPS,
      beats: [beat("out", 6.5), beat("late", 9, 10.5), beat("drift", 11, 13)],
      segments: [],
    });
    expect(errors).toEqual([
      expect.stringContaining("beat late: lands at 10.5, inside tip1's hold"),
    ]);
    expect(warnings).toEqual([expect.stringContaining("beat drift: starts inside tip1's hold")]);
  });

  it("should flag beats that end before they start", () => {
    const { errors } = lintTimeline({ stops: [], beats: [beat("x", 2, 1)], segments: [] });
    expect(errors).toEqual([expect.stringContaining("ends before it starts")]);
  });

  it("should flag track landings and overshooting springs inside holds", () => {
    const { errors } = lintTimeline({
      stops: STOPS,
      beats: [],
      segments: [],
      tracks: [
        { id: "ok", spec: { x: keys([8, 0], [9.5, 1, SPRINGS.LAND]), y: keys([10, 0], [14, 5]) } },
        { id: "late", spec: { opacity: keys([9, 0], [10.4, 1]) } },
        { id: "pop", spec: { scale: keys([10.5, 0], [12, 1, SPRINGS.POP]) } },
        { id: "settle", spec: { x: keys([9.8, 0], [12, 1, SPRINGS.LAND]) } },
      ],
    });
    expect(errors).toEqual([
      expect.stringContaining("track late.opacity: lands at 10.4"),
      expect.stringContaining("track pop.scale: overshooting spring"),
      expect.stringContaining("track settle.x: lands at 10.05"),
    ]);
  });
});
