import type * as ShadersCore from "shaders/core";

import type { Frame } from "#/engine/types";

type Core = Pick<
  typeof ShadersCore,
  "shaderRendererGPU" | "createGpuUniformsMap" | "rootPassthrough" | "isWebGPUSupported"
>;
type Renderer = ReturnType<Core["shaderRendererGPU"]>;
export type ShaderDefinition = ShadersCore.GpuShaderDefinition;

/** One composition node; `definition` is a `shaders/core/<Name>` componentDefinition. */
export type ShaderNode = {
  id: string;
  definition: ShaderDefinition;
  props?: Record<string, unknown>;
  blendMode?: ShadersCore.BlendMode;
  opacity?: number;
  children?: readonly ShaderNode[];
};

/** Per-frame prop writes keyed by node id. Never animate compile-time props (they recompile). */
export type ShaderUniforms = Record<string, Record<string, unknown>>;

/** `tau` layers scrub with story time (reversible); `wall` layers are ambient beds. */
export type ShadersClock = "tau" | "wall";

export type ShadersHost = {
  /** Resolves once the async-compiled composition has drawn */
  readonly ready: Promise<void>;
  render(
    frame: Frame,
    uniforms?: ShaderUniforms,
    options?: { waitForGpu?: boolean },
  ): Promise<void>;
  resize(width: number, height: number): void;
  dispose(): void;
};

export type ShadersHostResult = { ok: true; host: ShadersHost } | { ok: false; reason: string };

export type ShadersHostOptions = {
  canvas: HTMLCanvasElement;
  nodes: readonly ShaderNode[];
  clock?: ShadersClock;
  loadCore?: () => Promise<Core>;
};

const loadShadersCore = () => import("shaders/core");

/**
 * Runs `fn` with the renderer's own loop nominally running, so prop writes don't schedule a
 * wall-clock redraw.
 */
function withoutRogueRedraw(r: Renderer, fn: () => void) {
  r.startAnimation();
  try {
    fn();
  } finally {
    r.stopAnimation();
  }
}

function sanitizeId(id: string) {
  return id.replaceAll(/[^A-Za-z0-9_]/g, "_");
}

/**
 * Drives a `shaders@3.2.475` composition from the stage clock. Each render advances the library's
 * clock by exactly (target − its elapsed time), so any stray self-scheduled frame is absorbed.
 */
export async function createShadersHost({
  canvas,
  nodes,
  clock = "tau",
  loadCore = loadShadersCore,
}: ShadersHostOptions): Promise<ShadersHostResult> {
  const core = await loadCore();
  if (!core.isWebGPUSupported()) return { ok: false, reason: "unsupported" };
  const r = core.shaderRendererGPU();
  let failure: string | null = null;
  r.setOnUnavailable((reason) => {
    failure = reason;
  });
  let resolveReady = () => {};
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
  r.setOnReady(() => resolveReady());

  // Registered before initialize so per-node clocks start with the global clock.
  r.registerNode("root", core.rootPassthrough.fragment, null, null, {}, core.rootPassthrough);
  const register = (node: ShaderNode, parentId: string, renderOrder: number) => {
    const id = sanitizeId(node.id);
    const values = Object.fromEntries(
      Object.entries(node.definition.props).map(([k, c]) => [k, node.props?.[k] ?? c.default]),
    );
    const metadata = {
      blendMode: node.blendMode ?? "normal",
      opacity: node.opacity,
      renderOrder,
      id,
    };
    r.registerNode(
      id,
      node.definition.fragment,
      parentId,
      metadata,
      core.createGpuUniformsMap(node.definition, values, id),
      node.definition,
    );
    node.children?.forEach((child, i) => register(child, id, i));
  };
  nodes.forEach((node, i) => register(node, "root", i));

  await r.initialize({ canvas, colorSpace: "srgb", observeElement: false });
  r.stopAnimation();
  // Gates any self-scheduled frame within 100 ms of our synthetic ones.
  r.setFrameRateCap(10);
  failure ??= r.getFailureReason();
  if (failure !== null) {
    r.cleanup();
    return { ok: false, reason: failure };
  }

  const last = new Map<string, unknown>();
  const elapsed = () => r.__testing.getFrameDiagnostics().globalElapsedTime;

  return {
    ok: true,
    host: {
      ready,
      render(frame, uniforms, { waitForGpu = false } = {}) {
        if (uniforms) {
          withoutRogueRedraw(r, () => {
            for (const [nodeId, props] of Object.entries(uniforms)) {
              const id = sanitizeId(nodeId);
              for (const [prop, value] of Object.entries(props)) {
                const key = `${id}.${prop}`;
                if (last.get(key) === value) continue;
                last.set(key, value);
                r.updateUniformValue(id, prop, value);
              }
            }
          });
        }
        const delta = (clock === "tau" ? frame.tau : frame.w) - elapsed();
        // A non-finite delta would poison the library clock for good.
        if (!Number.isFinite(delta)) return Promise.resolve();
        return r.renderSyntheticFrame(delta, { waitForGpu });
      },
      resize(width, height) {
        withoutRogueRedraw(r, () => r.resize(width, height));
      },
      dispose() {
        r.cleanup();
      },
    },
  };
}
