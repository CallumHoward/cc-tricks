import * as THREE from "three";

import type { Frame } from "#/engine/types";

import { createLayerRegistry, type Layer, type LayerRegistry } from "./layer-registry";
import { LINEAR } from "./palette";
import { Post, makeRT } from "./post";
import { resolvePost, type PostParams } from "./post-params";

export type ThreeLayer = Layer<THREE.Object3D>;
export type ThreeRegistry = LayerRegistry<THREE.Object3D>;

export type ThreeHostOptions = {
  canvas: HTMLCanvasElement;
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

  const setPixelRatio = (ratio: number) => {
    const pr = Math.min(Math.max(ratio, 0.25), dprCap);
    renderer.setPixelRatio(pr);
    renderer.setSize(width, height, false);
    hdr.dispose();
    hdr = makeRT(width * pr, height * pr, true);
  };
  setPixelRatio(pixelRatio);

  registry.bind({ attach: (o) => scene.add(o), detach: (o) => scene.remove(o) });

  return {
    renderer,
    scene,
    camera,
    registry,
    render(frame) {
      const params = resolvePost(frame, base, ...registry.update(frame));
      renderer.setRenderTarget(hdr);
      renderer.render(scene, camera);
      post.render(renderer, hdr.texture, params, frame.w);
    },
    setPixelRatio,
    dispose() {
      registry.bind(null);
      hdr.dispose();
      post.dispose();
      renderer.dispose();
    },
  };
}
