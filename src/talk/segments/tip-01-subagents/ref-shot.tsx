import type { ReactNode } from "react";

import { ambientTime } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { setStyle, useFrameRef } from "#/talk/kit/tui/use-frame-ref";
import { useDecoded } from "#/talk/segments/shared/use-decoded";

import type { Cam3D } from "./tracks";

const CHROME = 32;
const DOTS = ["#ff5f57", "#febc2e", "#28c840"] as const;

/**
 * A real screenshot in a floating terminal window with soft shadow, moved by a 3D camera of story
 * time and ambient time. `children` overlay the screenshot in its frame px.
 */
export function RefShot({
  src,
  alt,
  left,
  top,
  width,
  height,
  cam,
  children,
}: {
  src: string;
  alt: string;
  left: number;
  top: number;
  width: number;
  height: number;
  cam: (tau: number, rho: number) => Cam3D;
  children?: ReactNode;
}) {
  useDecoded(src);
  const ref = useFrameRef<HTMLDivElement>((el: HTMLDivElement, frame: Frame) => {
    const c = cam(frame.tau, ambientTime(frame));
    setStyle(
      el,
      "transform",
      `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, 0) scale(${c.scale.toFixed(4)}) rotateX(${c.rotateX.toFixed(3)}deg) rotateY(${c.rotateY.toFixed(3)}deg)`,
    );
    setStyle(el, "opacity", c.opacity.toFixed(3));
    setStyle(el, "visibility", c.opacity > 0.001 ? "visible" : "hidden");
  });
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height: height + CHROME,
        perspective: 1800,
        perspectiveOrigin: "50% 40%",
      }}
    >
      <div
        ref={ref}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 14,
          overflow: "hidden",
          background: "#222433",
          boxShadow:
            "0 40px 90px rgb(0 0 0 / 55%), 0 12px 28px rgb(0 0 0 / 40%), 0 0 0 1px rgb(255 255 255 / 8%)",
          transformOrigin: "50% 60%",
          visibility: "hidden",
          opacity: 0,
        }}
      >
        <div
          style={{
            height: CHROME,
            display: "flex",
            alignItems: "center",
            gap: 9,
            paddingLeft: 14,
            background: "#2b2d3d",
            borderBottom: "1px solid rgb(0 0 0 / 35%)",
          }}
        >
          {DOTS.map((c) => (
            <span
              key={c}
              style={{ width: 13, height: 13, borderRadius: "50%", background: c, opacity: 0.9 }}
            />
          ))}
        </div>
        <div style={{ position: "relative", width, height }}>
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            decoding="sync"
            draggable={false}
            style={{ display: "block", width, height }}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
