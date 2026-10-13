const fract = (x: number) => x - Math.floor(x);

/** Fixed per-index noise for the backdrop sprites, so stills match. */
export const spriteHash = (n: number) => fract(Math.sin(n * 91.7 + 13.1) * 43_758.545_3);

export type FieldParticle = {
  x: number;
  y: number;
  /** Shader seed: phase, size, twinkle, bokeh flag. */
  seed: readonly [number, number, number, number];
  brightness: number;
  warm: boolean;
};

const dustSpot = (i: number) => ({
  x: (spriteHash(i * 3 + 1) - 0.5) * 34,
  y: 0.3 + spriteHash(i * 3 + 2) * 8.5,
});

const bokehSpot = (i: number) => ({
  x: (spriteHash(i * 3 + 1) - 0.5) * 6,
  y: (spriteHash(i * 3 + 2) - 0.5) * 3.4,
});

/**
 * Sprite `i` of the depth field: the first `dust` span the travel corridor, the rest are bokeh
 * hugging the lens for parallax.
 */
export function fieldParticle(i: number, dust: number): FieldParticle {
  const bokeh = i >= dust;
  const { x, y } = bokeh ? bokehSpot(i) : dustSpot(i);
  const size = 0.006 + spriteHash(i * 7 + 5) ** 4 * 0.026;
  return {
    x,
    y,
    seed: [spriteHash(i * 5 + 3), size, spriteHash(i * 11 + 7), bokeh ? 1 : 0],
    brightness: bokeh ? 0.9 : 0.2 + spriteHash(i * 13 + 2) ** 2 * 0.8,
    warm: spriteHash(i * 17 + 4) < 0.18,
  };
}
