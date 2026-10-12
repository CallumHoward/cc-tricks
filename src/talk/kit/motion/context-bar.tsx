import "./kit-motion.css";
import { useRef } from "react";

import { sampleKeys, type Key } from "#/engine/motion/track";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";

import { num, put } from "./dom";
import { layoutZones, type ZoneSize } from "./schedule";

export type CostState = "paid" | "cached" | "cold" | "output";

export type Zone = { id: string; size: ZoneSize; state: CostState; label?: string };

/** Bar pose: `pitch` (deg back, road at ~72), `height` (px), `labels` (0..1), `scroll` (px). */
export type BarPose = { pitch: number; height: number; labels: number; scroll: number };

export const BAR_POSES = Object.freeze({
  flat: { pitch: 0, height: 12, labels: 0, scroll: 0 },
  top: { pitch: 0, height: 96, labels: 1, scroll: 0 },
  road: { pitch: 72, height: 1400, labels: 0, scroll: 0 },
} satisfies Record<string, BarPose>);

export type PoseKeys = Partial<Record<keyof BarPose, readonly Key[]>>;

/** Pose at τ from per-channel keys over a base pose. */
export function poseAt(base: BarPose, keyed: PoseKeys, tau: number): BarPose {
  const out = { ...base };
  for (const k in keyed) {
    const track = keyed[k as keyof BarPose];
    if (track?.length) out[k as keyof BarPose] = sampleKeys(track, tau);
  }
  return out;
}

/**
 * The context bar: zones colored by cost state (paid / cached / cold+frost / output). Morphs flat ↔
 * top-down labeled bar ↔ a road pitched back into the horizon, all on τ.
 */
export function ContextBar({
  zones,
  x = 200,
  y = 740,
  width = 1200,
  capacity,
  pose = BAR_POSES.flat,
  keys: keyed = {},
}: {
  zones: readonly Zone[];
  x?: number;
  y?: number;
  width?: number;
  capacity?: number;
  pose?: BarPose;
  keys?: PoseKeys;
}) {
  const plane = useRef<HTMLDivElement>(null);
  const zoneEls = useRef<(HTMLDivElement | null)[]>([]);
  const labelEls = useRef<(HTMLSpanElement | null)[]>([]);
  const lane = useRef<HTMLDivElement>(null);

  useFrame((frame: Frame) => {
    const p = poseAt(pose, keyed, frame.tau);
    const boxes = layoutZones(
      zones.map((z) => z.size),
      frame.tau,
      width,
      capacity,
    );
    put(plane.current, "height", `${num(p.height, 1)}px`);
    put(plane.current, "transform", `perspective(900px) rotateX(${num(p.pitch, 2)}deg)`);
    boxes.forEach((b, i) => {
      put(zoneEls.current[i], "transform", `translateX(${num(b.x, 1)}px)`);
      put(zoneEls.current[i], "width", `${num(Math.max(0, b.w - 2), 1)}px`);
    });
    const lift = (1 - p.labels) * 110;
    for (const el of labelEls.current) put(el, "transform", `translateY(${num(-lift, 1)}%)`);
    const road = Math.min(1, p.pitch / 60);
    put(lane.current, "visibility", road > 0.05 ? "visible" : "hidden");
    put(lane.current, "background-position", `0 ${num(p.scroll, 1)}px`);
    put(lane.current, "clip-path", `inset(${num((1 - road) * 100, 2)}% 0 0 0)`);
  });

  return (
    <div className="km-bar" style={{ left: x, top: y, width }}>
      <div ref={plane} className="km-bar-plane">
        {zones.map((z, i) => (
          <div
            key={z.id}
            className="km-zone"
            data-state={z.state}
            ref={(el) => {
              zoneEls.current[i] = el;
            }}
          >
            {z.label ? (
              <span className="km-zone-label-mask">
                <span
                  className="km-zone-label type-label"
                  ref={(el) => {
                    labelEls.current[i] = el;
                  }}
                >
                  {z.label}
                </span>
              </span>
            ) : null}
          </div>
        ))}
        <div ref={lane} className="km-bar-lane" />
      </div>
    </div>
  );
}
