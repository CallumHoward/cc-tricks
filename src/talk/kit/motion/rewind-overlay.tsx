import "./kit-motion.css";
import { useRef } from "react";

import { useFrame } from "#/engine/stage/react";
import { PRIORITY } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { hash1 } from "#/engine/util/random";

import { num, put } from "./dom";

/** 2 px jitter stepped at 30 Hz of wall time. */
export function jitterAt(w: number): { x: number; y: number } {
  const k = Math.floor(w * 30);
  return { x: Math.round((hash1(k) - 0.5) * 4), y: Math.round((hash1(k + 9173) - 0.5) * 4) };
}

/** VHS-style rewind cue, shown only while v < 0 (optionally only inside a τ window). */
export function RewindOverlay({
  label = "/rewind · cache hit",
  window,
}: {
  label?: string;
  window?: { start: number; end: number };
}) {
  const root = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);

  useFrame((frame: Frame) => {
    const inside = !window || (frame.tau >= window.start && frame.tau <= window.end);
    const on = frame.v < -0.05 && inside;
    put(root.current, "visibility", on ? "visible" : "hidden");
    if (!on) return;
    const j = jitterAt(frame.w);
    put(tag.current, "transform", `translate3d(calc(-50% + ${j.x}px), ${j.y}px, 0)`);
    const y = ((frame.w * 420) % 1400) - 200;
    put(band.current, "transform", `translate3d(${j.x}px, ${num(y, 0)}px, 0)`);
  }, PRIORITY.overlay);

  return (
    <div ref={root} className="km-rewind" aria-hidden="true">
      <div ref={band} className="km-rewind-band" />
      <div ref={tag} className="km-rewind-tag type-label">
        <span className="km-rewind-arrows">◀◀</span> {label}
      </div>
    </div>
  );
}
