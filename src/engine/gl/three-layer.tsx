import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Object3D } from "three";

import { useStage } from "#/engine/stage/react";
import { PRIORITY } from "#/engine/stage/stage";
import { STAGE_HEIGHT, STAGE_WIDTH, useViewportScale } from "#/engine/stage/viewport";

import { createLayerRegistry } from "./layer-registry";
import type { PostParams } from "./post-params";
import { createThreeHost, type ThreeHost, type ThreeLayer, type ThreeRegistry } from "./three-host";

export type ThreeLayerContext = { width: number; height: number };

const RegistryContext = createContext<ThreeRegistry | null>(null);
const layerContext: ThreeLayerContext = { width: STAGE_WIDTH, height: STAGE_HEIGHT };
const fill = { position: "absolute", inset: 0, width: "100%", height: "100%" } as const;

const devicePixelRatio = () => (typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);

/**
 * WebGL canvas under the DOM world; children render above it. Idle (no layers) costs nothing. Keep
 * `post` stable (module-level): a new object recreates the renderer.
 */
export function ThreeLayerProvider({
  children,
  post,
}: {
  children: ReactNode;
  post?: Partial<PostParams>;
}) {
  const stage = useStage();
  const scale = useViewportScale();
  const [registry] = useState(() => createLayerRegistry<Object3D>());
  const hostRef = useRef<ThreeHost | null>(null);

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const created = createThreeHost({ canvas, registry, post });
      hostRef.current = created;
      const draw = (frame: Parameters<ThreeHost["render"]>[0]) => {
        const active = registry.size > 0;
        canvas.style.visibility = active ? "visible" : "hidden";
        if (active) created.render(frame);
      };
      draw(stage.frame());
      const off = stage.onFrame(draw, PRIORITY.three);
      return () => {
        off();
        created.dispose();
        hostRef.current = null;
      };
    },
    [registry, stage, post],
  );

  useEffect(() => {
    hostRef.current?.setPixelRatio(devicePixelRatio() * scale);
  }, [scale]);

  return (
    <RegistryContext value={registry}>
      <div style={fill}>
        <canvas ref={canvasRef} aria-hidden style={{ ...fill, visibility: "hidden" }} />
        <div style={fill}>{children}</div>
      </div>
    </RegistryContext>
  );
}

/** Adds a three.js layer for the lifetime of the component; `factory` runs once, after mount. */
export function useThreeLayer(factory: (ctx: ThreeLayerContext) => ThreeLayer): void {
  const registry = use(RegistryContext);
  if (!registry) throw new Error("useThreeLayer must be used inside <ThreeLayerProvider>");
  const [init] = useState(() => factory);
  useEffect(() => registry.add(init(layerContext)), [registry, init]);
}
