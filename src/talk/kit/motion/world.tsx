import "./kit-motion.css";
import { useId, useRef, type ReactNode } from "react";

import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";

import { camTransform, camVelocity, shotTrack, smearFor, type Cam, type Shot } from "./camera";
import { attr, cssId, put } from "./dom";

export type CameraSource = readonly Shot[] | ((tau: number) => Cam);

const toFn = (camera: CameraSource) => (typeof camera === "function" ? camera : shotTrack(camera));

/**
 * A 1920×1080 world moved by a τ-driven camera (pan, log zoom, roll, CSS-3D pitch) with a
 * directional smear from camera velocity while the playhead moves fast.
 */
export function World({
  camera,
  smear = true,
  perspective = 1600,
  className,
  children,
}: {
  camera: CameraSource;
  smear?: boolean;
  perspective?: number;
  className?: string;
  children: ReactNode;
}) {
  const id = cssId(useId());
  const frameRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const camAt = toFn(camera);

  useFrame((frame: Frame) => {
    put(worldRef.current, "transform", camTransform(camAt(frame.tau)));
    if (!smear) return;
    const { sx, sy } = smearFor(camVelocity(camAt, frame.tau), frame.v);
    attr(blurRef.current, "stdDeviation", `${sx} ${sy}`);
    put(frameRef.current, "filter", sx || sy ? `url(#${id})` : "none");
  });

  return (
    <div ref={frameRef} className={["km-world", className].filter(Boolean).join(" ")}>
      <svg className="km-defs" aria-hidden="true">
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur ref={blurRef} stdDeviation="0 0" />
        </filter>
      </svg>
      <div className="km-world-persp" style={{ perspective }}>
        <div ref={worldRef} className="km-world-plane">
          {children}
        </div>
      </div>
    </div>
  );
}
