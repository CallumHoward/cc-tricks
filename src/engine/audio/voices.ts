/**
 * Pure parameter curves for the continuous "ramp" voice, driven by playhead speed and its rate of
 * change.
 */

export type VoiceParams = {
  /** Filtered noise that swells while the playhead speeds up */
  whoosh: { gain: number; cutoff: number };
  /** Tonal layer whose pitch follows speed, so braking sounds like a tape stop */
  tape: { gain: number; rate: number };
  /** Wobbling tone while rewinding */
  warble: { gain: number; rate: number; lfo: number; depth: number };
};

const sat = (x: number) => Math.min(1, Math.max(0, x));

export const smoothstep = (a: number, b: number, x: number) => {
  const u = sat((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};

/** One-pole smoothed d|v|/dt; `timeConstant` in wall seconds. */
export function smoothAccel(
  prevAccel: number,
  prevV: number,
  v: number,
  dt: number,
  timeConstant = 0.06,
): number {
  if (dt <= 0) return prevAccel;
  const raw = (Math.abs(v) - Math.abs(prevV)) / dt;
  return prevAccel + (raw - prevAccel) * (1 - Math.exp(-dt / timeConstant));
}

/**
 * Voice levels for velocity `v` and speed acceleration `accel` (d|v|/dt). Silent while holding or
 * cruising.
 */
export function voiceParams(v: number, accel: number): VoiceParams {
  const speed = Math.abs(v);
  const moving = smoothstep(0.06, 0.35, speed);
  const speedUp = sat(accel / 2.5);
  const slowDown = sat(-accel / 1.2);
  const rewinding = v < 0;

  return {
    whoosh: {
      gain: moving * (0.5 * speedUp + 0.1 * sat((speed - 1) / 2)),
      cutoff: 250 + 2600 * sat(speed / 3) + 1800 * speedUp,
    },
    tape: {
      gain: 0.45 * slowDown * smoothstep(0.04, 0.3, speed),
      rate: Math.min(2, Math.max(0.05, speed)),
    },
    warble: {
      gain: rewinding ? 0.3 * smoothstep(0.1, 1.5, speed) : 0,
      rate: Math.min(3, Math.max(0.5, speed / 2.5)),
      lfo: 5 + 1.5 * Math.min(speed, 8),
      depth: 0.04 + 0.02 * Math.min(speed, 6),
    },
  };
}

/**
 * Deterministic variation in [0, 1) for a string id (FNV-1a), so repeated cues differ but replay
 * identically.
 */
export function variation(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x1_0000_0000;
}

/** Fills `out` with seeded white noise in [-1, 1) (xorshift32). */
export function fillNoise(out: Float32Array, seed = 1): Float32Array {
  let x = seed | 0 || 1;
  for (let i = 0; i < out.length; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    out[i] = (x >>> 8) / 0x80_0000 - 1;
  }
  return out;
}
