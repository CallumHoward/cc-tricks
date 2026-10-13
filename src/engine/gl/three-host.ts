import * as THREE from "three";

import type { Frame } from "#/engine/types";

import { createLayerRegistry, type Layer, type LayerRegistry } from "./layer-registry";
import { LINEAR } from "./palette";
import { Post, makeRT } from "./post";
import { resolvePost, type PostParams } from "./post-params";

export type ThreeLayer = Layer<THREE.Object3D>;
export type ThreeRegistry = LayerRegistry<THREE.Object3D>;

/** A world drawn first with its own camera, under every layer and never moved by them. */
export type ThreeBackdrop = {
  readonly scene: THREE.Scene;
  readonly camera: THREE.Camera;
  /** `size` is the drawing buffer in device px; returns the backdrop's base post overrides */
  update(frame: Frame, size: { width: number; height: number }): Partial<PostParams> | undefined;
  dispose(): void;
};

export type ThreeHostOptions = {
  canvas: HTMLCanvasElement;
  backdrop?: ThreeBackdrop;
  registry?: ThreeRegistry;
  width?: number;
  height?: number;
  /** Device px per logical px before the cap */
  pixelRatio?: number;
  dprCap?: number;
  /** Base post params for this host; layers override per frame */
  post?: Partial<PostParams>;
};

export type ThreeHost = {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  /**
   * Perspective camera where 1 world unit = 1 logical px on the z = 0 plane, origin at stage
   * center, y up
   */
  readonly camera: THREE.PerspectiveCamera;
  readonly registry: ThreeRegistry;
  /** True when there is anything to draw */
  readonly active: boolean;
  render(frame: Frame): void;
  setPixelRatio(ratio: number): void;
  dispose(): void;
};

export const CAMERA_FOV = 30;

/** Camera distance at which the z = 0 plane spans `height` logical px. */
export function pxCameraDistance(height: number, fov = CAMERA_FOV): number {
  return height / 2 / Math.tan((fov * Math.PI) / 360);
}

export function createThreeHost({
  canvas,
  backdrop,
  registry = createLayerRegistry<THREE.Object3D>(),
  width = 1920,
  height = 1080,
  pixelRatio = 1,
  dprCap = 2,
  post: base = {},
}: ThreeHostOptions): ThreeHost {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = true;
  const [r, g, b] = LINEAR.bg;
  renderer.setClearColor(new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace), 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, 10, 20_000);
  camera.position.set(0, 0, pxCameraDistance(height));

  let hdr = makeRT(width, height, true);
  const post = new Post(width, height);
  const size = { width, height };

  const setPixelRatio = (ratio: number) => {
    const pr = Math.min(Math.max(ratio, 0.25), dprCap);
    renderer.setPixelRatio(pr);
    renderer.setSize(width, height, false);
    hdr.dispose();
    hdr = makeRT(width * pr, height * pr, true);
    size.width = hdr.width;
    size.height = hdr.height;
  };
  setPixelRatio(pixelRatio);

  registry.bind({ attach: (o) => scene.add(o), detach: (o) => scene.remove(o) });

  return {
    renderer,
    scene,
    camera,
    registry,
    get active() {
      return backdrop !== undefined || registry.size > 0;
    },
    render(frame) {
      const under = backdrop?.update(frame, size) ?? {};
      const params = resolvePost(frame, base, under, ...registry.update(frame));
      renderer.setRenderTarget(hdr);
      if (backdrop) {
        renderer.render(backdrop.scene, backdrop.camera);
        if (registry.size > 0) {
          renderer.autoClear = false;
          renderer.clearDepth();
          renderer.render(scene, camera);
          renderer.autoClear = true;
        }
      } else {
        renderer.render(scene, camera);
      }
      post.render(renderer, hdr.texture, params, frame.w);
    },
    setPixelRatio,
    dispose() {
      registry.bind(null);
      backdrop?.dispose();
      hdr.dispose();
      post.dispose();
      renderer.dispose();
    },
  };
}
