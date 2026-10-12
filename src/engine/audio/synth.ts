import { createCueTracker, type CuePlanSegment, type CueOptions } from "#/engine/audio/cues";
import { fillNoise, smoothAccel, variation, voiceParams } from "#/engine/audio/voices";
import type { Beat, CueName, Frame, FrameCallback } from "#/engine/types";

export type FireOptions = { gain?: number; direction?: 1 | -1; seed?: string };

export type AudioEngine = {
  /** Register on the stage at priority 50 */
  readonly frame: FrameCallback;
  fire(cue: CueName, options?: FireOptions): void;
  /** Creates/resumes the AudioContext; call from a user gesture */
  unlock(): Promise<void>;
  /** Unlocks on the first pointer or key event on `target` */
  bindUnlock(target?: EventTarget): () => void;
  isMuted(): boolean;
  setMuted(muted: boolean): void;
  toggleMute(): boolean;
  setMasterGain(gain: number): void;
  /** Notifies on mute changes (for useSyncExternalStore) */
  subscribe(listener: () => void): () => void;
  dispose(): void;
};

export type AudioOptions = {
  beats?: readonly Beat[];
  /** Current planner segments, used to keep holds silent */
  plan?: () => readonly CuePlanSegment[];
  cueOptions?: Partial<CueOptions>;
  masterGain?: number;
  muted?: boolean;
  createContext?: () => AudioContext;
};

type Voices = {
  whooshGain: GainNode;
  whooshFilter: BiquadFilterNode;
  tapeGain: GainNode;
  tapeOscs: OscillatorNode[];
  warbleGain: GainNode;
  warbleOsc: OscillatorNode;
  warbleLfo: OscillatorNode;
  warbleDepth: GainNode;
};

const SMOOTH = 0.03;
const TAPE_BASE = [110, 165];
const WARBLE_BASE = 220;

const defaultContext = () => new AudioContext({ latencyHint: "interactive" });

export function createAudio(options: AudioOptions = {}): AudioEngine {
  const tracker = createCueTracker(options.beats ?? [], options.cueOptions);
  const listeners = new Set<() => void>();
  let muted = options.muted ?? false;
  let level = options.masterGain ?? 0.8;
  let ctx: AudioContext | undefined;
  let master: GainNode | undefined;
  let noise: AudioBuffer | undefined;
  let voices: Voices | undefined;
  let prevV = 0;
  let accel = 0;

  const masterLevel = () => (muted ? 0 : level);

  function build(context: AudioContext) {
    const out = context.createGain();
    out.gain.value = masterLevel();
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.ratio.value = 8;
    out.connect(limiter).connect(context.destination);
    master = out;

    noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    fillNoise(noise.getChannelData(0), 0x5eed);

    const bed = context.createBufferSource();
    bed.buffer = noise;
    bed.loop = true;
    const whooshFilter = context.createBiquadFilter();
    whooshFilter.type = "bandpass";
    whooshFilter.Q.value = 0.9;
    const whooshGain = silentGain(context);
    bed.connect(whooshFilter).connect(whooshGain).connect(out);
    bed.start();

    const tapeGain = silentGain(context);
    const tapeTone = context.createBiquadFilter();
    tapeTone.type = "lowpass";
    tapeTone.frequency.value = 900;
    tapeTone.connect(tapeGain).connect(out);
    const tapeOscs = TAPE_BASE.map((hz, i) => {
      const osc = context.createOscillator();
      osc.type = i === 0 ? "triangle" : "sine";
      osc.frequency.value = hz;
      osc.connect(tapeTone);
      osc.start();
      return osc;
    });

    const warbleGain = silentGain(context);
    const warbleTone = context.createBiquadFilter();
    warbleTone.type = "lowpass";
    warbleTone.frequency.value = 1400;
    const warbleOsc = context.createOscillator();
    warbleOsc.type = "sawtooth";
    warbleOsc.frequency.value = WARBLE_BASE;
    const warbleLfo = context.createOscillator();
    warbleLfo.frequency.value = 6;
    const warbleDepth = context.createGain();
    warbleDepth.gain.value = 0;
    warbleLfo.connect(warbleDepth).connect(warbleOsc.frequency);
    warbleOsc.connect(warbleTone).connect(warbleGain).connect(out);
    warbleOsc.start();
    warbleLfo.start();

    voices = {
      whooshGain,
      whooshFilter,
      tapeGain,
      tapeOscs,
      warbleGain,
      warbleOsc,
      warbleLfo,
      warbleDepth,
    };
  }

  function updateVoices(context: AudioContext, v: Voices, frame: Frame) {
    accel = smoothAccel(accel, prevV, frame.v, frame.dt);
    prevV = frame.v;
    const p = voiceParams(frame.v, accel);
    const now = context.currentTime;
    v.whooshGain.gain.setTargetAtTime(p.whoosh.gain, now, SMOOTH);
    v.whooshFilter.frequency.setTargetAtTime(p.whoosh.cutoff, now, SMOOTH);
    v.tapeGain.gain.setTargetAtTime(p.tape.gain, now, SMOOTH);
    v.tapeOscs.forEach((osc, i) =>
      osc.frequency.setTargetAtTime(TAPE_BASE[i] * p.tape.rate, now, SMOOTH),
    );
    v.warbleGain.gain.setTargetAtTime(p.warble.gain, now, SMOOTH);
    v.warbleOsc.frequency.setTargetAtTime(WARBLE_BASE * p.warble.rate, now, SMOOTH);
    v.warbleLfo.frequency.setTargetAtTime(p.warble.lfo, now, SMOOTH);
    v.warbleDepth.gain.setTargetAtTime(WARBLE_BASE * p.warble.rate * p.warble.depth, now, SMOOTH);
  }

  function fire(cue: CueName, fireOptions: FireOptions = {}) {
    if (!ctx || !master || !noise || muted || ctx.state !== "running") return;
    const gain = fireOptions.gain ?? 1;
    const jitter = variation(fireOptions.seed ?? cue);
    playCue({ ctx, out: master, noise }, cue, gain, fireOptions.direction ?? 1, jitter);
  }

  const notify = () => {
    for (const l of listeners) l();
  };

  async function unlock() {
    if (!ctx) {
      const create =
        options.createContext ?? (typeof AudioContext === "undefined" ? undefined : defaultContext);
      if (!create) return;
      ctx = create();
      build(ctx);
    }
    if (ctx.state !== "running") await ctx.resume();
  }

  function setMuted(next: boolean) {
    if (next === muted) return;
    muted = next;
    if (ctx && master) master.gain.setTargetAtTime(masterLevel(), ctx.currentTime, 0.02);
    notify();
  }

  return {
    frame(frame) {
      // Frozen frames (stills) have no motion to sonify.
      if (frame.dt <= 0 && frame.v === 0) {
        tracker.reset();
        return;
      }
      const fired = tracker.step(frame.tau, frame.v, options.plan?.() ?? []);
      if (!ctx || !voices || ctx.state !== "running") return;
      updateVoices(ctx, voices, frame);
      for (const c of fired) fire(c.cue, { gain: c.gain, direction: c.direction, seed: c.beatId });
    },
    fire,
    unlock,
    bindUnlock(target: EventTarget = globalThis) {
      const events = ["pointerdown", "keydown", "touchstart"] as const;
      const cleanup = () => {
        for (const e of events) target.removeEventListener(e, handler, true);
      };
      const handler = () => {
        cleanup();
        void unlock();
      };
      for (const e of events) target.addEventListener(e, handler, true);
      return cleanup;
    },
    isMuted: () => muted,
    setMuted,
    toggleMute() {
      setMuted(!muted);
      return muted;
    },
    setMasterGain(gain) {
      level = Math.min(1, Math.max(0, gain));
      if (ctx && master) master.gain.setTargetAtTime(masterLevel(), ctx.currentTime, 0.02);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      listeners.clear();
      const closing = ctx;
      ctx = undefined;
      master = undefined;
      voices = undefined;
      if (closing) void closing.close();
    },
  };
}

function silentGain(ctx: BaseAudioContext) {
  const g = ctx.createGain();
  g.gain.value = 0;
  return g;
}

type Rig = { ctx: AudioContext; out: AudioNode; noise: AudioBuffer };

/** Exponential-decay envelope on a fresh gain node, starting at `t`. */
function envelope(rig: Rig, t: number, peak: number, attack: number, decay: number) {
  const g = rig.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(rig.out);
  return g;
}

function tone(
  rig: Rig,
  t: number,
  type: OscillatorType,
  from: number,
  to: number,
  sweep: number,
  dest: AudioNode,
  len: number,
) {
  const osc = rig.ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + sweep);
  osc.connect(dest);
  osc.start(t);
  osc.stop(t + len);
}

function burst(
  rig: Rig,
  t: number,
  filter: BiquadFilterType,
  hz: number,
  q: number,
  dest: AudioNode,
  len: number,
  offset: number,
) {
  const src = rig.ctx.createBufferSource();
  src.buffer = rig.noise;
  const f = rig.ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = hz;
  f.Q.value = q;
  src.connect(f).connect(dest);
  src.start(t, offset * (rig.noise.duration - len - 0.01));
  src.stop(t + len);
  return f;
}

function playCue(rig: Rig, cue: CueName, gain: number, direction: 1 | -1, jitter: number) {
  const t = rig.ctx.currentTime + 0.005;
  const up = direction === 1;
  switch (cue) {
    case "slam": {
      tone(rig, t, "sine", 130, 42, 0.22, envelope(rig, t, 0.9 * gain, 0.004, 0.4), 0.45);
      burst(rig, t, "highpass", 2200, 0.7, envelope(rig, t, 0.5 * gain, 0.001, 0.03), 0.05, jitter);
      return;
    }
    case "thud": {
      tone(rig, t, "sine", 95, 48, 0.16, envelope(rig, t, 0.6 * gain, 0.004, 0.25), 0.3);
      return;
    }
    case "tick": {
      burst(
        rig,
        t,
        "bandpass",
        3200 + 800 * jitter,
        6,
        envelope(rig, t, 0.35 * gain, 0.001, 0.02),
        0.03,
        jitter,
      );
      return;
    }
    case "type": {
      const hz = 1600 + 1400 * jitter;
      burst(rig, t, "bandpass", hz, 4, envelope(rig, t, 0.22 * gain, 0.001, 0.035), 0.045, jitter);
      tone(
        rig,
        t,
        "square",
        hz / 4,
        hz / 5,
        0.02,
        envelope(rig, t, 0.03 * gain, 0.001, 0.02),
        0.03,
      );
      return;
    }
    case "pop": {
      const [a, b] = up ? [380, 980] : [980, 380];
      tone(
        rig,
        t,
        "sine",
        a + 80 * jitter,
        b,
        0.06,
        envelope(rig, t, 0.45 * gain, 0.002, 0.09),
        0.12,
      );
      return;
    }
    case "shutter": {
      for (const dt of [0, 0.045]) {
        burst(
          rig,
          t + dt,
          "bandpass",
          2600,
          2,
          envelope(rig, t + dt, 0.3 * gain, 0.001, 0.03),
          0.04,
          jitter,
        );
      }
      return;
    }
    case "riser": {
      const env = rig.ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.35 * gain, t + 0.75);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
      env.connect(rig.out);
      const f = burst(rig, t, "bandpass", 300, 3, env, 0.9, jitter);
      f.frequency.setValueAtTime(up ? 300 : 4000, t);
      f.frequency.exponentialRampToValueAtTime(up ? 4000 : 300, t + 0.8);
      return;
    }
    case "whoosh": {
      const env = rig.ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.4 * gain, t + 0.18);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      env.connect(rig.out);
      const f = burst(rig, t, "bandpass", 500, 1.2, env, 0.55, jitter);
      f.frequency.setValueAtTime(up ? 500 : 2600, t);
      f.frequency.exponentialRampToValueAtTime(up ? 2600 : 500, t + 0.45);
      return;
    }
    case "chime": {
      const env = envelope(rig, t, 0.28 * gain, 0.005, 1.4);
      for (const [hz, type] of [
        [880, "sine"],
        [1320.9, "sine"],
        [2641, "triangle"],
      ] as const) {
        tone(rig, t, type, hz, hz, 0.01, env, 1.5);
      }
      return;
    }
    default: {
      const exhaustive: never = cue;
      return exhaustive;
    }
  }
}
