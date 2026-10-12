import type { ShaderNode } from "#/engine/gl/shaders-host";

/** Haze colors: the stage ground and a barely warmer dark, so the bed never reads as a gradient. */
const HAZE = Object.freeze({ ground: "#262624", warm: "#2f2b27" });

/** Slow warm haze in the palette darks: the world keeps drifting behind every plate (τ-driven). */
export async function hazeBed(): Promise<ShaderNode[]> {
  const { componentDefinition: SimplexNoise } = await import("shaders/core/SimplexNoise");
  return [
    {
      id: "haze",
      definition: SimplexNoise,
      props: {
        colorA: HAZE.ground,
        colorB: HAZE.warm,
        colorSpace: "oklab",
        scale: 3.4,
        balance: 0.35,
        contrast: -1.2,
        seed: 7,
        speed: 0.12,
      },
    },
  ];
}
