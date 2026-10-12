import { useLayoutEffect, type ReactNode } from "react";
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";

import type { ExternalClock } from "#/remotion/external-clock";

/** The slice of the WP2 Stage this host drives. */
type FreezableStage = { freeze(at: { tau: number; w: number }): void };

type Props = {
  stage: FreezableStage;
  clock: ExternalClock;
  /** Fixed story time (stills); otherwise τ = tauStart + frame / fps */
  tau?: number;
  tauStart?: number;
  /** Wall time for ambient layers; defaults to τ */
  w?: number;
  children?: ReactNode;
};

/**
 * The only bridge from Remotion time to the Stage: maps the current frame to τ and freezes the
 * Stage there.
 */
export function RemotionTimeHost({
  stage,
  clock,
  tau: fixedTau,
  tauStart = 0,
  w: fixedW,
  children,
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tau = fixedTau ?? tauStart + frame / fps;
  const w = fixedW ?? tau;
  const v = fixedTau === undefined ? 1 : 0;

  // Layout effects run after the children's, so their layers are registered before the frozen frame renders.
  useLayoutEffect(() => {
    clock.set(tau, v);
    const handle = delayRender(`stage τ=${tau.toFixed(3)} w=${w.toFixed(3)}`);
    let pending = true;
    let raf = 0;
    const release = () => {
      if (!pending) return;
      pending = false;
      cancelAnimationFrame(raf);
      continueRender(handle);
    };
    const poll = () => {
      if (window.__stageReady) release();
      else raf = requestAnimationFrame(poll);
    };
    window.__stageReady = false;
    stage.freeze({ tau, w });
    poll();
    return release;
  }, [clock, stage, tau, w, v]);

  return children;
}
