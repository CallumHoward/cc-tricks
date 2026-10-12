import "./kit-motion.css";
import { useRef, type ReactNode } from "react";

import { clamp, inOutCubic } from "#/engine/motion/ease";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";

import { num, put } from "./dom";

export type Tone = "dark" | "bone" | "clay" | "halftone";

export type Wipe = { start: number; end: number; to: Tone; angle?: number };

/** Leading and trailing edges (0..1 across the stage): cover in, swap fully covered, reveal. */
export function wipeEdges(tau: number, { start, end }: { start: number; end: number }) {
  const p = clamp((tau - start) / (end - start));
  return { lead: inOutCubic(clamp(p / 0.5)), trail: inOutCubic(clamp((p - 0.5) / 0.5)), p };
}

/** Tone in effect at τ: each wipe swaps at its midpoint, so scrubbing back reverses it. */
export function toneAt(initial: Tone, wipes: readonly Wipe[], tau: number): Tone {
  let tone = initial;
  for (const w of [...wipes].sort((a, b) => a.start - b.start)) {
    if (tau >= (w.start + w.end) / 2) tone = w.to;
  }
  return tone;
}

const SPAN = 2400;

/** Opaque band sweeping across the stage at `angle`°, leading edge first; reversible. */
export function CoverWipe({
  start,
  end,
  angle = 0,
  color = "var(--clay)",
}: {
  start: number;
  end: number;
  angle?: number;
  color?: string;
}) {
  const band = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    const { lead, trail, p } = wipeEdges(frame.tau, { start, end });
    const on = p > 0 && p < 1;
    put(band.current, "visibility", on ? "visible" : "hidden");
    if (!on) return;
    put(
      band.current,
      "clip-path",
      `inset(0 ${num((1 - lead) * 100, 3)}% 0 ${num(trail * 100, 3)}%)`,
    );
  });
  return (
    <div className="km-cover" aria-hidden="true">
      <div
        ref={band}
        className="km-cover-band"
        style={{
          width: SPAN,
          height: SPAN,
          background: color,
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        }}
      />
    </div>
  );
}

/**
 * Bed and ink tone that swap dark ↔ bone (or clay, halftone) behind cover wipes. Children read
 * `--ink`, `--ink-soft`, `--ink-muted`, `--ink-rule` so they recolor with the bed.
 */
export function BoneSwap({
  initial = "dark",
  wipes,
  children,
}: {
  initial?: Tone;
  wipes: readonly Wipe[];
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    const tone = toneAt(initial, wipes, frame.tau);
    if (root.current && root.current.dataset.tone !== tone) root.current.dataset.tone = tone;
  });
  return (
    <div ref={root} className="km-tone km-bed" data-tone={initial}>
      {children}
      {wipes.map((w) => (
        <CoverWipe key={`${w.start}-${w.to}`} start={w.start} end={w.end} angle={w.angle} />
      ))}
    </div>
  );
}
