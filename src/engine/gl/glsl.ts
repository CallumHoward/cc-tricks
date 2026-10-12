// Adapted from pdoom-video (app/src/engine/glsl/common.ts, post.ts), MIT © 2026 Giacomo Magnanini.
// https://github.com/mexicat/pdoom-video
import { glslVec3, LINEAR } from "./palette";

/** Shared GLSL ES 3.0 helpers prepended to every fullscreen pass. Palette constants are linear. */
export const GLSL_COMMON = /* glsl */ `
const vec3 C_BG = ${glslVec3(LINEAR.bg)};
const vec3 C_TEXT = ${glslVec3(LINEAR.text)};
const vec3 C_CLAY = ${glslVec3(LINEAR.clay)};
float sat(float x) { return clamp(x, 0.0, 1.0); }
vec3 sat(vec3 x) { return clamp(x, 0.0, 1.0); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 toSRGB(vec3 c) { return mix(12.92 * c, 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
`;

/** Identity below k, exponential shoulder above; very bright values desaturate toward white. */
export const SHOULDER_GLSL = /* glsl */ `
vec3 shoulder(vec3 x) {
  const float k = 0.72;
  vec3 y = mix(x, k + (1.0 - k) * (1.0 - exp(-(x - k) / (1.0 - k))), step(k, x));
  float over = max(max(x.r, x.g), x.b);
  return mix(y, vec3(1.0), smoothstep(2.0, 12.0, over) * 0.85);
}`;

export const FS_VERT = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;
