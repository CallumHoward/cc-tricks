import { useEffect } from "react";

import type { Stage } from "#/engine/stage/stage";

import { INITIAL_KEY_STATE, isInteractiveTarget, reduceKey, type KeyIntent } from "./keys";

function routeIntent(stage: Stage, intent: KeyIntent): void {
  if (intent.type === "nav") stage.dispatch(intent.action);
  else stage.emit(intent);
}

/** Binds keydown to navigation and stage commands. Clicks never navigate. */
export function useNavKeys(stage: Stage): void {
  useEffect(() => {
    let state = INITIAL_KEY_STATE;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || isInteractiveTarget(event.target)) return;
      const result = reduceKey(state, event);
      state = result.state;
      if (!result.intent) return;
      event.preventDefault();
      routeIntent(stage, result.intent);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);
}
