import { useCallback } from "react";

import { useStage } from "#/engine/stage/react";
import { PRIORITY } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";

/** Ref callback that runs `update(el, frame)` now and on every tick while mounted. */
export function useFrameRef<T extends Element>(
  update: (el: T, frame: Frame) => void,
  priority: number = PRIORITY.dom,
) {
  const stage = useStage();
  return useCallback(
    (el: T | null) => {
      if (!el) return undefined;
      update(el, stage.frame());
      return stage.onFrame((frame) => update(el, frame), priority);
    },
    [stage, update, priority],
  );
}

export function setText(el: Element | null | undefined, text: string): void {
  if (el && el.textContent !== text) el.textContent = text;
}

export function setStyle(el: Element | null | undefined, prop: string, value: string): void {
  if (!el) return;
  const style = (el as HTMLElement).style;
  if (style.getPropertyValue(prop) !== value) style.setProperty(prop, value);
}

/** Typing reveal in whole monospace cells; `none` once fully typed. */
export const typeClip = (chars: number, total: number): string =>
  chars >= total ? "none" : `inset(-0.4em calc(100% - ${chars}ch) -0.4em -0.2em)`;
