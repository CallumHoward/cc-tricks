import type { Pt } from "./geometry";
import {
  boil,
  capsule,
  ellipse,
  eyeShape,
  polyPath,
  smoothPath,
  softBox,
  spiral,
  star4,
} from "./geometry";
import type { Eye, Pose } from "./pose";
import { BODY_BOTTOM, BODY_TOP, PALETTE, RIG, squashScale } from "./rig";

export const SLOTS = [
  "shadow",
  "armB0",
  "armB1",
  "leg0",
  "leg1",
  "leg2",
  "leg3",
  "body",
  "lit",
  "side",
  "highlight",
  "line",
  "blush",
  "eyeL",
  "eyeR",
  "glintL",
  "glintR",
  "mouth",
  "propBack",
  "propBackDetail",
  "armF0",
  "armF0Line",
  "armF1",
  "armF1Line",
  "propFront",
  "propFrontDetail",
  "fxSweat",
  "fxZzz",
  "fxMark",
  "fxSparkle",
] as const;

export type Slot = (typeof SLOTS)[number];

/** Slots painted inside the body clip (tone regions that must not spill past the silhouette). */
export const CLIPPED_SLOTS: ReadonlySet<Slot> = new Set(["lit", "side", "highlight"]);

export type Shape = { d: string; fill: string; stroke: string; sw: number; opacity: number };

export type Drawing = { clip: string; shapes: Record<Slot, Shape> };

export type DrawOptions = {
  /** Boil amplitude in px (0 for a clean model sheet) */
  boil?: number;
  /** Silhouette mode: every shape filled with one colour, no detail */
  silhouette?: string;
};

const EMPTY: Shape = { d: "", fill: "none", stroke: "none", sw: 0, opacity: 1 };
const DEG = Math.PI / 180;
const smoothstep = (a: number, b: number, x: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

function fillShape(d: string, fill: string, opacity = 1): Shape {
  return { d, fill, stroke: PALETTE.ink, sw: RIG.line, opacity };
}

function strokeShape(d: string, stroke: string, sw: number, opacity = 1): Shape {
  return { d, fill: "none", stroke, sw, opacity };
}

/** Pure: renders a pose to SVG path data. `drawing` picks the boil variant (cycle of three). */
export function drawMascot(pose: Pose, drawing = 0, opts: DrawOptions = {}): Drawing {
  const amp = opts.boil ?? 1.2;
  const seedBase = (((drawing % 3) + 3) % 3) * 31;
  const c = Math.cos(pose.yaw * DEG);
  const s = Math.sin(pose.yaw * DEG);
  const { sx, sy } = squashScale(pose.sq);
  const cl = Math.cos(pose.lean * DEG);
  const sl = Math.sin(pose.lean * DEG);
  const W = RIG.bodyW;
  const D = RIG.bodyD;

  /** Projected 2D (pre-squash) → screen. */
  const screen = (X: number, Y: number): Pt => {
    const x1 = X * sx;
    const y1 = Y * sy;
    return [x1 * cl - y1 * sl + pose.x, x1 * sl + y1 * cl - pose.lift];
  };
  const proj = (x: number, y: number, z: number): Pt => screen(x * c + z * s, y);
  const depthOf = (x: number, z: number) => -x * s + z * c;
  const mapAll = (pts: readonly Pt[]) => pts.map(([X, Y]) => screen(X, Y));
  let slotSeed = 0;
  const wobble = (pts: Pt[], k = 1) => boil(pts, amp * k, seedBase + ++slotSeed * 7);

  const shapes = Object.fromEntries(SLOTS.map((k) => [k, EMPTY])) as Record<Slot, Shape>;
  const bob = pose.bob;

  // Body silhouette and tone regions
  const Wp = W * Math.abs(c) + D * Math.abs(s);
  const silhouette = wobble(
    mapAll(softBox(0, BODY_BOTTOM + bob, Wp, RIG.bodyH, RIG.radiusTop, RIG.radiusBottom, RIG.dome)),
  );
  const silD = smoothPath(silhouette);
  shapes.body = { d: silD, fill: PALETTE.shade, stroke: "none", sw: 0, opacity: 1 };
  shapes.line = strokeShape(silD, PALETTE.ink, RIG.line);
  shapes.lit = {
    d: smoothPath(silhouette.map(([x, y]) => [x - 7, y - 8])),
    fill: PALETTE.clay,
    stroke: "none",
    sw: 0,
    opacity: 1,
  };

  const mainCenter = (c >= 0 ? 1 : -1) * (D / 2) * s;
  const m0 = mainCenter - (W / 2) * Math.abs(c);
  const m1 = mainCenter + (W / 2) * Math.abs(c);
  const top = BODY_TOP + bob - 20;
  const bottom = BODY_BOTTOM + bob + 4;
  const sideEdge = m0 > -Wp / 2 + 1 ? m0 : m1 < Wp / 2 - 1 ? m1 : null;
  if (sideEdge !== null) {
    const outer = sideEdge === m0 ? -Wp / 2 - 20 : Wp / 2 + 20;
    const bulge = Math.sign(outer - sideEdge) * 5;
    const region: Pt[] = [
      [outer, top],
      [sideEdge, top],
      ...Array.from({ length: 7 }, (_, i): Pt => {
        const u = (i + 1) / 8;
        return [sideEdge + bulge * Math.sin(u * Math.PI), top + (bottom - top) * u];
      }),
      [sideEdge, bottom],
      [outer, bottom],
    ];
    shapes.side = {
      d: polyPath(mapAll(region), true),
      fill: PALETTE.side,
      stroke: "none",
      sw: 0,
      opacity: 1,
    };
  }

  const rt = RIG.radiusTop;
  const hl: Pt[] = [];
  for (let i = 0; i <= 6; i++) {
    const a = (198 + (i / 6) * 50) * DEG;
    hl.push([
      -Wp / 2 + rt + Math.cos(a) * (rt - 12),
      BODY_TOP + bob + rt + Math.sin(a) * (rt - 12),
    ]);
  }
  const dotA = 262 * DEG;
  const dot = screen(
    -Wp / 2 + rt + Math.cos(dotA) * (rt - 12),
    BODY_TOP + bob + rt + Math.sin(dotA) * (rt - 12),
  );
  shapes.highlight = strokeShape(
    `${smoothPath(mapAll(hl), false)}M${dot[0].toFixed(1)} ${dot[1].toFixed(1)}l0 0`,
    PALETTE.ivory,
    5,
    0.85,
  );

  // Ground shadow (unaffected by lean and squash)
  const shadowK = 1 - Math.min(pose.lift, 220) / 380;
  shapes.shadow = {
    d: smoothPath(ellipse(pose.x, 3, (Wp / 2) * 0.92 * shadowK, 8 * shadowK)),
    fill: PALETTE.ground,
    stroke: "none",
    sw: 0,
    opacity: 0.55 * shadowK,
  };

  // Legs, painted back to front
  const legs = RIG.legAt.map(([lx, lz], i) => {
    const leg = pose.legs[i];
    const topPt = proj(lx, BODY_BOTTOM - 12 + bob, lz);
    const foot = proj(lx, -leg.lift - RIG.legW / 2, lz + leg.swing);
    const depth = depthOf(lx, lz);
    const pts = wobble(capsule(topPt, foot, RIG.legW / 2, RIG.legW / 2 + 1), 0.7);
    return { depth, shape: fillShape(smoothPath(pts), depth < -1 ? PALETTE.side : PALETTE.clay) };
  });
  legs.sort((a, b) => a.depth - b.depth);
  legs.forEach((l, i) => {
    shapes[`leg${i}` as Slot] = l.shape;
  });

  // Arms: behind the body unless the hand comes toward the viewer
  const hands: Pt[] = [];
  let back = 0;
  let front = 0;
  for (const [sgn, arm] of [
    [-1, pose.armL],
    [1, pose.armR],
  ] as const) {
    const shX = sgn * (W / 2 - RIG.shoulderInset);
    const shY = RIG.shoulderY + bob;
    const rot = arm.rot * DEG;
    // Arms drift forward as the body turns so a side view never shows an end-on nub
    const fwd = (arm.fwd + 55 * Math.abs(s)) * DEG;
    const L = RIG.armLen * arm.len;
    const hx = shX + sgn * Math.cos(rot) * Math.cos(fwd) * L;
    const hy = shY + Math.sin(rot) * L;
    const hz = Math.cos(rot) * Math.sin(fwd) * L;
    const a = proj(shX, shY, 0);
    const b = proj(hx, hy, hz);
    hands.push(b);
    const pts = wobble(capsule(a, b, RIG.armR, RIG.handR), 0.7);
    const isFront = depthOf(hx, hz) > 2;
    const shape = fillShape(smoothPath(pts), PALETTE.clay);
    if (isFront) {
      // Outline only the free end so the arm reads as growing out of the body
      shapes[`armF${front}` as Slot] = { ...shape, stroke: "none", sw: 0 };
      shapes[`armF${front++}Line` as Slot] = strokeShape(
        smoothPath(freeEnd(pts, a, RIG.armR * 1.25), false),
        PALETTE.ink,
        RIG.line,
      );
    } else shapes[`armB${back++}` as Slot] = { ...shape, fill: PALETTE.side };
  }

  // Face on the front plane
  const faceVis = smoothstep(-0.3, -0.08, c);
  if (faceVis > 0) {
    const xs = Math.sqrt(Math.max(0.25, c));
    const faceX = (x: number) => x * c + (D / 2) * s * (1 - 0.22 * s * s);
    const face = (x: number, y: number, dx: number, dy: number) =>
      screen(faceX(x) + dx * xs, y + dy);
    const lookX = pose.lookX * 9;
    const lookY = pose.lookY * 6;
    const blushPts: string[] = [];
    for (const [sgn, eye, key, glint] of [
      [-1, pose.eyeL, "eyeL", "glintL"],
      [1, pose.eyeR, "eyeR", "glintR"],
    ] as const) {
      const far = sgn * s > 0 ? 1 - smoothstep(0.8, 0.97, Math.abs(s)) : 1;
      const k = faceVis * far;
      if (k < 0.05) continue;
      const ex = sgn * RIG.eyeX + lookX;
      const ey = RIG.eyeY + lookY + bob;
      drawEye(shapes, key, glint, eye, ex, ey, k, sgn, face, wobble);
      const b = ellipse(0, 0, 8.5 * k, 4.5, 14).map(([dx, dy]) =>
        face(sgn * (RIG.eyeX + 13) + lookX * 0.6, ey + 19, dx, dy),
      );
      blushPts.push(smoothPath(b));
    }
    if (pose.blush > 0.01 && blushPts.length > 0) {
      shapes.blush = {
        d: blushPts.join(""),
        fill: PALETTE.blush,
        stroke: "none",
        sw: 0,
        opacity: pose.blush * 0.75 * faceVis,
      };
    }
    shapes.mouth = drawMouth(pose, (dx, dy) =>
      face(lookX * 0.6, RIG.mouthY + lookY * 0.7 + bob, dx, dy),
    );
    if (shapes.mouth.d) shapes.mouth = { ...shapes.mouth, opacity: faceVis };
  }

  drawProps(shapes, pose, hands, proj);
  drawFx(shapes, pose, proj);

  if (opts.silhouette) {
    for (const key of SLOTS) {
      const sh = shapes[key];
      if (!sh.d) continue;
      const solid =
        key === "body" ||
        key.startsWith("leg") ||
        key.startsWith("arm") ||
        (key.startsWith("prop") && !key.endsWith("Detail"));
      shapes[key] = solid
        ? { d: sh.d, fill: opts.silhouette, stroke: opts.silhouette, sw: RIG.line, opacity: 1 }
        : EMPTY;
    }
  }

  return { clip: silD, shapes };
}

type FaceMap = (x: number, y: number, dx: number, dy: number) => Pt;

function drawEye(
  shapes: Record<Slot, Shape>,
  key: "eyeL" | "eyeR",
  glintKey: "glintL" | "glintR",
  eye: Eye,
  ex: number,
  ey: number,
  k: number,
  sgn: -1 | 1,
  face: FaceMap,
  wobble: (pts: Pt[], k?: number) => Pt[],
) {
  const rx = RIG.eyeRx * eye.size * k;
  const ry = RIG.eyeRy * eye.size;
  const at = (dx: number, dy: number) => face(ex, ey, dx, dy);
  if (eye.glyph === "dizzy") {
    shapes[key] = strokeShape(
      smoothPath(
        spiral(0, 0, ry * 0.95, sgn > 0 ? 2.2 : -2.2).map(([x, y]) => at(x * k, y)),
        false,
      ),
      PALETTE.eye,
      3.4,
    );
    return;
  }
  if (eye.glyph === "cross") {
    const r = ry * 0.7;
    const [a, b, cc, d] = [at(-r * k, -r), at(r * k, r), at(r * k, -r), at(-r * k, r)];
    shapes[key] = strokeShape(polyPath([a, b]) + polyPath([cc, d]), PALETTE.eye, 4.2);
    return;
  }
  const pts = eyeShape(0, 0, rx, ry, eye.open, eye.happy, eye.slant, sgn > 0 ? -1 : 1).map(
    ([x, y]) => at(x, y),
  );
  shapes[key] = {
    d: smoothPath(wobble(pts, 0.35)),
    fill: PALETTE.eye,
    stroke: PALETTE.eye,
    sw: 1.2,
    opacity: 1,
  };
  const glint = Math.min(smoothstep(0.5, 0.75, eye.open), 1 - smoothstep(0.2, 0.45, eye.happy));
  if (glint > 0.05) {
    const r = 2.9 * eye.size * glint;
    const g = ellipse(0, 0, r * k, r, 10).map(([x, y]) => at(x - rx * 0.32, y - ry * 0.42));
    shapes[glintKey] = { d: smoothPath(g), fill: PALETTE.ivory, stroke: "none", sw: 0, opacity: 1 };
  }
}

function drawMouth(pose: Pose, at: (dx: number, dy: number) => Pt): Shape {
  const o = 0.4 + 0.6 * pose.mouthOpen;
  const line = (pts: Pt[]) =>
    strokeShape(
      smoothPath(
        pts.map(([x, y]) => at(x, y)),
        false,
      ),
      PALETTE.eye,
      3,
    );
  switch (pose.mouth) {
    case "none":
      return EMPTY;
    case "smile":
      return line([
        [-7, -1],
        [-3.5, 2.6],
        [0, 3.6],
        [3.5, 2.6],
        [7, -1],
      ]);
    case "frown":
      return line([
        [-7, 3],
        [-3.5, -0.4],
        [0, -1.4],
        [3.5, -0.4],
        [7, 3],
      ]);
    case "flat":
      return line([
        [-6, 1],
        [6, 1],
      ]);
    case "wavy":
      return line([
        [-9, 1],
        [-6, -1.5],
        [-3, 1.5],
        [0, -1.5],
        [3, 1.5],
        [6, -1.5],
        [9, 1],
      ]);
    case "cat":
      return line([
        [-8, -1],
        [-4, 3],
        [0, -0.5],
        [4, 3],
        [8, -1],
      ]);
    case "o": {
      const pts = ellipse(0, 2, 4 * o, 5.5 * o, 14).map(([x, y]) => at(x, y));
      return { d: smoothPath(pts), fill: PALETTE.eye, stroke: PALETTE.eye, sw: 1, opacity: 1 };
    }
    case "grin": {
      const h = 10 * o;
      const pts: Pt[] = [
        [-10, -1],
        [0, -1.6],
        [10, -1],
        [7, h * 0.65],
        [0, h],
        [-7, h * 0.65],
      ].map(([x, y]) => at(x, y));
      return { d: smoothPath(pts), fill: PALETTE.eye, stroke: PALETTE.eye, sw: 1.4, opacity: 1 };
    }
  }
}

function drawProps(
  shapes: Record<Slot, Shape>,
  pose: Pose,
  hands: readonly Pt[],
  proj: (x: number, y: number, z: number) => Pt,
) {
  switch (pose.prop) {
    case "none":
      return;
    case "box": {
      const cx = (hands[0][0] + hands[1][0]) / 2;
      const bottom = Math.min(hands[0][1], hands[1][1]) + 6;
      const box = softBox(cx, bottom, 96, 62, 7, 7, 0, 40);
      shapes.propFront = fillShape(smoothPath(box), PALETTE.soft);
      shapes.propFrontDetail = strokeShape(
        polyPath([
          [cx - 48, bottom - 44],
          [cx + 48, bottom - 44],
        ]) +
          polyPath([
            [cx - 10, bottom - 62],
            [cx - 10, bottom - 44],
          ]) +
          polyPath([
            [cx + 10, bottom - 62],
            [cx + 10, bottom - 44],
          ]),
        PALETTE.muted,
        3,
      );
      return;
    }
    case "keyboard": {
      const [cx, cy] = proj(0, -16, RIG.bodyD / 2 + 26 + pose.propReach);
      const kb = softBox(cx, cy + 12, 150, 26, 7, 7, 0, 40);
      shapes.propBack = fillShape(smoothPath(kb), PALETTE.soft);
      const keys: string[] = [];
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 9; i++) {
          const x = cx - 56 + i * 14 + row * 5;
          const y = cy - 6 + row * 9;
          keys.push(`M${x.toFixed(1)} ${y.toFixed(1)}l4 0`);
        }
      }
      shapes.propBackDetail = strokeShape(keys.join(""), PALETTE.muted, 4);
      return;
    }
    case "crate": {
      const cx = pose.x + pose.propReach;
      const crate = softBox(cx, 0, 92, 84, 6, 6, 0, 40);
      shapes.propBack = fillShape(smoothPath(crate), PALETTE.soft);
      shapes.propBackDetail = strokeShape(
        polyPath([
          [cx - 36, -8],
          [cx + 36, -76],
        ]) +
          polyPath([
            [cx - 46, -42],
            [cx + 46, -42],
          ]),
        PALETTE.muted,
        3.5,
      );
      return;
    }
  }
}

function drawFx(
  shapes: Record<Slot, Shape>,
  pose: Pose,
  proj: (x: number, y: number, z: number) => Pt,
) {
  const fx = pose.fx;
  const head = proj(0, BODY_TOP + pose.bob, 0);
  if (fx.sweat > 0) {
    const p = fx.sweat % 1;
    const [hx, hy] = proj(RIG.bodyW * 0.36, BODY_TOP + pose.bob + 22, RIG.bodyD / 2);
    const x = hx + 16;
    const y = hy + p * 22;
    const r = 6.5;
    const drop: Pt[] = [[x, y - r * 2.1]];
    for (let i = 0; i <= 10; i++) {
      const a = -0.25 * Math.PI + (i / 10) * 1.5 * Math.PI;
      drop.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
    shapes.fxSweat = {
      d: polyPath(drop, true),
      fill: PALETTE.ivory,
      stroke: PALETTE.ink,
      sw: 2.4,
      opacity: 1 - p ** 4,
    };
  }
  if (fx.zzz > 0) {
    const p = fx.zzz % 1;
    const zs: string[] = [];
    for (let j = 0; j < 3; j++) {
      const q = (p + j / 3) % 1;
      const size = 8 + q * 10;
      const x = head[0] + 54 + q * 40;
      const y = head[1] - 16 - q * 56;
      zs.push(
        polyPath([
          [x - size / 2, y - size / 2],
          [x + size / 2, y - size / 2],
          [x - size / 2, y + size / 2],
          [x + size / 2, y + size / 2],
        ]),
      );
    }
    shapes.fxZzz = strokeShape(zs.join(""), PALETTE.soft, 3.4);
  }
  const mark = Math.max(fx.alert, fx.question);
  if (mark > 0) {
    const k = Math.min(1, mark);
    const x = head[0] + 4;
    const y = head[1] - 44;
    const d =
      fx.alert >= fx.question
        ? `M${x} ${y - 22 * k}L${x} ${y + 2 * k}M${x} ${y + 14 * k}l0 0`
        : `M${x - 10 * k} ${y - 12 * k}C${x - 10 * k} ${y - 26 * k} ${x + 12 * k} ${y - 26 * k} ${x + 11 * k} ${y - 12 * k}C${x + 10 * k} ${y - 4 * k} ${x} ${y - 4 * k} ${x} ${y + 3 * k}M${x} ${y + 14 * k}l0 0`;
    shapes.fxMark = strokeShape(d, PALETTE.ivory, 6.5);
  }
  if (fx.sparkle > 0) {
    const p = fx.sparkle % 1;
    const spots: Pt[] = [
      [-120, -150],
      [128, -128],
      [-140, -60],
      [150, -40],
    ];
    const d = spots
      .map(([x, y], j) => {
        const q = (p + j * 0.27) % 1;
        const r = 13 * Math.sin(q * Math.PI);
        return r > 0.5 ? smoothStar(pose.x + x, y - pose.lift * 0.5, r) : "";
      })
      .join("");
    shapes.fxSparkle = { d, fill: PALETTE.blush, stroke: "none", sw: 0, opacity: 1 };
  }
}

function smoothStar(x: number, y: number, r: number) {
  return polyPath(star4(x, y, r), true);
}

/** The contiguous run of loop points farther than `r` from `anchor` (the outline away from a joint). */
export function freeEnd(pts: readonly Pt[], anchor: Pt, r: number): Pt[] {
  const n = pts.length;
  const far = pts.map(([x, y]) => Math.hypot(x - anchor[0], y - anchor[1]) > r);
  const start = far.findIndex((f, i) => f && !far[(i - 1 + n) % n]);
  if (start < 0) return far[0] ? [...pts, pts[0]] : [];
  const out: Pt[] = [];
  for (let k = 0; k < n && far[(start + k) % n]; k++) out.push(pts[(start + k) % n]);
  return out;
}
