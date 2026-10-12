import { describe, expect, it, vi } from "vitest";

import type { Frame } from "#/engine/types";

import { createLayerRegistry, type LayerTarget } from "./layer-registry";

const frame: Frame = { tau: 1, v: 1, w: 2, dt: 1 / 60 };

function target() {
  const attached = new Set<string>();
  const t: LayerTarget<string> = {
    attach: (o) => void attached.add(o),
    detach: (o) => void attached.delete(o),
  };
  return { t, attached };
}

describe("createLayerRegistry", () => {
  it("should attach objects added before and after binding", () => {
    const reg = createLayerRegistry<string>();
    const { t, attached } = target();
    reg.add({ object: "a" });
    reg.bind(t);
    reg.add({ object: "b" });
    expect([...attached].sort()).toEqual(["a", "b"]);
  });

  it("should detach everything when unbound", () => {
    const reg = createLayerRegistry<string>();
    const { t, attached } = target();
    reg.bind(t);
    reg.add({ object: "a" });
    reg.bind(null);
    expect(attached.size).toBe(0);
  });

  it("should detach and dispose a removed layer once", () => {
    const reg = createLayerRegistry<string>();
    const { t, attached } = target();
    const dispose = vi.fn<() => void>();
    reg.bind(t);
    const remove = reg.add({ object: "a", dispose });
    remove();
    remove();
    expect(attached.size).toBe(0);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(reg.size).toBe(0);
  });

  it("should update layers by order then insertion and collect post overrides", () => {
    const reg = createLayerRegistry<string>();
    const calls: string[] = [];
    reg.add({ order: 1, update: () => void calls.push("late") });
    reg.add({ update: () => void calls.push("first"), post: () => ({ zoom: 1.1 }) });
    reg.add({ update: () => void calls.push("second"), post: () => undefined });
    expect(reg.update(frame)).toEqual([{ zoom: 1.1 }]);
    expect(calls).toEqual(["first", "second", "late"]);
  });

  it("should pass the frame to each update", () => {
    const reg = createLayerRegistry<string>();
    const update = vi.fn<(f: Frame) => void>();
    reg.add({ update });
    reg.update(frame);
    expect(update).toHaveBeenCalledWith(frame);
  });

  it("should dispose every layer on clear", () => {
    const reg = createLayerRegistry<string>();
    const dispose = vi.fn<() => void>();
    reg.add({ dispose });
    reg.add({ dispose });
    reg.clear();
    expect(dispose).toHaveBeenCalledTimes(2);
    expect(reg.size).toBe(0);
  });
});
