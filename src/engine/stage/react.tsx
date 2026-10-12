import {
  createContext,
  use,
  useCallback,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { sampleTrack, type TrackSpec } from "#/engine/motion/track";
import type { Frame, FrameCallback, MountWindow } from "#/engine/types";

import { applyStyle, type AppliedCache, type StyleValues } from "./applier";
import { inMountWindow, PRIORITY, type Stage, type StageSnapshot } from "./stage";

const StageContext = createContext<Stage | null>(null);

export function StageProvider({ stage, children }: { stage: Stage; children: ReactNode }) {
  return <StageContext value={stage}>{children}</StageContext>;
}

export function useStage(): Stage {
  const stage = use(StageContext);
  if (!stage) throw new Error("useStage must be used inside <StageProvider>");
  return stage;
}

export function useStageSnapshot(): StageSnapshot {
  const stage = useStage();
  return useSyncExternalStore(stage.subscribe, stage.getSnapshot, stage.getSnapshot);
}

/** Runs `cb` every tick; keep `cb` stable (the compiler memoizes it) to avoid re-registering. */
export function useFrame(cb: FrameCallback, priority: number = PRIORITY.dom): void {
  const stage = useStage();
  useEffect(() => stage.onFrame(cb, priority), [stage, cb, priority]);
}

export type TrackSource = TrackSpec | ((tau: number, frame: Frame) => StyleValues);

/** Binds an element to a track; writes the current sample immediately and every tick after. */
export function bindTrack(
  stage: Stage,
  el: HTMLElement | SVGElement,
  source: TrackSource,
  priority: number = PRIORITY.dom,
): () => void {
  const cache: AppliedCache = {};
  const sampled: StyleValues = {};
  const write = (frame: Frame) => {
    const values =
      typeof source === "function"
        ? source(frame.tau, frame)
        : sampleTrack(source, frame.tau, sampled);
    applyStyle(el, values, cache);
  };
  write(stage.frame());
  return stage.onFrame(write, priority);
}

/** React 19 ref callback that drives an element from a track without re-rendering. */
export function useTrack(source: TrackSource, priority: number = PRIORITY.dom) {
  const stage = useStage();
  return useCallback(
    (el: HTMLElement | SVGElement | null) =>
      el ? bindTrack(stage, el, source, priority) : undefined,
    [stage, source, priority],
  );
}

/** Mounts children only while τ is within the window ± MOUNT_ROLL. */
export function SegmentGate({
  id,
  window,
  children,
}: {
  id: string;
  window: MountWindow;
  children: ReactNode;
}) {
  const stage = useStage();
  const { start, end } = window;
  const subscribe = useCallback(
    (listener: () => void) => {
      const unregister = stage.registerSegment(id, { start, end });
      const unsubscribe = stage.subscribe(listener);
      return () => {
        unsubscribe();
        unregister();
      };
    },
    [stage, id, start, end],
  );
  const getSnapshot = () => inMountWindow({ start, end }, stage.frame().tau);
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return mounted ? children : null;
}
