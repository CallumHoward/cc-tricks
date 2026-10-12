import type { Beat, CueName } from "#/engine/types";

/** Structural view of a planner segment; only holds matter for cue gating. */
export type CuePlanSegment = { kind: string; tau0: number; end?: number };

export type CueFire = {
  cue: CueName;
  beatId: string;
  /** 1 when crossed playing forwards, -1 when crossed while rewinding */
  direction: 1 | -1;
  gain: number;
};

export type CueOptions = {
  /** Above this |v| (story s per wall s) discrete cues are skipped; the ramp voice carries the sound */
  maxSpeed: number;
  /** A single-frame |Δτ| beyond this is a seek, which fires nothing */
  seekSpan: number;
  /** Keep at most this many cues per frame (the latest in travel order) */
  maxPerFrame: number;
  /** Gain for cues crossed while rewinding */
  reverseGain: number;
  /** Story seconds τ must move away from a beat before it can fire again */
  hysteresis: number;
};

const DEFAULT_CUE_OPTIONS: CueOptions = {
  maxSpeed: 3.5,
  seekSpan: 1.5,
  maxPerFrame: 2,
  reverseGain: 0.45,
  hysteresis: 0.05,
};

type CuedBeat = Beat & { cue: CueName };

const isHoldInterior = (start: number, plan: readonly CuePlanSegment[]) =>
  plan.some((s) => s.kind === "hold" && s.end !== undefined && start > s.tau0 && start <= s.end);

/**
 * Beats whose `start` lies between two consecutive frames, in travel order. Forward crossings use
 * (prevTau, tau], backward ones [tau, prevTau), so a beat never fires twice in one direction.
 */
export function crossings(
  prevTau: number | undefined,
  tau: number,
  beats: readonly Beat[],
  plan: readonly CuePlanSegment[] = [],
): CuedBeat[] {
  if (prevTau === undefined || prevTau === tau) return [];
  const forward = tau > prevTau;
  const hit = beats.filter(
    (b): b is CuedBeat =>
      b.cue !== undefined &&
      (forward ? b.start > prevTau && b.start <= tau : b.start >= tau && b.start < prevTau) &&
      !isHoldInterior(b.start, plan),
  );
  return hit.sort((a, b) => (forward ? a.start - b.start : b.start - a.start));
}

/** Stateless cue selection for one frame: crossings gated by speed, seeks and per-frame budget. */
export function selectCues(
  prevTau: number | undefined,
  tau: number,
  v: number,
  beats: readonly Beat[],
  plan: readonly CuePlanSegment[] = [],
  options: CueOptions = DEFAULT_CUE_OPTIONS,
): CueFire[] {
  if (prevTau === undefined) return [];
  if (Math.abs(tau - prevTau) > options.seekSpan || Math.abs(v) > options.maxSpeed) return [];
  const direction = tau > prevTau ? 1 : -1;
  const gain = direction === 1 ? 1 : options.reverseGain;
  return crossings(prevTau, tau, beats, plan)
    .slice(-options.maxPerFrame)
    .map((b) => ({ cue: b.cue, beatId: b.id, direction, gain }));
}

export type CueTracker = {
  /** Feed every frame; returns the cues to play now */
  step(tau: number, v: number, plan?: readonly CuePlanSegment[]): CueFire[];
  /** Forget the previous frame (after a seek or a still) */
  reset(): void;
};

/** Frame-to-frame cue selection that suppresses re-fires while τ jitters around a beat. */
export function createCueTracker(
  beats: readonly Beat[],
  options: Partial<CueOptions> = {},
): CueTracker {
  const opts = { ...DEFAULT_CUE_OPTIONS, ...options };
  const byId = new Map(beats.map((b) => [b.id, b]));
  let prevTau: number | undefined;
  // Beats that fired recently; they re-arm once τ is `hysteresis` away from their start.
  const latched = new Set<string>();

  return {
    step(tau, v, plan = []) {
      for (const id of latched) {
        const beat = byId.get(id);
        if (!beat || Math.abs(tau - beat.start) > opts.hysteresis) latched.delete(id);
      }
      const fired = selectCues(prevTau, tau, v, beats, plan, opts).filter(
        (c) => !latched.has(c.beatId),
      );
      for (const c of fired) latched.add(c.beatId);
      prevTau = tau;
      return fired;
    },
    reset() {
      prevTau = undefined;
      latched.clear();
    },
  };
}
