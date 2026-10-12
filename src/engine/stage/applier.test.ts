import { describe, expect, it, vi } from "vitest";

import { applyStyle, composeClip, composeTransform, styleStrings } from "./applier";

describe("applyStyle", () => {
  it("should compose translate, scale and rotate into one transform", () => {
    expect(composeTransform({ x: 10, y: -5.25, scale: 2, scaleY: 0.5, rotate: 45 })).toBe(
      "translate3d(10px, -5.25px, 0) scale(2, 1) rotate(45deg)",
    );
  });

  it("should leave transform alone when no transform channel is present", () => {
    expect(composeTransform({ opacity: 1 })).toBeUndefined();
  });

  it("should express clip channels as an inset in percent", () => {
    expect(composeClip({ clipRight: 40 })).toBe("inset(0% 40% 0% 0%)");
  });

  it("should clamp opacity and blur and pass custom properties through", () => {
    expect(styleStrings({ opacity: 1.2, blur: -3, "--wght": 612.4 })).toEqual({
      opacity: "1",
      filter: "blur(0px)",
      "--wght": "612.4",
    });
  });

  it("should write styles to the element", () => {
    const el = document.createElement("div");

    applyStyle(el, { x: 4, opacity: 0.5, clipTop: 10, "--axis": 3 });

    expect(el.style.transform).toBe("translate3d(4px, 0px, 0) scale(1, 1) rotate(0deg)");
    expect(el.style.opacity).toBe("0.5");
    expect(el.style.getPropertyValue("--axis")).toBe("3");
  });

  it("should skip writes whose value has not changed", () => {
    const el = document.createElement("div");
    const spy = vi.spyOn(el.style, "setProperty");
    const cache = applyStyle(el, { x: 1, opacity: 1 });

    applyStyle(el, { x: 1, opacity: 0.5 }, cache);

    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenLastCalledWith("opacity", "0.5");
  });

  it("should set path data on SVG elements only when it changes", () => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const spy = vi.spyOn(path, "setAttribute");
    const cache = applyStyle(path, { d: "M0 0L1 1" });

    applyStyle(path, { d: "M0 0L1 1" }, cache);

    expect(path.getAttribute("d")).toBe("M0 0L1 1");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
