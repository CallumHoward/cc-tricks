import { describe, expect, it, vi } from "vitest";

import type { Frame } from "#/engine/types";

import { createShadersHost, type ShaderDefinition, type ShadersHostOptions } from "./shaders-host";

type Call = [string, ...unknown[]];

function fakeCore({ supported = true, failure = null as string | null } = {}) {
  const calls: Call[] = [];
  let elapsed = 0;
  let running = false;
  let onReady: (() => void) | null = null;
  const renderer = {
    setOnUnavailable: () => {},
    setOnReady: (cb: () => void) => void (onReady = cb),
    registerNode: (
      id: string,
      _f: unknown,
      parent: string | null,
      _m: unknown,
      uniforms: unknown,
    ) => void calls.push(["register", id, parent, uniforms]),
    initialize: async () => void calls.push(["initialize"]),
    startAnimation: () => void (running = true),
    stopAnimation: () => void (running = false),
    setFrameRateCap: (fps: number) => void calls.push(["cap", fps]),
    getFailureReason: () => failure,
    cleanup: () => void calls.push(["cleanup"]),
    resize: (w: number, h: number) => void calls.push(["resize", w, h, running]),
    updateUniformValue: (id: string, prop: string, value: unknown) =>
      void calls.push(["uniform", id, prop, value, running]),
    renderSyntheticFrame: vi.fn<(delta: number, o?: { waitForGpu?: boolean }) => Promise<void>>(
      async (delta) => {
        elapsed += delta;
      },
    ),
    __testing: { getFrameDiagnostics: () => ({ globalElapsedTime: elapsed }) },
  };
  const core = {
    isWebGPUSupported: () => supported,
    shaderRendererGPU: () => renderer,
    rootPassthrough: { fragment: "root" },
    createGpuUniformsMap: (_d: unknown, values: Record<string, unknown>) => values,
  };
  return {
    calls,
    renderer,
    ready: () => onReady?.(),
    skew: (s: number) => void (elapsed += s),
    loadCore: (async () => core) as unknown as NonNullable<ShadersHostOptions["loadCore"]>,
  };
}

const def = {
  props: { progress: { default: 0.5 }, speed: { default: 1 } },
  fragment: "f",
} as unknown as ShaderDefinition;
const frame = (tau: number, w = 0): Frame => ({ tau, v: 1, w, dt: 1 / 60 });
const canvas = {} as HTMLCanvasElement;

async function host(fake = fakeCore(), clock: "tau" | "wall" = "tau") {
  const res = await createShadersHost({
    canvas,
    nodes: [{ id: "wipe-1", definition: def, props: { speed: 2 } }],
    clock,
    loadCore: fake.loadCore,
  });
  if (!res.ok) throw new Error(res.reason);
  return res.host;
}

describe("createShadersHost", () => {
  it("should report unsupported browsers without creating a renderer", async () => {
    const fake = fakeCore({ supported: false });
    await expect(
      createShadersHost({ canvas, nodes: [], loadCore: fake.loadCore }),
    ).resolves.toEqual({ ok: false, reason: "unsupported" });
    expect(fake.calls).toEqual([]);
  });

  it("should clean up and report a renderer that cannot draw", async () => {
    const fake = fakeCore({ failure: "no-adapter" });
    await expect(
      createShadersHost({ canvas, nodes: [], loadCore: fake.loadCore }),
    ).resolves.toEqual({ ok: false, reason: "no-adapter" });
    expect(fake.calls.at(-1)).toEqual(["cleanup"]);
  });

  it("should register sanitized nodes with merged defaults before initializing and cap the self-driven loop", async () => {
    const fake = fakeCore();
    await host(fake);
    expect(fake.calls.map((c) => c[0])).toEqual(["register", "register", "initialize", "cap"]);
    expect(fake.calls[1]).toEqual(["register", "wipe_1", "root", { progress: 0.5, speed: 2 }]);
    expect(fake.calls[3]).toEqual(["cap", 10]);
  });

  it("should advance the library clock to τ regardless of drift from stray frames", async () => {
    const fake = fakeCore();
    const h = await host(fake);
    await h.render(frame(2));
    fake.skew(0.016);
    await h.render(frame(1.5));
    expect(fake.renderer.renderSyntheticFrame.mock.calls.map((c) => c[0])).toEqual([2, -0.516]);
    expect(fake.renderer.__testing.getFrameDiagnostics().globalElapsedTime).toBeCloseTo(1.5, 12);
  });

  it("should follow wall time for ambient beds", async () => {
    const fake = fakeCore();
    const h = await host(fake, "wall");
    await h.render(frame(40, 3));
    expect(fake.renderer.renderSyntheticFrame).toHaveBeenCalledWith(3, { waitForGpu: false });
  });

  it("should write changed uniforms only while the library loop is suppressed", async () => {
    const fake = fakeCore();
    const h = await host(fake);
    await h.render(frame(1), { "wipe-1": { progress: 0.2 } }, { waitForGpu: true });
    await h.render(frame(1), { "wipe-1": { progress: 0.2 } });
    await h.render(frame(1), { "wipe-1": { progress: 0.3 } });
    expect(fake.calls.filter((c) => c[0] === "uniform")).toEqual([
      ["uniform", "wipe_1", "progress", 0.2, true],
      ["uniform", "wipe_1", "progress", 0.3, true],
    ]);
    expect(fake.renderer.renderSyntheticFrame).toHaveBeenNthCalledWith(1, 1, { waitForGpu: true });
  });

  it("should skip a non-finite frame instead of poisoning the clock", async () => {
    const fake = fakeCore();
    const h = await host(fake);
    await h.render(frame(Number.NaN));
    expect(fake.renderer.renderSyntheticFrame).not.toHaveBeenCalled();
  });

  it("should resolve ready when the composition first draws and resize without a stray frame", async () => {
    const fake = fakeCore();
    const h = await host(fake);
    fake.ready();
    await expect(h.ready).resolves.toBeUndefined();
    h.resize(640, 360);
    expect(fake.calls.at(-1)).toEqual(["resize", 640, 360, true]);
    h.dispose();
    expect(fake.calls.at(-1)).toEqual(["cleanup"]);
  });
});
