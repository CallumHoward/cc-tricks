import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { Clock } from "#/engine/clock/clock";
import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";

/** Test helper: mounts `ui` on a stage pinned at τ and runs one frame. */
export function renderAt(tau: number, ui: ReactNode) {
  const clock: Clock = {
    sample: () => ({ tau, v: 0 }),
    dispatch: () => {},
    target: 0,
    subscribe: () => () => {},
    plan: () => [],
  };
  let pending: (() => void) | undefined;
  const stage = createStage({
    clock,
    now: () => 0,
    scheduler: {
      request: (cb) => {
        pending = cb;
        return 1;
      },
      cancel: () => {},
    },
  });
  const result = render(<StageProvider stage={stage}>{ui}</StageProvider>);
  stage.start();
  act(() => pending?.());
  return result;
}
