import { useRef, type ReactNode } from "react";

import { GrainOverlay } from "#/engine/gl/overlay";
import { ThreeLayerProvider } from "#/engine/gl/three-layer";
import { SegmentGate, useFrame } from "#/engine/stage/react";
import type { Frame, MountWindow, Stop } from "#/engine/types";
import { CssBed } from "#/talk/kit/motion";
import { SEGMENT_ENTRIES } from "#/talk/segments";
import { STOPS } from "#/talk/timeline-data";

/** Engine stops for the clock, in talk order. */
export const TALK_STOPS: readonly Stop[] = STOPS.map(({ id, at, holdSpan }) => ({
  id,
  at,
  holdSpan,
}));

/** Story time at which the film ends. */
export const TALK_END = SEGMENT_ENTRIES.at(-1)?.window.end ?? 0;

const fill = { position: "absolute", inset: 0 } as const;

/** Mounted ± a roll by the gate, but only visible inside its own window. */
function SegmentLayer({ window, children }: { window: MountWindow; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame((frame: Frame) => {
    const el = ref.current;
    if (!el) return;
    const visible = frame.tau >= window.start && frame.tau < window.end;
    // Opacity, not visibility: kit parts set `visibility: visible` on themselves and would leak through
    const next = visible ? "1" : "0";
    if (el.style.opacity !== next) {
      el.style.opacity = next;
      el.style.pointerEvents = visible ? "" : "none";
    }
  });
  return (
    <div ref={ref} style={{ ...fill, opacity: 0, pointerEvents: "none" }}>
      {children}
    </div>
  );
}

/**
 * The whole film: beds, the shared GL canvas, every segment and the grain. Shared by `/` and
 * Remotion.
 */
export function TalkScene() {
  return (
    <>
      <CssBed tone="dark" />
      <ThreeLayerProvider>
        {SEGMENT_ENTRIES.map(({ id, window, View }) => (
          <SegmentGate key={id} id={id} window={window}>
            <SegmentLayer window={window}>
              <View />
            </SegmentLayer>
          </SegmentGate>
        ))}
      </ThreeLayerProvider>
      <GrainOverlay />
    </>
  );
}
