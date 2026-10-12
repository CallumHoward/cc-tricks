import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { createCueTracker, crossings, selectCues, type CuePlanSegment } from "#/engine/audio/cues";
import type { Beat } from "#/engine/types";

const beat = (id: string, start: number, cue: Beat["cue"] | null = "tick"): Beat => ({
  id,
  start,
  end: start + 0.2,
  summary: id,
  ...(cue ? { cue } : {}),
});

const beats = [
  beat("a", 1, "slam"),
  beat("b", 2, "pop"),
  beat("c", 3, "chime"),
  beat("quiet", 2.5, null),
];
const ids = (list: readonly { id?: string; beatId?: string }[]) =>
  list.map((x) => x.beatId ?? x.id ?? "");

describe("audio cues", () => {
  it("should fire nothing on the first frame", () => {
    expect(selectCues(undefined, 1, 1, beats)).toEqual([]);
  });

  it("should fire nothing when tau does not move", () => {
    expect(crossings(2, 2, beats)).toEqual([]);
  });

  it("should fire beats crossed forwards in travel order", () => {
    expect(ids(crossings(0.5, 2.6, beats))).toEqual(["a", "b"]);
  });

  it("should treat the forward interval as half-open so a beat fires once across adjacent frames", () => {
    expect(ids(crossings(0.9, 1, beats))).toEqual(["a"]);
    expect(ids(crossings(1, 1.1, beats))).toEqual([]);
  });

  it("should fire beats crossed backwards in reverse travel order", () => {
    expect(ids(crossings(3.5, 0.5, beats))).toEqual(["c", "b", "a"]);
  });

  it("should treat the backward interval as half-open so a beat fires once across adjacent frames", () => {
    expect(ids(crossings(2.1, 2, beats))).toEqual(["b"]);
    expect(ids(crossings(2, 1.9, beats))).toEqual([]);
  });

  it("should skip beats without a cue", () => {
    expect(ids(crossings(2.4, 2.6, beats))).toEqual([]);
  });

  it("should stay silent for beats inside a hold but still fire a beat landing exactly at the hold start", () => {
    const plan: CuePlanSegment[] = [
      { kind: "ramp", tau0: 0 },
      { kind: "hold", tau0: 2, end: 3 },
    ];
    expect(ids(crossings(1.5, 3.2, beats, plan))).toEqual(["b"]);
  });

  it("should mark direction and soften the gain when rewinding", () => {
    expect(selectCues(0.9, 1.1, 1, beats)).toEqual([
      { cue: "slam", beatId: "a", direction: 1, gain: 1 },
    ]);
    expect(selectCues(1.1, 0.9, -3, beats)).toEqual([
      { cue: "slam", beatId: "a", direction: -1, gain: 0.45 },
    ]);
  });

  it("should fire nothing for a seek-sized jump", () => {
    expect(selectCues(0, 2.9, 1, beats)).toEqual([]);
  });

  it("should fire nothing while travelling faster than the cue speed limit", () => {
    expect(selectCues(0.9, 1.1, 8, beats)).toEqual([]);
  });

  it("should keep only the latest cues when a frame crosses more than the budget", () => {
    const dense = [beat("t1", 1.0), beat("t2", 1.1), beat("t3", 1.2), beat("t4", 1.3)];
    expect(ids(selectCues(0.95, 1.35, 2, dense))).toEqual(["t3", "t4"]);
  });

  it("should not re-fire when tau jitters back and forth across a beat", () => {
    const tracker = createCueTracker(beats);
    const fired = [1.98, 2.001, 1.999, 2.001, 1.999, 2.002].flatMap((tau) =>
      ids(tracker.step(tau, 0.5)),
    );
    expect(fired).toEqual(["b"]);
  });

  it("should re-arm a beat once tau has moved past the hysteresis band", () => {
    const tracker = createCueTracker(beats);
    const fired = [1.9, 2.05, 2.2, 1.9, 2.1].flatMap((tau) => ids(tracker.step(tau, 1)));
    expect(fired).toEqual(["b", "b", "b"]);
  });

  it("should fire nothing on the first frame after a reset", () => {
    const tracker = createCueTracker(beats);
    tracker.step(0.5, 1);
    tracker.reset();
    expect(tracker.step(1.5, 1)).toEqual([]);
    expect(ids(tracker.step(2.1, 1))).toEqual(["b"]);
  });

  it("should pass hold segments from the plan through to the crossing check", () => {
    const tracker = createCueTracker(beats);
    tracker.step(1.9, 0.04);
    expect(tracker.step(2.1, 0.04, [{ kind: "hold", tau0: 1.95, end: 3 }])).toEqual([]);
  });

  it("should fire every beat exactly once on a monotonic walk in either direction", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 1, max: 400 }), { minLength: 1, maxLength: 30 }),
        fc.array(fc.double({ min: 0.001, max: 0.1, noNaN: true }), { minLength: 1, maxLength: 50 }),
        (starts, steps) => {
          const list = starts.map((s) => beat(`b${s}`, s / 10));
          const walk = (from: number, to: number) => {
            const tracker = createCueTracker(list);
            const dir = Math.sign(to - from);
            const fired: string[] = [];
            let tau = from;
            let i = 0;
            tracker.step(tau, dir);
            while (dir * (to - tau) > 0) {
              tau =
                dir > 0
                  ? Math.min(to, tau + steps[i % steps.length])
                  : Math.max(to, tau - steps[i % steps.length]);
              i++;
              fired.push(...ids(tracker.step(tau, dir)));
            }
            return fired;
          };
          const sorted = [...list].sort((a, b) => a.start - b.start).map((b) => b.id);
          expect(walk(0, 41)).toEqual(sorted);
          expect(walk(41, 0)).toEqual([...sorted].reverse());
        },
      ),
    );
  });
});
