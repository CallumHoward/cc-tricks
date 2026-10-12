import "./kit-motion.css";
import { useRef, type ReactNode } from "react";

import { inOutCubic, prog, type Ease } from "#/engine/motion/ease";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";

import { STAGE_H, STAGE_W, type Point } from "./camera";
import { num, put } from "./dom";
import type { Glyph } from "./glyphs";

export type DiveOpts = {
  /** Glyph box on screen before the dive (stage px) */
  at: Point;
  size: number;
  glyph: Glyph;
  start: number;
  end: number;
  zoom?: number;
  ease?: Ease;
};

/**
 * Dive state at τ: the glyph's focus travels to stage center while zoom grows log-linearly 1 → Z.
 * `scale`/`tx`/`ty` map start-screen px to screen; `plate*` map end-screen px to screen.
 */
export function diveAt(tau: number, o: DiveOpts) {
  const Z = o.zoom ?? 30;
  const u = prog(tau, o.start, o.end, o.ease ?? inOutCubic);
  const z = Math.exp(u * Math.log(Z));
  const f = {
    x: o.at.x + (o.glyph.focus.x / o.glyph.box) * o.size,
    y: o.at.y + (o.glyph.focus.y / o.glyph.box) * o.size,
  };
  const s = { x: f.x + (STAGE_W / 2 - f.x) * u, y: f.y + (STAGE_H / 2 - f.y) * u };
  const k = z / Z;
  return {
    u,
    scale: z,
    tx: s.x - z * f.x,
    ty: s.y - z * f.y,
    plateScale: k,
    plateX: s.x - k * (STAGE_W / 2),
    plateY: s.y - k * (STAGE_H / 2),
    /** Glyph box in end-screen px (the plate's mask) */
    mask: {
      x: STAGE_W / 2 + Z * (o.at.x - f.x),
      y: STAGE_H / 2 + Z * (o.at.y - f.y),
      size: o.size * Z,
    },
    bloom: prog(tau, o.start + (o.end - o.start) * 0.72, o.end, (u) => u * u * u),
    ink: 1 - prog(tau, o.start + (o.end - o.start) * 0.35, o.start + (o.end - o.start) * 0.8),
  };
}

const svgUri = (g: Glyph) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${g.box} ${g.box}'><path fill-rule='${g.rule ?? "nonzero"}' d='${g.d}'/></svg>`)}")`;

/**
 * Fixed-point log zoom into an SVG glyph; `children` (the outgoing plate) zooms with it and `plate`
 * is revealed inside the letterform, then blooms to full frame by `end`.
 */
export function GlyphDive({
  children,
  plate,
  color = "var(--clay)",
  ...o
}: DiveOpts & { children?: ReactNode; plate: ReactNode; color?: string }) {
  const from = useRef<HTMLDivElement>(null);
  const glyph = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const next = useRef<HTMLDivElement>(null);
  const mask = svgUri(o.glyph);

  useFrame((frame: Frame) => {
    const d = diveAt(frame.tau, o);
    const t = `translate3d(${num(d.tx, 2)}px, ${num(d.ty, 2)}px, 0) scale(${num(d.scale, 5)})`;
    put(from.current, "transform", t);
    const gx = d.tx + (d.scale - 1) * o.at.x;
    const gy = d.ty + (d.scale - 1) * o.at.y;
    put(
      glyph.current,
      "transform",
      `translate3d(${num(gx, 2)}px, ${num(gy, 2)}px, 0) scale(${num(d.scale, 5)})`,
    );
    put(path.current, "fill-opacity", num(d.ink, 3));
    const live = d.u > 0;
    put(next.current, "visibility", live ? "visible" : "hidden");
    if (!live) return;
    put(
      next.current,
      "transform",
      `translate3d(${num(d.plateX, 2)}px, ${num(d.plateY, 2)}px, 0) scale(${num(d.plateScale, 6)})`,
    );
    const r = num(d.bloom * 1300, 1);
    put(
      next.current,
      "mask-image",
      d.bloom >= 1
        ? "none"
        : `${mask}, radial-gradient(circle ${r}px at 50% 50%, #000 99%, transparent 100%)`,
    );
    put(next.current, "mask-position", `${num(d.mask.x, 1)}px ${num(d.mask.y, 1)}px, 0 0`);
    put(next.current, "mask-size", `${num(d.mask.size, 1)}px ${num(d.mask.size, 1)}px, 100% 100%`);
  });

  return (
    <div className="km-dive">
      <div ref={from} className="km-dive-layer">
        {children}
      </div>
      <div ref={next} className="km-dive-plate">
        {plate}
      </div>
      <svg
        ref={glyph}
        className="km-dive-glyph"
        viewBox={`0 0 ${o.glyph.box} ${o.glyph.box}`}
        style={{ left: o.at.x, top: o.at.y, width: o.size, height: o.size }}
        aria-hidden="true"
      >
        <path ref={path} d={o.glyph.d} fill={color} fillRule={o.glyph.rule ?? "nonzero"} />
      </svg>
    </div>
  );
}
