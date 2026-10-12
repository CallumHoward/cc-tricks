import { useId, useImperativeHandle, useRef, type Ref } from "react";

import type { MascotHandle } from "./apply";
import { MASCOT_VIEWBOX, applyDrawing } from "./apply";
import type { DrawOptions, Drawing, Shape, Slot } from "./draw";
import { CLIPPED_SLOTS, SLOTS, drawMascot } from "./draw";
import type { Pose } from "./pose";
import { restPose } from "./pose";

type SvgProps = {
  drawing: Drawing;
  viewBox?: string;
  className?: string;
  title?: string;
  nodeRef?: (slot: Slot | "clip", el: SVGPathElement | null) => void;
};

function attrs(shape: Shape) {
  return {
    d: shape.d,
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.sw,
    opacity: shape.opacity,
  };
}

type GroupProps = Pick<SvgProps, "drawing" | "nodeRef">;

/** The rig's paths as an SVG group, for embedding in a larger drawing. */
export function MascotGroup({ drawing, nodeRef }: GroupProps) {
  const clipId = useId();
  const outside = SLOTS.filter((s) => !CLIPPED_SLOTS.has(s));
  const bodyIndex = outside.indexOf("body");
  const path = (slot: Slot) => (
    <path
      key={slot}
      data-slot={slot}
      ref={nodeRef ? (el) => nodeRef(slot, el) : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...attrs(drawing.shapes[slot])}
    />
  );
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={drawing.clip} ref={nodeRef ? (el) => nodeRef("clip", el) : undefined} />
        </clipPath>
      </defs>
      {outside.slice(0, bodyIndex + 1).map(path)}
      <g clipPath={`url(#${clipId})`}>{SLOTS.filter((s) => CLIPPED_SLOTS.has(s)).map(path)}</g>
      {outside.slice(bodyIndex + 1).map(path)}
    </g>
  );
}

/** Static SVG for a drawing; the same markup the imperative mascot mutates. */
export function MascotSvg({
  drawing,
  viewBox = MASCOT_VIEWBOX,
  className,
  title,
  nodeRef,
}: SvgProps) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      overflow="visible"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <MascotGroup drawing={drawing} nodeRef={nodeRef} />
    </svg>
  );
}

type MascotProps = {
  ref?: Ref<MascotHandle>;
  /** Pose for the first paint (before any imperative render) */
  pose?: Pose;
  options?: DrawOptions;
  viewBox?: string;
  className?: string;
  title?: string;
};

/** Imperatively animated mascot: React renders once, then `ref.render(pose, drawing)` per frame. */
export function Mascot({ ref, pose, options, viewBox, className, title }: MascotProps) {
  const nodes = useRef(new Map<Slot | "clip", SVGPathElement>());
  const last = useRef<Drawing | null>(null);
  const initial = drawMascot(pose ?? restPose(), 0, options);

  useImperativeHandle(
    ref,
    () => ({
      render(next, drawing = 0) {
        last.current = applyDrawing(
          nodes.current,
          drawMascot(next, drawing, options),
          last.current ?? initial,
        );
      },
    }),
    [initial, options],
  );

  return (
    <MascotSvg
      drawing={initial}
      viewBox={viewBox}
      className={className}
      title={title}
      nodeRef={(slot, el) => {
        if (el) nodes.current.set(slot, el);
        else nodes.current.delete(slot);
      }}
    />
  );
}
