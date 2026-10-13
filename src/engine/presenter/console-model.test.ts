import { describe, expect, it } from "vitest";

import { formatClock, pace, presenterKeyAction } from "./console-model";

describe("console model", () => {
  it("should format durations as minutes and padded seconds", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(65_900)).toBe("1:05");
    expect(formatClock(-61_000)).toBe("-1:01");
  });

  it("should report pace against the budget share for the stop", () => {
    const budget = 1200;

    expect(pace(600_000, 5, 11, budget)).toBe("on");
    expect(pace(800_000, 5, 11, budget)).toBe("behind");
    expect(pace(100_000, 5, 11, budget)).toBe("ahead");
    expect(pace(999_000, 0, 1, budget)).toBe("on");
  });

  it("should replay the talk's keys on the stage and fullscreen the presenter window on F", () => {
    const button = document.createElement("button");
    const field = document.createElement("input");
    const press = (key: string, extra: object = {}) =>
      presenterKeyAction({ key, target: document.body, ...extra });

    expect(
      ["ArrowRight", " ", "PageDown", "Home", "Escape", "7", "Enter", "M", "."].map((key) =>
        press(key),
      ),
    ).toEqual(Array.from({ length: 9 }, () => "stage"));
    expect(press("f")).toBe("fullscreen");
    expect(press("p")).toBeNull();
    expect(press("x")).toBeNull();
    expect(press("m", { metaKey: true })).toBeNull();
    expect(press("ArrowRight", { repeat: true })).toBeNull();
    expect(press("m", { target: field })).toBeNull();
    expect(press("Enter", { target: button })).toBeNull();
    expect(press(" ", { target: button })).toBeNull();
    expect(press("ArrowRight", { target: button })).toBe("stage");
  });
});
