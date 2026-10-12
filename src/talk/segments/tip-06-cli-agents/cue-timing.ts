import { settleTime, SPRINGS, type SpringCfg } from "#/engine/motion/spring";
import { springFrom } from "#/talk/kit/motion/schedule";

/** First τ a spring started at `start` reaches its target (its impact, before any overshoot). */
export function firstImpact(start: number, spring: SpringCfg, step = 1 / 600): number {
  const end = start + settleTime(spring);
  for (let tau = start; tau < end; tau += step) {
    if (springFrom(tau, start, spring) >= 0.999) return tau;
  }
  return end;
}

/** τ at which a kit `Stamp` settling by `settleBy` first hits the paper. */
export function stampImpact(settleBy: number): number {
  return firstImpact(settleBy - settleTime(SPRINGS.SLAM), SPRINGS.SLAM);
}
