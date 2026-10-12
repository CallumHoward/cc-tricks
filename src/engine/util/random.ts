/** Seeded PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mix(h: number) {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Stable hash of an integer lattice point to [0, 1). Non-integers are floored. */
export function hash1(n: number): number {
  return mix(Math.floor(n) ^ 0x9e3779b9) / 4294967296;
}

export function hash2(x: number, y: number): number {
  return mix(Math.imul(Math.floor(x), 0x27d4eb2d) ^ mix(Math.floor(y) + 0x165667b1)) / 4294967296;
}

const fade = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);

/** Smooth value noise in [-1, 1]; equals `2·hash1(n) − 1` on integers. */
export function noise1(x: number): number {
  const i = Math.floor(x);
  const a = hash1(i);
  const b = hash1(i + 1);
  return (a + (b - a) * fade(x - i)) * 2 - 1;
}

/** Smooth 2D value noise in [-1, 1]. */
export function noise2(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const u = fade(x - ix);
  const v = fade(y - iy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  const top = a + (b - a) * u;
  const bottom = c + (d - c) * u;
  return (top + (bottom - top) * v) * 2 - 1;
}

/** Fractal value noise in [-1, 1]. */
export function fbm1(x: number, octaves = 4, lacunarity = 2, gain = 0.5): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise1(x * f + o * 17.31);
    norm += amp;
    amp *= gain;
    f *= lacunarity;
  }
  return norm > 0 ? sum / norm : 0;
}
