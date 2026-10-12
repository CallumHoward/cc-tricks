import { PALETTE } from "./palette";
import type { ShaderNode } from "./shaders-host";

/** Warm clay tint mixed into the background (decisions D9 allows tints of the one accent). */
export const CLAY_TINT = "#533a31";

/**
 * Slow mesh-gradient bed in palette darks, with a `wipe` node (`progress` 0 shows it, 1 wipes it
 * away).
 */
export async function clayBed(): Promise<ShaderNode[]> {
  const [{ componentDefinition: MeshGradient }, { componentDefinition: LinearWipe }] =
    await Promise.all([import("shaders/core/MeshGradient"), import("shaders/core/LinearWipe")]);
  return [
    {
      id: "bed",
      definition: MeshGradient,
      props: {
        stops: [
          { color: PALETTE.deep, position: 0 },
          { color: PALETTE.bg, position: 0.45 },
          { color: CLAY_TINT, position: 1 },
        ],
        count: 4,
        drift: 0.35,
        swirl: 0.2,
        speed: 0.6,
        seed: 3,
      },
    },
    { id: "wipe", definition: LinearWipe, props: { progress: 0, angle: 90, feather: 0.2 } },
  ];
}
