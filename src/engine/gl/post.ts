// Adapted from pdoom-video (app/src/engine/post.ts, gl.ts), MIT © 2026 Giacomo Magnanini.
// https://github.com/mexicat/pdoom-video
import * as THREE from "three";

import { FS_VERT, GLSL_COMMON, SHOULDER_GLSL } from "./glsl";
import type { PostParams } from "./post-params";

const MIPS = 7;

export function makeRT(w: number, h: number, depthBuffer = false): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(Math.max(2, Math.round(w)), Math.max(2, Math.round(h)), {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer,
  });
}

let fsGeometry: THREE.BufferGeometry | null = null;
function fullscreenGeometry() {
  if (!fsGeometry) {
    fsGeometry = new THREE.BufferGeometry();
    fsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    );
  }
  return fsGeometry;
}

/** A fullscreen GLSL ES 3.0 pass; `frag` declares its uniforms and writes `fragColor`. */
class FSPass {
  readonly mat: THREE.RawShaderMaterial;
  private readonly scene = new THREE.Scene();
  private readonly cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  constructor(frag: string, uniforms: Record<string, THREE.IUniform>) {
    this.mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: `precision highp float;\nin vec3 position;\n${FS_VERT}`,
      fragmentShader: `precision highp float;\nin vec2 vUv;\nout vec4 fragColor;\n${GLSL_COMMON}\n${frag}`,
      uniforms,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
    const mesh = new THREE.Mesh(fullscreenGeometry(), this.mat);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
  }

  get u(): Record<string, THREE.IUniform> {
    return this.mat.uniforms;
  }

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget | null) {
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.cam);
  }

  dispose() {
    this.mat.dispose();
  }
}

const vec2 = (u: THREE.IUniform) => u.value as THREE.Vector2;

/** Bloom pyramid + final grade (CA, shoulder, flash, vignette, fade, grain, dither) to the canvas. */
export class Post {
  private readonly prefilter: FSPass;
  private readonly down: FSPass;
  private readonly up: FSPass;
  private readonly final: FSPass;
  private readonly mips: THREE.WebGLRenderTarget[] = [];
  private readonly ups: THREE.WebGLRenderTarget[] = [];

  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {
    // The pyramid stays at logical half resolution at every DPR, so radii look the same.
    let w = width >> 1;
    let h = height >> 1;
    for (let i = 0; i < MIPS; i++) {
      this.mips.push(makeRT(w, h));
      this.ups.push(makeRT(w, h));
      w >>= 1;
      h >>= 1;
    }
    this.prefilter = new FSPass(
      /* glsl */ `
      uniform sampler2D src; uniform vec2 texel; uniform float threshold, knee;
      void main() {
        vec3 c = texture(src, vUv + texel * vec2(-1, -1)).rgb + texture(src, vUv + texel * vec2(1, -1)).rgb
          + texture(src, vUv + texel * vec2(-1, 1)).rgb + texture(src, vUv + texel * vec2(1, 1)).rgb;
        c = min(c * 0.25, vec3(40.0));
        float l = max(c.r, max(c.g, c.b));
        float rq = clamp(l - threshold + knee, 0.0, 2.0 * knee);
        rq = rq * rq / (4.0 * knee + 1e-5);
        float w = max(rq, l - threshold) / max(l, 1e-5);
        fragColor = vec4(c * w, 1.0);
      }`,
      {
        src: { value: null },
        texel: { value: new THREE.Vector2() },
        threshold: { value: 1 },
        knee: { value: 0.2 },
      },
    );
    this.down = new FSPass(
      /* glsl */ `
      uniform sampler2D src; uniform vec2 texel;
      void main() {
        vec3 a = texture(src, vUv + texel * vec2(-2, -2)).rgb, b = texture(src, vUv + texel * vec2(0, -2)).rgb, c = texture(src, vUv + texel * vec2(2, -2)).rgb;
        vec3 d = texture(src, vUv + texel * vec2(-1, -1)).rgb, e = texture(src, vUv + texel * vec2(1, -1)).rgb;
        vec3 f = texture(src, vUv + texel * vec2(-2, 0)).rgb, g = texture(src, vUv).rgb, h = texture(src, vUv + texel * vec2(2, 0)).rgb;
        vec3 i = texture(src, vUv + texel * vec2(-1, 1)).rgb, j = texture(src, vUv + texel * vec2(1, 1)).rgb;
        vec3 k = texture(src, vUv + texel * vec2(-2, 2)).rgb, l = texture(src, vUv + texel * vec2(0, 2)).rgb, m = texture(src, vUv + texel * vec2(2, 2)).rgb;
        vec3 o = (d + e + i + j) * 0.125 + (a + b + g + f) * 0.03125 + (b + c + h + g) * 0.03125 + (f + g + l + k) * 0.03125 + (g + h + m + l) * 0.03125;
        fragColor = vec4(o, 1.0);
      }`,
      { src: { value: null }, texel: { value: new THREE.Vector2() } },
    );
    this.up = new FSPass(
      /* glsl */ `
      uniform sampler2D src; uniform sampler2D prev; uniform vec2 texel; uniform float radius;
      void main() {
        vec2 o = texel * radius;
        vec3 s = texture(src, vUv - o).rgb + 2.0 * texture(src, vUv + vec2(0, -o.y)).rgb + texture(src, vUv + vec2(o.x, -o.y)).rgb
          + 2.0 * texture(src, vUv + vec2(-o.x, 0)).rgb + 4.0 * texture(src, vUv).rgb + 2.0 * texture(src, vUv + vec2(o.x, 0)).rgb
          + texture(src, vUv + vec2(-o.x, o.y)).rgb + 2.0 * texture(src, vUv + vec2(0, o.y)).rgb + texture(src, vUv + o).rgb;
        fragColor = vec4(texture(prev, vUv).rgb + s / 16.0, 1.0);
      }`,
      {
        src: { value: null },
        prev: { value: null },
        texel: { value: new THREE.Vector2() },
        radius: { value: 1 },
      },
    );
    this.final = new FSPass(
      /* glsl */ `
      uniform sampler2D src; uniform sampler2D bloomTex; uniform sampler2D haloTex;
      uniform float exposure, bloom, halation, ca, grain, vignette, fade, flash, time, zoom;
      uniform vec2 shake; uniform vec2 res;
      ${SHOULDER_GLSL}
      void main() {
        vec2 uv = (vUv - 0.5) / zoom + 0.5 - shake / res;
        vec2 dc = uv - 0.5;
        vec2 da = dc * vec2(res.x / res.y, 1.0);
        vec2 off = dc * dot(da, da) * ca / res.x * 4.0;
        vec3 col = vec3(texture(src, uv + off).r, texture(src, uv).g, texture(src, uv - off).b);
        col += texture(bloomTex, uv).rgb * bloom;
        col += vec3(1.0, 0.18, 0.04) * luma(texture(haloTex, uv).rgb) * halation;
        col *= exposure;
        col = shoulder(col);
        col += C_TEXT * flash;
        col *= mix(1.0, smoothstep(0.95, 0.25, length(dc * vec2(1.0, 0.8))), vignette);
        col = mix(col, C_BG, fade);
        vec3 s = toSRGB(sat(col));
        float g1 = hash12(gl_FragCoord.xy + fract(time * 13.37) * 1000.0) - 0.5;
        float g2 = hash12(floor(gl_FragCoord.xy / 2.0) + fract(time * 7.13) * 1000.0) - 0.5;
        float lm = luma(s);
        s += (g1 * 0.6 + g2 * 0.4) * grain * (0.55 + 1.2 * lm * (1.0 - lm));
        s += (hash12(gl_FragCoord.xy * 1.37 + time) - 0.5) / 255.0;
        fragColor = vec4(sat(s), 1.0);
      }`,
      {
        src: { value: null },
        bloomTex: { value: null },
        haloTex: { value: null },
        exposure: { value: 1 },
        bloom: { value: 0.5 },
        halation: { value: 0 },
        ca: { value: 1 },
        grain: { value: 0 },
        vignette: { value: 0.25 },
        fade: { value: 0 },
        flash: { value: 0 },
        time: { value: 0 },
        zoom: { value: 1 },
        shake: { value: new THREE.Vector2() },
        res: { value: new THREE.Vector2(width, height) },
      },
    );
  }

  /** HDR linear `src` → sRGB on the canvas. `time` is wall seconds (grain must not freeze in holds). */
  render(renderer: THREE.WebGLRenderer, src: THREE.Texture, p: PostParams, time: number) {
    const pre = this.prefilter.u;
    pre["src"]!.value = src;
    vec2(pre["texel"]!).set(1 / this.width, 1 / this.height);
    pre["threshold"]!.value = p.bloomThreshold;
    pre["knee"]!.value = p.bloomKnee;
    this.prefilter.render(renderer, this.mips[0]!);
    for (let i = 1; i < MIPS; i++) {
      const s = this.mips[i - 1]!;
      this.down.u["src"]!.value = s.texture;
      vec2(this.down.u["texel"]!).set(1 / s.width, 1 / s.height);
      this.down.render(renderer, this.mips[i]!);
    }
    let prevTex = this.mips[MIPS - 1]!.texture;
    for (let i = MIPS - 2; i >= 0; i--) {
      const small = i === MIPS - 2 ? this.mips[MIPS - 1]! : this.ups[i + 1]!;
      this.up.u["src"]!.value = prevTex;
      this.up.u["prev"]!.value = this.mips[i]!.texture;
      vec2(this.up.u["texel"]!).set(1 / small.width, 1 / small.height);
      this.up.u["radius"]!.value = 0.5 + p.bloomRadius;
      this.up.render(renderer, this.ups[i]!);
      prevTex = this.ups[i]!.texture;
    }
    const f = this.final.u;
    f["src"]!.value = src;
    f["bloomTex"]!.value = this.ups[0]!.texture;
    f["haloTex"]!.value = this.ups[3]!.texture;
    f["exposure"]!.value = p.exposure;
    f["bloom"]!.value = p.bloom / 3;
    f["halation"]!.value = p.halation;
    f["ca"]!.value = p.ca;
    f["grain"]!.value = p.grain;
    f["vignette"]!.value = p.vignette;
    f["fade"]!.value = p.fade;
    f["flash"]!.value = p.flash;
    f["time"]!.value = time;
    f["zoom"]!.value = p.zoom;
    vec2(f["shake"]!).set(p.shake[0], p.shake[1]);
    this.final.render(renderer, null);
  }

  dispose() {
    for (const rt of [...this.mips, ...this.ups]) rt.dispose();
    for (const pass of [this.prefilter, this.down, this.up, this.final]) pass.dispose();
  }
}
