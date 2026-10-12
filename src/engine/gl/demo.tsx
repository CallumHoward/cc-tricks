import { createDemoLayer } from "./demo-layer";
import { ThreeLayerProvider, useThreeLayer } from "./three-layer";

/** The demo scene alone, for use inside an existing <ThreeLayerProvider>. */
export function DemoLayer() {
  useThreeLayer(createDemoLayer);
  return null;
}

/** Visible smoke test for the GPU stack; mount inside the stage viewport. */
export function GlDemo() {
  return (
    <ThreeLayerProvider>
      <DemoLayer />
    </ThreeLayerProvider>
  );
}
