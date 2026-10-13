import { describe, expect, it } from "vitest";

import { pullAt, TIP7 } from "./timing";

describe("tip 7 timing", () => {
  it("should keep the camera inside the terminal at both window boundaries", () => {
    expect(pullAt(TIP7.window.start)).toBe(0);
    expect(pullAt(TIP7.window.end)).toBe(0);
    expect(pullAt(TIP7.headroom.at)).toBe(1);
  });

  it("should take the dashboard away before the camera is back in the terminal", () => {
    expect(TIP7.shot.out + 0.4).toBeLessThanOrEqual(TIP7.exit + 0.35);
    expect(TIP7.shot.in).toBeLessThan(TIP7.pull.end);
  });
});
