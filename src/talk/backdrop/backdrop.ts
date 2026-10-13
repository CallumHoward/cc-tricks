import * as THREE from "three";

import { hdr, linear, type Rgb } from "#/engine/gl/palette";
import { DEFAULT_POST, type PostParams } from "#/engine/gl/post-params";
import type { ThreeBackdrop } from "#/engine/gl/three-host";
import { lerp } from "#/engine/motion/ease";
import { ambientRate, ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";

import { fieldParticle, spriteHash } from "./field";
import { presenceAt, rigAt, type ShotStop } from "./shots";
import {
  cameraAt,
  cameraVelocity,
  CEILING,
  CELL,
  centerAt,
  focusAt,
  HEIGHT_GLSL,
  lightsAt,
  moodAt,
  TRAVEL,
  WELL_RADIUS,
  type MoodSegment,
} from "./world";

const FOV = 56;
/** Extra degrees of FOV at full rush, so a press visibly accelerates the world. */
const RUSH_FOV = 9;
/** Streak exposure in wall seconds. */
const SHUTTER = 1 / 40;
const LIGHTS = 10;
const DUST = 520;
const BOKEH = 26;
/** Wrapped depth of the dust and bokeh fields ahead of the camera. */
const DUST_DEPTH = 48;
const BOKEH_DEPTH = 7;

const PLANE_W = 90;
const PLANE_D = 72;
const PLANE_SEG_W = 180;
const PLANE_SEG_D = 144;

const vec3 = ([r, g, b]: Rgb) => new THREE.Vector3(r, g, b);

const LINE = vec3(linear("#c9c7bc"));
const CLAY = hdr("#d97757", 7);
const CLAY_LINE = vec3(linear("#d97757"));
const COOL = hdr("#dfe7ff", 6);
const DUST_COLOR = linear("#e9e4d6");
const WARM_DUST_COLOR = linear("#eb9f7f");

const GRID_VERT = /* glsl */ `
uniform float uRho, uWarp, uSide, uBase;
varying vec3 vW;
varying float vH;
${HEIGHT_GLSL}
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  float h = heightAt(w.xz, uRho + (1.0 - uSide) * 3.5, uWarp);
  w.y = uBase + h * uSide;
  vW = w.xyz;
  vH = h;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const GRID_FRAG = /* glsl */ `
uniform vec3 uCam, uLine, uClay;
uniform float uGrid, uContour, uContourGain, uCalm, uAlpha, uPresence, uRho;
uniform float uPolar, uSwirl, uRing, uGlow;
uniform vec2 uRes, uCenter;
uniform vec3 uLightPos[${LIGHTS}];
uniform vec3 uLightCol[${LIGHTS}];
varying vec3 vW;
varying float vH;

float lineAA(float g, float width) {
  float d = fwidth(g);
  float a = abs(fract(g - 0.5) - 0.5) / max(d, 1e-4);
  return (1.0 - smoothstep(width - 0.5, width + 0.5, a)) * (1.0 - smoothstep(0.25, 0.6, d));
}

float axisAA(float d) {
  return 1.0 - smoothstep(0.6, 1.6, abs(d) / max(fwidth(d), 1e-4));
}

void main() {
  vec2 q = vW.xz - uCenter;
  float r = length(q);
  // Vortex: twist the grid about the centre, strongest at the throat.
  float tw = uSwirl * 4.2 * exp(-r * 0.1) * (1.0 + 0.25 * sin(uRho * 0.21));
  vec2 tq = mat2(cos(tw), sin(tw), -sin(tw), cos(tw)) * q;
  vec2 g = (uCenter + tq) / ${CELL.toFixed(1)};
  float minor = max(lineAA(g.x, 0.55), lineAA(g.y, 0.55));
  float major = max(lineAA(g.x / 5.0, 1.0), lineAA(g.y / 5.0, 1.0));
  float cart = minor * 0.5 + major * 0.95;
  // Tikz plot: polar rings and 15° spokes, with clay axes, diagonals and a protractor arc.
  float rings = lineAA(r / 2.0, 0.9);
  float spokes = lineAA(atan(q.y, q.x) * 3.8197, 0.7) * smoothstep(1.5, 5.0, r);
  float polar = rings * 1.2 + spokes * 0.6 + minor * 0.2;
  float construct = max(axisAA(q.x), axisAA(q.y)) * 0.9
    + max(axisAA(dot(q, vec2(0.5, 0.866))), axisAA(dot(q, vec2(0.866, 0.5)))) * 0.45
    + axisAA(r - 7.0) * step(q.y, 0.0) * 0.8;
  construct *= uPolar * exp(-r * 0.035);
  float contour = lineAA(vH / 0.22, 0.8);
  float lines = uGrid * mix(cart, polar, uPolar) + uContour * uContourGain * contour * 0.75;
  // Gravity well: the throat swallows the lines inside a glowing ring.
  float throat = ${(WELL_RADIUS * 0.9).toFixed(3)};
  lines *= mix(1.0, smoothstep(throat * 0.7, throat * 1.1, r), uRing);
  float ring = uRing * (exp(-pow((r - throat) / 0.12, 2.0)) * 3.0 + exp(-pow((r - throat) / 0.9, 2.0)) * 0.12);
  vec3 emissive = uClay * (ring + uGlow * exp(-r * r / 22.0) * 0.55) + uClay * construct * 0.9;

  float dist = distance(vW, uCam);
  float fog = exp(-dist * 0.05) * smoothstep(0.8, 3.5, dist) * smoothstep(52.0, 26.0, dist);

  vec2 sp = gl_FragCoord.xy / uRes - 0.5;
  sp.x *= uRes.x / uRes.y;
  float calm = mix(1.0 - uCalm, 1.0, smoothstep(0.1, 0.78, length(sp * vec2(0.75, 1.0))));

  vec3 lit = uLine * 0.16;
  vec3 pool = vec3(0.0);
  for (int i = 0; i < ${LIGHTS}; i++) {
    vec3 d = uLightPos[i] - vW;
    float k = 1.0 / (1.0 + dot(d, d) * 0.45);
    lit += uLightCol[i] * k * 0.16;
    pool += uLightCol[i] * k * k * 0.01;
  }
  gl_FragColor = vec4((lit * lines + pool + emissive) * fog * calm * uAlpha * uPresence, 1.0);
}`;

const SPRITE_VERT = /* glsl */ `
attribute vec3 aPos;
attribute vec4 aSeed;
attribute vec3 aCol;
uniform float uRho, uTravel, uShutter, uFocal, uDust, uAnchor;
uniform vec3 uCam, uCamVel;
uniform vec2 uRes;
varying vec2 vLocal;
varying float vHalf, vR, vAlpha, vKind;
varying vec3 vCol;

void main() {
  float kind = aSeed.w;
  vec3 p = aPos;
  float alpha = 1.0;
  if (kind < 1.5) {
    // Dust (0) and bokeh (1) wrap in depth ahead of the camera, so the field is endless and pure.
    float depth = kind < 0.5 ? ${DUST_DEPTH.toFixed(1)} : ${BOKEH_DEPTH.toFixed(1)};
    float ahead = depth - fract(uTravel / depth + aSeed.x) * depth;
    float lead = kind < 0.5 ? 1.5 : 0.35;
    p.z = (kind < 0.5 ? uAnchor : uCam.z) - ahead + lead;
    p += vec3(sin(uRho * 0.31 + aSeed.y * 40.0), sin(uRho * 0.23 + aSeed.z * 40.0), 0.0) * 0.18;
    if (kind > 0.5) p.xy += uCam.xy * 0.6;
    alpha = smoothstep(0.0, depth * 0.25, depth - ahead) * smoothstep(0.1, 0.6, ahead - lead) * uDust;
  }
  vec3 tail = p + uCamVel * uShutter;
  vec4 ch = projectionMatrix * viewMatrix * vec4(p, 1.0);
  vec4 ct = projectionMatrix * viewMatrix * vec4(tail, 1.0);
  if (ch.w < 0.1 || ct.w < 0.1) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec2 hres = uRes * 0.5;
  vec2 sh = ch.xy / ch.w * hres;
  vec2 st = ct.xy / ct.w * hres;

  float r = aSeed.y * uFocal / ch.w;
  if (kind > 0.5 && kind < 1.5) r = (8.0 + aSeed.z * 34.0) * uRes.y / 1080.0 * (1.2 / max(ch.w, 0.4));
  float minR = uRes.y / 1080.0 * (kind > 1.5 ? 3.0 : 1.0);
  if (r < minR) { alpha *= r * r / (minR * minR); r = minR; }

  vec2 axis = sh - st;
  float len = length(axis);
  vec2 dir = len > 1e-3 ? axis / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float hl = len * 0.5;
  vec2 corner = position.xy;
  float ext = kind > 1.5 ? 7.0 : 2.0;
  vec2 px = (sh + st) * 0.5 + dir * corner.x * (hl + r * ext) + nrm * corner.y * r * ext;
  gl_Position = vec4(px / hres * ch.w, ch.z, ch.w);

  vLocal = vec2(corner.x * (hl + r * ext), corner.y * r * ext);
  vHalf = hl;
  vR = r;
  vAlpha = alpha * r / (r + hl);
  vKind = kind;
  vCol = aCol;
}`;

const SPRITE_FRAG = /* glsl */ `
uniform float uCalm;
uniform vec2 uRes;
varying vec2 vLocal;
varying float vHalf, vR, vAlpha, vKind;
varying vec3 vCol;
void main() {
  float qx = max(abs(vLocal.x) - vHalf, 0.0);
  float d = length(vec2(qx, vLocal.y)) / vR;
  float a;
  if (vKind < 0.5) a = exp(-d * d * 2.2);
  else if (vKind < 1.5) a = smoothstep(1.0, 0.82, d) * (0.55 + 0.45 * smoothstep(0.3, 0.95, d)) * 0.05;
  else a = exp(-d * d * 3.0) + exp(-d * 0.9) * 0.05 * (1.0 - smoothstep(4.0, 7.0, d));
  vec2 sp = gl_FragCoord.xy / uRes - 0.5;
  sp.x *= uRes.x / uRes.y;
  float calm = mix(1.0 - uCalm * 0.85, 1.0, smoothstep(0.08, 0.7, length(sp * vec2(0.75, 1.0))));
  gl_FragColor = vec4(vCol * a * vAlpha * calm, 1.0);
}`;

function gridPlane(
  side: 1 | -1,
  base: number,
  contourGain: number,
  shared: Record<string, THREE.IUniform>,
) {
  const geometry = new THREE.PlaneGeometry(PLANE_W, PLANE_D, PLANE_SEG_W, PLANE_SEG_D);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: GRID_VERT,
    fragmentShader: GRID_FRAG,
    uniforms: {
      ...shared,
      uSide: { value: side },
      uBase: { value: base },
      uAlpha: { value: 1 },
      uGrid: { value: 1 },
      uContourGain: { value: contourGain },
    },
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

function spriteGeometry(count: number) {
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3),
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.instanceCount = count;
  const pos = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  const seed = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
  const col = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  geometry.setAttribute("aPos", pos);
  geometry.setAttribute("aSeed", seed);
  geometry.setAttribute("aCol", col);
  return { geometry, pos, seed, col };
}

/**
 * Dust spans the travel corridor; bokeh hug the lens for parallax. Seeds are fixed, so stills
 * match.
 */
function fieldGeometry() {
  const field = spriteGeometry(DUST + BOKEH);
  for (let i = 0; i < DUST + BOKEH; i++) {
    const p = fieldParticle(i, DUST);
    field.pos.setXYZ(i, p.x, p.y, 0);
    field.seed.setXYZW(i, ...p.seed);
    const [r, g, bl] = p.warm ? WARM_DUST_COLOR : DUST_COLOR;
    field.col.setXYZ(i, r * p.brightness, g * p.brightness, bl * p.brightness);
  }
  return field;
}

export type BackdropOptions = {
  segments: readonly MoodSegment[];
  stops: readonly ShotStop[];
};

/**
 * Pdoom-style world under every segment: a warping wire grid (floor, and a mirrored ceiling in rich
 * moods) with contour lines, sparse glowing lights and depth dust. Each stop has its own shot (a
 * tikz plot, contour terrain, ripples, a gravity well, a vortex, a low skim) and the camera cranes
 * between them in transit, travelling with ambient time ρ.
 */
export function createBackdrop({ segments, stops }: BackdropOptions): ThreeBackdrop {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 200);
  camera.rotation.order = "YXZ";

  const lightPos = Array.from({ length: LIGHTS }, () => new THREE.Vector3());
  const lightCol = Array.from({ length: LIGHTS }, () => new THREE.Vector3());
  const shared: Record<string, THREE.IUniform> = {
    uRho: { value: 0 },
    uWarp: { value: 1 },
    uCam: { value: new THREE.Vector3() },
    uLine: { value: LINE },
    uContour: { value: 0 },
    uCalm: { value: 0 },
    uPresence: { value: 0 },
    uCenter: { value: new THREE.Vector2() },
    uWell: { value: 0 },
    uRipple: { value: 0 },
    uPolar: { value: 0 },
    uSwirl: { value: 0 },
    uRing: { value: 0 },
    uGlow: { value: 0 },
    uClay: { value: CLAY_LINE },
    uRes: { value: new THREE.Vector2(1920, 1080) },
    uLightPos: { value: lightPos },
    uLightCol: { value: lightCol },
  };
  const floor = gridPlane(1, 0, 1, shared);
  const ceiling = gridPlane(-1, CEILING, 0.5, shared);
  scene.add(floor, ceiling);

  const spriteUniforms: Record<string, THREE.IUniform> = {
    uRho: shared["uRho"]!,
    uCam: shared["uCam"]!,
    uRes: shared["uRes"]!,
    uCalm: shared["uCalm"]!,
    uTravel: { value: 0 },
    uShutter: { value: SHUTTER },
    uFocal: { value: 1000 },
    uDust: { value: 1 },
    uAnchor: { value: 0 },
    uCamVel: { value: new THREE.Vector3() },
  };
  const spriteMaterial = (dust: boolean) =>
    new THREE.ShaderMaterial({
      vertexShader: SPRITE_VERT,
      fragmentShader: SPRITE_FRAG,
      uniforms: dust ? spriteUniforms : { ...spriteUniforms, uDust: { value: 1 } },
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

  const field = fieldGeometry();
  const fieldMesh = new THREE.Mesh(field.geometry, spriteMaterial(true));
  fieldMesh.frustumCulled = false;

  const lights = spriteGeometry(LIGHTS);
  for (let i = 0; i < LIGHTS; i++)
    lights.seed.setXYZW(i, 0, 0.14 + spriteHash(i + 40) * 0.14, 0, 2);
  const lightMesh = new THREE.Mesh(lights.geometry, spriteMaterial(false));
  lightMesh.frustumCulled = false;
  lightMesh.renderOrder = 1;
  scene.add(fieldMesh, lightMesh);

  const floorU = floor.material.uniforms;
  const ceilU = ceiling.material.uniforms;

  return {
    scene,
    camera,
    update(frame: Frame, size): Partial<PostParams> | undefined {
      const rho = ambientTime(frame);
      const mood = moodAt(frame.tau, segments, stops);
      const rig = rigAt(frame.tau, stops);
      const presence = presenceAt(frame.tau);
      const pose = cameraAt(rho, rig);
      const focus = focusAt(rho, rig);
      const center = centerAt(rho, rig);
      const distort = {
        warp: mood.warp * rig.warp,
        well: rig.well,
        ripple: rig.ripple,
        cx: center.x,
        cz: center.z,
      };
      // Dust, lights and the floor wrap ahead of whichever is nearer: the lens or the focus.
      const anchorZ = Math.max(pose.z, focus.z + 12);
      const rate = frame.dt === 0 ? 0 : ambientRate(frame.v);
      const rush = 1 - Math.exp(-Math.max(0, Math.abs(rate) - 0.15) / 1.6);

      camera.fov = FOV + RUSH_FOV * rush;
      camera.aspect = size.width / size.height;
      camera.position.set(pose.x, pose.y, pose.z);
      camera.rotation.set(pose.pitch, pose.yaw, pose.roll);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      // Snap to the vertex pitch so the sampled warp never swims under the camera.
      const pitch = PLANE_W / PLANE_SEG_W;
      const px = Math.round(pose.x / pitch) * pitch;
      const pz = Math.round((anchorZ - PLANE_D / 2 + 6) / pitch) * pitch;
      floor.position.set(px, 0, pz);
      ceiling.position.set(px, 0, pz);

      const visible = presence > 0.001;
      floor.visible = visible;
      fieldMesh.visible = visible;
      lightMesh.visible = visible;

      shared["uRho"]!.value = rho;
      shared["uWarp"]!.value = distort.warp;
      shared["uContour"]!.value = mood.contour * rig.contour;
      shared["uCalm"]!.value = mood.calm;
      shared["uPresence"]!.value = presence;
      shared["uWell"]!.value = rig.well;
      shared["uRipple"]!.value = rig.ripple;
      shared["uPolar"]!.value = rig.polar;
      shared["uSwirl"]!.value = rig.swirl;
      shared["uRing"]!.value = rig.ring;
      shared["uGlow"]!.value = rig.glow;
      (shared["uCenter"]!.value as THREE.Vector2).set(center.x, center.z);
      (shared["uCam"]!.value as THREE.Vector3).set(pose.x, pose.y, pose.z);
      (shared["uRes"]!.value as THREE.Vector2).set(size.width, size.height);
      floorU["uGrid"]!.value = mood.grid * rig.grid;
      ceilU["uGrid"]!.value = mood.grid * 0.8;
      ceilU["uAlpha"]!.value = mood.ceiling * rig.ceiling;
      ceiling.visible = visible && mood.ceiling * rig.ceiling > 0.01;

      lightsAt(rho, mood, { anchorZ, focusX: focus.x, distort, presence }).forEach((l, i) => {
        lightPos[i]!.set(l.x, l.y, l.z);
        const k = l.intensity;
        lightCol[i]!.set(
          lerp(COOL[0], CLAY[0], l.warmth) * k,
          lerp(COOL[1], CLAY[1], l.warmth) * k,
          lerp(COOL[2], CLAY[2], l.warmth) * k,
        );
        lights.pos.setXYZ(i, l.x, l.y, l.z);
        lights.col.setXYZ(i, lightCol[i]!.x, lightCol[i]!.y, lightCol[i]!.z);
      });
      lights.pos.needsUpdate = true;
      lights.col.needsUpdate = true;

      const [vx, vy, vz] = cameraVelocity(rho, rig);
      spriteUniforms["uTravel"]!.value = TRAVEL * rho;
      spriteUniforms["uAnchor"]!.value = anchorZ;
      spriteUniforms["uDust"]!.value = mood.dust * presence;
      spriteUniforms["uFocal"]!.value = size.height / 2 / Math.tan((camera.fov * Math.PI) / 360);
      (spriteUniforms["uCamVel"]!.value as THREE.Vector3).set(vx * rate, vy * rate, vz * rate);

      // Edge aberration and a deeper vignette come in with the world; the cold open keeps its grade.
      return {
        bloom: 0.7,
        bloomThreshold: 0.9,
        vignette: lerp(0.32, 0.46, presence),
        ca: lerp(DEFAULT_POST.ca, rig.ca + 0.9 * rush, presence),
      };
    },
    dispose() {
      for (const mesh of [floor, ceiling, fieldMesh, lightMesh]) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    },
  };
}
