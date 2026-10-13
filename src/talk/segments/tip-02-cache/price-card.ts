import { inOutCubic, lerp, prog, smoothstep } from "#/engine/motion/ease";

import { T } from "./timing";

/** The pricing screenshot (image px) and where its prompt-caching columns sit inside it. */
export const SHOT = Object.freeze({ w: 1620, h: 1044, src: "/talk/refs/pricing.webp" });

/** Image-px rects of the regions the camera and the highlight care about. */
export const REGIONS = Object.freeze({
  caching: { x0: 872, y0: 0, x1: 1620, y1: 975 },
  writes: { x0: 872, y0: 0, x1: 1340, y1: 975 },
  write5m: { x: 953, y: 103 },
  write1h: { x: 1186, y: 103 },
});

/** Window chrome above the screenshot (image px, scales with the card). */
export const CHROME = 60;

/** Card scale at rest: the whole table fits under the title with room for the bot. */
const K = 0.74;
export const CARD_LEFT = 300;
const IMAGE_TOP = 248;

/** Card transform: screen = (x, y) + image px × s. */
export type CardPose = { x: number; y: number; s: number };

type Key = { at: number; fx: number; fy: number; px: number; py: number; zoom: number };

const rest = (fx: number, fy: number) => ({
  fx,
  fy,
  px: CARD_LEFT + fx * K,
  py: IMAGE_TOP + fy * K,
});

/** Camera on the card: zoom about a focus point pinned to a screen point. */
const KEYS: readonly Key[] = [
  { at: T.cardLand, ...rest(810, 522), zoom: 1 },
  { at: 100.5, ...rest(1246, 200), zoom: 1.08 },
  { at: 103, ...rest(1246, 200), zoom: 1.16 },
  { at: T.pushEnd, fx: 1106, fy: 260, px: 1278, py: 400, zoom: 1.45 },
];

function camAt(tau: number): CardPose {
  const first = KEYS[0] as Key;
  let a = first;
  let b = first;
  let u = 0;
  if (tau > first.at) {
    a = KEYS.at(-1) as Key;
    b = a;
    for (let i = 1; i < KEYS.length; i++) {
      const k = KEYS[i] as Key;
      if (tau < k.at) {
        a = KEYS[i - 1] as Key;
        b = k;
        // The hold glides at constant speed; the moves between shots ease.
        u =
          a.at >= 100.5 && b.at <= 103 ? prog(tau, a.at, b.at) : inOutCubic(prog(tau, a.at, b.at));
        break;
      }
    }
  }
  const fx = lerp(a.fx, b.fx, u);
  const fy = lerp(a.fy, b.fy, u);
  const px = lerp(a.px, b.px, u);
  const py = lerp(a.py, b.py, u);
  // Zoom blends in log space so the push reads as a constant-speed dolly.
  const zoom = Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), u));
  const s = K * zoom;
  return { x: px - fx * s, y: py - fy * s, s };
}

/** Card pose at τ: rises in, glides through the hold, pushes into the writes, then drops away. */
export function cardAt(tau: number): CardPose {
  const cam = camAt(tau);
  const drop = prog(tau, T.cardOut, T.cardGone);
  // A small lift before the fall gives the exit its anticipation.
  const fall = 980 * drop * drop * (2.4 * drop - 1.4);
  const shrink = 1 - 0.1 * smoothstep(drop);
  const cx = cam.x + (SHOT.w / 2) * cam.s;
  return {
    x: cx - (SHOT.w / 2) * cam.s * shrink,
    y: cam.y + fall,
    s: cam.s * shrink,
  };
}

/** Screen px of an image-px point on the card at τ. */
export function onCard(tau: number, x: number, y: number): { x: number; y: number } {
  const p = cardAt(tau);
  return { x: p.x + x * p.s, y: p.y + y * p.s };
}

/** Highlight rect at τ: the three caching columns, narrowing to the two write columns. */
export function highlightAt(tau: number): { x0: number; y0: number; x1: number; y1: number } {
  const u = inOutCubic(prog(tau, T.narrow, T.narrow + 0.8));
  const a = REGIONS.caching;
  const b = REGIONS.writes;
  return {
    x0: lerp(a.x0, b.x0, u),
    y0: lerp(a.y0, b.y0, u),
    x1: lerp(a.x1, b.x1, u),
    y1: lerp(a.y1, b.y1, u),
  };
}
