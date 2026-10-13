import { useCallback, type ReactNode } from "react";

import { GrainOverlay } from "#/engine/gl/overlay";
import { ThreeLayerProvider } from "#/engine/gl/three-layer";
import { SegmentGate, useStage, useVisibleWindow } from "#/engine/stage/react";
import { ambientTime, PRIORITY } from "#/engine/stage/stage";
import type { MountWindow, Stop } from "#/engine/types";
import { createBackdrop } from "#/talk/backdrop/backdrop";
import { parallaxAt } from "#/talk/backdrop/world";
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

const backdrop = () => createBackdrop({ segments: SEGMENT_ENTRIES, stops: STOPS });

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
 * The slide plane drifts with the backdrop camera as a global function of ρ, so depth reads and
 * segment match cuts stay identical on both sides.
 */
function SlidePlane({ children }: { children: ReactNode }) {
  const stage = useStage();
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      let last = "";
      return stage.onFrame((frame) => {
        const { x, y, scale } = parallaxAt(ambientTime(frame));
        const next = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(5)})`;
        if (next === last) return;
        last = next;
        el.style.transform = next;
      }, PRIORITY.dom);
    },
    [stage],
  );
  return (
    <div ref={ref} data-testid="slide-plane" style={fill}>
      {children}
    </div>
  );
}

/**
 * The whole film: a solid stage under the shared GL world (backdrop grid, lights and dust, plus any
 * segment layers), every segment on the parallax slide plane, then the grain. Shared by `/` and
 * Remotion.
 */
export function TalkScene() {
  return (
    <>
      <div aria-hidden style={{ ...fill, background: "var(--bg, #262624)" }} />
      <ThreeLayerProvider backdrop={backdrop}>
        <SlidePlane>
          {SEGMENT_ENTRIES.map(({ id, window, View }) => (
            <SegmentGate key={id} id={id} window={window}>
              <SegmentLayer window={window}>
                <View />
              </SegmentLayer>
            </SegmentGate>
          ))}
        </SlidePlane>
      </ThreeLayerProvider>
      <GrainOverlay />
    </>
  );
}
