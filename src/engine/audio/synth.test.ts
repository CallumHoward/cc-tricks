import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createAudio } from "#/engine/audio/synth";
import type { Beat, CueName, Frame } from "#/engine/types";

class FakeParam {
  value = 0;
  readonly targets: number[] = [];
  setValueAtTime = vi.fn<(v: number) => FakeParam>((v: number) => {
    this.value = v;
    return this;
  });
  exponentialRampToValueAtTime = vi.fn<() => FakeParam>(() => this);
  linearRampToValueAtTime = vi.fn<() => FakeParam>(() => this);
  setTargetAtTime = vi.fn<(v: number) => FakeParam>((v: number) => {
    this.targets.push(v);
    return this;
  });
}

class FakeNode {
  readonly kind: string;
  readonly gain = new FakeParam();
  readonly frequency = new FakeParam();
  readonly Q = new FakeParam();
  readonly threshold = new FakeParam();
  readonly ratio = new FakeParam();
  type = "";
  buffer: unknown = null;
  loop = false;
  started = 0;
  constructor(kind: string) {
    this.kind = kind;
  }
  connect<T>(dest: T): T {
    return dest;
  }
  start = vi.fn<() => void>(() => {
    this.started++;
  });
  stop = vi.fn<() => void>();
}

class FakeContext {
  state: "suspended" | "running" | "closed" = "suspended";
  currentTime = 1;
  sampleRate = 8000;
  destination = new FakeNode("destination");
  readonly nodes: FakeNode[] = [];
  private make(kind: string) {
    const n = new FakeNode(kind);
    this.nodes.push(n);
    return n;
  }
  createGain = () => this.make("gain");
  createOscillator = () => this.make("osc");
  createBiquadFilter = () => this.make("filter");
  createBufferSource = () => this.make("source");
  createDynamicsCompressor = () => this.make("compressor");
  createBuffer = (_channels: number, length: number) => {
    const data = new Float32Array(length);
    return { duration: length / this.sampleRate, getChannelData: () => data };
  };
  resume = vi.fn<() => Promise<void>>(async () => {
    this.state = "running";
  });
  close = vi.fn<() => Promise<void>>(async () => {
    this.state = "closed";
  });
  count = (kind: string) => this.nodes.filter((n) => n.kind === kind).length;
}

const frame = (tau: number, v: number, dt = 1 / 60): Frame => ({ tau, v, w: tau, dt });
const beats: Beat[] = [{ id: "land", start: 1, end: 1.2, summary: "slam", cue: "slam" }];

function setup(options: Parameters<typeof createAudio>[0] = {}) {
  const ctx = new FakeContext();
  const audio = createAudio({
    beats,
    ...options,
    createContext: () => ctx as unknown as AudioContext,
  });
  return { ctx, audio };
}

describe("audio synth", () => {
  it("should stay silent until unlocked by a gesture", async () => {
    const { ctx, audio } = setup();
    audio.fire("pop");
    expect(ctx.nodes).toHaveLength(0);
    await audio.unlock();
    expect(ctx.resume).toHaveBeenCalledOnce();
    const before = ctx.nodes.length;
    audio.fire("pop");
    expect(ctx.nodes.length).toBeGreaterThan(before);
  });

  it("should unlock on the first key press only", async () => {
    const { ctx, audio } = setup();
    const unbind = audio.bindUnlock();
    await userEvent.keyboard("m");
    await userEvent.keyboard("n");
    await vi.waitFor(() => expect(ctx.state).toBe("running"));
    expect(ctx.resume).toHaveBeenCalledOnce();
    unbind();
  });

  it("should stop listening for gestures when the unlock binding is removed", async () => {
    const { ctx, audio } = setup();
    audio.bindUnlock()();
    await userEvent.keyboard("m");
    expect(ctx.resume).not.toHaveBeenCalled();
  });

  it("should do nothing when WebAudio is unavailable", async () => {
    vi.stubGlobal("AudioContext", undefined);
    const audio = createAudio();
    await expect(audio.unlock()).resolves.toBeUndefined();
    expect(() => audio.fire("chime")).not.toThrow();
    vi.unstubAllGlobals();
  });

  it("should build nodes for every cue", async () => {
    const { ctx, audio } = setup();
    await audio.unlock();
    const cues: CueName[] = [
      "whoosh",
      "slam",
      "tick",
      "type",
      "pop",
      "shutter",
      "riser",
      "thud",
      "chime",
    ];
    for (const cue of cues) {
      const before = ctx.nodes.length;
      audio.fire(cue, { direction: cue === "pop" ? -1 : 1, seed: cue });
      expect(ctx.nodes.length).toBeGreaterThan(before);
    }
    expect(() => audio.fire("riser", { direction: -1 })).not.toThrow();
    expect(() => audio.fire("whoosh", { direction: -1 })).not.toThrow();
  });

  it("should not fire cues while muted and ramp the master gain to zero", async () => {
    const { ctx, audio } = setup();
    await audio.unlock();
    const listener = vi.fn<() => void>();
    audio.subscribe(listener);
    expect(audio.toggleMute()).toBe(true);
    expect(audio.isMuted()).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
    const master = ctx.nodes.find((n) => n.kind === "gain");
    expect(master?.gain.targets.at(-1)).toBe(0);
    const before = ctx.nodes.length;
    audio.fire("slam");
    expect(ctx.nodes).toHaveLength(before);
    audio.setMuted(true);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("should start muted when asked and clamp the master gain", async () => {
    const { ctx, audio } = setup({ muted: true, masterGain: 0.5 });
    await audio.unlock();
    const master = ctx.nodes.find((n) => n.kind === "gain");
    expect(master?.gain.value).toBe(0);
    audio.setMuted(false);
    audio.setMasterGain(4);
    expect(master?.gain.targets.at(-1)).toBe(1);
  });

  it("should play a beat cue when the playhead crosses it", async () => {
    const { ctx, audio } = setup();
    await audio.unlock();
    audio.frame(frame(0.98, 1));
    const before = ctx.count("osc");
    audio.frame(frame(1.0, 1));
    expect(ctx.count("osc")).toBeGreaterThan(before);
  });

  it("should keep the ramp voice silent while holding", async () => {
    const { ctx, audio } = setup();
    await audio.unlock();
    for (let i = 0; i < 30; i++) audio.frame(frame(2 + i * 0.0006, 0.035));
    const voiceGains = ctx.nodes.filter((n) => n.kind === "gain").slice(1, 4);
    for (const g of voiceGains) expect(g.gain.targets.at(-1)).toBeCloseTo(0, 3);
  });

  it("should ignore frozen frames", async () => {
    const { ctx, audio } = setup();
    await audio.unlock();
    audio.frame(frame(0.9, 1));
    const before = ctx.nodes.length;
    audio.frame(frame(1.1, 0, 0));
    expect(ctx.nodes).toHaveLength(before);
  });

  it("should still fire a crossed beat after a zero-length realtime tick", async () => {
    const { ctx, audio } = setup();
    await audio.unlock();
    audio.frame(frame(0.98, 1));
    audio.frame(frame(0.99, 1, 0));
    const before = ctx.count("osc");
    audio.frame(frame(1.0, 1));
    expect(ctx.count("osc")).toBeGreaterThan(before);
  });

  it("should close the context and drop listeners on dispose", async () => {
    const { ctx, audio } = setup();
    await audio.unlock();
    const listener = vi.fn<() => void>();
    audio.subscribe(listener);
    audio.dispose();
    audio.setMuted(true);
    expect(ctx.close).toHaveBeenCalledOnce();
    expect(listener).not.toHaveBeenCalled();
  });
});
