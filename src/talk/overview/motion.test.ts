import { describe, expect, it } from "vitest";

import { CELL_SCALE } from "./layout";
import { cellGoal, keyIntent, liveStyle, stepRing } from "./motion";

const key = (k: string, mods: Partial<Record<"metaKey" | "ctrlKey" | "altKey", boolean>> = {}) => ({
  key: k,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  ...mods,
});

describe("keyIntent", () => {
  it.each(["Escape", "m", "M", "o", "O"])("should close on %j", (k) => {
    expect(keyIntent(key(k))).toBe("close");
  });

  it("should jump on Enter", () => {
    expect(keyIntent(key("Enter"))).toBe("jump");
  });

  it.each(["ArrowRight", "ArrowUp", "PageDown", " ", "Home", "End"])("should move on %j", (k) => {
    expect(keyIntent(key(k))).toBe("move");
  });

  it("should swallow digits so they never reach the stage", () => {
    expect(keyIntent(key("7"))).toBe("swallow");
  });

  it("should pass through unrelated keys and any modified key", () => {
    expect(keyIntent(key("f"))).toBeNull();
    expect(keyIntent(key("m", { metaKey: true }))).toBeNull();
    expect(keyIntent(key("Enter", { ctrlKey: true }))).toBeNull();
    expect(keyIntent(key("1", { altKey: true }))).toBeNull();
  });
});

describe("cellGoal", () => {
  it("should reveal nearer cells before farther ones when opening", () => {
    expect(cellGoal(true, 0.06, 0, 3)).toBe(1);
    expect(cellGoal(true, 0.06, 2, 3)).toBe(0);
    expect(cellGoal(true, 0.05 + 2 * 0.024, 2, 3)).toBe(1);
  });

  it("should hide the farthest cells first when closing", () => {
    expect(cellGoal(false, 0, 3, 3)).toBe(0);
    expect(cellGoal(false, 0, 0, 3)).toBe(1);
    expect(cellGoal(false, 3 * 0.008, 0, 3)).toBe(0);
  });
});

describe("stepRing", () => {
  it("should not move a ring already resting on its goal", () => {
    expect(stepRing({ x: 10, y: 20, vx: 0, vy: 0 }, { x: 10, y: 20 }, 1 / 60)).toEqual({
      x: 10,
      y: 20,
      vx: 0,
      vy: 0,
    });
  });

  it("should spring toward its goal on both axes", () => {
    const next = stepRing({ x: 0, y: 0, vx: 0, vy: 0 }, { x: 100, y: -50 }, 1 / 60);
    expect(next.x).toBeGreaterThan(0);
    expect(next.y).toBeLessThan(0);
    expect(next.vx).toBeGreaterThan(0);
    expect(next.vy).toBeLessThan(0);
  });
});

describe("liveStyle", () => {
  it("should clear every inline style once fully closed", () => {
    expect(liveStyle(0, { x: 40, y: 60 }, true)).toEqual({
      transform: "",
      borderRadius: "",
      boxShadow: "",
    });
  });

  it("should shrink the stage into its cell when fully open", () => {
    const style = liveStyle(1, { x: 40, y: 60 }, false);
    expect(style.transform).toBe(`translate(40px, 60px) scale(${CELL_SCALE})`);
    expect(style.borderRadius).toBe(`${12 / CELL_SCALE}px`);
    expect(style.boxShadow).toBe(`0 ${18 / CELL_SCALE}px ${48 / CELL_SCALE}px rgb(0 0 0 / 0.55)`);
  });

  it("should keep the full-size stage while still settling closed", () => {
    expect(liveStyle(0, { x: 40, y: 60 }, false)).toEqual({
      transform: "translate(0px, 0px) scale(1)",
      borderRadius: "0px",
      boxShadow: "0 18px 48px rgb(0 0 0 / 0)",
    });
  });
});
