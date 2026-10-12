import type { Frame } from "#/engine/types";
import { hash1, mulberry32 } from "#/engine/util/random";

import { rewindAmount } from "./post-params";

export type OverlayOptions = {
  /** Grain refresh rate in wall frames per second (film-like, independent of the display) */
  fps: number;
  /** Grain tile edge in px */
  tile: number;
  /** Grain layer opacity at rest */
  grain: number;
  /** Extra grain opacity at full rewind */
  rewindGrain: number;
};

export const DEFAULT_OVERLAY: Readonly<OverlayOptions> = Object.freeze({
  fps: 24,
  tile: 256,
  grain: 0.22,
  rewindGrain: 0.16,
});

export type OverlayState = {
  x: number;
  y: number;
  grain: number;
  /** 0..1 rewind look intensity */
  rewind: number;
  /** Tracking-band offset in logical px, scrolling with wall time */
  band: number;
};

/** Grain is keyed to wall time so it keeps moving during slo-mo holds; stills pass a fixed `w`. */
export function overlayState(frame: Frame, opts: OverlayOptions = DEFAULT_OVERLAY): OverlayState {
  const n = Math.floor(frame.w * opts.fps);
  const rewind = rewindAmount(frame.v);
  return {
    x: Math.floor(hash1(n) * opts.tile),
    y: Math.floor(hash1(n + 7919) * opts.tile),
    grain: opts.grain + opts.rewindGrain * rewind,
    rewind,
    band: (frame.w * 420) % 1080,
  };
}

/** RGBA pixels of a seeded grey noise tile, two octaves like film grain. */
export function grainPixels(size: number, seed = 1): Uint8ClampedArray<ArrayBuffer> {
  const rand = mulberry32(seed);
  const coarse = new Float32Array(Math.ceil(size / 2) ** 2);
  for (let i = 0; i < coarse.length; i++) coarse[i] = rand() - 0.5;
  const px = new Uint8ClampedArray(size * size * 4);
  const half = Math.ceil(size / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fine = rand() - 0.5;
      const c = coarse[(y >> 1) * half + (x >> 1)] ?? 0;
      const v = 128 + (fine * 0.6 + c * 0.4) * 255;
      const i = (y * size + x) * 4;
      px[i] = v;
      px[i + 1] = v;
      px[i + 2] = v;
      px[i + 3] = 255;
    }
  }
  return px;
}
