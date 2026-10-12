import "./kit-motion.css";
import { useId, useRef, type CSSProperties } from "react";

import { clamp } from "#/engine/motion/ease";
import { SPRINGS, settleTime } from "#/engine/motion/spring";
import { useFrame } from "#/engine/stage/react";
import type { Frame } from "#/engine/types";

import { attr, cssId, num, put } from "./dom";
import { springFrom } from "./schedule";

/** Stamp pose: SLAM from ×2.6 so it rests by `settleBy`, then ink creeps a little (≤ 0.35 px). */
export function stampAt(tau: number, settleBy: number, rotate: number) {
  const start = settleBy - settleTime(SPRINGS.SLAM);
  const t = tau - start;
  if (t <= 0) return { shown: false, scale: 2.6, rotate: rotate + 7, spread: 0 };
  const k = springFrom(tau, start, SPRINGS.SLAM);
  return {
    shown: true,
    scale: 2.6 + (1 - 2.6) * k,
    rotate: rotate + 7 * (1 - k),
    spread: clamp((tau - settleBy) * 0.12, 0, 0.35),
  };
}

/** Mono uppercase rubber stamp in a clay border, 8–12° off true. */
export function Stamp({
  text,
  settleBy,
  rotate = -9,
  seed = 3,
  style,
}: {
  text: string;
  settleBy: number;
  rotate?: number;
  seed?: number;
  style?: CSSProperties;
}) {
  const id = cssId(useId());
  const el = useRef<HTMLDivElement>(null);
  const dilate = useRef<SVGFEMorphologyElement>(null);

  useFrame((frame: Frame) => {
    const s = stampAt(frame.tau, settleBy, rotate);
    put(el.current, "visibility", s.shown ? "visible" : "hidden");
    put(
      el.current,
      "transform",
      `translate(-50%, -50%) rotate(${num(s.rotate, 2)}deg) scale(${num(s.scale, 4)})`,
    );
    attr(dilate.current, "radius", num(s.spread, 1));
  });

  return (
    <div ref={el} className="km-stamp type-label" style={{ ...style, filter: `url(#${id})` }}>
      <svg className="km-defs" aria-hidden="true">
        <filter id={id} x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="2"
            seed={seed}
            result="grain"
          />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.4" result="rough" />
          <feMorphology ref={dilate} in="rough" operator="dilate" radius="0" result="ink" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.09"
            numOctaves="3"
            seed={seed + 7}
            result="blot"
          />
          <feColorMatrix
            in="blot"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.1"
            result="wear"
          />
          <feComposite in="ink" in2="wear" operator="in" />
        </filter>
      </svg>
      {text}
    </div>
  );
}
