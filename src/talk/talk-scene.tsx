import type { ReactNode } from "react";

import { GrainOverlay } from "#/engine/gl/overlay";
import { ShadersLayer } from "#/engine/gl/shaders-layer";
import { ThreeLayerProvider } from "#/engine/gl/three-layer";
import { SegmentGate, useVisibleWindow } from "#/engine/stage/react";
import type { MountWindow, Stop } from "#/engine/types";
import { hazeBed } from "#/talk/bed";
import { CssBed } from "#/talk/kit/motion";
import { SEGMENT_ENTRIES } from "#/talk/segments";
import { STOPS } from "#/talk/timeline-data";

/** Pre-roll: the page opens on an empty prompt and the first press plays the cold open. */
const START_STOP: Stop = { id: "start", at: -0.6, holdSpan: 0.3, holdSpeed: 0.001 };

/** Engine stops for the clock, in talk order. */
export const TALK_STOPS: readonly Stop[] = [
  START_STOP,
  ...STOPS.map(({ id, at, holdSpan }) => ({ id, at, holdSpan })),
];

/** Story time at which the film ends. */
export const TALK_END = SEGMENT_ENTRIES.at(-1)?.window.end ?? 0;

const fill = { position: "absolute", inset: 0 } as const;

/** Mounted ± a roll by the gate, but only visible inside its own window. */
function SegmentLayer({ window, children }: { window: MountWindow; children: ReactNode }) {
  const ref = useVisibleWindow<HTMLDivElement>(window.start, window.end);
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
      <ShadersLayer nodes={hazeBed} fallback="transparent" />
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
