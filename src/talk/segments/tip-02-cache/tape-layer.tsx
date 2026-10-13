import * as THREE from "three";

import { hdr, linear, type Rgb } from "#/engine/gl/palette";
import type { ThreeLayer } from "#/engine/gl/three-host";
import { useThreeLayer } from "#/engine/gl/three-layer";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";

import {
  ambientView,
  blockAt,
  MONOLITH,
  N_BLOCKS,
  propsAt,
  SKIP,
  viewAt,
  type View,
} from "./scene";

const color = (rgb: Rgb) =>
  new THREE.Color().setRGB(rgb[0], rgb[1], rgb[2], THREE.LinearSRGBColorSpace);

function lambert(rgb: Rgb) {
  return new THREE.MeshLambertMaterial({ color: color(rgb) });
}

/** Box mesh with its pivot at one edge, so it can hinge. */
function box(w: number, h: number, d: number, mat: THREE.Material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

function placeView(group: THREE.Group, view: View) {
  group.position.set(view.px - 960, 540 - view.py, 0);
  group.rotation.set(view.ax, view.ay, 0, "YXZ");
  group.scale.setScalar(view.zoom);
}

/** Local screen px → group-local coords (pivot-relative, y up). */
function local(view: View, x: number, y: number, z: number, out: THREE.Vector3) {
  return out.set(x - view.px, -(y - view.py), z);
}

function createTapeLayer(): ThreeLayer {
  const root = new THREE.Group();
  const scene = new THREE.Group();
  root.add(scene);

  const ambient = new THREE.AmbientLight(0xffffff, 0.62);
  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(-500, 900, 1400);
  root.add(ambient, key);

  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const blocks = new THREE.InstancedMesh(geo, mat, N_BLOCKS);
  blocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  blocks.setColorAt(0, new THREE.Color());
  blocks.frustumCulled = false;
  scene.add(blocks);

  const panel = linear("#2d2c28");
  const edgeMat = new THREE.LineBasicMaterial({ color: color(linear("#5b5a52")) });

  // monolith: body, hinged door, drawer tray
  const mono = new THREE.Group();
  const body = box(MONOLITH.w, MONOLITH.h, MONOLITH.d, lambert(panel));
  body.add(new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), edgeMat));
  const slot = box(12, 70, MONOLITH.d + 2, lambert(linear("#141413")));
  slot.position.set(-MONOLITH.w / 2 + 5, -50, 0);
  mono.add(body, slot);
  const hinge = new THREE.Group();
  hinge.position.set(-MONOLITH.w / 2 + 12, 40, MONOLITH.d / 2 + 4);
  const door = box(MONOLITH.w - 24, 110, 8, lambert(linear("#3a3934")));
  door.position.set((MONOLITH.w - 24) / 2, 0, 0);
  door.add(new THREE.LineSegments(new THREE.EdgesGeometry(door.geometry), edgeMat));
  hinge.add(door);
  const drawer = new THREE.Group();
  const trayMat = lambert(linear("#3e3d38"));
  const tw = MONOLITH.w - 40;
  const td = 150;
  const bottom = box(tw, 6, td, trayMat);
  bottom.position.y = -36;
  const front = box(tw, 50, 6, lambert(linear("#4a4943")));
  front.position.set(0, -14, td / 2);
  const left = box(6, 44, td, trayMat);
  left.position.set(-tw / 2, -14, 0);
  const right = box(6, 44, td, trayMat);
  right.position.set(tw / 2, -14, 0);
  drawer.add(bottom, front, left, right);
  drawer.position.set(0, 40, 0);
  mono.add(hinge, drawer);
  scene.add(mono);

  // reply block: output = clay outline on deep ground
  const reply = box(46, 46, 46, lambert(linear("#1f1e1d")));
  const replyEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(reply.geometry),
    new THREE.LineBasicMaterial({ color: color(hdr("#d97757", 1.4)) }),
  );
  reply.add(replyEdges);
  scene.add(reply);

  // scan line
  const scan = box(5, 270, 5, new THREE.MeshBasicMaterial({ color: color(hdr("#eb9f7f", 2.2)) }));
  scene.add(scan);

  // skip: an open bin
  const skip = new THREE.Group();
  const binMat = lambert(linear("#33322e"));
  const binBottom = box(SKIP.w, SKIP.h, 6, binMat);
  binBottom.position.z = -50;
  const walls = [
    [0, SKIP.h / 2, SKIP.w, 6],
    [0, -SKIP.h / 2, SKIP.w, 6],
    [SKIP.w / 2, 0, 6, SKIP.h],
    [-SKIP.w / 2, 0, 6, SKIP.h],
  ] as const;
  skip.add(binBottom);
  for (const [x, y, w, h] of walls) {
    const wall = box(w, h, 50, binMat);
    wall.position.set(x, y, -25);
    wall.add(new THREE.LineSegments(new THREE.EdgesGeometry(wall.geometry), edgeMat));
    skip.add(wall);
  }
  scene.add(skip);

  // cachebeat pulse
  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(13, 20, 14),
    new THREE.MeshBasicMaterial({ color: color(hdr("#eb9f7f", 3)) }),
  );
  scene.add(pulse);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const c = new THREE.Color();

  return {
    object: root,
    update(frame: Frame) {
      const { tau } = frame;
      const view = ambientView(viewAt(tau), tau, ambientTime(frame));
      placeView(scene, view);
      for (let i = 0; i < N_BLOCKS; i++) {
        const b = blockAt(i, tau);
        local(view, b.x, b.y, b.z, p);
        e.set(b.rx, 0, b.rz);
        q.setFromEuler(e);
        const k = Math.max(b.s, 0.0001);
        s.set(b.w * k, b.h * k, b.d * k);
        m.compose(p, q, s);
        blocks.setMatrixAt(i, m);
        c.setRGB(b.rgb[0], b.rgb[1], b.rgb[2], THREE.LinearSRGBColorSpace);
        blocks.setColorAt(i, c);
      }
      blocks.instanceMatrix.needsUpdate = true;
      if (blocks.instanceColor) blocks.instanceColor.needsUpdate = true;

      const pr = propsAt(tau);
      mono.visible = pr.monolith > 0.001;
      local(view, MONOLITH.x, MONOLITH.y, 0, mono.position);
      mono.scale.set(1, Math.max(pr.monolith, 0.001), 1);
      hinge.rotation.y = pr.door;
      drawer.position.z = pr.drawer;
      drawer.visible = pr.drawer > 1;

      reply.visible = pr.reply > 0.001;
      local(view, MONOLITH.x + 20 + 150 * pr.reply, 610, 0, reply.position);

      scan.visible = pr.scan !== null;
      if (pr.scan !== null) local(view, pr.scan, 536, 30, scan.position);

      skip.visible = pr.skip > 0.001;
      local(view, SKIP.x, SKIP.y, 0, skip.position);
      skip.scale.setScalar(Math.max(pr.skip, 0.001));

      pulse.visible = pr.pulse !== null;
      if (pr.pulse !== null) local(view, pr.pulse, 690 - 48, 0, pulse.position);
    },
    dispose() {
      root.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const mm = o.material as THREE.Material | THREE.Material[];
          for (const x of Array.isArray(mm) ? mm : [mm]) x.dispose();
        }
      });
    },
  };
}

/** Tip 2's three.js tape: token blocks, monolith, staircase, K/V plates, coins, road and skip. */
export function TapeLayer() {
  useThreeLayer(createTapeLayer);
  return null;
}
