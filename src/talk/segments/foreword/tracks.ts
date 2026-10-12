import { inOutCubic, inOutQuad, lerp, outCubic, prog } from "#/engine/motion/ease";
import { SPRINGS, springProgress } from "#/engine/motion/spring";
import type { Shot } from "#/talk/kit/motion";
import { HOME } from "#/talk/kit/tui";

/** Story times for the foreword (absolute τ); the window is [23.4, 47.4). */
export const F = Object.freeze({
  start: 23.4,
  handover: 23.5,
  morph: { start: 23.5, end: 24.5 },
  placeholderAt: 24.0,
  chipsAt: 24.15,
  headSettle: 26.5,
  lineAt: 26.0,
  cloneAt: 26.8,
  chatAt: 28,
  chatHoldEnd: 30.5,
  crowdOut: 32.3,
  crowdIn: { start: 33.5, end: 34.4 },
  floor: { start: 33.9, end: 34.5 },
  a1At: 34.85,
  a2At: 35.22,
  tasteAt: 36.5,
  tasteHoldEnd: 40.5,
  toPrompt: { start: 40.6, end: 41.1 },
  tipsAt: 41.15,
  menuAt: 41.6,
  investSettle: 42.7,
  investAt: 43.5,
  investHoldEnd: 46,
  exit: 46.0,
  homeAt: 47.3,
  end: 47.4,
});

export type Rect = { x: number; y: number; w: number; h: number; r: number };

const BAR: Rect = { x: 200, y: 728, w: 1200, h: 12, r: 3 };
export const COMPOSER: Rect = { x: 200, y: 500, w: 1100, h: 180, r: 28 };
export const PROMPT_UP: Rect = { x: HOME.left, y: 220, w: HOME.width, h: HOME.promptHeight, r: 0 };

const mixRect = (a: Rect, b: Rect, u: number): Rect => ({
  x: lerp(a.x, b.x, u),
  y: lerp(a.y, b.y, u),
  w: lerp(a.w, b.w, u),
  h: lerp(a.h, b.h, u),
  r: lerp(a.r, b.r, Math.min(1, Math.max(0, u))),
});

/** Our composer drifts up 10 px over the chat-box hold and back before it becomes the prompt. */
export const composerDy = (tau: number): number =>
  -10 * prog(tau, F.chatAt, F.chatHoldEnd) * (1 - prog(tau, F.toPrompt.start, F.toPrompt.end));

/** The bar → composer morph (SETTLE), then composer → prompt box. */
export function composerRect(tau: number): Rect {
  const { start, end } = F.morph;
  const u = springProgress(SPRINGS.SETTLE, end - start, prog(tau, start, end));
  const v = inOutCubic(prog(tau, F.toPrompt.start, F.toPrompt.end));
  const base = mixRect(BAR, COMPOSER, u);
  const out = v > 0 ? mixRect(COMPOSER, PROMPT_UP, v) : base;
  return { ...out, y: out.y + composerDy(tau) };
}

/** CSS clip for a rect on a full-stage layer, grown by `pad`. */
export function rectClip(r: Rect, pad = 0): string {
  const f = (n: number) => Number(n.toFixed(2));
  return `inset(${f(r.y - pad)}px ${f(1920 - r.x - r.w - pad)}px ${f(1080 - r.y - r.h - pad)}px ${f(r.x - pad)}px round ${f(Math.max(0, r.r + pad))}px)`;
}

/** The clone composer slides in from the right; 40% in frame at `chatAt`, then creeps 25 px/τ-s. */
export function cloneX(tau: number): number {
  if (tau < F.cloneAt) return 1920;
  if (tau < F.chatAt) return 1920 - 440 * outCubic(prog(tau, F.cloneAt, F.chatAt));
  return 1480 - 25 * (tau - F.chatAt);
}

/** The crowd: composers on a grid around ours (column 5, row 6). */
export const CROWD = Object.freeze({
  cols: 12,
  rows: 16,
  cellW: 1240,
  cellH: 400,
  ourCol: 5,
  ourRow: 6,
});
const ORIGIN = {
  x: COMPOSER.x - CROWD.ourCol * CROWD.cellW,
  y: COMPOSER.y - CROWD.ourRow * CROWD.cellH,
};
export const CROWD_CENTER = {
  x: ORIGIN.x + (CROWD.cols * CROWD.cellW) / 2 - (CROWD.cellW - COMPOSER.w) / 2,
  y: ORIGIN.y + (CROWD.rows * CROWD.cellH) / 2 - (CROWD.cellH - COMPOSER.h) / 2,
};

export type CrowdCell = {
  id: string;
  x: number;
  y: number;
  d: number;
  popAt: number;
  dimAt: number;
};

export function crowdCells(): CrowdCell[] {
  const out: CrowdCell[] = [];
  for (let r = 0; r < CROWD.rows; r++) {
    for (let c = 0; c < CROWD.cols; c++) {
      if (r === CROWD.ourRow && c === CROWD.ourCol) continue;
      const d = Math.hypot(c - CROWD.ourCol, (r - CROWD.ourRow) * 0.8);
      out.push({
        id: `c${r}-${c}`,
        x: ORIGIN.x + c * CROWD.cellW,
        y: ORIGIN.y + r * CROWD.cellH,
        d,
        popAt: 30.7 + 0.17 * d,
        dimAt: 32.5 + 0.4 * d,
      });
    }
  }
  return out;
}

export const FLOOR_Y = 760;

/** Camera: home → 1/8 crowd → push back in to ours and the floor → home for the prompt. */
export const FW_SHOTS: readonly Shot[] = [
  { at: 30.5, x: 960, y: 540, zoom: 1 },
  { at: F.crowdOut, x: CROWD_CENTER.x, y: CROWD_CENTER.y, zoom: 0.125, ease: inOutCubic },
  { at: F.crowdIn.start, x: CROWD_CENTER.x - 60, y: CROWD_CENTER.y - 40, zoom: 0.13 },
  // Our composer and the lit floor up top, the two taste lines set large on the floor below
  { at: F.crowdIn.end, x: 1460, y: 1040, zoom: 0.6, ease: inOutCubic },
  { at: F.tasteHoldEnd, x: 1460, y: 1040, zoom: 0.618 },
  { at: F.toPrompt.end, x: 960, y: 540, zoom: 1, ease: inOutCubic },
];

/** Crowd drift in the taste hold: 15 px/τ-s on screen at zoom 0.5. */
export const crowdDrift = (tau: number): number =>
  Math.max(0, Math.min(tau, F.tasteHoldEnd) - F.tasteAt) * 30;

/** Highlight bar offset from row 1 (px): glides up two rows, the last 8 px inside the hold. */
export function highlightOffset(tau: number): number {
  if (tau < F.investAt) return lerp(92, 8, outCubic(prog(tau, 42.3, F.investAt)));
  return 8 * (1 - prog(tau, F.investAt, F.investHoldEnd));
}

export const MENU = Object.freeze({ x: 1260, y: 380, w: 440, row: 46 });

type Anchor = { cx: number; feet: number; s: number };

const at = (cx: number, feet: number, s = 1): Anchor => ({ cx, feet, s });

/** Hops between anchors (act `at`; airborne from at + 0.16 to at + 0.58). */
export const HOPS = [23.75, 34.12, 40.6, 42.0, 46.05] as const;

/** A hop's feet touch down this long after its act starts. */
export const HOP_LANDS = 0.58;

function anchor(i: number, tau: number): Anchor {
  switch (i) {
    case 0:
      return at(1480, 560);
    case 1:
      return at(1180, composerRect(tau).y);
    case 2:
      return at(1480, FLOOR_Y + 40, 1.8);
    case 3:
      return at(1180, composerRect(tau).y);
    case 4:
      return at(1640, MENU.y + highlightOffset(tau), 0.6);
    default:
      return at(1480, 560);
  }
}

/** The bot's feet (world px) and scale at τ; a pure function of τ. */
export function botAt(tau: number): Anchor {
  let i = 0;
  while (i < HOPS.length && tau >= (HOPS[i] as number) + HOP_LANDS) i++;
  if (i >= HOPS.length) return anchor(5, tau);
  const hop = HOPS[i] as number;
  const u = inOutQuad(prog(tau, hop + 0.16, hop + HOP_LANDS));
  const a = anchor(i, tau);
  if (u <= 0) return a;
  const b = anchor(i + 1, tau);
  return { cx: lerp(a.cx, b.cx, u), feet: lerp(a.feet, b.feet, u), s: lerp(a.s, b.s, u) };
}

/** Cast shadow length (0..1) and skew (deg): lengthens as the key light rises, then shortens. */
export function shadowAt(tau: number): { len: number; skew: number } {
  const grow = inOutCubic(prog(tau, 34.9, 36.9));
  const hold = prog(tau, F.tasteAt, F.tasteHoldEnd);
  const gone = 1 - prog(tau, F.tasteHoldEnd, F.tasteHoldEnd + 0.25);
  return { len: (0.85 * grow - 0.12 * hold) * gone, skew: 62 - 3 * hold };
}
