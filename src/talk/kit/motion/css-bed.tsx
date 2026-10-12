import "./kit-motion.css";
import { useRef } from "react";

import { useFrame } from "#/engine/stage/react";
import { PRIORITY } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";

import type { Tone } from "./cover-wipe";
import { put } from "./dom";

/** Static bed: dark dither, bone paper, dark paper halftone or flat clay (tiles in kit-motion.css). */
export function CssBed({ tone = "dark" }: { tone?: Tone }) {
  return <div className="km-tone km-bed km-bed-only" data-tone={tone} aria-hidden="true" />;
}

const OFFSETS = [
  [0, 0],
  [-97, -41],
  [-53, -149],
  [-181, -83],
] as const;

/** Grain frame for wall time: 4 tile offsets stepped at 24 fps. */
export const grainFrame = (w: number): number => Math.floor(w * 24) % 4;

/** Film grain fallback: a noise tile stepped on wall time, 4% (10% while rewinding). */
export function GrainOverlay({ amount = 0.04 }: { amount?: number }) {
  const el = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    const [x, y] = OFFSETS[grainFrame(frame.w)] ?? OFFSETS[0];
    put(el.current, "background-position", `${x}px ${y}px`);
    put(el.current, "opacity", String(frame.v < 0 ? 0.1 : amount));
  }, PRIORITY.overlay);
  return <div ref={el} className="km-grain" aria-hidden="true" />;
}
