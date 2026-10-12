import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type { MascotHandle } from "./apply";
import { applyDrawing } from "./apply";
import { drawMascot } from "./draw";
import { stepMascot } from "./driver";
import { Mascot } from "./mascot";
import type { Pose } from "./pose";
import { restPose } from "./pose";

const frame = (tau: number, w: number, v = 1) => ({ tau, w, v, dt: 1 / 60 });

describe("Mascot", () => {
  it("should redraw the rig in place when rendered through its handle", () => {
    const ref = createRef<MascotHandle>();
    render(<Mascot ref={ref} title="mascot" />);
    const svg = screen.getByRole("img", { name: "mascot" });
    const before = svg.innerHTML;
    ref.current?.render({ ...restPose(), sq: 0.75 });
    expect(svg.innerHTML).not.toBe(before);
  });

  it("should only write attributes that changed", () => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const spy = vi.spyOn(el, "setAttribute");
    const nodes = new Map([["body" as const, el]]);
    const a = drawMascot(restPose(), 0);
    applyDrawing(nodes, a, null);
    const firstCalls = spy.mock.calls.length;
    applyDrawing(nodes, drawMascot(restPose(), 0), a);
    expect(firstCalls).toBeGreaterThan(0);
    expect(spy.mock.calls).toHaveLength(firstCalls);
  });

  it("should render on twos and skip frames inside the same drawing", () => {
    const draw = vi.fn<(pose: Pose, drawing?: number) => void>();
    const handle = { render: draw };
    let key: number | null = null;
    for (const t of [0, 1 / 60, 1 / 12 + 0.001]) key = stepMascot(key, frame(t, t), [], handle);
    expect(draw).toHaveBeenCalledTimes(2);
  });

  it("should keep drawing in slo-mo by stepping on wall time", () => {
    const draw = vi.fn<(pose: Pose, drawing?: number) => void>();
    const handle = { render: draw };
    let key: number | null = null;
    for (const [tau, w] of [
      [3, 10],
      [3.0001, 10.01],
      [3.003, 10.09],
    ]) {
      key = stepMascot(key, frame(tau, w, 0.04), [], handle);
    }
    expect(draw).toHaveBeenCalledTimes(2);
  });

  it("should wait for the handle before consuming a drawing", () => {
    expect(stepMascot(null, frame(1, 1), [], null)).toBeNull();
  });
});
