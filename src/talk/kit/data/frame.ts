import "#/talk/tokens.css";
import { useLayoutEffect } from "react";

import { useStage } from "#/engine/stage/react";
import { PRIORITY } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";

import { timeOf, type VizClock } from "./logic";

/**
 * Per-frame callback on the viz's clock (τ for the film, w for widgets). Writes the current frame
 * on mount too, so components mounted after a frozen still render landed, and never flash.
 */
export function useVizFrame(clock: VizClock, cb: (t: number, frame: Frame) => void): void {
  const stage = useStage();
  useLayoutEffect(() => {
    const write = (frame: Frame) => cb(timeOf(frame, clock), frame);
    write(stage.frame());
    return stage.onFrame(write, PRIORITY.dom);
  }, [stage, clock, cb]);
}

export function setText(el: Element | null | undefined, text: string): void {
  if (el && el.textContent !== text) el.textContent = text;
}

export function setAttr(el: Element | null | undefined, name: string, value: string): void {
  if (el && el.getAttribute(name) !== value) el.setAttribute(name, value);
}

export function setStyle(
  el: HTMLElement | SVGElement | null | undefined,
  name: string,
  value: string,
): void {
  if (el && el.style.getPropertyValue(name) !== value) el.style.setProperty(name, value);
}
