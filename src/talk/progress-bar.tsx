import { useRef } from "react";

import { useFrame, useStage } from "#/engine/stage/react";
import { PRIORITY } from "#/engine/stage/stage";
import type { Frame } from "#/engine/types";
import { TALK_END } from "#/talk/talk-scene";

import { followProgress, talkProgress, type Follow } from "./progress-follow";

import "./progress-bar.css";

/** Hairline of total progress along the bottom edge. Live only: stills and renders hide it. */
export function ProgressBar() {
  const stage = useStage();
  const root = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const state = useRef<Follow | null>(null);

  useFrame((frame: Frame) => {
    if (root.current && root.current.hidden !== stage.frozen) root.current.hidden = stage.frozen;
    const s = followProgress(state.current, talkProgress(frame.tau, TALK_END), frame.dt);
    state.current = s;
    if (fill.current) fill.current.style.transform = `scaleX(${clampUnit(s.x)})`;
  }, PRIORITY.overlay);

  return (
    <div ref={root} className="talk-progress" aria-hidden>
      <div ref={fill} className="talk-progress-fill" />
    </div>
  );
}

const clampUnit = (x: number) => Math.min(1, Math.max(0, x));
