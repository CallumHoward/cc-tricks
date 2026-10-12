import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { Clock } from "#/engine/clock/clock";
import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";

/** Renders `ui` on a stage frozen at τ (one frame ticked), for segment smoke tests. */
export function renderAt(tau: number, ui: ReactNode, v = 1) {
  const clock: Clock = {
    sample: () => ({ tau, v }),
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
