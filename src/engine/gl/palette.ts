export type Rgb = readonly [number, number, number];

/** Brand palette (decisions D9) as sRGB hex. */
export const PALETTE = Object.freeze({
  bg: "#262624",
  deep: "#1f1e1d",
  raised: "#32312d",
  text: "#faf9f5",
  soft: "#c9c7bc",
  muted: "#918f86",
  hairline: "#3e3d38",
  clay: "#d97757",
  coralHi: "#eb9f7f",
  ink: "#141413",
});

export type PaletteToken = keyof typeof PALETTE;

export function hexToRgb(hex: string): Rgb {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!m?.[1]) throw new Error(`Invalid hex color: ${hex}`);
  const n = Number.parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

/** Linear RGB of a hex color. */
export function linear(hex: string): Rgb {
  const [r, g, b] = hexToRgb(hex);
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

/** Linear HDR color: values above 1 bloom (author the clay accent at ×1.6–3 where it should glow). */
export function hdr(hex: string, intensity: number): Rgb {
  const [r, g, b] = linear(hex);
  return [r * intensity, g * intensity, b * intensity];
}

export const LINEAR: Readonly<Record<PaletteToken, Rgb>> = Object.freeze(
  Object.fromEntries(Object.entries(PALETTE).map(([k, hex]) => [k, linear(hex)])) as Record<
    PaletteToken,
    Rgb
  >,
);

export function glslVec3([r, g, b]: Rgb): string {
  return `vec3(${r.toFixed(5)}, ${g.toFixed(5)}, ${b.toFixed(5)})`;
}
