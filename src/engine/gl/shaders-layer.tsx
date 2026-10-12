import { useCallback, type CSSProperties } from "react";

import { useStage } from "#/engine/stage/react";
import { PRIORITY } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";

import type { ShaderNode, ShadersClock, ShaderUniforms } from "./shaders-host";

export type ShadersLayerProps = {
  /** Lazily builds the composition (dynamic-import `shaders/core/<Name>` inside) */
  nodes: () => Promise<readonly ShaderNode[]>;
  uniforms?: (frame: Frame) => ShaderUniforms | undefined;
  clock?: ShadersClock;
  /** CSS background shown without WebGPU (and until the first frame) */
  fallback?: string;
  style?: CSSProperties;
};

const fill = { position: "absolute", inset: 0, width: "100%", height: "100%" } as const;

/** WebGPU `shaders` layer driven by the stage; the library is loaded only when this mounts. */
export function ShadersLayer({
  nodes,
  uniforms,
  clock = "tau",
  fallback = "var(--color-bg, #262624)",
  style,
}: ShadersLayerProps) {
  const stage = useStage();
  const ref = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const release = stage.hold("shaders");
      const life = { disposed: false, ready: false };
      let off = () => {};
      let dispose = () => {};
      void (async () => {
        try {
          const { createShadersHost } = await import("./shaders-host");
          const result = await createShadersHost({ canvas, nodes: await nodes(), clock });
          if (!result.ok || life.disposed) {
            if (result.ok) result.host.dispose();
            return;
          }
          const { host } = result;
          dispose = () => host.dispose();
          const draw = (frame: Frame, waitForGpu = frame.dt === 0) =>
            host.render(frame, uniforms?.(frame), { waitForGpu });
          // Pump until the async-compiled composition draws, then show it.
          void host.ready.then(() => (life.ready = true));
          for (let i = 0; i < 300 && !life.ready && !life.disposed; i++) {
            await draw(stage.frame(), true);
            await new Promise((resolve) => setTimeout(resolve, 16));
          }
          await draw(stage.frame(), true);
          canvas.style.opacity = "1";
          off = stage.onFrame((frame) => void draw(frame), PRIORITY.shaders);
        } catch (error) {
          console.error(error);
        } finally {
          release();
        }
      })();
      return () => {
        life.disposed = true;
        off();
        dispose();
        release();
      };
    },
    [stage, nodes, uniforms, clock],
  );

  return (
    <div
      role="presentation"
      style={{ ...fill, background: fallback, pointerEvents: "none", ...style }}
    >
      <canvas ref={ref} aria-hidden style={{ ...fill, display: "block", opacity: 0 }} />
    </div>
  );
}
