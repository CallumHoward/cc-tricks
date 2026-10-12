import * as THREE from "three";

import { SPRINGS, springAt } from "#/engine/motion/spring";

import { hdr, PALETTE } from "./palette";
import type { ThreeLayer } from "./three-host";

const hdrColor = (hex: string, k: number) => {
  const [r, g, b] = hdr(hex, k);
  return new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
};

/** Matte clay knot with an HDR clay ring (blooms) and an ivory moon (must not bloom). */
export function createDemoLayer(): ThreeLayer {
  const group = new THREE.Group();
  const clay = new THREE.MeshStandardMaterial({
    color: PALETTE.clay,
    roughness: 0.55,
    metalness: 0,
  });
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(150, 46, 220, 32), clay);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(330, 5, 16, 160),
    new THREE.MeshBasicMaterial({ color: hdrColor(PALETTE.clay, 2.6) }),
  );
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(40, 48, 24),
    new THREE.MeshBasicMaterial({ color: PALETTE.text }),
  );
  moon.position.set(520, 220, 0);
  ring.rotation.x = Math.PI * 0.42;
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-600, 800, 900);
  const fill = new THREE.HemisphereLight(PALETTE.text, PALETTE.deep, 0.9);
  group.add(knot, ring, moon, key, fill);

  return {
    object: group,
    update({ tau }) {
      const grow = springAt(tau, SPRINGS.LAND);
      group.scale.setScalar(Math.max(0.001, grow));
      knot.rotation.set(tau * 0.35, tau * 0.6, 0);
      ring.rotation.z = tau * 0.2;
    },
    post: ({ tau }) => ({ zoom: 1 + 0.01 * Math.sin(tau * 0.5) }),
    dispose() {
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          (o.geometry as THREE.BufferGeometry).dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    },
  };
}
