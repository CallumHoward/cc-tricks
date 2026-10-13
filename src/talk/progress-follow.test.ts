import { describe, expect, it } from "vitest";

import { followProgress, talkProgress } from "./progress-follow";

describe("progress follow", () => {
  it("should report the share of the film played, clamped to the film", () => {
    expect(talkProgress(-5, 100)).toBe(0);
    expect(talkProgress(25, 100)).toBe(0.25);
    expect(talkProgress(150, 100)).toBe(1);
  });

  it("should report no progress for an empty film", () => {
    expect(talkProgress(10, 0)).toBe(0);
  });

  it("should start at rest on the target", () => {
    expect(followProgress(null, 0.4, 1 / 60)).toEqual({ x: 0.4, v: 0 });
  });

  it("should glide towards a jumped target instead of snapping", () => {
    const next = followProgress({ x: 0, v: 0 }, 1, 1 / 60);
    expect(next.x).toBeGreaterThan(0);
    expect(next.x).toBeLessThan(0.1);
    expect(next.v).toBeGreaterThan(0);
  });

  it("should cap a long frame gap so a stall does not overshoot", () => {
    const stalled = followProgress({ x: 0, v: 0 }, 1, 5);
    expect(stalled).toEqual(followProgress({ x: 0, v: 0 }, 1, 0.1));
  });
});
