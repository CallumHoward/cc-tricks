import type { ShaderNode } from "#/engine/gl/shaders-host";

/** Faint ivory lattice over the backdrop that springs away from the cursor and settles back. */
export async function cursorField(): Promise<ShaderNode[]> {
  const [{ componentDefinition: Grid }, { componentDefinition: Liquify }] = await Promise.all([
    import("shaders/core/Grid"),
    import("shaders/core/Liquify"),
  ]);
  return [
    {
      id: "lattice",
      definition: Grid,
      props: { color: "#47443f", cells: 14, thickness: 1.5, softness: 0.4 },
    },
    {
      id: "warp",
      definition: Liquify,
      props: { intensity: 6, stiffness: 3, damping: 2.5, radius: 0.9 },
    },
  ];
}
