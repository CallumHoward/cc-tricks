import type { Drawing, Slot } from "./draw";
import { SLOTS } from "./draw";
import type { Pose } from "./pose";

export const MASCOT_VIEWBOX = "-180 -270 360 300";

export type MascotHandle = {
  /** Redraws the rig in place (no React render); unchanged attributes are skipped. */
  render(pose: Pose, drawing?: number): void;
};

const ATTRS = [
  ["d", "d"],
  ["fill", "fill"],
  ["stroke", "stroke"],
  ["sw", "stroke-width"],
  ["opacity", "opacity"],
] as const;

/** Writes changed attributes of `next` onto the slot nodes; returns `next` for the caller to keep. */
export function applyDrawing(
  nodes: ReadonlyMap<Slot | "clip", SVGPathElement>,
  next: Drawing,
  prev: Drawing | null,
): Drawing {
  const clip = nodes.get("clip");
  if (clip && next.clip !== prev?.clip) clip.setAttribute("d", next.clip);
  for (const slot of SLOTS) {
    const el = nodes.get(slot);
    if (!el) continue;
    const a = next.shapes[slot];
    const b = prev?.shapes[slot];
    for (const [key, name] of ATTRS) {
      if (!b || a[key] !== b[key]) el.setAttribute(name, String(a[key]));
    }
  }
  return next;
}
