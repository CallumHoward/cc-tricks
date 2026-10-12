import { useEffect } from "react";

import type { Stage } from "#/engine/stage/stage";

import { INITIAL_KEY_STATE, isInteractiveTarget, reduceKey, type KeyIntent } from "./keys";

export function routeIntent(stage: Stage, intent: KeyIntent): void {
  if (intent.type === "nav") stage.dispatch(intent.action);
  else stage.emit(intent);
}

/** Binds keydown and stage clicks to navigation and stage commands. */
export function useNavKeys(stage: Stage, clickTarget?: HTMLElement | null): void {
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
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || isInteractiveTarget(event.target)) return;
      stage.dispatch({ type: "next" });
    };
    window.addEventListener("keydown", onKey);
    clickTarget?.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      clickTarget?.removeEventListener("click", onClick);
    };
  }, [stage, clickTarget]);
}
