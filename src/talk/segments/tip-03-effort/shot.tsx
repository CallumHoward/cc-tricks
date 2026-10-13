import type { ReactNode } from "react";

import { useTrack } from "#/engine/stage/react";
import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";

import type { Pt } from "./tracks";

/** A real screenshot's box on stage at rest (its height follows the image's aspect). */
export type ShotBox = { x: number; y: number; w: number; h: number };

/** Pose of a screenshot relative to its rest box: translate, scale about its centre, 3D tilt. */
export type ShotPose = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  /** Tilt in degrees (rotateX, rotateY) under a 1800 px perspective */
  rx: number;
  ry: number;
};

export const shotBox = (x: number, y: number, w: number, size: { w: number; h: number }) => ({
  x,
  y,
  w,
  h: (w * size.h) / size.w,
});

/** Where a point of the screenshot at rest lands under `pose` (tilt ignored). */
export function onShot(box: ShotBox, pose: ShotPose, q: Pt): Pt {
  const c = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
  return { x: c.x + (q.x - c.x) * pose.scale + pose.x, y: c.y + (q.y - c.y) * pose.scale + pose.y };
}

/**
 * A real screenshot (its own window chrome and shadow are in the image) floating on the stage. The
 * pose is a function of τ and ambient time ρ, so it keeps drifting in slow motion at a stop.
 */
export function Shot({
  src,
  alt,
  box,
  pose,
  dim = 1,
  children,
}: {
  src: string;
  alt: string;
  box: ShotBox;
  pose: (tau: number, rho: number) => ShotPose;
  /** Brightness multiplier (below 1 dims the screenshot) */
  dim?: number;
  children?: ReactNode;
}) {
  const ref = useTrack((tau: number, frame: Frame) => {
    const p = pose(tau, ambientTime(frame));
    return { x: p.x, y: p.y, scale: p.scale, opacity: p.opacity, "--rx": p.rx, "--ry": p.ry };
  });
  return (
    <div
      ref={ref}
      className="seg-abs seg-shot"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
    >
      <div className="seg-shot__tilt">
        <img
          src={src}
          alt={alt}
          width={box.w}
          height={box.h}
          decoding="sync"
          loading="eager"
          draggable={false}
          style={dim < 1 ? { filter: `brightness(${dim})` } : undefined}
        />
        {children}
      </div>
    </div>
  );
}
