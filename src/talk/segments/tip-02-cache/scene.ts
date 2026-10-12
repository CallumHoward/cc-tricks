import { hdr, linear, type Rgb } from "#/engine/gl/palette";
import { CAMERA_FOV, pxCameraDistance } from "#/engine/gl/three-host";
import { clamp, inOutCubic, lerp, outCubic, outExpo, prog, smoothstep } from "#/engine/motion/ease";

import { T } from "./timing";

/** Pure model of Tip 2's GL tape: every block, the monolith, drawer and skip as f(τ). */

export const N_TOKENS = 66;
export const N_GHOST = 12;
export const N_BLOCKS = N_TOKENS + N_GHOST;

/** Staircase rows: each turn re-sends the previous request plus 3 new blocks. */
export const ROW_LENGTHS = [12, 15, 18, 21] as const;
const ROW_START = [0, 12, 27, 45] as const;
export const PITCH = 56;
export const BLOCK = 46;
export const STAIR_X0 = 200;
export const STAIR_Y0 = 446;
export const ROW_PITCH = 60;
/** Columns of the newest request that repeat the previous request (the prefix). */
export const PREFIX_COLS = 18;

export const COLORS = Object.freeze({
  paid: hdr("#d97757", 1.8),
  hot: hdr("#d97757", 2.6),
  cached: linear("#885340"),
  cold: mixRgb(linear("#4a362e"), linear("#faf9f5"), 0.1),
  idle: linear("#3a3934"),
  ghost: mixRgb(linear("#4a362e"), linear("#918f86"), 0.3),
  base: mixRgb(linear("#3a3934"), linear("#918f86"), 0.55),
});

export function mixRgb(a: Rgb, b: Rgb, u: number): Rgb {
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
}

/** Box in local screen px (x right, y down, z toward the viewer); `s` scales it (0 = hidden). */
export type Block = {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  rx: number;
  rz: number;
  s: number;
  rgb: Rgb;
};

/** Scene rotation about a pivot (screen px): `ax` tips tops toward the viewer, `ay` turns. */
export type View = { ax: number; ay: number; px: number; py: number; zoom: number };

const hidden = (x = 960, y = 540): Block => ({
  x,
  y,
  z: 0,
  w: BLOCK,
  h: BLOCK,
  d: BLOCK,
  rx: 0,
  rz: 0,
  s: 0,
  rgb: COLORS.idle,
});

function mixBlock(a: Block, b: Block, u: number): Block {
  return {
    x: lerp(a.x, b.x, u),
    y: lerp(a.y, b.y, u),
    z: lerp(a.z, b.z, u),
    w: lerp(a.w, b.w, u),
    h: lerp(a.h, b.h, u),
    d: lerp(a.d, b.d, u),
    rx: lerp(a.rx, b.rx, u),
    rz: lerp(a.rz, b.rz, u),
    s: lerp(a.s, b.s, u),
    rgb: mixRgb(a.rgb, b.rgb, u),
  };
}

/** Row and column of token block `i` in the staircase. */
export function rowCol(i: number): { row: number; col: number } {
  for (let r = ROW_START.length - 1; r >= 0; r--) {
    const start = ROW_START[r] ?? 0;
    if (i >= start) return { row: r, col: i - start };
  }
  return { row: 0, col: i };
}

// ── views ────────────────────────────────────────────────────────────────────────────────────

/** Road centre in the switch shot; the camera pivots on it so the road clears the copy. */
export const ROAD_X = 1450;

type ViewKey = { at: number; v: View };
const VIEWS: readonly ViewKey[] = [
  { at: 71.5, v: { ax: 0, ay: 0, px: 800, py: 734, zoom: 1 } },
  { at: 72.9, v: { ax: 0.38, ay: -0.34, px: 900, py: 600, zoom: 1 } },
  { at: 77.4, v: { ax: 0.38, ay: -0.34, px: 900, py: 600, zoom: 1 } },
  { at: 79.6, v: { ax: 0.2, ay: -0.16, px: 900, py: 560, zoom: 1 } },
  { at: 83.0, v: { ax: 0.2, ay: -0.11, px: 900, py: 560, zoom: 1 } },
  { at: 84.4, v: { ax: 0.3, ay: 0.3, px: 850, py: 650, zoom: 1 } },
  { at: 94.5, v: { ax: 0.3, ay: 0.34, px: 850, py: 650, zoom: 1 } },
  { at: 95.8, v: { ax: 0, ay: 0, px: 960, py: 700, zoom: 1 } },
  { at: 115.5, v: { ax: 0, ay: 0, px: 960, py: 700, zoom: 1 } },
  { at: 115.6, v: { ax: 0.34, ay: -0.2, px: 800, py: 640, zoom: 1 } },
  { at: 123.5, v: { ax: 0.34, ay: -0.18, px: 800, py: 640, zoom: 1 } },
  { at: 124.3, v: { ax: -1.05, ay: 0.22, px: ROAD_X, py: 930, zoom: 1 } },
  { at: 132.5, v: { ax: -1.04, ay: 0.24, px: ROAD_X, py: 930, zoom: 1 } },
];

/** Scene rotation at τ (eased between keyed shots; holds only creep). */
export function viewAt(tau: number): View {
  const first = VIEWS[0] as ViewKey;
  if (tau <= first.at) return first.v;
  for (let i = 1; i < VIEWS.length; i++) {
    const b = VIEWS[i] as ViewKey;
    if (tau < b.at) {
      const a = VIEWS[i - 1] as ViewKey;
      const u = inOutCubic(prog(tau, a.at, b.at));
      return {
        ax: lerp(a.v.ax, b.v.ax, u),
        ay: lerp(a.v.ay, b.v.ay, u),
        px: lerp(a.v.px, b.v.px, u),
        py: lerp(a.v.py, b.v.py, u),
        zoom: lerp(a.v.zoom, b.v.zoom, u),
      };
    }
  }
  return (VIEWS.at(-1) as ViewKey).v;
}

const D = pxCameraDistance(1080, CAMERA_FOV);

/** Local screen px → rendered screen px through the view (matches the GL group transform). */
export function project(view: View, x: number, y: number, z = 0): { x: number; y: number } {
  const lx = (x - view.px) * view.zoom;
  const ly = -(y - view.py) * view.zoom;
  const lz = z * view.zoom;
  // rotateX(ax) then rotateY(ay): Euler order YXZ
  const cx = Math.cos(view.ax);
  const sx = Math.sin(view.ax);
  const y1 = ly * cx - lz * sx;
  const z1 = ly * sx + lz * cx;
  const cy = Math.cos(view.ay);
  const sy = Math.sin(view.ay);
  const x2 = lx * cy + z1 * sy;
  const z2 = -lx * sy + z1 * cy;
  const wx = x2 + (view.px - 960);
  const wy = y1 + (540 - view.py);
  const k = D / (D - z2);
  return { x: 960 + wx * k, y: 540 - wy * k };
}

// ── home bar ─────────────────────────────────────────────────────────────────────────────────

function barBlock(i: number): Block {
  const { row, col } = rowCol(i);
  if (row > 0) return hidden(STAIR_X0 + col * PITCH, 734);
  const w = 1200 / 12;
  return {
    x: 200 + w * (col + 0.5),
    y: 734,
    z: 0,
    w: w - 2,
    h: 12,
    d: 12,
    rx: 0,
    rz: 0,
    s: 1,
    rgb: col < 8 ? COLORS.cached : COLORS.paid,
  };
}

// ── t2-stateless ─────────────────────────────────────────────────────────────────────────────

export const MONOLITH = Object.freeze({ x: 1560, y: 560, w: 170, h: 360, d: 170 });
const TAPE_Y = 610;
const TAPE_HEAD = MONOLITH.x - MONOLITH.w / 2 - 34;

/** X of the scan line that fuses the prefix (parked at the suffix boundary). */
export function scanX(tau: number): number {
  return lerp(
    STAIR_X0 - 20,
    STAIR_X0 + PREFIX_COLS * PITCH,
    inOutCubic(prog(tau, T.scan, T.scanEnd)),
  );
}

/** Slide-in offset of staircase row r (row 0 slides up from the tape instead). */
export function rowSlide(row: number, col: number, tau: number): number {
  if (row === 0) return 0;
  const at = T.rows[row - 1] ?? 0;
  const u = outExpo(prog(tau, at + col * 0.012, at + 0.9 + col * 0.012));
  if (row < 3) return -760 * (1 - u);
  // The newest row eases its last 8 px through the hold.
  const tail = 8 * (1 - prog(tau, at + 1.1, 83));
  return -760 * (1 - u) + tail * u;
}

function statelessBlock(i: number, tau: number): Block {
  const { row, col } = rowCol(i);
  const len = ROW_LENGTHS[row] ?? 12;
  const stairX = STAIR_X0 + PITCH / 2 + col * PITCH;
  const stairY = STAIR_Y0 + row * ROW_PITCH;
  if (row === 0) {
    // bar → tape (extrude and lift into the slot) → feed → climb to staircase row 0
    const bar = barBlock(i);
    const tapeX = TAPE_HEAD - (11 - col) * PITCH;
    const feed = outExpo(prog(tau, T.tapeIn + (11 - col) * 0.02, T.tapeHome));
    const tape: Block = {
      x: tapeX - 520 * (1 - feed),
      y: TAPE_Y,
      z: 0,
      w: BLOCK,
      h: BLOCK,
      d: BLOCK,
      rx: 0,
      rz: 0,
      s: 1,
      rgb: COLORS.paid,
    };
    const extrude = outCubic(prog(tau, T.dive + col * 0.03, T.dive + 0.7 + col * 0.03));
    const climb = inOutCubic(prog(tau, 77.3 + col * 0.015, 77.9 + col * 0.015));
    const stair: Block = { ...tape, x: stairX, y: stairY };
    const base = extrude < 1 ? mixBlock(bar, { ...tape, x: tapeX - 520 }, extrude) : tape;
    return fuse(climb > 0 ? mixBlock(tape, stair, climb) : base, row, col, len, tau);
  }
  const slide = rowSlide(row, col, tau);
  const at = T.rows[row - 1] ?? 0;
  const pop = smoothstep(prog(tau, at + col * 0.012, at + 0.18 + col * 0.012));
  const b: Block = {
    x: stairX + slide,
    y: stairY,
    z: 0,
    w: BLOCK,
    h: BLOCK,
    d: BLOCK,
    rx: 0,
    rz: 0,
    s: pop,
    rgb: COLORS.paid,
  };
  return fuse(b, row, col, len, tau);
}

/** The scan line fuses every repeated column into one cached slab; the diagonal stays bright. */
function fuse(b: Block, row: number, col: number, len: number, tau: number): Block {
  if (col >= len - 3) return b;
  const u = smoothstep(clamp((scanX(tau) - (STAIR_X0 + col * PITCH)) / 60));
  if (u <= 0) return b;
  return {
    ...b,
    w: lerp(b.w, PITCH + 0.5, u),
    h: lerp(b.h, row === 3 ? BLOCK + 7 : ROW_PITCH + 0.5, u),
    y: b.y + (row === 3 ? -3.5 : (ROW_PITCH - BLOCK) / 2) * u,
    rgb: mixRgb(b.rgb, COLORS.cached, u),
  };
}

// ── t2-kv ────────────────────────────────────────────────────────────────────────────────────

export const KV_COLS = 11;
export const KV_PREFIX = 8;
export const KV_LAYERS = 6;
export const KV_X0 = 470;
export const KV_PITCH = 84;
export const KV_Y0 = 836;
export const KV_LAYER_PITCH = 58;

/** Height of the prefill wave front in layers (0..6) for the first request. */
export function prefillFront(tau: number): number {
  return KV_LAYERS * prog(tau, T.wave, T.waveEnd);
}

/** Wave front for the new suffix: halfway at `at`, then only creeping through the hold. */
export function suffixFront(tau: number): number {
  const lead = 3 * outCubic(prog(tau, T.wallBack + 0.2, 92));
  return lead + 0.24 * clamp(tau - 92, 0, 3.5);
}

/** How far the prefix wall has slid back onto the shelf (0 in place, 1 stored). */
export function wallOut(tau: number): number {
  return (
    inOutCubic(prog(tau, T.wallStack, T.wallStack + 0.5)) *
    (1 - outCubic(prog(tau, T.wallBack, T.wallBack + 0.45)))
  );
}

function kvBlock(i: number, tau: number): Block {
  const col = i % KV_COLS;
  const layer = Math.floor(i / KV_COLS);
  const prefix = col < KV_PREFIX;
  const x = KV_X0 + col * KV_PITCH + (prefix ? 0 : 40);
  const y = KV_Y0 - layer * KV_LAYER_PITCH;
  let rgb = COLORS.idle;
  let s = 1;
  let z = 0;
  if (prefix) {
    const lit = clamp(prefillFront(tau) - layer);
    const cool = prog(tau, T.wave + 0.32 * (layer + 1) + 0.4, T.wave + 0.32 * (layer + 1) + 1.2);
    rgb = mixRgb(mixRgb(COLORS.idle, COLORS.hot, lit), COLORS.cached, cool);
    z = -120 * wallOut(tau);
  } else {
    const lit = clamp(suffixFront(tau) - layer);
    rgb = mixRgb(COLORS.idle, COLORS.hot, lit);
    s = outCubic(
      prog(tau, T.reask + (col - KV_PREFIX) * 0.06, T.reask + 0.35 + (col - KV_PREFIX) * 0.06),
    );
  }
  return { x, y, z, w: 68, h: 22, d: 68, rx: 0, rz: 0, s, rgb };
}

// ── t2-price ─────────────────────────────────────────────────────────────────────────────────

export const PRICE_VALUES = [0.4, 0.5, 0.8, 0.02] as const;
export const PRICE_COUNTS = [15, 19, 31, 1] as const;
export const PRICE_X = [1200, 1370, 1540, 1710] as const;
export const PRICE_BASE = 880;
export const COIN = 13.2;

export function priceSlot(i: number): { column: number; index: number } {
  let start = 0;
  for (let c = 0; c < PRICE_COUNTS.length; c++) {
    const n = PRICE_COUNTS[c] ?? 0;
    if (i < start + n) return { column: c, index: i - start };
    start += n;
  }
  return { column: 3, index: 0 };
}

/** The hit column sags under the bot through the hold (≤ 1 px per τ-s). */
export function hitSag(tau: number): number {
  return 3 * smoothstep(prog(tau, 99.6, 100.4)) + 0.8 * clamp(tau - 100.5, 0, 3);
}

function priceBlock(i: number, tau: number): Block {
  const { column, index } = priceSlot(i);
  const grow = outCubic(
    prog(
      tau,
      T.columns - 0.3 + column * 0.12 + index * 0.012,
      T.columns + 0.4 + column * 0.12 + index * 0.012,
    ),
  );
  const y = PRICE_BASE - COIN * (index + 0.5) * grow + (column === 3 ? hitSag(tau) : 0);
  const tone = column === 3 ? COLORS.cached : column === 0 ? COLORS.idle : COLORS.paid;
  return {
    x: PRICE_X[column] ?? 0,
    y,
    z: 0,
    w: 132,
    h: COIN - 2.4,
    d: 70,
    rx: 0,
    rz: 0,
    s: 1,
    rgb: column === 0 ? COLORS.base : tone,
  };
}

/** After the iris the columns sink into the floor while their tops fly up into the ring row. */
function priceSink(i: number, tau: number): Block {
  const b = priceBlock(i, tau);
  const u = inOutCubic(prog(tau, T.rings, T.ringsLand - 0.1));
  if (u <= 0) return b;
  return { ...b, y: lerp(b.y, PRICE_BASE, u), h: b.h * (1 - u), s: u >= 1 ? 0 : 1 };
}

// ── t2-idle ──────────────────────────────────────────────────────────────────────────────────

export const IDLE_LEN = 21;
export const IDLE_Y = 690;
export const IDLE_X0 = 220;

/** X of the cachebeat pulse (first run relights the tape; the second creeps through the hold). */
export function pulseX(tau: number): number | null {
  if (tau >= T.pulse && tau < T.pulseEnd + 0.1)
    return lerp(
      IDLE_X0 - 30,
      IDLE_X0 + IDLE_LEN * PITCH,
      inOutCubic(prog(tau, T.pulse, T.pulseEnd)),
    );
  if (tau >= T.pulse2)
    return IDLE_X0 + 560 * outCubic(prog(tau, T.pulse2, 121.5)) + 30 * clamp(tau - 121.5, 0, 3);
  return null;
}

function idleBlock(i: number, tau: number): Block {
  if (i >= IDLE_LEN) return hidden(IDLE_X0 + (i % IDLE_LEN) * PITCH, IDLE_Y);
  const x = IDLE_X0 + PITCH / 2 + i * PITCH;
  const rise = outCubic(prog(tau, T.idleIn + i * 0.02, T.idleIn + 0.45 + i * 0.02));
  const grey = prog(tau, T.clock + 0.2, T.clockEnd);
  const spikeT = tau - (T.spike + i * 0.022);
  const spike =
    spikeT < 0 ? 0 : Math.exp(-spikeT * 5) * Math.sin(Math.min(spikeT * 14, Math.PI / 2));
  const reheat = spikeT >= 0 ? 1 : 0;
  const relit = smoothstep(
    clamp(
      (lerp(IDLE_X0, IDLE_X0 + IDLE_LEN * PITCH, inOutCubic(prog(tau, T.pulse, T.pulseEnd))) - x) /
        50 +
        0.5,
    ),
  );
  let rgb = mixRgb(COLORS.cached, COLORS.cold, grey);
  if (reheat) rgb = mixRgb(COLORS.hot, COLORS.paid, clamp(spikeT * 2));
  if (tau >= T.pulse) rgb = mixRgb(rgb, COLORS.cached, relit);
  return {
    x,
    y: IDLE_Y - 70 * spike - 60 * (1 - rise),
    z: 0,
    w: BLOCK,
    h: BLOCK * (1 + 1.6 * spike),
    d: BLOCK,
    rx: 0,
    rz: 0,
    s: rise,
    rgb,
  };
}

// ── t2-switch ────────────────────────────────────────────────────────────────────────────────

export const ROAD_NEAR = 930;
export const ROAD_ROW = 96;
const PREFIX_ROWS = 7;

/** Slide of appended turn rows (0 placed; px still to travel toward the viewer side). */
export function appendSlide(turn: 0 | 1 | 2, tau: number): number {
  const at = [T.turn7, T.turn8, T.turn9][turn] ?? 0;
  const u = outExpo(prog(tau, at, at + 0.7));
  if (turn < 2) return 520 * (1 - u);
  return 520 * (1 - u) + 12 * u * (1 - prog(tau, at + 0.9, 132.5));
}

function roadRowY(rowFromNear: number): number {
  return ROAD_NEAR - rowFromNear * ROAD_ROW;
}

function switchBlock(i: number, tau: number): Block {
  const lane = i % 3;
  const x = ROAD_X + (lane - 1) * 62;
  if (i < PREFIX_ROWS * 3) {
    const row = Math.floor(i / 3);
    return {
      x,
      y: roadRowY(3 + (PREFIX_ROWS - 1 - row)),
      z: 26,
      w: 54,
      h: 86,
      d: 52,
      rx: 0,
      rz: 0,
      s: 1,
      rgb: COLORS.cached,
    };
  }
  if (i < PREFIX_ROWS * 3 + 9) {
    const turn = Math.floor((i - PREFIX_ROWS * 3) / 3) as 0 | 1 | 2;
    const slide = appendSlide(turn, tau);
    const at = [T.turn7, T.turn8, T.turn9][turn] ?? 0;
    return {
      x,
      y: roadRowY(2 - turn) + slide,
      z: 26,
      w: 54,
      h: 86,
      d: 52,
      rx: 0,
      rz: 0,
      s: tau >= at ? 1 : 0,
      rgb: COLORS.paid,
    };
  }
  return hidden(x, ROAD_NEAR);
}

export const SKIP = Object.freeze({ x: 2000, y: 360, w: 300, h: 170 });

/** Ghost lane: a copy takes the `/model` fork, the shelf tips, slabs fall into the skip. */
function ghostBlock(g: number, tau: number): Block {
  const lane = g % 3;
  const row = Math.floor(g / 3);
  const startX = ROAD_X + (lane - 1) * 62;
  const startY = roadRowY(3 + row);
  const appear = outCubic(prog(tau, T.fork + row * 0.04, T.fork + 0.3 + row * 0.04));
  const veer = inOutCubic(prog(tau, T.fork + 0.1, T.tip));
  const fallT = Math.max(0, tau - T.tip - g * 0.05);
  const fall = 1 - Math.exp(-fallT / 1.5);
  const laneX = startX + 330 * veer;
  const laneY = startY - 140 * veer;
  const x = lerp(laneX, SKIP.x + (lane - 1) * 60, fall) + 6 * fallT;
  const y = lerp(laneY, SKIP.y + row * 14, fall) - 4 * fallT;
  const z = 26 + 60 * Math.sin(Math.min(1, fall * 1.6) * Math.PI) - 140 * fall * fall;
  const spin = 1.3 * (1 - Math.exp(-fallT / 0.7));
  return {
    x,
    y,
    z,
    w: 54,
    h: 54,
    d: 52,
    rx: spin * (lane - 1 || 0.6),
    rz: spin * (row % 2 ? 1 : -1),
    s: appear,
    rgb: COLORS.ghost,
  };
}

// ── whole scene ──────────────────────────────────────────────────────────────────────────────

function blend(
  i: number,
  tau: number,
  a: (i: number, t: number) => Block,
  ta: number,
  b: (i: number, t: number) => Block,
  tb: number,
  stagger = 0.006,
): Block {
  const span = tb - ta - stagger * N_TOKENS;
  const u = inOutCubic(prog(tau, ta + i * stagger, ta + i * stagger + span));
  return mixBlock(a(i, ta), b(i, tb), u);
}

/** One token block at τ (indices ≥ N_TOKENS are the ghost lane). */
export function blockAt(i: number, tau: number): Block {
  if (i >= N_TOKENS) {
    if (tau < T.fork || tau >= T.foldEnd) return hidden();
    const g = ghostBlock(i - N_TOKENS, tau);
    return { ...g, s: g.s * (1 - foldAt(tau)) };
  }
  if (tau < T.dive) return barBlock(i);
  if (tau < T.kvMorph) return statelessBlock(i, tau);
  if (tau < T.kvMorph + 1.5)
    return blend(i, tau, statelessBlock, T.kvMorph, kvBlock, T.kvMorph + 1.5);
  if (tau < T.plan) return kvBlock(i, tau);
  if (tau < T.plan + 1.2) return blend(i, tau, kvBlock, T.plan, priceBlock, T.plan + 1.2, 0.004);
  if (tau < T.cut) return priceBlock(i, tau);
  if (tau < T.ringsLand) return priceSink(i, tau);
  if (tau < T.crack) return hidden();
  if (tau < 123.6) return idleBlock(i, tau);
  if (tau < 124.4) return blend(i, tau, idleBlock, 123.6, switchBlock, 124.4, 0.004);
  if (tau < T.fold) return switchBlock(i, tau);
  const b = switchBlock(i, T.fold);
  return { ...b, s: 1 - foldAt(tau) };
}

/** The exit squash every plate shares (0 before the fold, 1 folded). */
function foldAt(tau: number): number {
  return inOutCubic(prog(tau, T.fold, T.foldEnd));
}

// ── props ────────────────────────────────────────────────────────────────────────────────────

export type Props = {
  /** Monolith scale (0 hidden) */
  monolith: number;
  /** Door hinge angle (rad, 0 shut) */
  door: number;
  /** Drawer travel toward the viewer (px) */
  drawer: number;
  /** Reply block extrusion (0 inside the monolith, 1 out) */
  reply: number;
  /** Scan line x (null hidden) */
  scan: number | null;
  /** Skip scale (0 hidden) */
  skip: number;
  pulse: number | null;
};

export function propsAt(tau: number): Props {
  const monolith =
    outCubic(prog(tau, T.dive + 0.4, T.dive + 1.0)) *
    (1 - inOutCubic(prog(tau, T.kvMorph, T.kvMorph + 0.6)));
  const door =
    -1.75 *
    outCubic(prog(tau, T.hinge, T.hinge + 0.3)) *
    (1 - inOutCubic(prog(tau, T.drawerShut + 0.15, T.drawerShut + 0.45)));
  const drawer =
    190 *
    outExpo(prog(tau, T.drawerOut, T.drawerOut + 0.35)) *
    (1 - inOutCubic(prog(tau, T.drawerShut, T.drawerShut + 0.3)));
  const reply =
    outExpo(prog(tau, T.reply, T.reply + 0.6)) * (1 - inOutCubic(prog(tau, 77.0, 77.4)));
  const scan = tau >= T.scan - 0.1 && tau < T.kvMorph ? scanX(tau) : null;
  const skip = outCubic(prog(tau, T.fork - 0.2, T.fork + 0.3)) * (1 - foldAt(tau));
  const p = tau >= T.crack && tau < 123.6 ? pulseX(tau) : null;
  return { monolith, door, drawer, reply, scan, skip, pulse: p };
}
