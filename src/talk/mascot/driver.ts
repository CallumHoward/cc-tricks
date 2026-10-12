import type { Frame } from "#/engine/types";

import type { Act } from "./actions";
import { boilIndex, poseAt, twosKey } from "./actions";
import type { MascotHandle } from "./apply";

/**
 * One stage tick: redraws only when the on-twos drawing key changes. Returns the key to keep for
 * the next tick.
 */
export function stepMascot(
  prevKey: number | null,
  frame: Frame,
  acts: readonly Act[],
  handle: MascotHandle | null,
): number | null {
  const key = twosKey(frame.tau, frame.w, frame.v);
  if (key === prevKey || !handle) return prevKey;
  handle.render(poseAt(acts, frame.tau, frame.w), boilIndex(frame.w));
  return key;
}
